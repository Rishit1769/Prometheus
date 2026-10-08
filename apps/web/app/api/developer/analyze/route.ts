import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { analyzeDeveloper } from "@/lib/intelligence/service";
import { DeveloperAnalysisFailure, formatDiagnostic } from "@/lib/intelligence/errors";

export const dynamic = "force-dynamic";

export async function POST() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: { code: "UNAUTHENTICATED", message: "You must be signed in to analyze developer intelligence." } }, { status: 401 });
  try {
    return NextResponse.json(await analyzeDeveloper(userId));
  } catch (error) {
    if (error instanceof DeveloperAnalysisFailure) {
      const errorCode = error.diagnostic.stage === "provider"
        ? "ANALYSIS_PROVIDER_FAILED"
        : error.diagnostic.stage === "validation" || error.diagnostic.stage === "parse"
          ? "ANALYSIS_OUTPUT_INVALID"
          : "ANALYSIS_FAILED";
      return NextResponse.json({
        error: {
          code: errorCode,
          message: error.diagnostic.message,
          diagnostic: {
            stage: error.diagnostic.stage,
            code: error.diagnostic.code,
            providerStatus: error.diagnostic.providerStatus ?? null,
            validationIssuePaths: error.diagnostic.validationIssuePaths ?? [],
            failedRepositories: error.failedRepositories,
            summary: formatDiagnostic(error.diagnostic),
          },
        },
      }, { status: 502 });
    }
    if (error instanceof Error && error.message === "AI provider is not configured.") {
      return NextResponse.json({ error: { code: "AI_NOT_CONFIGURED", message: "Developer intelligence analysis is not configured on this server." } }, { status: 503 });
    }
    return NextResponse.json({ error: { code: "ANALYSIS_FAILED", message: "Developer intelligence analysis failed." } }, { status: 502 });
  }
}
