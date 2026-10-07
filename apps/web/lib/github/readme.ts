import { createHash } from "node:crypto";
import { GitHubApiError } from "./errors";
import type { GitHubReadmePayload } from "./types";

/** Maximum UTF-8 payload persisted for a README and made available to future analysis. */
export const MAX_README_BYTES = 256 * 1024;

export type NormalizedReadme = {
  sourcePath: string | null;
  githubSha: string | null;
  content: string;
  contentHash: string;
  contentBytes: number;
  truncated: boolean;
  encoding: "utf-8";
  status: "AVAILABLE" | "EMPTY" | "TRUNCATED";
};

/**
 * Decode and normalize GitHub's base64 README response without summarizing or
 * interpreting its Markdown. Hashing uses the complete normalized content;
 * only the persisted content is bounded.
 */
export function normalizeReadme(payload: GitHubReadmePayload): NormalizedReadme {
  if (payload.encoding !== "base64" || typeof payload.content !== "string") {
    throw new GitHubApiError("GitHub returned an unsupported README response.");
  }

  const encoded = payload.content.replace(/\s/g, "");
  if (encoded.length % 4 === 1 || !/^[A-Za-z0-9+/]*={0,2}$/.test(encoded)) {
    throw new GitHubApiError("GitHub returned malformed README content.");
  }
  const decoded = Buffer.from(encoded, "base64");
  const normalized = decoded.toString("utf8").replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n").trim();
  const normalizedBytes = Buffer.from(normalized, "utf8");
  const contentHash = createHash("sha256").update(normalizedBytes).digest("hex");
  const truncated = normalizedBytes.byteLength > MAX_README_BYTES;
  const boundedContent = truncated ? normalizedBytes.subarray(0, MAX_README_BYTES).toString("utf8") : normalized;

  return {
    sourcePath: typeof payload.path === "string" ? payload.path : typeof payload.name === "string" ? payload.name : null,
    githubSha: typeof payload.sha === "string" ? payload.sha : null,
    content: boundedContent,
    contentHash,
    contentBytes: normalizedBytes.byteLength,
    truncated,
    encoding: "utf-8",
    status: normalized.length === 0 ? "EMPTY" : truncated ? "TRUNCATED" : "AVAILABLE",
  };
}
