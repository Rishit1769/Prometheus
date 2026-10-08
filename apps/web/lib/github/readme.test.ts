import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { MAX_README_BYTES, normalizeReadme } from "./readme";

function payload(content: string, overrides: Record<string, unknown> = {}) {
  return {
    encoding: "base64",
    content: Buffer.from(content, "utf8").toString("base64"),
    path: "README.md",
    sha: "sha-1",
    ...overrides,
  };
}

describe("normalizeReadme", () => {
  it("normalizes line endings and hashes deterministically", () => {
    const result = normalizeReadme(payload("  # Hello\r\n\r\nWorld  "));
    expect(result.content).toBe("# Hello\n\nWorld");
    expect(result.status).toBe("AVAILABLE");
    expect(result.contentHash).toBe(createHash("sha256").update("# Hello\n\nWorld").digest("hex"));
  });

  it("preserves Unicode while truncating at a safe UTF-8 boundary", () => {
    const result = normalizeReadme(payload("🙂".repeat(MAX_README_BYTES)));
    expect(result.status).toBe("TRUNCATED");
    expect(result.truncated).toBe(true);
    expect(result.contentBytes).toBe(Buffer.byteLength("🙂".repeat(MAX_README_BYTES), "utf8"));
    expect(Buffer.byteLength(result.content, "utf8")).toBeLessThanOrEqual(MAX_README_BYTES);
    expect(result.content.endsWith("�")).toBe(false);
  });

  it("represents an empty README explicitly", () => {
    const result = normalizeReadme(payload("\r\n  \n"));
    expect(result.status).toBe("EMPTY");
    expect(result.content).toBe("");
    expect(result.contentHash).toHaveLength(64);
  });

  it("rejects unsupported GitHub response encodings", () => {
    expect(() => normalizeReadme(payload("readme", { encoding: "utf-8" }))).toThrow(
      "unsupported README response",
    );
  });
});
