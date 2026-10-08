export type IntelligenceStage = "provider" | "parse" | "validation" | "persistence" | "summary";

export interface IntelligenceDiagnostic {
  stage: IntelligenceStage;
  code: string;
  message: string;
  providerStatus?: number;
  validationIssuePaths?: string[];
}

function safeCode(value: string): string {
  return value.replace(/[^a-zA-Z0-9_.-]/g, "_").slice(0, 80) || "UNKNOWN";
}

export function safeDiagnosticMessage(value: string, secret?: string): string {
  let message = value.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim();
  if (secret) message = message.split(secret).join("<redacted>");
  message = message.replace(/Bearer\s+\S+/gi, "Bearer <redacted>");
  return message.slice(0, 400) || "The intelligence analysis failed.";
}

export class IntelligenceError extends Error {
  readonly diagnostic: IntelligenceDiagnostic;

  constructor(diagnostic: IntelligenceDiagnostic) {
    super(diagnostic.message);
    this.name = "IntelligenceError";
    this.diagnostic = {
      ...diagnostic,
      code: safeCode(diagnostic.code),
      message: safeDiagnosticMessage(diagnostic.message),
      validationIssuePaths: diagnostic.validationIssuePaths?.slice(0, 20),
    };
  }
}

export class DeveloperAnalysisFailure extends Error {
  readonly diagnostic: IntelligenceDiagnostic;
  readonly failedRepositories: number;

  constructor(diagnostic: IntelligenceDiagnostic, failedRepositories: number) {
    super(diagnostic.message);
    this.name = "DeveloperAnalysisFailure";
    this.diagnostic = diagnostic;
    this.failedRepositories = failedRepositories;
  }
}

export function diagnosticForError(error: unknown, fallbackStage: IntelligenceStage = "provider"): IntelligenceDiagnostic {
  if (error instanceof IntelligenceError) return error.diagnostic;
  return {
    stage: fallbackStage,
    code: fallbackStage === "persistence" ? "PERSISTENCE_FAILED" : "ANALYSIS_FAILED",
    message: "Repository analysis failed. Check the diagnostic stage and retry.",
  };
}

export function formatDiagnostic(diagnostic: IntelligenceDiagnostic): string {
  const details = [
    `${diagnostic.stage}/${diagnostic.code}`,
    diagnostic.providerStatus === undefined ? null : `HTTP ${diagnostic.providerStatus}`,
    diagnostic.validationIssuePaths?.length ? `paths: ${diagnostic.validationIssuePaths.join(", ")}` : null,
  ].filter(Boolean);
  return `${details.join("; ")}: ${diagnostic.message}`.slice(0, 700);
}
