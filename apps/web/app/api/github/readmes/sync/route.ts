import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { GitHubAccountError } from "@/lib/github/errors";
import { getGitHubAccessToken } from "@/lib/github/sync";
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

  const accessToken = await getGitHubAccessToken(userId);
  if (!accessToken) {
    const error = new GitHubAccountError();
    return NextResponse.json({ error: { code: error.code, message: error.message } }, { status: 409 });
  }

  const result = await syncGitHubReadmes({ userId, accessToken });
  const status = result.status === "AUTH_FAILED" ? 401 : result.status === "RATE_LIMITED" ? 429 : 200;
  return NextResponse.json(result, { status });
}
