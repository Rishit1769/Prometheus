import { describe, expect, it, vi } from "vitest";
import { persistGitHubAccountCredential } from "./auth-account";

describe("GitHub OAuth reconnect persistence", () => {
  it("updates only the current user's authoritative GitHub account", async () => {
    const updateMany = vi.fn().mockResolvedValue({ count: 1 });
    await persistGitHubAccountCredential({
      db: { account: { updateMany } } as never,
      userId: "user-1",
      providerAccountId: "github-user-1",
      accessToken: "fresh-token",
      refreshToken: null,
      refreshTokenExpiresAt: null,
      expiresAt: null,
      tokenType: "bearer",
      scope: "read:user user:email",
    });

    expect(updateMany).toHaveBeenCalledWith({
      where: { provider: "github", providerAccountId: "github-user-1", userId: "user-1" },
      data: {
        access_token: "fresh-token",
        refresh_token: null,
        refresh_token_expires_at: null,
        expires_at: null,
        token_type: "bearer",
        scope: "read:user user:email",
      },
    });
  });
});
