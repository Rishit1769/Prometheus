import { PrismaAdapter } from "@auth/prisma-adapter";
import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import { prisma } from "@prometheus/database";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [GitHub],
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
    },
  },
});
