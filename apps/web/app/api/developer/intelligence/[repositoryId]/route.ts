import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getRepositoryIntelligenceForUser } from "@/lib/github/queries";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ repositoryId: string }> }) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: { code: "UNAUTHENTICATED", message: "You must be signed in to view repository intelligence." } }, { status: 401 });
  const { repositoryId } = await context.params;
  const intelligence = await getRepositoryIntelligenceForUser(userId, repositoryId);
  if (!intelligence) return NextResponse.json({ error: { code: "NOT_FOUND", message: "Repository intelligence was not found." } }, { status: 404 });
  return NextResponse.json({ intelligence });
}
