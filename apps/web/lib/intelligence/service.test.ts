import { describe, expect, it, vi } from "vitest";
import { analyzeDeveloper } from "./service";
import { DeveloperAnalysisFailure, IntelligenceError } from "./errors";
import type { IntelligenceModel, RepositoryAnalysisOutput } from "./types";
import { EVIDENCE_VALIDATION_VERSION, REPOSITORY_PROMPT_VERSION, REPOSITORY_SCHEMA_VERSION } from "./types";
import { sha256 } from "./hash";

const analysisOutput: RepositoryAnalysisOutput = {
  summary: "A documented backend service.", detectedTechnologies: [{ name: "TypeScript", evidence: [{ type: "LANGUAGE", reference: "TypeScript" }] }], demonstratedDomains: [{ domain: "BACKEND", strength: 0.8, confidence: 0.9, evidence: [{ type: "LANGUAGE", reference: "TypeScript" }], reasoningSummary: "Server evidence." }], projectComplexity: "MODERATE", documentationQuality: "GOOD", architectureSignals: [], engineeringSignals: [], limitations: [], confidence: 0.8, evidenceReferences: [],
};

function model(): IntelligenceModel {
  return { provider: "mock", modelName: "mock-v1", analyzeRepository: vi.fn().mockResolvedValue(analysisOutput), summarizeDeveloper: vi.fn().mockResolvedValue({ profileSummary: "Evidence indicates backend signals.", limitations: [] }) };
}

describe("developer analysis orchestration", () => {
  it("analyzes once, then reuses unchanged repository and developer evidence", async () => {
    type TestRepository = { id: string; name: string; description: string; topics: string[]; isFork: boolean; isPrivate: boolean; isArchived: boolean; githubUpdatedAt: Date | null; languages: { language: string; bytes: number }[]; readmeEvidence: { status: string; content: string; contentHash: string; truncated: boolean }; analysis: Record<string, unknown> | null };
    const repositories: TestRepository[] = [{ id: "r1", name: "one", description: "service", topics: [], isFork: false, isPrivate: false, isArchived: false, githubUpdatedAt: null, languages: [{ language: "TypeScript", bytes: 10 }], readmeEvidence: { status: "AVAILABLE", content: "# API", contentHash: "h1", truncated: false }, analysis: null }];
    let profile: Record<string, unknown> | null = null;
    const db = {
      repository: { findMany: vi.fn().mockImplementation(async () => repositories) },
      repositoryAnalysis: {
        upsert: vi.fn().mockImplementation(async ({ create, update }: { create: Record<string, unknown>; update: Record<string, unknown> }) => { const target = repositories[0]; target.analysis = { ...(target.analysis ?? {}), ...create, ...update }; return target.analysis; }),
        update: vi.fn().mockImplementation(async ({ data }: { data: Record<string, unknown> }) => { repositories[0].analysis = { ...(repositories[0].analysis ?? {}), ...data }; return repositories[0].analysis; }),
      },
      developerIntelligence: {
        findUnique: vi.fn().mockImplementation(async () => profile),
        upsert: vi.fn().mockImplementation(async ({ create, update }: { create: Record<string, unknown>; update: Record<string, unknown> }) => { profile = { ...(profile ?? {}), ...create, ...update }; return profile; }),
        update: vi.fn().mockImplementation(async ({ data }: { data: Record<string, unknown> }) => { profile = { ...(profile ?? {}), ...data }; return profile; }),
        deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
      },
    };
    const first = await analyzeDeveloper("user-1", { db: db as never, model: model() });
    profile = { ...(profile ?? {}), generatedAt: new Date("2026-01-01T00:00:00Z"), updatedAt: new Date("2026-01-02T00:00:00Z") };
    const secondModel = model();
    const second = await analyzeDeveloper("user-1", { db: db as never, model: secondModel });
    expect(first.developerProfileGenerated).toBe(true);
    expect(first.repositoriesAnalyzed).toBe(1);
    expect(first.modelRequests).toBe(1);
    expect(second.repositoriesReused).toBe(1);
    expect(second.repositoriesAnalyzed).toBe(0);
    expect(second.developerProfileReused).toBe(true);
    expect(second.modelRequests).toBe(0);
    expect(db.developerIntelligence.update).toHaveBeenCalledWith({ where: { userId: "user-1" }, data: { generatedAt: new Date("2026-01-02T00:00:00Z") } });
    expect(secondModel.analyzeRepository).not.toHaveBeenCalled();
  });

  it("does not persist a zero-coverage developer profile after total provider failure", async () => {
    const repository = { id: "failed-1", name: "broken", description: null, topics: [], isFork: false, isPrivate: false, isArchived: false, githubUpdatedAt: null, languages: [], readmeEvidence: null, analysis: null };
    const repositoryAnalysis = {
      upsert: vi.fn().mockResolvedValue({}),
      update: vi.fn().mockResolvedValue({}),
    };
    const developerIntelligence = {
      findUnique: vi.fn().mockResolvedValue({ status: "PARTIAL", coverage: 0, analyzedRepositories: 0 }),
      upsert: vi.fn(),
      deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
    };
    const db = {
      repository: { findMany: vi.fn().mockResolvedValue([repository]) },
      repositoryAnalysis,
      developerIntelligence,
    };
    const brokenModel: IntelligenceModel = {
      provider: "opencode",
      modelName: "deepseek-v4.1-flash",
      analyzeRepository: vi.fn().mockRejectedValue(new IntelligenceError({ stage: "provider", code: "HTTP_ERROR", providerStatus: 400, message: "Provider request was rejected." })),
      summarizeDeveloper: vi.fn(),
    };

    await expect(analyzeDeveloper("all-failed-user", { db: db as never, model: brokenModel })).rejects.toMatchObject({
      name: "DeveloperAnalysisFailure",
      failedRepositories: 1,
      diagnostic: { stage: "provider", code: "HTTP_ERROR", providerStatus: 400, message: "Provider request was rejected." },
    } satisfies Partial<DeveloperAnalysisFailure>);
    expect(developerIntelligence.deleteMany).toHaveBeenCalledWith({ where: { userId: "all-failed-user", coverage: 0, analyzedRepositories: 0 } });
    expect(developerIntelligence.upsert).not.toHaveBeenCalled();
    expect(brokenModel.summarizeDeveloper).not.toHaveBeenCalled();
    expect(repositoryAnalysis.upsert).toHaveBeenLastCalledWith(expect.objectContaining({
      update: expect.objectContaining({ status: "FAILED", errorMessage: expect.stringContaining("provider/HTTP_ERROR; HTTP 400") }),
    }));
  });

  it("persists a partial profile when at least one repository succeeds", async () => {
    const repositories = ["good", "bad"].map((name, index) => ({ id: `partial-${index}`, name, description: null, topics: [], isFork: false, isPrivate: false, isArchived: false, githubUpdatedAt: null, languages: [], readmeEvidence: null, analysis: null }));
    const profile = { status: "PARTIAL", coverage: 0.5 };
    const developerIntelligence = {
      findUnique: vi.fn().mockResolvedValue(null),
      upsert: vi.fn().mockResolvedValue(profile),
      deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
    };
    const db = {
      repository: { findMany: vi.fn().mockResolvedValue(repositories) },
      repositoryAnalysis: { upsert: vi.fn().mockResolvedValue({}), update: vi.fn().mockResolvedValue({}) },
      developerIntelligence,
    };
    const partialModel: IntelligenceModel = {
      provider: "mock",
      modelName: "mock-v1",
      analyzeRepository: vi.fn(async (input) => {
        if (input.repository.name === "bad") throw new IntelligenceError({ stage: "validation", code: "OUTPUT_SCHEMA_INVALID", validationIssuePaths: ["confidence"], message: "Output schema invalid." });
        return analysisOutput;
      }),
      summarizeDeveloper: vi.fn().mockResolvedValue({ profileSummary: "One repository had grounded evidence.", limitations: [] }),
    };

    const result = await analyzeDeveloper("partial-user", { db: db as never, model: partialModel });

    expect(result.status).toBe("PARTIAL");
    expect(result.coverage).toBe(0.5);
    expect(result.repositoriesAnalyzed).toBe(1);
    expect(result.repositoriesFailed).toBe(1);
    expect(result.diagnostics).toMatchObject({ stage: "validation", validationIssuePaths: ["confidence"] });
    expect(developerIntelligence.upsert).toHaveBeenCalledWith(expect.objectContaining({
      create: expect.objectContaining({ status: "PARTIAL", coverage: 0.5, analyzedRepositories: 1 }),
    }));
  });

  it("revalidates a legacy cached analysis without another model call", async () => {
    const repository = { id: "legacy-1", name: "legacy", description: "service", topics: [], isFork: false, isPrivate: false, isArchived: false, githubUpdatedAt: null, languages: [{ language: "TypeScript", bytes: 10 }], readmeEvidence: { status: "AVAILABLE", content: "# API", contentHash: "h1", truncated: false } };
    const input = { repository: { id: repository.id, name: repository.name, description: repository.description, languages: [{ name: "TypeScript", bytes: 10 }], topics: [], isFork: false, isArchived: false, updatedAt: null }, readme: repository.readmeEvidence };
    const legacyHash = sha256({ promptVersion: REPOSITORY_PROMPT_VERSION, schemaVersion: REPOSITORY_SCHEMA_VERSION, provider: "mock", modelName: "mock-v1", input });
    const analysis = { status: "COMPLETE", evidenceHash: legacyHash, validationVersion: "unknown", analyzedAt: new Date("2026-01-01T00:00:00Z"), output: analysisOutput };
    const update = vi.fn().mockResolvedValue(analysis);
    const db = {
      repository: { findMany: vi.fn().mockResolvedValue([{ ...repository, analysis }]) },
      repositoryAnalysis: { update, upsert: vi.fn() },
      developerIntelligence: { findUnique: vi.fn().mockResolvedValue(null), upsert: vi.fn().mockResolvedValue({}), deleteMany: vi.fn().mockResolvedValue({ count: 0 }) },
    };
    const result = await analyzeDeveloper("legacy-user", { db: db as never, model: model() });
    expect(result.repositoriesReused).toBe(1);
    expect(result.modelRequests).toBe(0);
    expect(update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ validationVersion: EVIDENCE_VALIDATION_VERSION }) }));
  });

  it("does not cache an empty no-repository result as a zero-coverage profile", async () => {
    const developerIntelligence = { deleteMany: vi.fn().mockResolvedValue({ count: 0 }), upsert: vi.fn(), findUnique: vi.fn() };
    const db = { repository: { findMany: vi.fn().mockResolvedValue([]) }, repositoryAnalysis: {}, developerIntelligence };
    const result = await analyzeDeveloper("empty-user", { db: db as never, model: model() });
    expect(result.status).toBe("EMPTY");
    expect(result.coverage).toBe(0);
    expect(developerIntelligence.deleteMany).toHaveBeenCalled();
    expect(developerIntelligence.upsert).not.toHaveBeenCalled();
  });
});
