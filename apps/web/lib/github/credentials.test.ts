import { describe, expect, it, vi } from "vitest";
import { getGitHubCredentialForUser } from "./credentials";

function dbWithAccount(account: Record<string, unknown> | null) {
  return { account: { findFirst: vi.fn().mockResolvedValue(account) } } as never;
}

describe("GitHub credential service", () => {
  it("returns connected without exposing credential metadata beyond the server boundary", async () => {
    const result = await getGitHubCredentialForUser("user-1", dbWithAccount({ access_token: "secret", refresh_token: null, expires_at: null, refresh_token_expires_at: null }));
    expect(result).toEqual({ status: "CONNECTED", credential: { accessToken: "secret", expiresAt: null } });
  });

  it("classifies a missing account or token", async () => {
    await expect(getGitHubCredentialForUser("user-1", dbWithAccount(null))).resolves.toEqual({ status: "MISSING", credential: null });
    await expect(getGitHubCredentialForUser("user-1", dbWithAccount({ access_token: null, refresh_token: null, expires_at: null, refresh_token_expires_at: null }))).resolves.toEqual({ status: "MISSING", credential: null });
  });

  it("requires reauthentication for an expired credential without refresh support", async () => {
    const result = await getGitHubCredentialForUser(
      "user-1",
      dbWithAccount({ access_token: "secret", refresh_token: null, expires_at: 100, refresh_token_expires_at: null }),
      new Date(101_000),
    );
    expect(result).toEqual({ status: "REAUTH_REQUIRED", credential: null });
  });

  it("refreshes an expired GitHub credential and rotates the stored token", async () => {
    const updateMany = vi.fn().mockResolvedValue({ count: 1 });
    const db = { account: { findFirst: vi.fn().mockResolvedValue({
      access_token: "old-access",
      refresh_token: "old-refresh",
      expires_at: 100,
      refresh_token_expires_at: 500,
      providerAccountId: "github-1",
    }), updateMany } } as never;
    const fetchFn = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      access_token: "new-access",
      refresh_token: "new-refresh",
      expires_in: 28800,
      refresh_token_expires_in: 15897600,
      token_type: "bearer",
      scope: "read:user,user:email",
    }), { status: 200, headers: { "content-type": "application/json" } }));
    const originalId = process.env.AUTH_GITHUB_ID;
    const originalSecret = process.env.AUTH_GITHUB_SECRET;
    process.env.AUTH_GITHUB_ID = "client-id";
    process.env.AUTH_GITHUB_SECRET = "client-secret";
    try {
      const result = await getGitHubCredentialForUser("user-1", db, new Date(101_000), fetchFn);
      expect(result.status).toBe("CONNECTED");
      expect(updateMany).toHaveBeenCalledOnce();
      expect(fetchFn).toHaveBeenCalledWith("https://github.com/login/oauth/access_token", expect.objectContaining({ method: "POST" }));
    } finally {
      process.env.AUTH_GITHUB_ID = originalId;
      process.env.AUTH_GITHUB_SECRET = originalSecret;
    }
  });
});
