import { prisma } from "@prometheus/database";
import type { GitHubSyncStatusValue } from "./types";

/** The Prisma client type, derived from the shared singleton without a new export. */
type DatabaseClient = typeof prisma;

export interface RepositoryLanguageDto {
  language: string;
  bytes: number;
  percentage: number;
}

export interface RepositoryDto {
  id: string;
  githubRepositoryId: string;
  ownerLogin: string;
  name: string;
  fullName: string;
  description: string | null;
  url: string;
  isFork: boolean;
  isArchived: boolean;
  isTemplate: boolean;
  defaultBranch: string | null;
  primaryLanguage: string | null;
  stars: number;
  forks: number;
  watchers: number;
  openIssues: number;
  size: number;
  topics: string[];
  githubCreatedAt: string | null;
  githubUpdatedAt: string | null;
  githubPushedAt: string | null;
  lastSyncedAt: string;
  languages: RepositoryLanguageDto[];
}

export interface LatestSyncDto {
  status: GitHubSyncStatusValue;
  startedAt: string;
  completedAt: string | null;
  repositoriesFound: number;
  repositoriesCreated: number;
  repositoriesUpdated: number;
  repositoriesFailed: number;
  rateLimitLimit: number | null;
  rateLimitRemaining: number | null;
  rateLimitResetAt: string | null;
  errorMessage: string | null;
}

/** List the authenticated user's synchronized repositories with language evidence. */
export async function listRepositoriesForUser(userId: string, db: DatabaseClient = prisma): Promise<RepositoryDto[]> {
  const repositories = await db.repository.findMany({
    where: { userId },
    orderBy: [{ githubUpdatedAt: "desc" }, { fullName: "asc" }],
    include: { languages: { orderBy: { bytes: "desc" } } },
  });

  return repositories.map((repository) => ({
    id: repository.id,
    githubRepositoryId: repository.githubRepositoryId.toString(),
    ownerLogin: repository.ownerLogin,
    name: repository.name,
    fullName: repository.fullName,
    description: repository.description,
    url: repository.url,
    isFork: repository.isFork,
    isArchived: repository.isArchived,
    isTemplate: repository.isTemplate,
    defaultBranch: repository.defaultBranch,
    primaryLanguage: repository.primaryLanguage,
    stars: repository.stars,
    forks: repository.forks,
    watchers: repository.watchers,
    openIssues: repository.openIssues,
    size: repository.size,
    topics: repository.topics,
    githubCreatedAt: repository.githubCreatedAt?.toISOString() ?? null,
    githubUpdatedAt: repository.githubUpdatedAt?.toISOString() ?? null,
    githubPushedAt: repository.githubPushedAt?.toISOString() ?? null,
    lastSyncedAt: repository.lastSyncedAt.toISOString(),
    languages: repository.languages.map((language) => ({
      language: language.language,
      bytes: language.bytes,
      percentage: language.percentage,
    })),
  }));
}

/** Return the most recent synchronization attempt for a user, if any. */
export async function getLatestSyncForUser(userId: string, db: DatabaseClient = prisma): Promise<LatestSyncDto | null> {
  const sync = await db.gitHubRepositorySync.findFirst({
    where: { userId },
    orderBy: { startedAt: "desc" },
  });
  if (!sync) return null;

  return {
    status: sync.status,
    startedAt: sync.startedAt.toISOString(),
    completedAt: sync.completedAt?.toISOString() ?? null,
    repositoriesFound: sync.repositoriesFound,
    repositoriesCreated: sync.repositoriesCreated,
    repositoriesUpdated: sync.repositoriesUpdated,
    repositoriesFailed: sync.repositoriesFailed,
    rateLimitLimit: sync.rateLimitLimit,
    rateLimitRemaining: sync.rateLimitRemaining,
    rateLimitResetAt: sync.rateLimitResetAt?.toISOString() ?? null,
    errorMessage: sync.errorMessage,
  };
}
