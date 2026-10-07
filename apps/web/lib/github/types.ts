/**
 * Types for the GitHub integration boundary.
 *
 * `GitHubRepositoryPayload` mirrors the subset of the GitHub REST API response
 * that PROM-002 consumes. Internal code must not depend on this shape directly;
 * see `normalize.ts` for the conversion into PROMETHEUS domain structures.
 */

export interface GitHubRepositoryOwnerPayload {
  login?: string | null;
}

export interface GitHubRepositoryPayload {
  id: number;
  name: string;
  full_name: string;
  owner?: GitHubRepositoryOwnerPayload | null;
  description?: string | null;
  html_url: string;
  fork?: boolean;
  archived?: boolean;
  is_template?: boolean;
  default_branch?: string | null;
  language?: string | null;
  stargazers_count?: number;
  forks_count?: number;
  watchers_count?: number;
  open_issues_count?: number;
  size?: number;
  topics?: string[] | null;
  created_at?: string | null;
  updated_at?: string | null;
  pushed_at?: string | null;
  private?: boolean;
  visibility?: string | null;
}

/** GitHub's languages endpoint returns a map of language name to byte count. */
export type GitHubLanguageBytes = Record<string, number>;

/** GitHub's repository README endpoint response. */
export interface GitHubReadmePayload {
  type?: string;
  encoding?: string;
  size?: number;
  name?: string;
  path?: string;
  content?: string;
  sha?: string;
  download_url?: string | null;
}

/** Minimal authenticated-user response used only for safe credential checks. */
export interface GitHubAuthenticatedUserPayload {
  id: number;
  login: string;
}

/** Parsed rate-limit information from GitHub response headers. */
export interface GitHubRateLimit {
  limit: number | null;
  remaining: number | null;
  resetAt: Date | null;
}

/** Normalized repository evidence ready for persistence. */
export interface NormalizedRepository {
  githubRepositoryId: bigint;
  ownerLogin: string;
  name: string;
  fullName: string;
  description: string | null;
  url: string;
  isFork: boolean;
  isPrivate: boolean;
  isArchived: boolean;
  isTemplate: boolean;
  defaultBranch: string | null;
  primaryLanguage: string | null;
  stars: number;
  forks: number;
  watchers: number;
  openIssues: number;
  size: number;
  topics: string[];
  githubCreatedAt: Date | null;
  githubUpdatedAt: Date | null;
  githubPushedAt: Date | null;
}

/** Normalized language evidence for a repository. */
export interface NormalizedLanguage {
  language: string;
  bytes: number;
  percentage: number;
}

export type GitHubSyncStatusValue = "SUCCESS" | "PARTIAL" | "FAILED" | "RATE_LIMITED";

/**
 * The subset of GitHub behaviour the synchronization service depends on. Kept
 * as an interface so tests (and future providers) can substitute an
 * implementation without depending on the concrete client.
 */
export interface GitHubRepositorySource {
  listPublicRepositories(params: {
    accessToken: string;
  }): Promise<{ repositories: GitHubRepositoryPayload[]; rateLimit: GitHubRateLimit }>;
  listRepositoryLanguages(params: { accessToken: string; fullName: string }): Promise<GitHubLanguageBytes>;
}

export interface GitHubReadmeSource {
  getRepositoryReadme(params: { accessToken: string; fullName: string }): Promise<GitHubReadmePayload>;
}

/** Result of a synchronization run, safe to return to the client. */
export interface GitHubSyncResult {
  status: GitHubSyncStatusValue;
  repositoriesFound: number;
  repositoriesCreated: number;
  repositoriesUpdated: number;
  repositoriesFailed: number;
  rateLimit: GitHubRateLimit;
  startedAt: string;
  completedAt: string;
}
