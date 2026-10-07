import { describe, expect, it } from "vitest";
import { normalizeLanguages, normalizeRepository } from "./normalize";
import type { GitHubRepositoryPayload } from "./types";

function payload(overrides: Partial<GitHubRepositoryPayload> = {}): GitHubRepositoryPayload {
  return {
    id: 1398201341,
    name: "prometheus",
    full_name: "Rishit1769/prometheus",
    owner: { login: "Rishit1769" },
    html_url: "https://github.com/Rishit1769/prometheus",
    description: "A decentralized skill framework",
    fork: false,
    archived: false,
    is_template: false,
    default_branch: "main",
    language: "TypeScript",
    stargazers_count: 42,
    forks_count: 5,
    watchers_count: 42,
    open_issues_count: 3,
    size: 1234,
    topics: ["ai", "skills"],
    created_at: "2024-01-02T03:04:05Z",
    updated_at: "2024-06-07T08:09:10Z",
    pushed_at: "2024-06-08T00:00:00Z",
    ...overrides,
  };
}

describe("normalizeRepository", () => {
  it("maps GitHub fields into normalized evidence", () => {
    const normalized = normalizeRepository(payload());
    expect(normalized).toMatchObject({
      githubRepositoryId: BigInt(1398201341),
      ownerLogin: "Rishit1769",
      name: "prometheus",
      fullName: "Rishit1769/prometheus",
      url: "https://github.com/Rishit1769/prometheus",
      primaryLanguage: "TypeScript",
      stars: 42,
      forks: 5,
      watchers: 42,
      openIssues: 3,
      size: 1234,
      topics: ["ai", "skills"],
      isFork: false,
      isArchived: false,
      isTemplate: false,
    });
    expect(normalized.githubCreatedAt?.toISOString()).toBe("2024-01-02T03:04:05.000Z");
    expect(normalized.githubUpdatedAt?.toISOString()).toBe("2024-06-07T08:09:10.000Z");
    expect(normalized.githubPushedAt?.toISOString()).toBe("2024-06-08T00:00:00.000Z");
  });

  it("handles a null description and missing optional metadata", () => {
    const normalized = normalizeRepository(
      payload({ description: null, topics: null, language: null, stargazers_count: undefined, created_at: null }),
    );
    expect(normalized.description).toBeNull();
    expect(normalized.topics).toEqual([]);
    expect(normalized.primaryLanguage).toBeNull();
    expect(normalized.stars).toBe(0);
    expect(normalized.githubCreatedAt).toBeNull();
  });

  it("preserves fork, archived, and template metadata", () => {
    const normalized = normalizeRepository(payload({ fork: true, archived: true, is_template: true }));
    expect(normalized.isFork).toBe(true);
    expect(normalized.isArchived).toBe(true);
    expect(normalized.isTemplate).toBe(true);
  });

  it("handles an empty repository with no language", () => {
    const normalized = normalizeRepository(payload({ language: null, size: 0, topics: [] }));
    expect(normalized.primaryLanguage).toBeNull();
    expect(normalized.size).toBe(0);
    expect(normalized.topics).toEqual([]);
  });
});

describe("normalizeLanguages", () => {
  it("derives deterministic percentages from byte counts", () => {
    const languages = normalizeLanguages({ TypeScript: 184302, JavaScript: 42871, CSS: 13982, Python: 3211 });
    const total = 184302 + 42871 + 13982 + 3211;
    expect(languages[0].language).toBe("TypeScript");
    expect(languages[0].bytes).toBe(184302);
    const sum = languages.reduce((acc, language) => acc + language.percentage, 0);
    expect(sum).toBeCloseTo(100, 6);
    expect(languages[0].percentage).toBeCloseTo((184302 / total) * 100, 6);
  });

  it("returns an empty array for an empty repository", () => {
    expect(normalizeLanguages({})).toEqual([]);
  });

  it("does not divide by zero when total bytes are zero", () => {
    const languages = normalizeLanguages({ Go: 0 });
    expect(languages).toEqual([{ language: "Go", bytes: 0, percentage: 0 }]);
  });
});
