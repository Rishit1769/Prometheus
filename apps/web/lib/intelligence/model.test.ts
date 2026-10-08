import { describe, expect, it, vi } from "vitest";
import { OpenAIIntelligenceModel, createConfiguredIntelligenceModel } from "./model";

describe("intelligence model boundary", () => {
  it("does not require a provider key for offline configuration inspection", () => {
    expect(createConfiguredIntelligenceModel({ AI_PROVIDER: "openai" })).toBeNull();
  });

  it("supports the OpenCode Zen OpenAI-compatible configuration", () => {
    const model = createConfiguredIntelligenceModel({ AI_PROVIDER: "opencode", AI_API_KEY: "test-key" });
    expect(model).toMatchObject({ provider: "opencode", modelName: "deepseek-v4.1-flash", baseUrl: "https://opencode.ai/zen/v1" });
  });

  it("parses and validates structured provider output without exposing the key", async () => {
    const fetchFn = vi.fn().mockResolvedValue(new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify({ summary: "Evidence summary", detectedTechnologies: [], demonstratedDomains: [], projectComplexity: "SIMPLE", documentationQuality: "BASIC", architectureSignals: [], engineeringSignals: [], limitations: [], confidence: 0.5, evidenceReferences: [] }) } }] }), { status: 200 }));
    const model = new OpenAIIntelligenceModel({ apiKey: "test-key", modelName: "test-model", fetchFn });
    const result = await model.analyzeRepository({ repository: { id: "r", name: "repo", description: null, languages: [], topics: [], isFork: false, isArchived: false, updatedAt: null }, readme: { status: "MISSING", content: null, contentHash: null, truncated: false } });
    expect(result.summary).toBe("Evidence summary");
    expect(JSON.stringify(result)).not.toContain("test-key");
  });
});
