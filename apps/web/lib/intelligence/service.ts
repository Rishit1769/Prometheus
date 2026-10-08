import { prisma } from "@prometheus/database";
import { aggregateRepositoryAnalyses } from "./aggregate";
import { sha256 } from "./hash";
import { createConfiguredIntelligenceModel } from "./model";
import { DeveloperAnalysisFailure, diagnosticForError, formatDiagnostic, type IntelligenceDiagnostic } from "./errors";
import { DEVELOPER_PROMPT_VERSION, DOMAIN_SCORING_VERSION, REPOSITORY_PROMPT_VERSION, REPOSITORY_SCHEMA_VERSION, type DeveloperSummaryInput, type IntelligenceModel, type RepositoryAnalysisInput, type RepositoryAnalysisOutput } from "./types";

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

function fallbackSummary(input: DeveloperSummaryInput): { profileSummary: string; limitations: string[] } {
  const domains = input.domains.filter((domain) => domain.level > 0).slice(0, 3).map((domain) => domain.domain.toLowerCase().replace("_", "/")).join(", ");
  return {
    profileSummary: domains ? `Available repository evidence indicates demonstrated signals in ${domains}.` : "Available repository evidence is insufficient for a capability summary.",
    limitations: ["Developer summary fallback used because the summary model response was unavailable."],
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
  const work = repositories.map((repository) => ({ repository, input: repositoryInput(repository), evidenceHash: sha256({ promptVersion: REPOSITORY_PROMPT_VERSION, schemaVersion: REPOSITORY_SCHEMA_VERSION, provider: model.provider, modelName: model.modelName, input: repositoryInput(repository) }) }));

  await runBounded(work, async ({ repository, input, evidenceHash }) => {
    if (repository.analysis?.status === "COMPLETE" && repository.analysis.evidenceHash === evidenceHash && repository.analysis.output) {
      outputs.push({ repositoryId: repository.id, repositoryName: repository.name, output: repository.analysis.output as unknown as RepositoryAnalysisOutput });
      reused += 1;
      return;
    }
    try {
      await db.repositoryAnalysis.upsert({ where: { repositoryId: repository.id }, create: { repositoryId: repository.id, status: "RUNNING", evidenceHash, promptVersion: REPOSITORY_PROMPT_VERSION, modelProvider: model.provider, modelName: model.modelName }, update: { status: "RUNNING", evidenceHash, promptVersion: REPOSITORY_PROMPT_VERSION, modelProvider: model.provider, modelName: model.modelName, errorMessage: null } });
      modelRequests += 1;
      const output = await model.analyzeRepository(input);
      await db.repositoryAnalysis.update({ where: { repositoryId: repository.id }, data: { status: "COMPLETE", output: JSON.parse(JSON.stringify(output)), analyzedAt: new Date(), errorMessage: null } });
      outputs.push({ repositoryId: repository.id, repositoryName: repository.name, output });
      analyzed += 1;
    } catch (error) {
      failed += 1;
      const diagnostic = diagnosticForError(error, "persistence");
      firstFailure ??= diagnostic;
      const errorMessage = formatDiagnostic(diagnostic);
      await db.repositoryAnalysis.upsert({ where: { repositoryId: repository.id }, create: { repositoryId: repository.id, status: "FAILED", evidenceHash, promptVersion: REPOSITORY_PROMPT_VERSION, modelProvider: model.provider, modelName: model.modelName, errorMessage }, update: { status: "FAILED", evidenceHash, promptVersion: REPOSITORY_PROMPT_VERSION, modelProvider: model.provider, modelName: model.modelName, errorMessage } });
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
  const summaryInput: DeveloperSummaryInput = { domains: aggregate.domains.map(({ domain, level, evidenceScore, confidence, repositoryCount }) => ({ domain, level, evidenceScore, confidence, repositoryCount })), technologies: aggregate.strongestTechnologies.map((name) => ({ name, repositoryCount: outputs.filter((item) => item.output.detectedTechnologies.some((technology) => technology.name === name)).length })), limitations: aggregate.limitations };
  let summary = fallbackSummary(summaryInput);
  let summaryFailure: IntelligenceDiagnostic | undefined;
  try { modelRequests += 1; summary = await model.summarizeDeveloper(summaryInput); } catch (error) {
    summaryFailure = diagnosticForError(error, "summary");
  }
  const output = { ...aggregate, limitations: [...aggregate.limitations, ...summary.limitations] };
  const coverage = repositories.length === 0 ? 0 : (analyzed + reused) / repositories.length;
  const jsonOutput = JSON.parse(JSON.stringify(output));
  const status = failed || summaryFailure ? "PARTIAL" : "COMPLETE";
  await db.developerIntelligence.upsert({ where: { userId }, create: { userId, status, evidenceHash: profileEvidenceHash, promptVersion: DEVELOPER_PROMPT_VERSION, scoringVersion: DOMAIN_SCORING_VERSION, modelProvider: model.provider, modelName: model.modelName, profileSummary: summary.profileSummary, overallConfidence: outputs.reduce((sum, item) => sum + item.output.confidence, 0) / outputs.length, eligibleRepositories: repositories.length, analyzedRepositories: successfulRepositories, reusedRepositories: reused, failedRepositories: failed, coverage, output: jsonOutput }, update: { status, evidenceHash: profileEvidenceHash, promptVersion: DEVELOPER_PROMPT_VERSION, scoringVersion: DOMAIN_SCORING_VERSION, modelProvider: model.provider, modelName: model.modelName, profileSummary: summary.profileSummary, overallConfidence: outputs.reduce((sum, item) => sum + item.output.confidence, 0) / outputs.length, eligibleRepositories: repositories.length, analyzedRepositories: successfulRepositories, reusedRepositories: reused, failedRepositories: failed, coverage, output: jsonOutput, generatedAt: new Date() } });
  return { repositoriesEligible: repositories.length, repositoriesAnalyzed: analyzed, repositoriesReused: reused, repositoriesFailed: failed, developerProfileGenerated: true, developerProfileReused: false, coverage, status, modelRequests, ...(firstFailure ?? summaryFailure ? { diagnostics: firstFailure ?? summaryFailure } : {}) };
}

export function analyzeDeveloper(userId: string, dependencies: { db?: DatabaseClient; model?: IntelligenceModel | null } = {}): Promise<DeveloperAnalysisResult> {
  const active = activeAnalyses.get(userId);
  if (active) return active;
  const promise = runDeveloperAnalysis(userId, dependencies).finally(() => activeAnalyses.delete(userId));
  activeAnalyses.set(userId, promise);
  return promise;
}
