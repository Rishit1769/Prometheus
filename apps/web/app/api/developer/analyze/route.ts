import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { analyzeDeveloper } from "@/lib/intelligence/service";

export const dynamic = "force-dynamic";

export async function POST() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: { code: "UNAUTHENTICATED", message: "You must be signed in to analyze developer intelligence." } }, { status: 401 });
  try {
    return NextResponse.json(await analyzeDeveloper(userId));
  } catch (error) {
    if (error instanceof Error && error.message === "AI provider is not configured.") {
      return NextResponse.json({ error: { code: "AI_NOT_CONFIGURED", message: "Developer intelligence analysis is not configured on this server." } }, { status: 503 });
    }
    return NextResponse.json({ error: { code: "ANALYSIS_FAILED", message: "Developer intelligence analysis failed." } }, { status: 502 });
  }
}
