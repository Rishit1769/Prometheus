import {
  DOMAIN_SCORING_VERSION,
  INTELLIGENCE_DOMAINS,
  type DeveloperDomainIntelligence,
  type DomainLevel,
  type IntelligenceDomain,
  type RepositoryAnalysisOutput,
} from "./types";

const COMPLEXITY_WEIGHT: Record<RepositoryAnalysisOutput["projectComplexity"], number> = {
  TRIVIAL: 0.25,
  SIMPLE: 0.45,
  MODERATE: 0.7,
  COMPLEX: 0.9,
  ADVANCED: 1,
};

export { DOMAIN_SCORING_VERSION };

export function scoreToLevel(score: number): DomainLevel {
  if (score < 0.1) return 0;
  if (score < 0.25) return 1;
  if (score < 0.45) return 2;
  if (score < 0.65) return 3;
  if (score < 0.82) return 4;
  return 5;
}

export function aggregateRepositoryAnalyses(
  analyses: { repositoryId: string; repositoryName: string; output: RepositoryAnalysisOutput }[],
): {
  domains: DeveloperDomainIntelligence[];
  strongestDomains: IntelligenceDomain[];
  strongestTechnologies: string[];
  notableRepositories: { repositoryId: string; name: string; summary: string }[];
  limitations: string[];
} {
  const domains = INTELLIGENCE_DOMAINS.map((domain) => {
    const signals = analyses.flatMap((analysis) => analysis.output.demonstratedDomains.filter((signal) => signal.domain === domain).map((signal) => ({ ...signal, repositoryId: analysis.repositoryId })));
    const contributions = signals.map((signal) => signal.strength * signal.confidence * COMPLEXITY_WEIGHT[analyses.find((analysis) => analysis.repositoryId === signal.repositoryId)?.output.projectComplexity ?? "SIMPLE"]);
    const total = contributions.reduce((sum, value) => sum + value, 0);
    const score = Math.min(1, total / (1 + Math.max(0, contributions.length - 1) * 0.5));
    const confidence = signals.length === 0 ? 0 : signals.reduce((sum, signal) => sum + signal.confidence, 0) / signals.length;
    const evidenceReferences = signals.flatMap((signal) => signal.evidence).filter((reference, index, references) => references.findIndex((item) => JSON.stringify(item) === JSON.stringify(reference)) === index).slice(0, 20);
    return {
      domain,
      level: scoreToLevel(score),
      evidenceScore: Number(score.toFixed(4)),
      confidence: Number(confidence.toFixed(4)),
      repositoryCount: new Set(signals.map((signal) => signal.repositoryId)).size,
      evidenceReferences,
      summary: signals.length === 0 ? "Insufficient repository evidence for this domain." : `Evidence from ${new Set(signals.map((signal) => signal.repositoryId)).size} analyzed repository${signals.length === 1 ? "" : "ies"}.`,
    } satisfies DeveloperDomainIntelligence;
  });
  const strongestDomains = [...domains].filter((domain) => domain.level > 0).sort((a, b) => b.evidenceScore - a.evidenceScore || a.domain.localeCompare(b.domain)).slice(0, 3).map((domain) => domain.domain);
  const technologyCounts = new Map<string, number>();
  for (const analysis of analyses) for (const technology of analysis.output.detectedTechnologies) technologyCounts.set(technology.name, (technologyCounts.get(technology.name) ?? 0) + 1);
  const strongestTechnologies = [...technologyCounts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 10).map(([name]) => name);
  const notableRepositories = analyses.slice().sort((a, b) => b.output.confidence - a.output.confidence || a.repositoryName.localeCompare(b.repositoryName)).slice(0, 5).map((analysis) => ({ repositoryId: analysis.repositoryId, name: analysis.repositoryName, summary: analysis.output.summary }));
  return { domains, strongestDomains, strongestTechnologies, notableRepositories, limitations: ["Repository evidence demonstrates documented signals; it does not prove code quality, authorship, seniority, or production reliability.", ...(analyses.length === 0 ? ["No repository analyses were available."] : [])] };
}
