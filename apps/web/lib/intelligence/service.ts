import { prisma } from "@prometheus/database";
import { aggregateRepositoryAnalyses } from "./aggregate";
import { sha256 } from "./hash";
import { createConfiguredIntelligenceModel } from "./model";
import { DEVELOPER_PROMPT_VERSION, DOMAIN_SCORING_VERSION, REPOSITORY_PROMPT_VERSION, type DeveloperSummaryInput, type IntelligenceModel, type RepositoryAnalysisInput, type RepositoryAnalysisOutput } from "./types";

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
  status: "COMPLETE" | "PARTIAL" | "FAILED";
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

export async function analyzeDeveloper(
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
  const outputs: { repositoryId: string; repositoryName: string; output: RepositoryAnalysisOutput }[] = [];
  const work = repositories.map((repository) => ({ repository, input: repositoryInput(repository), evidenceHash: sha256({ version: REPOSITORY_PROMPT_VERSION, input: repositoryInput(repository) }) }));

  await runBounded(work, async ({ repository, input, evidenceHash }) => {
    if (repository.analysis?.status === "COMPLETE" && repository.analysis.evidenceHash === evidenceHash && repository.analysis.output) {
      outputs.push({ repositoryId: repository.id, repositoryName: repository.name, output: repository.analysis.output as unknown as RepositoryAnalysisOutput });
      reused += 1;
      return;
    }
    try {
      await db.repositoryAnalysis.upsert({ where: { repositoryId: repository.id }, create: { repositoryId: repository.id, status: "RUNNING", evidenceHash, promptVersion: REPOSITORY_PROMPT_VERSION, modelProvider: model.provider, modelName: model.modelName }, update: { status: "RUNNING", evidenceHash, promptVersion: REPOSITORY_PROMPT_VERSION, modelProvider: model.provider, modelName: model.modelName, errorMessage: null } });
      const output = await model.analyzeRepository(input);
      await db.repositoryAnalysis.update({ where: { repositoryId: repository.id }, data: { status: "COMPLETE", output: JSON.parse(JSON.stringify(output)), analyzedAt: new Date(), errorMessage: null } });
      outputs.push({ repositoryId: repository.id, repositoryName: repository.name, output });
      analyzed += 1;
    } catch {
      failed += 1;
      await db.repositoryAnalysis.upsert({ where: { repositoryId: repository.id }, create: { repositoryId: repository.id, status: "FAILED", evidenceHash, promptVersion: REPOSITORY_PROMPT_VERSION, modelProvider: model.provider, modelName: model.modelName, errorMessage: "Repository analysis failed." }, update: { status: "FAILED", evidenceHash, promptVersion: REPOSITORY_PROMPT_VERSION, modelProvider: model.provider, modelName: model.modelName, errorMessage: "Repository analysis failed." } });
    }
  });

  const aggregate = aggregateRepositoryAnalyses(outputs);
  const profileEvidenceHash = sha256({ version: DOMAIN_SCORING_VERSION, analyses: outputs.map((item) => ({ repositoryId: item.repositoryId, evidenceHash: work.find((candidate) => candidate.repository.id === item.repositoryId)?.evidenceHash })).sort((a, b) => a.repositoryId.localeCompare(b.repositoryId)) });
  const existingProfile = await db.developerIntelligence.findUnique({ where: { userId } });
  if (existingProfile?.status === "COMPLETE" && existingProfile.evidenceHash === profileEvidenceHash) {
    return { repositoriesEligible: repositories.length, repositoriesAnalyzed: analyzed + reused, repositoriesReused: reused, repositoriesFailed: failed, developerProfileGenerated: false, developerProfileReused: true, coverage: repositories.length === 0 ? 0 : (analyzed + reused) / repositories.length, status: failed ? "PARTIAL" : "COMPLETE" };
  }
  const summaryInput: DeveloperSummaryInput = { domains: aggregate.domains.map(({ domain, level, evidenceScore, confidence, repositoryCount }) => ({ domain, level, evidenceScore, confidence, repositoryCount })), technologies: aggregate.strongestTechnologies.map((name) => ({ name, repositoryCount: outputs.filter((item) => item.output.detectedTechnologies.some((technology) => technology.name === name)).length })), limitations: aggregate.limitations };
  let summary = fallbackSummary(summaryInput);
  try { summary = await model.summarizeDeveloper(summaryInput); } catch { /* deterministic fallback remains safe and evidence-limited */ }
  const output = { ...aggregate, limitations: [...aggregate.limitations, ...summary.limitations] };
  const coverage = repositories.length === 0 ? 0 : (analyzed + reused) / repositories.length;
  const jsonOutput = JSON.parse(JSON.stringify(output));
  await db.developerIntelligence.upsert({ where: { userId }, create: { userId, status: failed ? "PARTIAL" : "COMPLETE", evidenceHash: profileEvidenceHash, promptVersion: DEVELOPER_PROMPT_VERSION, scoringVersion: DOMAIN_SCORING_VERSION, modelProvider: model.provider, modelName: model.modelName, profileSummary: summary.profileSummary, overallConfidence: outputs.length === 0 ? 0 : outputs.reduce((sum, item) => sum + item.output.confidence, 0) / outputs.length, eligibleRepositories: repositories.length, analyzedRepositories: analyzed + reused, reusedRepositories: reused, failedRepositories: failed, coverage, output: jsonOutput }, update: { status: failed ? "PARTIAL" : "COMPLETE", evidenceHash: profileEvidenceHash, promptVersion: DEVELOPER_PROMPT_VERSION, scoringVersion: DOMAIN_SCORING_VERSION, modelProvider: model.provider, modelName: model.modelName, profileSummary: summary.profileSummary, overallConfidence: outputs.length === 0 ? 0 : outputs.reduce((sum, item) => sum + item.output.confidence, 0) / outputs.length, eligibleRepositories: repositories.length, analyzedRepositories: analyzed + reused, reusedRepositories: reused, failedRepositories: failed, coverage, output: jsonOutput } });
  return { repositoriesEligible: repositories.length, repositoriesAnalyzed: analyzed + reused, repositoriesReused: reused, repositoriesFailed: failed, developerProfileGenerated: true, developerProfileReused: false, coverage, status: failed ? "PARTIAL" : "COMPLETE" };
}
