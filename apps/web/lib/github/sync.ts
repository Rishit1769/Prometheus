import { prisma } from "@prometheus/database";
import { GitHubClient } from "./client";
import { GitHubError, GitHubRateLimitError } from "./errors";
import { getGitHubCredentialForUser } from "./credentials";
import { normalizeLanguages, normalizeRepository } from "./normalize";
import { persistRepository } from "./persist";
import type {
  GitHubRateLimit,
  GitHubRepositorySource,
  GitHubSyncResult,
  GitHubSyncStatusValue,
} from "./types";

const MAX_REPORTED_ERRORS = 10;

/** The Prisma client type, derived from the shared singleton without a new export. */
type DatabaseClient = typeof prisma;

export interface SyncDependencies {
  db?: DatabaseClient;
  githubClient?: GitHubRepositorySource;
  now?: () => Date;
}

function emptyRateLimit(): GitHubRateLimit {
  return { limit: null, remaining: null, resetAt: null };
}

function addError(errors: string[], message: string): void {
  if (errors.length < MAX_REPORTED_ERRORS) errors.push(message);
}

/** Return the stored GitHub OAuth access token for a user, if connected. */
export async function getGitHubAccessToken(userId: string, db: DatabaseClient = prisma): Promise<string | null> {
  const state = await getGitHubCredentialForUser(userId, db);
  return state.status === "CONNECTED" ? state.credential.accessToken : null;
}

interface SyncRecordInput {
  userId: string;
  status: GitHubSyncStatusValue;
  startedAt: Date;
  completedAt: Date;
  repositoriesFound: number;
  repositoriesCreated: number;
  repositoriesUpdated: number;
  repositoriesFailed: number;
  rateLimit: GitHubRateLimit;
  errorMessage: string | null;
}

async function recordSync(db: DatabaseClient, input: SyncRecordInput): Promise<void> {
  await db.gitHubRepositorySync.create({
    data: {
      userId: input.userId,
      status: input.status,
      startedAt: input.startedAt,
      completedAt: input.completedAt,
      repositoriesFound: input.repositoriesFound,
      repositoriesCreated: input.repositoriesCreated,
      repositoriesUpdated: input.repositoriesUpdated,
      repositoriesFailed: input.repositoriesFailed,
      rateLimitLimit: input.rateLimit.limit,
      rateLimitRemaining: input.rateLimit.remaining,
      rateLimitResetAt: input.rateLimit.resetAt,
      errorMessage: input.errorMessage,
    },
  });
}

/**
 * Synchronize the authenticated developer's public GitHub repositories.
 *
 * Strategy:
 * - Repository metadata and topics come from the paginated list endpoint.
 * - Language bytes are fetched per repository and treated as best-effort: a
 *   single repository's language failure marks the run `PARTIAL` and preserves
 *   that repository's existing language rows rather than deleting them.
 * - Any rate-limit response aborts the run deliberately (no retry storm).
 * - Every attempt is recorded as a `GitHubRepositorySync` row.
 */
export async function syncGitHubRepositories(
  params: { userId: string; accessToken: string } & SyncDependencies,
): Promise<GitHubSyncResult> {
  const db = params.db ?? prisma;
  const githubClient = params.githubClient ?? new GitHubClient();
  const now = params.now ?? (() => new Date());
  const startedAt = now();
  const errors: string[] = [];

  try {
    const { repositories, rateLimit } = await githubClient.listPublicRepositories({
      accessToken: params.accessToken,
    });

    let created = 0;
    let updated = 0;
    let failed = 0;

    for (const raw of repositories) {
      const repository = normalizeRepository(raw);
      let languages: ReturnType<typeof normalizeLanguages> | null = [];
      let languageFetchFailed = false;

      try {
        const rawLanguages = await githubClient.listRepositoryLanguages({
          accessToken: params.accessToken,
          fullName: repository.fullName,
        });
        languages = normalizeLanguages(rawLanguages);
      } catch (error) {
        if (error instanceof GitHubRateLimitError) throw error;
        languageFetchFailed = true;
        languages = null;
      }

      try {
        const result = await persistRepository(db, params.userId, repository, languages, now());
        if (result.created) created += 1;
        else updated += 1;
      } catch {
        failed += 1;
        addError(errors, `Failed to persist repository ${repository.fullName}.`);
        continue;
      }

      if (languageFetchFailed) {
        failed += 1;
        addError(errors, `Language evidence unavailable for ${repository.fullName}; existing languages preserved.`);
      }
    }

    const completedAt = now();
    const status: GitHubSyncStatusValue = failed > 0 ? "PARTIAL" : "SUCCESS";
    await recordSync(db, {
      userId: params.userId,
      status,
      startedAt,
      completedAt,
      repositoriesFound: repositories.length,
      repositoriesCreated: created,
      repositoriesUpdated: updated,
      repositoriesFailed: failed,
      rateLimit,
      errorMessage: errors.length > 0 ? errors.join(" ") : null,
    });

    return {
      status,
      repositoriesFound: repositories.length,
      repositoriesCreated: created,
      repositoriesUpdated: updated,
      repositoriesFailed: failed,
      rateLimit,
      startedAt: startedAt.toISOString(),
      completedAt: completedAt.toISOString(),
    };
  } catch (error) {
    const completedAt = now();
    const rateLimit = error instanceof GitHubRateLimitError ? error.rateLimit : emptyRateLimit();
    const status: GitHubSyncStatusValue = error instanceof GitHubRateLimitError ? "RATE_LIMITED" : "FAILED";
    const errorMessage =
      error instanceof GitHubError ? error.message : "Repository synchronization failed unexpectedly.";

    try {
      await recordSync(db, {
        userId: params.userId,
        status,
        startedAt,
        completedAt,
        repositoriesFound: 0,
        repositoriesCreated: 0,
        repositoriesUpdated: 0,
        repositoriesFailed: 0,
        rateLimit,
        errorMessage,
      });
    } catch {
      // Persisting the failure record must not mask the original error.
    }

    throw error;
  }
}
