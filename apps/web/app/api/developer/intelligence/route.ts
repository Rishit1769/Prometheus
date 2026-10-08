import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDeveloperIntelligenceForUser } from "@/lib/github/queries";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: { code: "UNAUTHENTICATED", message: "You must be signed in to view developer intelligence." } }, { status: 401 });
  return NextResponse.json({ intelligence: await getDeveloperIntelligenceForUser(userId) });
}
