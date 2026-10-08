import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getReadmeEvidenceForRepository } from "@/lib/github/queries";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json(
      { error: { code: "UNAUTHENTICATED", message: "You must be signed in to view README evidence." } },
      { status: 401 },
    );
  }

  const { id } = await context.params;
  if (!/^[A-Za-z0-9_-]+$/.test(id)) {
    return NextResponse.json({ error: { code: "INVALID_REPOSITORY_ID", message: "Invalid repository id." } }, { status: 400 });
  }

  const result = await getReadmeEvidenceForRepository(userId, id);
  if (!result) {
    return NextResponse.json({ error: { code: "NOT_FOUND", message: "Repository README evidence was not found." } }, { status: 404 });
  }

  return NextResponse.json(result);
}
