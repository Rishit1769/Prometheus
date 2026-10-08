import type {
  GitHubLanguageBytes,
  GitHubRepositoryPayload,
  NormalizedLanguage,
  NormalizedRepository,
} from "./types";

function parseDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function sanitizeTopics(topics: string[] | null | undefined): string[] {
  if (!Array.isArray(topics)) return [];
  const seen = new Set<string>();
  const result: string[] = [];
  for (const topic of topics) {
    if (typeof topic !== "string") continue;
    const trimmed = topic.trim();
    if (!trimmed || seen.has(trimmed)) continue;
    seen.add(trimmed);
    result.push(trimmed);
  }
  return result;
}

function nonNegativeInt(value: number | undefined): number {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
}

function ownerFromFullName(fullName: string): string {
  const [owner] = fullName.split("/");
  return owner ?? "";
}

/** Convert a raw GitHub repository payload into PROMETHEUS domain evidence. */
export function normalizeRepository(raw: GitHubRepositoryPayload): NormalizedRepository {
  const fullName = raw.full_name;
  return {
    githubRepositoryId: BigInt(Math.trunc(raw.id)),
    ownerLogin: raw.owner?.login ?? ownerFromFullName(fullName),
    name: raw.name,
    fullName,
    description: raw.description ?? null,
    url: raw.html_url,
    isFork: Boolean(raw.fork),
    isPrivate: Boolean(raw.private),
    isArchived: Boolean(raw.archived),
    isTemplate: Boolean(raw.is_template),
    defaultBranch: raw.default_branch ?? null,
    primaryLanguage: raw.language ?? null,
    stars: nonNegativeInt(raw.stargazers_count),
    forks: nonNegativeInt(raw.forks_count),
    watchers: nonNegativeInt(raw.watchers_count),
    openIssues: nonNegativeInt(raw.open_issues_count),
    size: nonNegativeInt(raw.size),
    topics: sanitizeTopics(raw.topics),
    githubCreatedAt: parseDate(raw.created_at),
    githubUpdatedAt: parseDate(raw.updated_at),
    githubPushedAt: parseDate(raw.pushed_at),
  };
}

/**
 * Convert GitHub language byte counts into normalized evidence.
 *
 * GitHub reports byte counts, not percentages. Percentages are derived
 * deterministically from the total bytes so they always sum to 100% (or 0 when
 * no bytes are reported). An empty map is valid and yields an empty array.
 */
export function normalizeLanguages(raw: GitHubLanguageBytes): NormalizedLanguage[] {
  const entries = Object.entries(raw).filter(
    ([language, bytes]) =>
      typeof language === "string" && language.length > 0 && typeof bytes === "number" && Number.isFinite(bytes) && bytes >= 0,
  );
  const total = entries.reduce((sum, [, bytes]) => sum + bytes, 0);

  return entries
    .map(([language, bytes]) => ({
      language,
      bytes,
      percentage: total > 0 ? (bytes / total) * 100 : 0,
    }))
    .sort((a, b) => b.bytes - a.bytes);
}
