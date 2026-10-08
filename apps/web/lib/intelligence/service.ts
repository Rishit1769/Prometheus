import { prisma } from "@prometheus/database";
import { aggregateRepositoryAnalyses } from "./aggregate";
import { sha256 } from "./hash";
import { createConfiguredIntelligenceModel } from "./model";
import { DeveloperAnalysisFailure, diagnosticForError, formatDiagnostic, type IntelligenceDiagnostic } from "./errors";
import { DEVELOPER_PROMPT_VERSION, DOMAIN_SCORING_VERSION, EVIDENCE_VALIDATION_VERSION, REPOSITORY_PROMPT_VERSION, REPOSITORY_SCHEMA_VERSION, type IntelligenceModel, type RepositoryAnalysisInput, type RepositoryAnalysisOutput } from "./types";
import { validateEvidenceReferences, validateRepositoryAnalysisOutput } from "./validate";

type DatabaseClient = typeof prisma;
const MAX_CONCURRENCY = 3;

export interface DeveloperAnalysisResult {
  repositoriesEligible: number;
  repositoriesAnalyzed: number;
  repositoriesReused: number;
  repositoriesFailed: number;
  developerProfileGenerated: boolean;
  developerProfileReused: boolean;
  coverage: number;
  status: "COMPLETE" | "PARTIAL" | "FAILED" | "EMPTY";
  modelRequests: number;
  diagnostics?: IntelligenceDiagnostic;
}

function repositoryInput(repository: {
  id: string;
  name: string;
  description: string | null;
  topics: string[];
  isFork: boolean;
  isArchived: boolean;
  githubUpdatedAt: Date | null;
  languages: { language: string; bytes: number }[];
  readmeEvidence: { status: string; content: string | null; contentHash: string | null; truncated: boolean } | null;
}): RepositoryAnalysisInput {
  return {
    repository: {
      id: repository.id,
      name: repository.name,
      description: repository.description,
      languages: repository.languages.map((language) => ({ name: language.language, bytes: language.bytes })),
      topics: repository.topics,
      isFork: repository.isFork,
      isArchived: repository.isArchived,
      updatedAt: repository.githubUpdatedAt?.toISOString() ?? null,
    },
    readme: {
      status: repository.readmeEvidence?.status ?? "MISSING",
      content: repository.readmeEvidence?.content ?? null,
      contentHash: repository.readmeEvidence?.contentHash ?? null,
      truncated: repository.readmeEvidence?.truncated ?? false,
    },
  };
}

async function runBounded<T>(items: T[], worker: (item: T) => Promise<void>): Promise<void> {
  let cursor = 0;
  async function consume() {
    while (cursor < items.length) {
      const item = items[cursor++];
      await worker(item);
    }
  }
  await Promise.all(Array.from({ length: Math.min(MAX_CONCURRENCY, items.length) }, consume));
}

function deterministicSummary(aggregate: ReturnType<typeof aggregateRepositoryAnalyses>, coverage: number): { profileSummary: string; limitations: string[] } {
  const domains = aggregate.domains.filter((domain) => domain.level > 0).sort((a, b) => b.evidenceScore - a.evidenceScore).slice(0, 3).map((domain) => domain.domain.toLowerCase().replace("_", "/"));
  const technologies = aggregate.strongestTechnologies.slice(0, 4);
  const lowEvidence = aggregate.domains.filter((domain) => domain.repositoryCount > 0 && domain.repositoryCount <= 2).map((domain) => domain.domain.toLowerCase().replace("_", "/"));
  const parts = [
    domains.length ? `Available public repository evidence indicates recurring signals across ${domains.join(", ")}.` : "Available public repository evidence is insufficient for a domain summary.",
    technologies.length ? `Repeatedly observed technologies include ${technologies.join(", ")}.` : null,
    lowEvidence.length ? `Fewer supporting repositories are available for ${lowEvidence.join(", ")}.` : null,
    `Analysis coverage is ${Math.round(coverage * 100)}%.`,
  ].filter(Boolean);
  return {
    profileSummary: parts.join(" "),
    limitations: aggregate.limitations,
  };
}

const activeAnalyses = new Map<string, Promise<DeveloperAnalysisResult>>();

async function runDeveloperAnalysis(
  userId: string,
  dependencies: { db?: DatabaseClient; model?: IntelligenceModel | null } = {},
): Promise<DeveloperAnalysisResult> {
  const db = dependencies.db ?? prisma;
  const model = dependencies.model ?? createConfiguredIntelligenceModel();
  if (!model) throw new Error("AI provider is not configured.");
  const repositories = await db.repository.findMany({
    where: { userId, isFork: false, isPrivate: false },
    orderBy: { id: "asc" },
    include: { languages: { orderBy: { bytes: "desc" } }, readmeEvidence: true, analysis: true },
  });
  let analyzed = 0;
  let reused = 0;
  let failed = 0;
  let modelRequests = 0;
  let firstFailure: IntelligenceDiagnostic | undefined;
  const outputs: { repositoryId: string; repositoryName: string; output: RepositoryAnalysisOutput }[] = [];
  const work = repositories.map((repository) => {
    const input = repositoryInput(repository);
    return { repository, input, legacyEvidenceHash: sha256({ promptVersion: REPOSITORY_PROMPT_VERSION, schemaVersion: REPOSITORY_SCHEMA_VERSION, provider: model.provider, modelName: model.modelName, input }), evidenceHash: sha256({ promptVersion: REPOSITORY_PROMPT_VERSION, schemaVersion: REPOSITORY_SCHEMA_VERSION, validationVersion: EVIDENCE_VALIDATION_VERSION, provider: model.provider, modelName: model.modelName, input }) };
  });

  await runBounded(work, async ({ repository, input, legacyEvidenceHash, evidenceHash }) => {
    const currentCache = repository.analysis?.status === "COMPLETE" && repository.analysis.evidenceHash === evidenceHash;
    const legacyCache = repository.analysis?.status === "COMPLETE" && repository.analysis.evidenceHash === legacyEvidenceHash;
    if ((currentCache || legacyCache) && repository.analysis?.output) {
      let cachedOutput: RepositoryAnalysisOutput;
      try {
        cachedOutput = validateRepositoryAnalysisOutput(repository.analysis.output);
        const grounded = validateEvidenceReferences(cachedOutput, input).output;
        if (repository.analysis.validationVersion !== EVIDENCE_VALIDATION_VERSION) {
          await db.repositoryAnalysis.update({ where: { repositoryId: repository.id }, data: { evidenceHash, output: JSON.parse(JSON.stringify(grounded)), validationVersion: EVIDENCE_VALIDATION_VERSION, status: "COMPLETE", analyzedAt: repository.analysis.analyzedAt ?? new Date(), errorMessage: null } });
        }
        outputs.push({ repositoryId: repository.id, repositoryName: repository.name, output: grounded });
        reused += 1;
        return;
      } catch {
        await db.repositoryAnalysis.update({ where: { repositoryId: repository.id }, data: { status: "STALE", validationVersion: EVIDENCE_VALIDATION_VERSION, errorMessage: "Cached analysis failed current evidence validation." } });
      }
    }
    try {
      await db.repositoryAnalysis.upsert({ where: { repositoryId: repository.id }, create: { repositoryId: repository.id, status: "RUNNING", evidenceHash, validationVersion: EVIDENCE_VALIDATION_VERSION, promptVersion: REPOSITORY_PROMPT_VERSION, modelProvider: model.provider, modelName: model.modelName }, update: { status: "RUNNING", evidenceHash, validationVersion: EVIDENCE_VALIDATION_VERSION, promptVersion: REPOSITORY_PROMPT_VERSION, modelProvider: model.provider, modelName: model.modelName, errorMessage: null } });
      modelRequests += 1;
      const output = await model.analyzeRepository(input);
      await db.repositoryAnalysis.update({ where: { repositoryId: repository.id }, data: { status: "COMPLETE", validationVersion: EVIDENCE_VALIDATION_VERSION, output: JSON.parse(JSON.stringify(output)), analyzedAt: new Date(), errorMessage: null } });
      outputs.push({ repositoryId: repository.id, repositoryName: repository.name, output });
      analyzed += 1;
    } catch (error) {
      failed += 1;
      const diagnostic = diagnosticForError(error, "persistence");
      firstFailure ??= diagnostic;
      const errorMessage = formatDiagnostic(diagnostic);
      await db.repositoryAnalysis.upsert({ where: { repositoryId: repository.id }, create: { repositoryId: repository.id, status: "FAILED", evidenceHash, validationVersion: EVIDENCE_VALIDATION_VERSION, promptVersion: REPOSITORY_PROMPT_VERSION, modelProvider: model.provider, modelName: model.modelName, errorMessage }, update: { status: "FAILED", evidenceHash, validationVersion: EVIDENCE_VALIDATION_VERSION, promptVersion: REPOSITORY_PROMPT_VERSION, modelProvider: model.provider, modelName: model.modelName, errorMessage } });
    }
  });

  const successfulRepositories = analyzed + reused;
  if (repositories.length === 0 || successfulRepositories === 0) {
    // Remove the legacy zero-coverage profile written by earlier PROM-004 code.
    // Do not replace it with another cached profile that looks like an analysis.
    await db.developerIntelligence.deleteMany({ where: { userId, coverage: 0, analyzedRepositories: 0 } });
    if (repositories.length === 0) {
      return {
        repositoriesEligible: 0,
        repositoriesAnalyzed: 0,
        repositoriesReused: 0,
        repositoriesFailed: 0,
        developerProfileGenerated: false,
        developerProfileReused: false,
        coverage: 0,
        status: "EMPTY",
        modelRequests,
      };
    }
    throw new DeveloperAnalysisFailure(
      firstFailure ?? { stage: "provider", code: "ALL_REPOSITORIES_FAILED", message: "No repository produced validated intelligence output." },
      failed,
    );
  }

  const aggregate = aggregateRepositoryAnalyses(outputs);
  const profileEvidenceHash = sha256({ scoringVersion: DOMAIN_SCORING_VERSION, promptVersion: DEVELOPER_PROMPT_VERSION, provider: model.provider, modelName: model.modelName, eligibleRepositories: work.map((item) => ({ repositoryId: item.repository.id, evidenceHash: item.evidenceHash, state: outputs.some((output) => output.repositoryId === item.repository.id) ? "COMPLETE" : "FAILED" })).sort((a, b) => a.repositoryId.localeCompare(b.repositoryId)) });
  const existingProfile = await db.developerIntelligence.findUnique({ where: { userId } });
  if (existingProfile?.status === "COMPLETE" && existingProfile.coverage > 0 && existingProfile.evidenceHash === profileEvidenceHash) {
    // Repair the timestamp on a valid profile updated by versions that did not
    // advance generatedAt when replacing a prior zero-coverage result.
    if (existingProfile.generatedAt < existingProfile.updatedAt) {
      await db.developerIntelligence.update({ where: { userId }, data: { generatedAt: existingProfile.updatedAt } });
    }
    return { repositoriesEligible: repositories.length, repositoriesAnalyzed: analyzed, repositoriesReused: reused, repositoriesFailed: failed, developerProfileGenerated: false, developerProfileReused: true, coverage: repositories.length === 0 ? 0 : (analyzed + reused) / repositories.length, status: "COMPLETE", modelRequests };
  }
  const coverage = repositories.length === 0 ? 0 : (analyzed + reused) / repositories.length;
  const summary = deterministicSummary(aggregate, coverage);
  const output = { ...aggregate, limitations: [...aggregate.limitations, ...summary.limitations] };
  const jsonOutput = JSON.parse(JSON.stringify(output));
  const status = failed ? "PARTIAL" : "COMPLETE";
  await db.developerIntelligence.upsert({ where: { userId }, create: { userId, status, evidenceHash: profileEvidenceHash, promptVersion: DEVELOPER_PROMPT_VERSION, scoringVersion: DOMAIN_SCORING_VERSION, modelProvider: model.provider, modelName: model.modelName, profileSummary: summary.profileSummary, overallConfidence: outputs.reduce((sum, item) => sum + item.output.confidence, 0) / outputs.length, eligibleRepositories: repositories.length, analyzedRepositories: successfulRepositories, reusedRepositories: reused, failedRepositories: failed, coverage, output: jsonOutput }, update: { status, evidenceHash: profileEvidenceHash, promptVersion: DEVELOPER_PROMPT_VERSION, scoringVersion: DOMAIN_SCORING_VERSION, modelProvider: model.provider, modelName: model.modelName, profileSummary: summary.profileSummary, overallConfidence: outputs.reduce((sum, item) => sum + item.output.confidence, 0) / outputs.length, eligibleRepositories: repositories.length, analyzedRepositories: successfulRepositories, reusedRepositories: reused, failedRepositories: failed, coverage, output: jsonOutput, generatedAt: new Date() } });
  return { repositoriesEligible: repositories.length, repositoriesAnalyzed: analyzed, repositoriesReused: reused, repositoriesFailed: failed, developerProfileGenerated: true, developerProfileReused: false, coverage, status, modelRequests, ...(firstFailure ? { diagnostics: firstFailure } : {}) };
}

export function analyzeDeveloper(userId: string, dependencies: { db?: DatabaseClient; model?: IntelligenceModel | null } = {}): Promise<DeveloperAnalysisResult> {
  const active = activeAnalyses.get(userId);
  if (active) return active;
  const promise = runDeveloperAnalysis(userId, dependencies).finally(() => activeAnalyses.delete(userId));
  activeAnalyses.set(userId, promise);
  return promise;
}
