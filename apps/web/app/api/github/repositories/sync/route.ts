import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  GitHubAccountError,
  GitHubApiError,
  GitHubAuthError,
  GitHubRateLimitError,
} from "@/lib/github/errors";
import { requireGitHubCredentialForUser } from "@/lib/github/credentials";
import { syncGitHubRepositories } from "@/lib/github/sync";

export const dynamic = "force-dynamic";

function errorResponse(code: string, message: string, status: number, extra?: Record<string, unknown>) {
  return NextResponse.json({ error: { code, message, ...extra } }, { status });
}

/**
 * Trigger a public-repository synchronization for the authenticated user.
 *
 * The user identity is always derived from the server session; the request body
 * is ignored so a client can never synchronize another user's repositories.
 */
export async function POST() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return errorResponse("UNAUTHENTICATED", "You must be signed in to synchronize repositories.", 401);
  }

  let accessToken: string;
  try {
    accessToken = (await requireGitHubCredentialForUser(userId)).accessToken;
  } catch (error) {
    if (error instanceof GitHubAccountError) return errorResponse(error.code, error.message, 409);
    if (error instanceof GitHubAuthError) return errorResponse(error.code, error.message, 401);
    throw error;
  }

  try {
    const result = await syncGitHubRepositories({ userId, accessToken });
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    if (error instanceof GitHubRateLimitError) {
      return errorResponse(error.code, error.message, 429, {
        resetAt: error.rateLimit.resetAt?.toISOString() ?? null,
      });
    }
    if (error instanceof GitHubAuthError) {
      return errorResponse(error.code, error.message, 401);
    }
    if (error instanceof GitHubApiError) {
      return errorResponse(error.code, error.message, 502);
    }
    return errorResponse("SYNC_FAILED", "Repository synchronization failed unexpectedly.", 500);
  }
}
