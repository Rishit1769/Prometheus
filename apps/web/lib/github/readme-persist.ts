import { prisma } from "@prometheus/database";
import type { RepositoryReadmeStatus } from "@prisma/client";

type DatabaseClient = typeof prisma;

export type ReadmeEvidenceRecord = {
  sourcePath: string | null;
  githubSha: string | null;
  content: string | null;
  contentHash: string | null;
  contentBytes: number | null;
  truncated: boolean;
  encoding: string;
  status: RepositoryReadmeStatus;
  fetchedAt: Date;
};

export type PersistReadmeResult = { created: boolean; updated: boolean; unchanged: boolean };

/** Persist one current README record per repository without creating history duplicates. */
export async function persistReadmeEvidence(
  db: DatabaseClient,
  repositoryId: string,
  evidence: ReadmeEvidenceRecord,
): Promise<PersistReadmeResult> {
  const existing = await db.repositoryReadmeEvidence.findUnique({
    where: { repositoryId },
    select: { id: true, contentHash: true, githubSha: true, status: true },
  });

  const same =
    existing?.contentHash === evidence.contentHash &&
    existing?.githubSha === evidence.githubSha &&
    existing?.status === evidence.status;

  const data = {
    sourcePath: evidence.sourcePath,
    githubSha: evidence.githubSha,
    content: evidence.content,
    contentHash: evidence.contentHash,
    contentBytes: evidence.contentBytes,
    truncated: evidence.truncated,
    encoding: evidence.encoding,
    status: evidence.status,
    fetchedAt: evidence.fetchedAt,
  };

  if (existing) {
    await db.repositoryReadmeEvidence.update({ where: { id: existing.id }, data });
    return { created: false, updated: !same, unchanged: same };
  }

  await db.repositoryReadmeEvidence.create({ data: { repositoryId, ...data } });
  return { created: true, updated: false, unchanged: false };
}
