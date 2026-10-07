import { prisma } from "@prometheus/database";

type AccountStore = Pick<typeof prisma, "account">;

export async function persistGitHubAccountCredential(params: {
  db?: AccountStore;
  userId: string;
  providerAccountId: string;
  accessToken: string;
  refreshToken?: string | null;
  refreshTokenExpiresAt?: number | null;
  expiresAt?: number | null;
  tokenType?: string | null;
  scope?: string | null;
}): Promise<void> {
  const db = params.db ?? prisma;
  await db.account.updateMany({
    where: {
      provider: "github",
      providerAccountId: params.providerAccountId,
      userId: params.userId,
    },
    data: {
      access_token: params.accessToken,
      refresh_token: params.refreshToken ?? null,
      refresh_token_expires_at: params.refreshTokenExpiresAt ?? null,
      expires_at: params.expiresAt ?? null,
      token_type: params.tokenType ?? null,
      scope: params.scope ?? null,
    },
  });
}
