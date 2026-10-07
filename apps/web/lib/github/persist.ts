import { prisma } from "@prometheus/database";
import type { NormalizedLanguage, NormalizedRepository } from "./types";

/** The Prisma client type, derived from the shared singleton without a new export. */
type DatabaseClient = typeof prisma;

export interface PersistRepositoryResult {
  created: boolean;
}

/**
 * Idempotently persist one repository and its language evidence.
 *
 * - Repositories are matched by GitHub's immutable repository id, so repeated
 *   syncs update rather than duplicate.
 * - Language rows are replaced atomically so stale languages never accumulate.
 * - Callers pass `languages === null` to intentionally leave stored languages
 *   untouched (used when the language endpoint was unavailable for a repo).
 *
 * Network work happens before this function; only a short transaction is held.
 */
export async function persistRepository(
  db: DatabaseClient,
  userId: string,
  repository: NormalizedRepository,
  languages: NormalizedLanguage[] | null,
  syncedAt: Date,
): Promise<PersistRepositoryResult> {
  return db.$transaction(async (tx) => {
    const existing = await tx.repository.findUnique({
      where: { githubRepositoryId: repository.githubRepositoryId },
      select: { id: true },
    });

    const shared = {
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
      githubCreatedAt: repository.githubCreatedAt,
      githubUpdatedAt: repository.githubUpdatedAt,
      githubPushedAt: repository.githubPushedAt,
      lastSyncedAt: syncedAt,
    };

    let repositoryId: string;
    let created: boolean;

    if (existing) {
      const updated = await tx.repository.update({ where: { id: existing.id }, data: shared });
      repositoryId = updated.id;
      created = false;
    } else {
      const inserted = await tx.repository.create({
        data: { ...shared, userId, githubRepositoryId: repository.githubRepositoryId },
      });
      repositoryId = inserted.id;
      created = true;
    }

    if (languages !== null) {
      await tx.repositoryLanguage.deleteMany({ where: { repositoryId } });
      if (languages.length > 0) {
        await tx.repositoryLanguage.createMany({
          data: languages.map((language) => ({
            repositoryId,
            language: language.language,
            bytes: language.bytes,
            percentage: language.percentage,
          })),
        });
      }
    }

    return { created };
  });
}
