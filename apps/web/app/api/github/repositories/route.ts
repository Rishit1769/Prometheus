import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getLatestSyncForUser, listRepositoriesForUser } from "@/lib/github/queries";

export const dynamic = "force-dynamic";

/**
 * Return the authenticated user's synchronized repositories and latest sync
 * status. Never returns OAuth tokens, secrets, or other users' data.
 */
export async function GET() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json(
      { error: { code: "UNAUTHENTICATED", message: "You must be signed in to view repositories." } },
      { status: 401 },
    );
  }

  const [repositories, latestSync] = await Promise.all([
    listRepositoriesForUser(userId),
    getLatestSyncForUser(userId),
  ]);

  return NextResponse.json({ repositories, latestSync });
}
