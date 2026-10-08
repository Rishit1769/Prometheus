import type { GitHubRateLimit } from "./types";

/**
 * Base class for GitHub integration failures.
 *
 * Messages are deliberately safe for client display: they never include the
 * OAuth token, request headers, or raw response bodies.
 */
export class GitHubError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "GitHubError";
    this.code = code;
  }
}

/** The GitHub account is missing or its stored token is unavailable. */
export class GitHubAccountError extends GitHubError {
  constructor(message = "No connected GitHub account was found for this user.") {
    super("GITHUB_ACCOUNT_MISSING", message);
    this.name = "GitHubAccountError";
  }
}

/** GitHub rejected the token (expired, revoked, or invalid). */
export class GitHubAuthError extends GitHubError {
  constructor(message = "GitHub rejected the stored access token. Please sign in with GitHub again.") {
    super("GITHUB_REAUTH_REQUIRED", message);
    this.name = "GitHubAuthError";
  }
}

/** The repository has no README according to GitHub. */
export class GitHubNotFoundError extends GitHubError {
  constructor(message = "GitHub README was not found for this repository.") {
    super("GITHUB_NOT_FOUND", message);
    this.name = "GitHubNotFoundError";
  }
}

/** GitHub rate limit has been exhausted. */
export class GitHubRateLimitError extends GitHubError {
  readonly rateLimit: GitHubRateLimit;

  constructor(rateLimit: GitHubRateLimit, message = "GitHub API rate limit has been exhausted. Try again later.") {
    super("GITHUB_RATE_LIMITED", message);
    this.name = "GitHubRateLimitError";
    this.rateLimit = rateLimit;
  }
}

/** GitHub returned an unexpected error response or the request failed. */
export class GitHubApiError extends GitHubError {
  readonly status: number | null;

  constructor(message: string, status: number | null = null) {
    super("GITHUB_API_ERROR", message);
    this.name = "GitHubApiError";
    this.status = status;
  }
}
