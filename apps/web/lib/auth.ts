import { PrismaAdapter } from "@auth/prisma-adapter";
import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import { prisma } from "@prometheus/database";
import { persistGitHubAccountCredential } from "./auth-account";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    GitHub({
      account(account) {
        const refreshTokenExpiresIn = Number(account.refresh_token_expires_in);
        return {
          ...account,
          refresh_token_expires_at: Number.isFinite(refreshTokenExpiresIn) && refreshTokenExpiresIn > 0
            ? Math.floor(Date.now() / 1000) + refreshTokenExpiresIn
            : undefined,
        };
      },
    }),
  ],
  session: { strategy: "database" },
  callbacks: {
    async session({ session, user }) {
      const identity = await prisma.user.findUnique({
        where: { id: user.id },
        select: { githubUsername: true, githubProfileUrl: true },
      });
      session.user.githubUsername = identity?.githubUsername ?? null;
      session.user.githubProfileUrl = identity?.githubProfileUrl ?? null;
      return session;
    },
  },
  events: {
    async signIn({ user, account, profile }) {
      if (account?.provider !== "github" || !user.id) return;
      const githubProfile = profile as { login?: string; html_url?: string };
      await prisma.user.update({
        where: { id: user.id },
        data: {
          githubUsername: githubProfile.login ?? undefined,
          githubProfileUrl: githubProfile.html_url ?? undefined,
        },
      });

      // Auth.js does not update an existing OAuth Account when the same linked
      // provider account signs in again. Persist the fresh token from the
      // provider callback, scoped by the authoritative provider account id and
      // current user, so reconnect works without relinking arbitrary accounts.
      if (account.providerAccountId && account.access_token) {
        await persistGitHubAccountCredential({
          userId: user.id,
          providerAccountId: account.providerAccountId,
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          refreshTokenExpiresAt: (account as typeof account & { refresh_token_expires_at?: number | null }).refresh_token_expires_at,
          expiresAt: account.expires_at,
          tokenType: account.token_type,
          scope: account.scope,
        });
      }
    },
  },
});
