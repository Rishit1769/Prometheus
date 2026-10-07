import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Mock } from "vitest";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/github/sync", () => ({
  getGitHubAccessToken: vi.fn(),
  syncGitHubRepositories: vi.fn(),
}));

import { auth } from "@/lib/auth";
import { GitHubAuthError, GitHubRateLimitError } from "@/lib/github/errors";
import { getGitHubAccessToken, syncGitHubRepositories } from "@/lib/github/sync";
import { POST } from "@/app/api/github/repositories/sync/route";

const authMock = auth as unknown as Mock;
const tokenMock = getGitHubAccessToken as unknown as Mock;
const syncMock = syncGitHubRepositories as unknown as Mock;

const successResult = {
  status: "SUCCESS",
  repositoriesFound: 1,
  repositoriesCreated: 1,
  repositoriesUpdated: 0,
  repositoriesFailed: 0,
  rateLimit: { limit: 5000, remaining: 4999, resetAt: null },
  startedAt: "2026-01-01T00:00:00.000Z",
  completedAt: "2026-01-01T00:00:01.000Z",
};

describe("POST /api/github/repositories/sync", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects unauthenticated requests", async () => {
    authMock.mockResolvedValue(null);
    const response = await POST();
    expect(response.status).toBe(401);
    expect(syncMock).not.toHaveBeenCalled();
    expect(tokenMock).not.toHaveBeenCalled();
  });

  it("rejects when no GitHub account token is connected", async () => {
    authMock.mockResolvedValue({ user: { id: "user-1" } });
    tokenMock.mockResolvedValue(null);
    const response = await POST();
    expect(response.status).toBe(409);
    expect(syncMock).not.toHaveBeenCalled();
  });

  it("derives the user from the server session and ignores any client input", async () => {
    authMock.mockResolvedValue({ user: { id: "user-1" } });
    tokenMock.mockResolvedValue("token");
    syncMock.mockResolvedValue(successResult);

    const response = await POST();

    expect(response.status).toBe(200);
    expect(syncMock).toHaveBeenCalledWith({ userId: "user-1", accessToken: "token" });
  });

  it("maps GitHub authentication failures to a safe response without leaking secrets", async () => {
    authMock.mockResolvedValue({ user: { id: "user-1" } });
    tokenMock.mockResolvedValue("gho_supersecret_value");
    syncMock.mockRejectedValue(new GitHubAuthError());

    const response = await POST();
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error.code).toBe("GITHUB_AUTH_FAILED");
    expect(JSON.stringify(body)).not.toContain("gho_supersecret_value");
  });

  it("maps rate limit failures to 429 with the reset time", async () => {
    authMock.mockResolvedValue({ user: { id: "user-1" } });
    tokenMock.mockResolvedValue("token");
    syncMock.mockRejectedValue(
      new GitHubRateLimitError({ limit: 60, remaining: 0, resetAt: new Date("2026-01-01T00:00:00Z") }),
    );

    const response = await POST();
    const body = await response.json();

    expect(response.status).toBe(429);
    expect(body.error.code).toBe("GITHUB_RATE_LIMITED");
    expect(body.error.resetAt).toBe("2026-01-01T00:00:00.000Z");
  });
});
