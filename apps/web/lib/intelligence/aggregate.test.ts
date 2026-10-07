import { describe, expect, it } from "vitest";
import { aggregateRepositoryAnalyses, scoreToLevel } from "./aggregate";
import type { RepositoryAnalysisOutput } from "./types";

function output(overrides: Partial<RepositoryAnalysisOutput> = {}): RepositoryAnalysisOutput {
  return {
    summary: "Documented service evidence.",
    detectedTechnologies: [],
    demonstratedDomains: [],
    projectComplexity: "MODERATE",
    documentationQuality: "BASIC",
    architectureSignals: [],
    engineeringSignals: [],
    limitations: [],
    confidence: 0.8,
    evidenceReferences: [],
    ...overrides,
  };
}

describe("developer intelligence aggregation", () => {
  it("maps deterministic thresholds and preserves no-evidence semantics", () => {
    expect(scoreToLevel(0)).toBe(0);
    expect(scoreToLevel(0.25)).toBe(2);
    expect(scoreToLevel(0.65)).toBe(4);
    expect(aggregateRepositoryAnalyses([]).domains.every((domain) => domain.level === 0)).toBe(true);
  });

  it("uses confidence, complexity, and diminishing returns across repositories", () => {
    const result = aggregateRepositoryAnalyses([
      { repositoryId: "a", repositoryName: "A", output: output({ projectComplexity: "ADVANCED", demonstratedDomains: [{ domain: "BACKEND", strength: 1, confidence: 1, evidence: [], reasoningSummary: "API" }] }) },
      { repositoryId: "b", repositoryName: "B", output: output({ projectComplexity: "SIMPLE", demonstratedDomains: [{ domain: "BACKEND", strength: 1, confidence: 0.5, evidence: [], reasoningSummary: "API" }] }) },
    ]);
    const backend = result.domains.find((domain) => domain.domain === "BACKEND");
    expect(backend?.repositoryCount).toBe(2);
    expect(backend?.evidenceScore).toBeLessThan(1);
    expect(backend?.confidence).toBe(0.75);
  });
});
