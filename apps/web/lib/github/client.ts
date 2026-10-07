import { GitHubApiError, GitHubAuthError, GitHubRateLimitError } from "./errors";
import type {
  GitHubLanguageBytes,
  GitHubAuthenticatedUserPayload,
  GitHubRateLimit,
  GitHubReadmePayload,
  GitHubRepositoryPayload,
} from "./types";
import { GitHubNotFoundError } from "./errors";

const DEFAULT_BASE_URL = "https://api.github.com";
const DEFAULT_USER_AGENT = "prometheus-github-client";
const DEFAULT_MAX_RETRIES = 2;
const PER_PAGE = 100;

export interface GitHubClientOptions {
  /** Injectable fetch implementation, primarily for tests. */
  fetchFn?: typeof fetch;
  baseUrl?: string;
  userAgent?: string;
  /** Number of retries for transient (network / 5xx) failures. Never applied to rate limits. */
  maxRetries?: number;
  retryDelayMs?: number;
}

interface GitHubResponse<T> {
  data: T;
  linkNext: string | null;
  rateLimit: GitHubRateLimit;
}

function emptyRateLimit(): GitHubRateLimit {
  return { limit: null, remaining: null, resetAt: null };
}

function toNumber(value: string | null): number | null {
  if (value === null) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseRateLimit(headers: Headers): GitHubRateLimit {
  const reset = toNumber(headers.get("x-ratelimit-reset"));
  return {
    limit: toNumber(headers.get("x-ratelimit-limit")),
    remaining: toNumber(headers.get("x-ratelimit-remaining")),
    resetAt: reset === null ? null : new Date(reset * 1000),
  };
}

function parseNextLink(link: string | null): string | null {
  if (!link) return null;
  for (const part of link.split(",")) {
    const match = part.match(/<([^>]+)>\s*;\s*rel="next"/);
    if (match) return match[1];
  }
  return null;
}

function isRateLimited(response: Response, rateLimit: GitHubRateLimit): boolean {
  if (response.status === 429) return true;
  return response.status === 403 && rateLimit.remaining === 0;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Minimal authenticated GitHub REST client.
 *
 * Responsibilities:
 * - attach correct headers (API version, user agent, bearer token)
 * - paginate multi-page list endpoints via the `Link` header
 * - surface rate-limit information
 * - translate failures into safe, typed errors
 *
 * The OAuth token is only ever sent to GitHub; it is never logged or returned.
 */
export class GitHubClient {
  private readonly fetchFn: typeof fetch;
  private readonly baseUrl: string;
  private readonly userAgent: string;
  private readonly maxRetries: number;
  private readonly retryDelayMs: number;

  constructor(options: GitHubClientOptions = {}) {
    this.fetchFn = options.fetchFn ?? fetch;
    this.baseUrl = (options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/$/, "");
    this.userAgent = options.userAgent ?? DEFAULT_USER_AGENT;
    this.maxRetries = options.maxRetries ?? DEFAULT_MAX_RETRIES;
    this.retryDelayMs = options.retryDelayMs ?? 250;
  }

  /** List the authenticated developer's public owned repositories across all pages. */
  async listPublicRepositories(params: {
    accessToken: string;
  }): Promise<{ repositories: GitHubRepositoryPayload[]; rateLimit: GitHubRateLimit }> {
    const repositories: GitHubRepositoryPayload[] = [];
    let url: string | null =
      `${this.baseUrl}/user/repos?visibility=public&affiliation=owner&per_page=${PER_PAGE}&page=1`;
    let rateLimit = emptyRateLimit();

    while (url) {
      const response: GitHubResponse<GitHubRepositoryPayload[]> = await this.request<GitHubRepositoryPayload[]>(
        url,
        params.accessToken,
      );
      if (Array.isArray(response.data)) {
        for (const repository of response.data) {
          // Defense in depth: only public evidence is in scope for PROM-002.
          if (repository.private === true) continue;
          repositories.push(repository);
        }
      }
      rateLimit = response.rateLimit;
      url = response.linkNext;
    }

    return { repositories, rateLimit };
  }

  /** Validate the credential through GitHub's authenticated-user endpoint. */
  async getAuthenticatedUser(params: { accessToken: string }): Promise<GitHubAuthenticatedUserPayload> {
    const response = await this.request<GitHubAuthenticatedUserPayload>(`${this.baseUrl}/user`, params.accessToken);
    if (!response.data || typeof response.data.id !== "number" || typeof response.data.login !== "string") {
      throw new GitHubApiError("GitHub returned an invalid authenticated-user response.");
    }
    return response.data;
  }

  /** Fetch language byte counts for a repository, or an empty map when unavailable. */
  async listRepositoryLanguages(params: {
    accessToken: string;
    fullName: string;
  }): Promise<GitHubLanguageBytes> {
    const [owner, repo] = params.fullName.split("/");
    if (!owner || !repo) return {};
    const url = `${this.baseUrl}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/languages`;
    const response = await this.request<GitHubLanguageBytes>(url, params.accessToken);
    if (!response.data || typeof response.data !== "object" || Array.isArray(response.data)) {
      return {};
    }
    return response.data;
  }

  /** Fetch the repository's README through GitHub's supported README endpoint. */
  async getRepositoryReadme(params: { accessToken: string; fullName: string }): Promise<GitHubReadmePayload> {
    const [owner, repo] = params.fullName.split("/");
    if (!owner || !repo) throw new GitHubNotFoundError();
    const url = `${this.baseUrl}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/readme`;
    const response = await this.request<GitHubReadmePayload>(url, params.accessToken);
    if (!response.data || typeof response.data !== "object" || Array.isArray(response.data)) {
      throw new GitHubApiError("GitHub returned an invalid README response.");
    }
    return response.data;
  }

  private async request<T>(url: string, accessToken: string): Promise<GitHubResponse<T>> {
    let attempt = 0;

    for (;;) {
      let response: Response;
      try {
        response = await this.fetchFn(url, {
          headers: {
            Accept: "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
            "User-Agent": this.userAgent,
            Authorization: `Bearer ${accessToken}`,
          },
        });
      } catch {
        if (attempt < this.maxRetries) {
          attempt += 1;
          await delay(this.retryDelayMs * attempt);
          continue;
        }
        throw new GitHubApiError("Unable to reach the GitHub API. Please try again later.");
      }

      const rateLimit = parseRateLimit(response.headers);

      if (response.ok) {
        const data = (await response.json()) as T;
        return { data, linkNext: parseNextLink(response.headers.get("link")), rateLimit };
      }

      if (response.status === 401) {
        throw new GitHubAuthError();
      }

      if (response.status === 404) {
        throw new GitHubNotFoundError();
      }

      if (isRateLimited(response, rateLimit)) {
        throw new GitHubRateLimitError(rateLimit);
      }

      if (response.status >= 500 && attempt < this.maxRetries) {
        attempt += 1;
        await delay(this.retryDelayMs * attempt);
        continue;
      }

      throw new GitHubApiError(`GitHub API request failed (status ${response.status}).`, response.status);
    }
  }
}
