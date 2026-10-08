import { describe, expect, it, vi } from "vitest";
import { analyzeDeveloper } from "./service";
import type { IntelligenceModel, RepositoryAnalysisOutput } from "./types";

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
      developerIntelligence: { findUnique: vi.fn().mockImplementation(async () => profile), upsert: vi.fn().mockImplementation(async ({ create, update }: { create: Record<string, unknown>; update: Record<string, unknown> }) => { profile = { ...(profile ?? {}), ...create, ...update }; return profile; }) },
    };
    const first = await analyzeDeveloper("user-1", { db: db as never, model: model() });
    const secondModel = model();
    const second = await analyzeDeveloper("user-1", { db: db as never, model: secondModel });
    expect(first.developerProfileGenerated).toBe(true);
    expect(first.repositoriesAnalyzed).toBe(1);
    expect(first.modelRequests).toBe(2);
    expect(second.repositoriesReused).toBe(1);
    expect(second.developerProfileReused).toBe(true);
    expect(second.modelRequests).toBe(0);
    expect(secondModel.analyzeRepository).not.toHaveBeenCalled();
  });
});
