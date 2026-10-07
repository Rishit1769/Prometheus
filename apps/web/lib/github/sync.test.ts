import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@prometheus/database";
import { GitHubApiError, GitHubAuthError, GitHubRateLimitError } from "./errors";
import { syncGitHubRepositories } from "./sync";
import type {
  GitHubLanguageBytes,
  GitHubRateLimit,
  GitHubRepositoryPayload,
  GitHubRepositorySource,
} from "./types";

const hasDatabase = Boolean(process.env.DATABASE_URL);

const RATE_LIMIT: GitHubRateLimit = { limit: 5000, remaining: 4999, resetAt: new Date("2026-01-01T00:00:00Z") };

function payload(id: number, overrides: Partial<GitHubRepositoryPayload> = {}): GitHubRepositoryPayload {
  return {
    id,
    name: `repo-${id}`,
    full_name: `owner/repo-${id}`,
    owner: { login: "owner" },
    html_url: `https://github.com/owner/repo-${id}`,
    ...overrides,
  };
}

function source(
  repositories: GitHubRepositoryPayload[],
  languagesByRepo: Record<string, GitHubLanguageBytes> = {},
  rateLimit: GitHubRateLimit = RATE_LIMIT,
): GitHubRepositorySource {
  return {
    listPublicRepositories: async () => ({ repositories, rateLimit }),
    listRepositoryLanguages: async ({ fullName }) => languagesByRepo[fullName] ?? {},
  };
}

describe.skipIf(!hasDatabase)("syncGitHubRepositories (integration)", () => {
  let userId = "";
  const baseId = BigInt(Date.now()) * BigInt(1000);

  beforeAll(async () => {
    const user = await prisma.user.create({
      data: { email: `prom-002-${randomUUID()}@example.com`, githubUsername: "prom-002-test" },
    });
    userId = user.id;
  });

  afterAll(async () => {
    if (userId) {
      await prisma.user.deleteMany({ where: { id: userId } });
    }
    await prisma.$disconnect();
  });

  it("creates repositories with language evidence, topics, and ownership", async () => {
    const idA = baseId + BigInt(1);
    const idB = baseId + BigInt(2);
    const repos = [
      payload(Number(idA), { topics: ["ai", "skills"], language: "TypeScript" }),
      payload(Number(idB), { language: null, fork: true, archived: true, is_template: true }),
    ];

    const result = await syncGitHubRepositories({
      userId,
      accessToken: "token",
      db: prisma,
      githubClient: source(repos, { [`owner/repo-${Number(idA)}`]: { TypeScript: 184302, JavaScript: 42871 } }),
    });

    expect(result.status).toBe("SUCCESS");
    expect(result.repositoriesFound).toBe(2);
    expect(result.repositoriesCreated).toBe(2);

    const stored = await prisma.repository.findMany({ where: { userId }, include: { languages: true } });
    expect(stored).toHaveLength(2);
    expect(stored.every((repository) => repository.userId === userId)).toBe(true);

    const repositoryA = stored.find((repository) => repository.githubRepositoryId === idA);
    expect(repositoryA?.topics).toEqual(["ai", "skills"]);
    expect(repositoryA?.languages).toHaveLength(2);
    expect(repositoryA?.primaryLanguage).toBe("TypeScript");

    const repositoryB = stored.find((repository) => repository.githubRepositoryId === idB);
    expect(repositoryB?.isFork).toBe(true);
    expect(repositoryB?.isArchived).toBe(true);
    expect(repositoryB?.isTemplate).toBe(true);
    expect(repositoryB?.languages).toHaveLength(0);
  });

  it("is idempotent across repeated synchronizations", async () => {
    const id = baseId + BigInt(10);
    const repos = [payload(Number(id), { stargazers_count: 1 })];
    const makeSource = () => source(repos, { [`owner/repo-${Number(id)}`]: { TypeScript: 100 } });

    const first = await syncGitHubRepositories({ userId, accessToken: "token", db: prisma, githubClient: makeSource() });
    const second = await syncGitHubRepositories({ userId, accessToken: "token", db: prisma, githubClient: makeSource() });

    expect(first.repositoriesCreated).toBe(1);
    expect(second.repositoriesCreated).toBe(0);
    expect(second.repositoriesUpdated).toBe(1);

    const repositoryCount = await prisma.repository.count({ where: { githubRepositoryId: id } });
    expect(repositoryCount).toBe(1);
    const languageCount = await prisma.repositoryLanguage.count({ where: { repository: { githubRepositoryId: id } } });
    expect(languageCount).toBe(1);
  });

  it("updates repository metadata on a later synchronization", async () => {
    const id = baseId + BigInt(15);
    const fullName = `owner/repo-${Number(id)}`;

    await syncGitHubRepositories({
      userId,
      accessToken: "token",
      db: prisma,
      githubClient: source([payload(Number(id), { stargazers_count: 1 })], { [fullName]: { Go: 500 } }),
    });

    await syncGitHubRepositories({
      userId,
      accessToken: "token",
      db: prisma,
      githubClient: source([payload(Number(id), { stargazers_count: 99, topics: ["updated"] })], {
        [fullName]: { Go: 750, Rust: 250 },
      }),
    });

    const stored = await prisma.repository.findUnique({ where: { githubRepositoryId: id }, include: { languages: true } });
    expect(stored?.stars).toBe(99);
    expect(stored?.topics).toEqual(["updated"]);
    expect(stored?.languages).toHaveLength(2);
    const go = stored?.languages.find((language) => language.language === "Go");
    expect(go?.bytes).toBe(750);
  });

  it("treats an empty repository list as a successful sync", async () => {
    const result = await syncGitHubRepositories({ userId, accessToken: "token", db: prisma, githubClient: source([]) });
    expect(result.status).toBe("SUCCESS");
    expect(result.repositoriesFound).toBe(0);
    expect(result.repositoriesCreated).toBe(0);
  });

  it("marks a run partial and preserves languages when a language fetch fails", async () => {
    const id = baseId + BigInt(20);
    const fullName = `owner/repo-${Number(id)}`;

    await syncGitHubRepositories({
      userId,
      accessToken: "token",
      db: prisma,
      githubClient: source([payload(Number(id))], { [fullName]: { Go: 500 } }),
    });

    const failing: GitHubRepositorySource = {
      listPublicRepositories: async () => ({ repositories: [payload(Number(id))], rateLimit: RATE_LIMIT }),
      listRepositoryLanguages: async () => {
        throw new GitHubApiError("temporary failure", 500);
      },
    };

    const result = await syncGitHubRepositories({ userId, accessToken: "token", db: prisma, githubClient: failing });
    expect(result.status).toBe("PARTIAL");
    expect(result.repositoriesFailed).toBe(1);

    const languages = await prisma.repositoryLanguage.findMany({ where: { repository: { githubRepositoryId: id } } });
    expect(languages.map((language) => language.language)).toEqual(["Go"]);
  });

  it("records RATE_LIMITED and rethrows when the GitHub rate limit is exhausted", async () => {
    const failing: GitHubRepositorySource = {
      listPublicRepositories: async () => {
        throw new GitHubRateLimitError(RATE_LIMIT);
      },
      listRepositoryLanguages: async () => ({}),
    };

    await expect(
      syncGitHubRepositories({ userId, accessToken: "token", db: prisma, githubClient: failing }),
    ).rejects.toBeInstanceOf(GitHubRateLimitError);

    const sync = await prisma.gitHubRepositorySync.findFirst({ where: { userId }, orderBy: { startedAt: "desc" } });
    expect(sync?.status).toBe("RATE_LIMITED");
  });

  it("records FAILED when GitHub rejects the token", async () => {
    const failing: GitHubRepositorySource = {
      listPublicRepositories: async () => {
        throw new GitHubAuthError();
      },
      listRepositoryLanguages: async () => ({}),
    };

    await expect(
      syncGitHubRepositories({ userId, accessToken: "expired", db: prisma, githubClient: failing }),
    ).rejects.toBeInstanceOf(GitHubAuthError);

    const sync = await prisma.gitHubRepositorySync.findFirst({ where: { userId }, orderBy: { startedAt: "desc" } });
    expect(sync?.status).toBe("FAILED");
  });
});
