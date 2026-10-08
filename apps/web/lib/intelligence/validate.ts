import {
  INTELLIGENCE_DOMAINS,
  type DeveloperSummaryOutput,
  type EvidenceReference,
  type RepositoryAnalysisOutput,
  type RepositoryAnalysisInput,
  type IntelligenceDomain,
} from "./types";

const COMPLEXITIES = ["TRIVIAL", "SIMPLE", "MODERATE", "COMPLEX", "ADVANCED"] as const;
const DOCUMENTATION = ["LIMITED", "BASIC", "GOOD", "STRONG"] as const;
const REFERENCE_TYPES = ["REPOSITORY_DESCRIPTION", "LANGUAGE", "TOPIC", "README_SECTION", "README_CONTENT"] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function boundedString(value: unknown, field: string, max: number): string {
  if (typeof value !== "string" || value.length > max) throw new Error(`Invalid ${field}`);
  return value;
}

function boundedArray(value: unknown, field: string, max: number): unknown[] {
  if (!Array.isArray(value) || value.length > max) throw new Error(`Invalid ${field}`);
  return value;
}

function boundedNumber(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0 || value > 1) throw new Error(`Invalid ${field}`);
  return value;
}

function validateReference(value: unknown): EvidenceReference {
  if (!isRecord(value) || !REFERENCE_TYPES.includes(value.type as (typeof REFERENCE_TYPES)[number])) throw new Error("Invalid evidence reference");
  return {
    type: value.type as EvidenceReference["type"],
    reference: boundedString(value.reference, "evidence reference", 300),
    ...(value.excerptHash === undefined ? {} : { excerptHash: boundedString(value.excerptHash, "excerpt hash", 128) }),
  };
}

function validateDomain(value: unknown): RepositoryAnalysisOutput["demonstratedDomains"][number] {
  if (!isRecord(value) || !INTELLIGENCE_DOMAINS.includes(value.domain as IntelligenceDomain)) throw new Error("Invalid domain");
  return {
    domain: value.domain as IntelligenceDomain,
    strength: boundedNumber(value.strength, "domain strength"),
    confidence: boundedNumber(value.confidence, "domain confidence"),
    evidence: boundedArray(value.evidence, "domain evidence", 12).map(validateReference),
    reasoningSummary: boundedString(value.reasoningSummary, "reasoning summary", 600),
  };
}

export function validateRepositoryAnalysisOutput(value: unknown): RepositoryAnalysisOutput {
  if (!isRecord(value)) throw new Error("Model output must be an object");
  const domains = boundedArray(value.demonstratedDomains, "demonstrated domains", 8).map(validateDomain);
  if (new Set(domains.map((domain) => domain.domain)).size !== domains.length) throw new Error("Duplicate domain");
  const technologies = boundedArray(value.detectedTechnologies, "detected technologies", 40).map((item) => {
    if (!isRecord(item)) throw new Error("Invalid technology");
    return {
      name: boundedString(item.name, "technology", 100),
      evidence: boundedArray(item.evidence, "technology evidence", 12).map(validateReference),
    };
  });
  const references = boundedArray(value.evidenceReferences, "evidence references", 30).map(validateReference);
  if (!COMPLEXITIES.includes(value.projectComplexity as (typeof COMPLEXITIES)[number])) throw new Error("Invalid complexity");
  if (!DOCUMENTATION.includes(value.documentationQuality as (typeof DOCUMENTATION)[number])) throw new Error("Invalid documentation quality");
  return {
    summary: boundedString(value.summary, "summary", 2000),
    detectedTechnologies: technologies,
    demonstratedDomains: domains,
    projectComplexity: value.projectComplexity as RepositoryAnalysisOutput["projectComplexity"],
    documentationQuality: value.documentationQuality as RepositoryAnalysisOutput["documentationQuality"],
    architectureSignals: boundedArray(value.architectureSignals, "architecture signals", 20).map((item) => boundedString(item, "architecture signal", 300)),
    engineeringSignals: boundedArray(value.engineeringSignals, "engineering signals", 20).map((item) => boundedString(item, "engineering signal", 300)),
    limitations: boundedArray(value.limitations, "limitations", 20).map((item) => boundedString(item, "limitation", 300)),
    confidence: boundedNumber(value.confidence, "confidence"),
    evidenceReferences: references,
  };
}

export function validateDeveloperSummaryOutput(value: unknown): DeveloperSummaryOutput {
  if (!isRecord(value)) throw new Error("Developer summary must be an object");
  return {
    profileSummary: boundedString(value.profileSummary, "profile summary", 2000),
    limitations: boundedArray(value.limitations, "developer limitations", 20).map((item) => boundedString(item, "limitation", 300)),
  };
}

function headingSlug(value: string): string {
  return value.toLowerCase().trim().replace(/[`*_]/g, "").replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-");
}

/** Remove model references that do not point to the supplied evidence payload. */
export function groundRepositoryAnalysisOutput(output: RepositoryAnalysisOutput, input: RepositoryAnalysisInput): RepositoryAnalysisOutput {
  const headings = new Set<string>();
  for (const match of input.readme.content?.matchAll(/^#{1,6}\s+(.+)$/gm) ?? []) {
    const heading = match[1].trim();
    headings.add(heading);
    headings.add(`README.md#${headingSlug(heading)}`);
  }
  const validReference = (reference: EvidenceReference): boolean => {
    if (reference.type === "REPOSITORY_DESCRIPTION") return Boolean(input.repository.description) && ["description", "repository.description"].includes(reference.reference);
    if (reference.type === "LANGUAGE") return input.repository.languages.some((language) => language.name === reference.reference);
    if (reference.type === "TOPIC") return input.repository.topics.includes(reference.reference);
    if (reference.type === "README_SECTION") return headings.has(reference.reference);
    return Boolean(input.readme.content) && ["README.md", "README_CONTENT", input.readme.contentHash].includes(reference.reference);
  };
  const ground = (references: EvidenceReference[]) => references.filter(validReference);
  return {
    ...output,
    detectedTechnologies: output.detectedTechnologies.map((technology) => ({ ...technology, evidence: ground(technology.evidence) })).filter((technology) => technology.evidence.length > 0),
    demonstratedDomains: output.demonstratedDomains.map((domain) => ({ ...domain, evidence: ground(domain.evidence) })).filter((domain) => domain.evidence.length > 0),
    evidenceReferences: ground(output.evidenceReferences),
  };
}
