import {
  INTELLIGENCE_DOMAINS,
  type DeveloperSummaryOutput,
  type EvidenceReference,
  type RepositoryAnalysisOutput,
  type RepositoryAnalysisInput,
  type IntelligenceDomain,
} from "./types";
import { IntelligenceError } from "./errors";

const COMPLEXITIES = ["TRIVIAL", "SIMPLE", "MODERATE", "COMPLEX", "ADVANCED"] as const;
const DOCUMENTATION = ["LIMITED", "BASIC", "GOOD", "STRONG"] as const;
const REFERENCE_TYPES = ["REPOSITORY_DESCRIPTION", "LANGUAGE", "TOPIC", "README_SECTION", "README_CONTENT"] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export class OutputValidationError extends IntelligenceError {
  constructor(path: string) {
    super({
      stage: "validation",
      code: "OUTPUT_SCHEMA_INVALID",
      message: `Model output did not match the repository analysis schema at ${path}.`,
      validationIssuePaths: [path],
    });
    this.name = "OutputValidationError";
  }
}

function invalid(path: string): never {
  throw new OutputValidationError(path);
}

function boundedString(value: unknown, path: string, max: number): string {
  if (typeof value !== "string" || value.length > max) return invalid(path);
  return value;
}

function boundedArray(value: unknown, path: string, max: number): unknown[] {
  if (!Array.isArray(value) || value.length > max) return invalid(path);
  return value;
}

function boundedNumber(value: unknown, path: string): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0 || value > 1) return invalid(path);
  return value;
}

function validateReference(value: unknown, path: string): EvidenceReference {
  if (!isRecord(value) || !REFERENCE_TYPES.includes(value.type as (typeof REFERENCE_TYPES)[number])) return invalid(`${path}.type`);
  return {
    type: value.type as EvidenceReference["type"],
    reference: boundedString(value.reference, `${path}.reference`, 300),
    ...(value.excerptHash === undefined ? {} : { excerptHash: boundedString(value.excerptHash, `${path}.excerptHash`, 128) }),
  };
}

function validateDomain(value: unknown, path: string): RepositoryAnalysisOutput["demonstratedDomains"][number] {
  if (!isRecord(value) || !INTELLIGENCE_DOMAINS.includes(value.domain as IntelligenceDomain)) return invalid(`${path}.domain`);
  return {
    domain: value.domain as IntelligenceDomain,
    strength: boundedNumber(value.strength, `${path}.strength`),
    confidence: boundedNumber(value.confidence, `${path}.confidence`),
    evidence: boundedArray(value.evidence, `${path}.evidence`, 12).map((item, index) => validateReference(item, `${path}.evidence[${index}]`)),
    reasoningSummary: boundedString(value.reasoningSummary, `${path}.reasoningSummary`, 600),
  };
}

export function validateRepositoryAnalysisOutput(value: unknown): RepositoryAnalysisOutput {
  if (!isRecord(value)) return invalid("$");
  const domains = boundedArray(value.demonstratedDomains, "demonstratedDomains", 8).map((item, index) => validateDomain(item, `demonstratedDomains[${index}]`));
  if (new Set(domains.map((domain) => domain.domain)).size !== domains.length) return invalid("demonstratedDomains");
  const technologies = boundedArray(value.detectedTechnologies, "detectedTechnologies", 40).map((item, index) => {
    const path = `detectedTechnologies[${index}]`;
    if (!isRecord(item)) return invalid(path);
    return {
      name: boundedString(item.name, `${path}.name`, 100),
      evidence: boundedArray(item.evidence, `${path}.evidence`, 12).map((reference, referenceIndex) => validateReference(reference, `${path}.evidence[${referenceIndex}]`)),
    };
  });
  const references = boundedArray(value.evidenceReferences, "evidenceReferences", 30).map((reference, index) => validateReference(reference, `evidenceReferences[${index}]`));
  if (!COMPLEXITIES.includes(value.projectComplexity as (typeof COMPLEXITIES)[number])) return invalid("projectComplexity");
  if (!DOCUMENTATION.includes(value.documentationQuality as (typeof DOCUMENTATION)[number])) return invalid("documentationQuality");
  return {
    summary: boundedString(value.summary, "summary", 2000),
    detectedTechnologies: technologies,
    demonstratedDomains: domains,
    projectComplexity: value.projectComplexity as RepositoryAnalysisOutput["projectComplexity"],
    documentationQuality: value.documentationQuality as RepositoryAnalysisOutput["documentationQuality"],
    architectureSignals: boundedArray(value.architectureSignals, "architectureSignals", 20).map((item, index) => boundedString(item, `architectureSignals[${index}]`, 300)),
    engineeringSignals: boundedArray(value.engineeringSignals, "engineeringSignals", 20).map((item, index) => boundedString(item, `engineeringSignals[${index}]`, 300)),
    limitations: boundedArray(value.limitations, "limitations", 20).map((item, index) => boundedString(item, `limitations[${index}]`, 300)),
    confidence: boundedNumber(value.confidence, "confidence"),
    evidenceReferences: references,
  };
}

export function validateDeveloperSummaryOutput(value: unknown): DeveloperSummaryOutput {
  if (!isRecord(value)) return invalid("$");
  return {
    profileSummary: boundedString(value.profileSummary, "profileSummary", 2000),
    limitations: boundedArray(value.limitations, "limitations", 20).map((item, index) => boundedString(item, `limitations[${index}]`, 300)),
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
