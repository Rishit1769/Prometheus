import { prisma } from "@prometheus/database";
import { GitHubAuthError, GitHubNotFoundError, GitHubRateLimitError } from "./errors";
import { normalizeReadme } from "./readme";
import { persistReadmeEvidence } from "./readme-persist";
import type { GitHubReadmeSource } from "./types";
import { GitHubClient } from "./client";

type DatabaseClient = typeof prisma;

export type ReadmeSyncStatus = "SUCCESS" | "PARTIAL" | "RATE_LIMITED" | "AUTH_FAILED";

export type ReadmeSyncResult = {
  status: ReadmeSyncStatus;
  repositoriesEligible: number;
  readmesFound: number;
  missing: number;
  empty: number;
  created: number;
  updated: number;
  unchanged: number;
  truncated: number;
  failed: number;
  rateLimited: number;
  authFailed: number;
  startedAt: string;
  completedAt: string;
};

export interface ReadmeSyncDependencies {
  db?: DatabaseClient;
  githubClient?: GitHubReadmeSource;
  now?: () => Date;
}

function emptyResult(startedAt: Date): ReadmeSyncResult {
  return {
    status: "SUCCESS",
    repositoriesEligible: 0,
    readmesFound: 0,
    missing: 0,
    empty: 0,
    created: 0,
    updated: 0,
    unchanged: 0,
    truncated: 0,
    failed: 0,
    rateLimited: 0,
    authFailed: 0,
    startedAt: startedAt.toISOString(),
    completedAt: startedAt.toISOString(),
  };
}

/**
 * Fetch README evidence for stored public, non-fork repositories. Requests are
 * deliberately sequential (concurrency 1) to stay within GitHub API limits.
 */
export async function syncGitHubReadmes(
  params: { userId: string; accessToken: string } & ReadmeSyncDependencies,
): Promise<ReadmeSyncResult> {
  const db = params.db ?? prisma;
  const githubClient = params.githubClient ?? new GitHubClient();
  const now = params.now ?? (() => new Date());
  const startedAt = now();
  const repositories = await db.repository.findMany({
    where: { userId: params.userId, isFork: false, isPrivate: false },
    select: { id: true, fullName: true },
    orderBy: { id: "asc" },
  });
  const result = emptyResult(startedAt);
  result.repositoriesEligible = repositories.length;

  for (const repository of repositories) {
    try {
      const payload = await githubClient.getRepositoryReadme({ accessToken: params.accessToken, fullName: repository.fullName });
      const normalized = normalizeReadme(payload);
      const persisted = await persistReadmeEvidence(db, repository.id, {
        ...normalized,
        status: normalized.status,
        fetchedAt: now(),
      });
      result.readmesFound += 1;
      result.empty += normalized.status === "EMPTY" ? 1 : 0;
      result.truncated += normalized.truncated ? 1 : 0;
      result.created += persisted.created ? 1 : 0;
      result.updated += persisted.updated ? 1 : 0;
      result.unchanged += persisted.unchanged ? 1 : 0;
    } catch (error) {
      const fetchedAt = now();
      let status: "MISSING" | "FETCH_FAILED" | "RATE_LIMITED" | "AUTH_FAILED" = "FETCH_FAILED";
      if (error instanceof GitHubNotFoundError) {
        status = "MISSING";
        result.missing += 1;
      } else if (error instanceof GitHubRateLimitError) {
        status = "RATE_LIMITED";
        result.rateLimited += 1;
      } else if (error instanceof GitHubAuthError) {
        status = "AUTH_FAILED";
        result.authFailed += 1;
      } else {
        result.failed += 1;
      }

      const persisted = await persistReadmeEvidence(db, repository.id, {
        sourcePath: null,
        githubSha: null,
        content: null,
        contentHash: null,
        contentBytes: null,
        truncated: false,
        encoding: "utf-8",
        status,
        fetchedAt,
      });
      result.created += persisted.created ? 1 : 0;
      result.updated += persisted.updated ? 1 : 0;
      result.unchanged += persisted.unchanged ? 1 : 0;

      if (error instanceof GitHubRateLimitError || error instanceof GitHubAuthError) break;
    }
  }

  result.status =
    result.authFailed > 0 ? "AUTH_FAILED" : result.rateLimited > 0 ? "RATE_LIMITED" : result.failed > 0 ? "PARTIAL" : "SUCCESS";
  result.completedAt = now().toISOString();
  return result;
}
