import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Mock } from "vitest";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/github/sync", () => ({ getGitHubAccessToken: vi.fn() }));
vi.mock("@/lib/github/readme-sync", () => ({ syncGitHubReadmes: vi.fn() }));

import { auth } from "@/lib/auth";
import { getGitHubAccessToken } from "@/lib/github/sync";
import { syncGitHubReadmes } from "@/lib/github/readme-sync";
import { POST } from "@/app/api/github/readmes/sync/route";

const authMock = auth as unknown as Mock;
const tokenMock = getGitHubAccessToken as unknown as Mock;
const syncMock = syncGitHubReadmes as unknown as Mock;

describe("POST /api/github/readmes/sync", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rejects unauthenticated requests", async () => {
    authMock.mockResolvedValue(null);
    const response = await POST();
    expect(response.status).toBe(401);
    expect(syncMock).not.toHaveBeenCalled();
  });

  it("derives ownership from the authenticated session", async () => {
    authMock.mockResolvedValue({ user: { id: "user-1" } });
    tokenMock.mockResolvedValue("token");
    syncMock.mockResolvedValue({ status: "SUCCESS", repositoriesEligible: 0 });
    await POST();
    expect(syncMock).toHaveBeenCalledWith({ userId: "user-1", accessToken: "token" });
  });

  it("maps authentication and rate-limit statuses safely", async () => {
    authMock.mockResolvedValue({ user: { id: "user-1" } });
    tokenMock.mockResolvedValue("token");
    syncMock.mockResolvedValueOnce({ status: "AUTH_FAILED" });
    expect((await POST()).status).toBe(401);
    syncMock.mockResolvedValueOnce({ status: "RATE_LIMITED" });
    expect((await POST()).status).toBe(429);
  });
});
