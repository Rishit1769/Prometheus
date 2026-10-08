import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      githubUsername: string | null;
      githubProfileUrl: string | null;
    } & DefaultSession["user"];
  }
}
