import { randomUUID } from "node:crypto";
import { prisma } from "@prometheus/database";
import { afterEach, describe, expect, it } from "vitest";
import { GitHubApiError, GitHubNotFoundError, GitHubRateLimitError } from "./errors";
import { MAX_README_BYTES } from "./readme";
import { syncGitHubReadmes } from "./readme-sync";
import type { GitHubReadmePayload, GitHubReadmeSource } from "./types";

const hasDatabase = Boolean(process.env.DATABASE_URL);
const createdUserIds: string[] = [];

function readme(content: string, sha: string): GitHubReadmePayload {
  return {
    encoding: "base64",
    content: Buffer.from(content, "utf8").toString("base64"),
    path: "README.md",
    sha,
  };
}

async function createRepository(userId: string, name: string, flags: { isFork?: boolean; isPrivate?: boolean } = {}) {
  return prisma.repository.create({
    data: {
      userId,
      githubRepositoryId: BigInt(Date.now()) + BigInt(Math.floor(Math.random() * 100000)),
      ownerLogin: "owner",
      name,
      fullName: `owner/${name}`,
      url: `https://github.com/owner/${name}`,
      isFork: flags.isFork ?? false,
      isPrivate: flags.isPrivate ?? false,
      lastSyncedAt: new Date(),
    },
  });
}

afterEach(async () => {
  for (const userId of createdUserIds.splice(0)) await prisma.user.delete({ where: { id: userId } });
});

describe.skipIf(!hasDatabase)("syncGitHubReadmes", () => {
  it("handles available, empty, oversized, missing, fork, and private repositories idempotently", async () => {
    const user = await prisma.user.create({ data: { email: `prom-003-${randomUUID()}@example.com` } });
    createdUserIds.push(user.id);
    const available = await createRepository(user.id, "available");
    await createRepository(user.id, "empty");
    await createRepository(user.id, "oversized");
    const missing = await createRepository(user.id, "missing");
    const fork = await createRepository(user.id, "fork", { isFork: true });
    const privateRepository = await createRepository(user.id, "private", { isPrivate: true });
    const contentByName: Record<string, GitHubReadmePayload> = {
      "owner/available": readme("# Available", "available-1"),
      "owner/empty": readme("", "empty-1"),
      "owner/oversized": readme("🙂".repeat(MAX_README_BYTES), "oversized-1"),
    };
    const source: GitHubReadmeSource = {
      getRepositoryReadme: async ({ fullName }) => {
        if (fullName === missing.fullName) throw new GitHubNotFoundError();
        return contentByName[fullName];
      },
    };

    const first = await syncGitHubReadmes({ userId: user.id, accessToken: "test-token", db: prisma, githubClient: source });
    expect(first).toMatchObject({ repositoriesEligible: 4, readmesFound: 3, missing: 1, empty: 1, truncated: 1, created: 4, updated: 0, unchanged: 0 });
    expect(await prisma.repositoryReadmeEvidence.count({ where: { repositoryId: { in: [fork.id, privateRepository.id] } } })).toBe(0);

    const second = await syncGitHubReadmes({ userId: user.id, accessToken: "test-token", db: prisma, githubClient: source });
    expect(second).toMatchObject({ created: 0, updated: 0, unchanged: 4, readmesFound: 3 });

    contentByName[available.fullName] = readme("# Changed", "available-2");
    const third = await syncGitHubReadmes({ userId: user.id, accessToken: "test-token", db: prisma, githubClient: source });
    expect(third).toMatchObject({ created: 0, updated: 1, unchanged: 3 });
    const stored = await prisma.repositoryReadmeEvidence.findUnique({ where: { repositoryId: available.id } });
    expect(stored?.contentHash).toBeTruthy();
    expect(stored?.status).toBe("AVAILABLE");
  }, 20000);

  it("records fetch failures and stops safely on rate limits", async () => {
    const user = await prisma.user.create({ data: { email: `prom-003-${randomUUID()}@example.com` } });
    createdUserIds.push(user.id);
    const failed = await createRepository(user.id, "failed");
    const rateLimited = await createRepository(user.id, "rate-limited");
    const source: GitHubReadmeSource = {
      getRepositoryReadme: async ({ fullName }) => {
        if (fullName === failed.fullName) throw new GitHubApiError("request failed", 500);
        throw new GitHubRateLimitError({ limit: 60, remaining: 0, resetAt: null });
      },
    };

    const result = await syncGitHubReadmes({ userId: user.id, accessToken: "test-token", db: prisma, githubClient: source });
    expect(result.status).toBe("RATE_LIMITED");
    expect(result.failed).toBe(1);
    expect(result.rateLimited).toBe(1);
    expect((await prisma.repositoryReadmeEvidence.findUnique({ where: { repositoryId: failed.id } }))?.status).toBe("FETCH_FAILED");
    expect((await prisma.repositoryReadmeEvidence.findUnique({ where: { repositoryId: rateLimited.id } }))?.status).toBe("RATE_LIMITED");
  });
});
