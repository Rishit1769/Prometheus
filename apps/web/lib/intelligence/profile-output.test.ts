import { describe, expect, it } from "vitest";
import { normalizePersistedDeveloperIntelligenceOutput } from "./profile-output";
import { DEVELOPER_OUTPUT_SCHEMA_VERSION, LEGACY_DEVELOPER_OUTPUT_SCHEMA_VERSION } from "./types";

describe("persisted developer intelligence output compatibility", () => {
  it("supplies safe detail defaults for legacy domain JSON", () => {
    const result = normalizePersistedDeveloperIntelligenceOutput({
      domains: [{ domain: "FRONTEND", level: 3, evidenceScore: 0.65, confidence: 0.7, repositoryCount: 4, limitations: undefined }],
    }) as { schemaVersion: string; domains: { domain: string; level: number; evidenceScore: number; confidence: number; repositoryCount: number; supportingRepositories: unknown[]; limitations: string[] }[] };

    expect(result.schemaVersion).toBe(LEGACY_DEVELOPER_OUTPUT_SCHEMA_VERSION);
    expect(result.domains[0]).toMatchObject({
      domain: "FRONTEND",
      level: 3,
      evidenceScore: 0.65,
      confidence: 0.7,
      repositoryCount: 4,
      supportingRepositories: [],
      limitations: ["Detailed repository attribution unavailable for this saved profile. Re-analyze to rebuild it from validated cached repository analyses where possible."],
    });
  });

  it("preserves existing repository attribution and limitations", () => {
    const details = [{ repositoryId: "repo-1", repositoryName: "example", technologies: ["TypeScript"], evidenceReferences: [{ type: "LANGUAGE", reference: "TypeScript" }], explanation: "A validated service signal." }];
    const result = normalizePersistedDeveloperIntelligenceOutput({
      schemaVersion: DEVELOPER_OUTPUT_SCHEMA_VERSION,
      domains: [{ domain: "BACKEND", supportingRepositories: details, limitations: ["limited evidence"] }],
    }) as { schemaVersion: string; domains: { supportingRepositories: unknown[]; limitations: string[] }[] };

    expect(result.schemaVersion).toBe(DEVELOPER_OUTPUT_SCHEMA_VERSION);
    expect(result.domains[0].supportingRepositories).toEqual(details);
    expect(result.domains[0].limitations).toEqual(["limited evidence"]);
  });

  it("does not present an unversioned legacy attribution payload as modern evidence", () => {
    const legacyReference = { type: "README_CONTENT", reference: "README.md" };
    const result = normalizePersistedDeveloperIntelligenceOutput({
      schemaVersion: "developer-intelligence-output-v2",
      domains: [{
        domain: "BACKEND",
        level: 3,
        repositoryCount: 1,
        supportingRepositories: [{ repositoryId: "repo-1", repositoryName: "legacy", technologies: [], evidenceReferences: [legacyReference], explanation: "old attribution" }],
        limitations: [],
      }],
    }) as { schemaVersion: string; domains: { repositoryCount: number; supportingRepositories: unknown[]; limitations: string[] }[] };

    expect(result.schemaVersion).toBe(LEGACY_DEVELOPER_OUTPUT_SCHEMA_VERSION);
    expect(result.domains[0].repositoryCount).toBe(1);
    expect(result.domains[0].supportingRepositories).toEqual([]);
    expect(result.domains[0].limitations[0]).toContain("Detailed repository attribution unavailable for this saved profile");
  });

  it("marks malformed current-version attribution as legacy instead of trusting the marker", () => {
    const result = normalizePersistedDeveloperIntelligenceOutput({
      schemaVersion: DEVELOPER_OUTPUT_SCHEMA_VERSION,
      domains: [{ domain: "BACKEND", supportingRepositories: null, limitations: [] }],
    }) as { schemaVersion: string; domains: { supportingRepositories: unknown[]; limitations: string[] }[] };

    expect(result.schemaVersion).toBe(LEGACY_DEVELOPER_OUTPUT_SCHEMA_VERSION);
    expect(result.domains[0].supportingRepositories).toEqual([]);
    expect(result.domains[0].limitations[0]).toContain("Detailed repository attribution unavailable for this saved profile");
  });
});
