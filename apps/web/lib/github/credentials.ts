import { prisma } from "@prometheus/database";
import { GitHubAccountError, GitHubAuthError } from "./errors";

type DatabaseClient = typeof prisma;

export type GitHubCredential = {
  accessToken: string;
  expiresAt: Date | null;
};

export type GitHubCredentialState =
  | { status: "CONNECTED"; credential: GitHubCredential }
  | { status: "MISSING"; credential: null }
  | { status: "REAUTH_REQUIRED"; credential: null };

type RefreshableAccount = {
  access_token: string | null;
  refresh_token: string | null;
  expires_at: number | null;
  refresh_token_expires_at: number | null;
  providerAccountId: string;
};

async function refreshGitHubCredential(
  account: RefreshableAccount,
  db: DatabaseClient,
  now: Date,
  fetchFn: typeof fetch,
): Promise<GitHubCredential | null> {
  if (!account.refresh_token) return null;
  if (account.refresh_token_expires_at !== null && account.refresh_token_expires_at * 1000 <= now.getTime()) return null;

  const clientId = process.env.AUTH_GITHUB_ID;
  const clientSecret = process.env.AUTH_GITHUB_SECRET;
  if (!clientId || !clientSecret) return null;

  let response: Response;
  try {
    response = await fetchFn("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "refresh_token",
        refresh_token: account.refresh_token,
      }),
    });
  } catch {
    return null;
  }

  if (!response.ok) return null;
  const tokenSet = (await response.json()) as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    refresh_token_expires_in?: number;
    token_type?: string;
    scope?: string;
  };
  if (!tokenSet.access_token) return null;

  const expiresAt = typeof tokenSet.expires_in === "number" ? Math.floor(now.getTime() / 1000) + tokenSet.expires_in : null;
  const refreshTokenExpiresAt = typeof tokenSet.refresh_token_expires_in === "number"
    ? Math.floor(now.getTime() / 1000) + tokenSet.refresh_token_expires_in
    : account.refresh_token_expires_at;
  await db.account.updateMany({
    where: { provider: "github", providerAccountId: account.providerAccountId },
    data: {
      access_token: tokenSet.access_token,
      refresh_token: tokenSet.refresh_token ?? account.refresh_token,
      expires_at: expiresAt,
      refresh_token_expires_at: refreshTokenExpiresAt,
      token_type: tokenSet.token_type ?? null,
      scope: tokenSet.scope ?? null,
    },
  });
  return { accessToken: tokenSet.access_token, expiresAt: expiresAt ? new Date(expiresAt * 1000) : null };
}

/**
 * Resolve a user's GitHub credential without ever crossing the client boundary.
 * GitHub may return expiring access and refresh tokens. Expired access tokens
 * are refreshed server-side; a failed or expired refresh requires OAuth again.
 */
export async function getGitHubCredentialForUser(
  userId: string,
  db: DatabaseClient = prisma,
  now = new Date(),
  fetchFn: typeof fetch = fetch,
): Promise<GitHubCredentialState> {
  const account = await db.account.findFirst({
    where: { userId, provider: "github" },
    select: { access_token: true, refresh_token: true, expires_at: true, refresh_token_expires_at: true, providerAccountId: true },
  });

  if (!account?.access_token) return { status: "MISSING", credential: null };

  if (account.expires_at !== null && account.expires_at * 1000 <= now.getTime()) {
    const refreshed = await refreshGitHubCredential(account, db, now, fetchFn);
    if (refreshed) return { status: "CONNECTED", credential: refreshed };
    return { status: "REAUTH_REQUIRED", credential: null };
  }

  return {
    status: "CONNECTED",
    credential: {
      accessToken: account.access_token,
      expiresAt: account.expires_at ? new Date(account.expires_at * 1000) : null,
    },
  };
}

/** Resolve a credential for a sync route or throw a safe, typed error. */
export async function requireGitHubCredentialForUser(
  userId: string,
  db: DatabaseClient = prisma,
  now = new Date(),
): Promise<GitHubCredential> {
  const state = await getGitHubCredentialForUser(userId, db, now);
  if (state.status === "MISSING") throw new GitHubAccountError();
  if (state.status === "REAUTH_REQUIRED") throw new GitHubAuthError();
  return state.credential;
}
