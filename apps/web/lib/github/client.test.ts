import { describe, expect, it, vi } from "vitest";
import { GitHubClient } from "./client";
import { GitHubApiError, GitHubAuthError, GitHubNotFoundError, GitHubRateLimitError } from "./errors";
import type { GitHubRepositoryPayload } from "./types";

function repo(id: number, overrides: Partial<GitHubRepositoryPayload> = {}): GitHubRepositoryPayload {
  return {
    id,
    name: `repo-${id}`,
    full_name: `owner/repo-${id}`,
    html_url: `https://github.com/owner/repo-${id}`,
    owner: { login: "owner" },
    ...overrides,
  };
}

function jsonResponse(body: unknown, init: { status?: number; headers?: Record<string, string> } = {}): Response {
  return new Response(JSON.stringify(body), {
    status: init.status ?? 200,
    headers: { "content-type": "application/json", ...(init.headers ?? {}) },
  });
}

function client(fetchFn: typeof fetch, maxRetries = 0) {
  return new GitHubClient({ fetchFn, maxRetries, retryDelayMs: 0 });
}

describe("GitHubClient.listPublicRepositories", () => {
  it("returns repositories with parsed rate-limit information", async () => {
    const fetchFn = vi.fn(async () =>
      jsonResponse([repo(1)], {
        headers: { "x-ratelimit-limit": "5000", "x-ratelimit-remaining": "4999", "x-ratelimit-reset": "1791340424" },
      }),
    ) as unknown as typeof fetch;

    const result = await client(fetchFn).listPublicRepositories({ accessToken: "secret-token" });

    expect(result.repositories).toHaveLength(1);
    expect(result.rateLimit).toEqual({ limit: 5000, remaining: 4999, resetAt: new Date(1791340424 * 1000) });
  });

  it("sends the bearer token and required headers", async () => {
    const fetchFn = vi.fn(async () => jsonResponse([])) as unknown as typeof fetch;

    await client(fetchFn).listPublicRepositories({ accessToken: "secret-token" });

    const init = (fetchFn as unknown as { mock: { calls: [string, RequestInit][] } }).mock.calls[0][1];
    const headers = init.headers as Record<string, string>;
    expect(headers.Authorization).toBe("Bearer secret-token");
    expect(headers.Accept).toBe("application/vnd.github+json");
    expect(headers["X-GitHub-Api-Version"]).toBe("2022-11-28");
  });

  it("follows Link rel=next across multiple pages", async () => {
    const fetchFn = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("page=1")) {
        return jsonResponse([repo(1)], { headers: { link: '<https://api.github.com/user/repos?page=2>; rel="next"' } });
      }
      return jsonResponse([repo(2)]);
    }) as unknown as typeof fetch;

    const result = await client(fetchFn).listPublicRepositories({ accessToken: "t" });

    expect(result.repositories.map((r) => r.id)).toEqual([1, 2]);
    expect((fetchFn as unknown as { mock: { calls: unknown[] } }).mock.calls).toHaveLength(2);
  });

  it("returns an empty list without error when the developer has no repositories", async () => {
    const fetchFn = vi.fn(async () => jsonResponse([])) as unknown as typeof fetch;
    const result = await client(fetchFn).listPublicRepositories({ accessToken: "t" });
    expect(result.repositories).toEqual([]);
  });

  it("excludes private repositories defensively", async () => {
    const fetchFn = vi.fn(async () => jsonResponse([repo(1), repo(2, { private: true })])) as unknown as typeof fetch;
    const result = await client(fetchFn).listPublicRepositories({ accessToken: "t" });
    expect(result.repositories.map((r) => r.id)).toEqual([1]);
  });

  it("throws GitHubAuthError on 401", async () => {
    const fetchFn = vi.fn(async () => jsonResponse({ message: "Bad credentials" }, { status: 401 })) as unknown as typeof fetch;
    await expect(client(fetchFn).listPublicRepositories({ accessToken: "bad" })).rejects.toBeInstanceOf(GitHubAuthError);
  });

  it("throws GitHubRateLimitError when the rate limit is exhausted", async () => {
    const fetchFn = vi.fn(async () =>
      jsonResponse({ message: "API rate limit exceeded" }, {
        status: 403,
        headers: { "x-ratelimit-limit": "60", "x-ratelimit-remaining": "0", "x-ratelimit-reset": "1791340424" },
      }),
    ) as unknown as typeof fetch;

    await expect(client(fetchFn).listPublicRepositories({ accessToken: "t" })).rejects.toBeInstanceOf(GitHubRateLimitError);
  });

  it("throws GitHubApiError on a server error", async () => {
    const fetchFn = vi.fn(async () => jsonResponse({ message: "boom" }, { status: 500 })) as unknown as typeof fetch;
    await expect(client(fetchFn).listPublicRepositories({ accessToken: "t" })).rejects.toMatchObject({
      code: "GITHUB_API_ERROR",
      status: 500,
    });
  });

  it("wraps network failures in GitHubApiError", async () => {
    const fetchFn = vi.fn(async () => {
      throw new TypeError("network down");
    }) as unknown as typeof fetch;
    await expect(client(fetchFn).listPublicRepositories({ accessToken: "t" })).rejects.toBeInstanceOf(GitHubApiError);
  });
});

describe("GitHubClient.listRepositoryLanguages", () => {
  it("returns language byte counts", async () => {
    const fetchFn = vi.fn(async () => jsonResponse({ TypeScript: 184302, JavaScript: 42871 })) as unknown as typeof fetch;
    const result = await client(fetchFn).listRepositoryLanguages({ accessToken: "t", fullName: "owner/repo" });
    expect(result).toEqual({ TypeScript: 184302, JavaScript: 42871 });
  });

  it("returns an empty map for an empty repository", async () => {
    const fetchFn = vi.fn(async () => jsonResponse({})) as unknown as typeof fetch;
    const result = await client(fetchFn).listRepositoryLanguages({ accessToken: "t", fullName: "owner/repo" });
    expect(result).toEqual({});
  });
});

describe("GitHubClient.getRepositoryReadme", () => {
  it("uses the supported README endpoint and returns metadata", async () => {
    const fetchFn = vi.fn(async (input: RequestInfo | URL) => {
      expect(String(input)).toBe("https://api.github.com/repos/owner/repo/readme");
      return jsonResponse({
        encoding: "base64",
        content: Buffer.from("# README", "utf8").toString("base64"),
        path: "README.md",
        sha: "abc123",
      });
    }) as unknown as typeof fetch;

    const result = await client(fetchFn).getRepositoryReadme({ accessToken: "t", fullName: "owner/repo" });
    expect(result.path).toBe("README.md");
    expect(result.sha).toBe("abc123");
  });

  it("maps GitHub 404 to a missing README error", async () => {
    const fetchFn = vi.fn(async () => jsonResponse({ message: "Not Found" }, { status: 404 })) as unknown as typeof fetch;
    await expect(client(fetchFn).getRepositoryReadme({ accessToken: "t", fullName: "owner/repo" })).rejects.toBeInstanceOf(
      GitHubNotFoundError,
    );
  });
});
