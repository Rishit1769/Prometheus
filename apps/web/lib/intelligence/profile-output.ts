import { DEVELOPER_OUTPUT_SCHEMA_VERSION, LEGACY_DEVELOPER_OUTPUT_SCHEMA_VERSION } from "./types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function isCurrentDeveloperIntelligenceOutput(output: unknown): boolean {
  if (!isRecord(output) || output.schemaVersion !== DEVELOPER_OUTPUT_SCHEMA_VERSION || !Array.isArray(output.domains)) return false;
  const allowedReferenceTypes = new Set(["REPOSITORY_DESCRIPTION", "LANGUAGE", "TOPIC", "README_SECTION", "README_CONTENT"]);
  return output.domains.every((domain) => {
    if (!isRecord(domain) || !Array.isArray(domain.supportingRepositories) || !Array.isArray(domain.limitations)) return false;
    if (!domain.limitations.every((limitation) => typeof limitation === "string")) return false;
    return domain.supportingRepositories.every((repository) =>
      isRecord(repository) &&
      typeof repository.repositoryId === "string" &&
      typeof repository.repositoryName === "string" &&
      Array.isArray(repository.technologies) &&
      repository.technologies.every((technology) => typeof technology === "string") &&
      Array.isArray(repository.evidenceReferences) &&
      repository.evidenceReferences.every((reference) =>
        isRecord(reference) && typeof reference.type === "string" && allowedReferenceTypes.has(reference.type) && typeof reference.reference === "string",
      ) &&
      typeof repository.explanation === "string",
    );
  });
}

function normalizeEvidenceReferences(value: unknown): Record<string, string>[] {
  if (!Array.isArray(value)) return [];
  const allowedTypes = new Set(["REPOSITORY_DESCRIPTION", "LANGUAGE", "TOPIC", "README_SECTION", "README_CONTENT"]);
  return value.filter((item): item is Record<string, unknown> =>
    isRecord(item) && typeof item.type === "string" && allowedTypes.has(item.type) && typeof item.reference === "string",
  ).map((item) => ({ type: item.type as string, reference: item.reference as string }));
}

/** Add safe defaults when reading developer profile JSON written by older PROM-004 versions. */
export function normalizePersistedDeveloperIntelligenceOutput(output: unknown): unknown {
  if (!isRecord(output)) return output;
  const domains = Array.isArray(output.domains) ? output.domains.filter(isRecord) : [];
  const hasModernAttributionSchema = isCurrentDeveloperIntelligenceOutput(output);

  return {
    ...output,
    schemaVersion: hasModernAttributionSchema ? DEVELOPER_OUTPUT_SCHEMA_VERSION : LEGACY_DEVELOPER_OUTPUT_SCHEMA_VERSION,
    domains: domains.map((value) => {
      if (!isRecord(value)) return value;
      const storedRepositories = Array.isArray(value.supportingRepositories) ? value.supportingRepositories : null;
      const storedLimitations = Array.isArray(value.limitations) ? value.limitations : null;
      const limitations = storedLimitations
        ? storedLimitations.filter((limitation): limitation is string => typeof limitation === "string")
        : [];
      if (!hasModernAttributionSchema && !limitations.some((limitation) => limitation.startsWith("Detailed repository attribution unavailable for this saved profile"))) {
        limitations.push("Detailed repository attribution unavailable for this saved profile. Re-analyze to rebuild it from validated cached repository analyses where possible.");
      }
      return {
        ...value,
        supportingRepositories: hasModernAttributionSchema && storedRepositories
          ? storedRepositories.filter((repository): repository is Record<string, unknown> =>
              isRecord(repository) && typeof repository.repositoryId === "string" && repository.repositoryId.length > 0 && typeof repository.repositoryName === "string",
            ).map((repository) => ({
              repositoryId: typeof repository.repositoryId === "string" ? repository.repositoryId : "",
              repositoryName: repository.repositoryName as string,
              technologies: Array.isArray(repository.technologies) ? repository.technologies.filter((technology): technology is string => typeof technology === "string") : [],
              evidenceReferences: normalizeEvidenceReferences(repository.evidenceReferences),
              explanation: typeof repository.explanation === "string" ? repository.explanation : "",
            }))
          : [],
        limitations,
      };
    }),
  };
}
