export const INTELLIGENCE_DOMAINS = [
  "FRONTEND",
  "BACKEND",
  "DATABASE",
  "AI_ML",
  "DEVOPS",
  "TESTING",
  "SYSTEMS",
  "MOBILE",
] as const;

export type IntelligenceDomain = (typeof INTELLIGENCE_DOMAINS)[number];
export type DomainLevel = 0 | 1 | 2 | 3 | 4 | 5;
export type ProjectComplexity = "TRIVIAL" | "SIMPLE" | "MODERATE" | "COMPLEX" | "ADVANCED";
export type DocumentationQuality = "LIMITED" | "BASIC" | "GOOD" | "STRONG";

export const REPOSITORY_PROMPT_VERSION = "repository-analysis-v3";
export const REPOSITORY_SCHEMA_VERSION = "repository-analysis-schema-v3";
export const DEVELOPER_PROMPT_VERSION = "developer-aggregation-v3";
export const DEVELOPER_OUTPUT_SCHEMA_VERSION = "developer-intelligence-output-v3";
export const LEGACY_DEVELOPER_OUTPUT_SCHEMA_VERSION = "legacy";
export const DOMAIN_SCORING_VERSION = "domain-score-v1";
export const EVIDENCE_VALIDATION_VERSION = "evidence-grounding-v1";
export const MODEL_PROVIDER = "openai";

export interface EvidenceReference {
  type: "REPOSITORY_DESCRIPTION" | "LANGUAGE" | "TOPIC" | "README_SECTION" | "README_CONTENT";
  reference: string;
  excerptHash?: string;
}

export interface RepositoryDomainSignal {
  domain: IntelligenceDomain;
  strength: number;
  confidence: number;
  evidence: EvidenceReference[];
  reasoningSummary: string;
}

export interface RepositoryTechnologySignal {
  name: string;
  evidence: EvidenceReference[];
}

export interface RepositoryAnalysisOutput {
  summary: string;
  detectedTechnologies: RepositoryTechnologySignal[];
  demonstratedDomains: RepositoryDomainSignal[];
  projectComplexity: ProjectComplexity;
  documentationQuality: DocumentationQuality;
  architectureSignals: string[];
  engineeringSignals: string[];
  limitations: string[];
  confidence: number;
  evidenceReferences: EvidenceReference[];
}

export interface RepositoryAnalysisInput {
  repository: {
    id: string;
    name: string;
    description: string | null;
    languages: { name: string; bytes: number }[];
    topics: string[];
    isFork: boolean;
    isArchived: boolean;
    updatedAt: string | null;
  };
  readme: {
    status: string;
    content: string | null;
    contentHash: string | null;
    truncated: boolean;
  };
}

export interface DeveloperSummaryInput {
  domains: {
    domain: IntelligenceDomain;
    level: DomainLevel;
    evidenceScore: number;
    confidence: number;
    repositoryCount: number;
  }[];
  technologies: { name: string; repositoryCount: number }[];
  limitations: string[];
}

export interface DeveloperSummaryOutput {
  profileSummary: string;
  limitations: string[];
}

export interface IntelligenceModel {
  provider: string;
  modelName: string;
  analyzeRepository(input: RepositoryAnalysisInput): Promise<RepositoryAnalysisOutput>;
  summarizeDeveloper(input: DeveloperSummaryInput): Promise<DeveloperSummaryOutput>;
}

export interface DeveloperDomainIntelligence {
  domain: IntelligenceDomain;
  level: DomainLevel;
  evidenceScore: number;
  confidence: number;
  repositoryCount: number;
  evidenceReferences: EvidenceReference[];
  supportingRepositories: {
    repositoryId: string;
    repositoryName: string;
    technologies: string[];
    evidenceReferences: EvidenceReference[];
    explanation: string;
  }[];
  limitations: string[];
  summary: string;
}

export interface DeveloperIntelligenceOutput {
  schemaVersion: typeof DEVELOPER_OUTPUT_SCHEMA_VERSION;
  domains: DeveloperDomainIntelligence[];
  strongestDomains: IntelligenceDomain[];
  strongestTechnologies: string[];
  notableRepositories: { repositoryId: string; name: string; summary: string }[];
  limitations: string[];
}
