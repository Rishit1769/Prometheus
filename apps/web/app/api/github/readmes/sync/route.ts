import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { GitHubAccountError, GitHubAuthError } from "@/lib/github/errors";
import { requireGitHubCredentialForUser } from "@/lib/github/credentials";
import { syncGitHubReadmes } from "@/lib/github/readme-sync";

export const dynamic = "force-dynamic";

export async function POST() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json(
      { error: { code: "UNAUTHENTICATED", message: "You must be signed in to synchronize README evidence." } },
      { status: 401 },
    );
  }

  let accessToken: string;
  try {
    accessToken = (await requireGitHubCredentialForUser(userId)).accessToken;
  } catch (error) {
    if (error instanceof GitHubAccountError) {
      return NextResponse.json({ error: { code: error.code, message: error.message } }, { status: 409 });
    }
    if (error instanceof GitHubAuthError) {
      return NextResponse.json({ error: { code: error.code, message: error.message } }, { status: 401 });
    }
    throw error;
  }

  const result = await syncGitHubReadmes({ userId, accessToken });
  const status = result.status === "AUTH_FAILED" ? 401 : result.status === "RATE_LIMITED" ? 429 : 200;
  return NextResponse.json(result, { status });
}
