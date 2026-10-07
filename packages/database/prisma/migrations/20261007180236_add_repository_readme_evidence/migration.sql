-- CreateEnum
CREATE TYPE "RepositoryReadmeStatus" AS ENUM ('AVAILABLE', 'MISSING', 'EMPTY', 'TRUNCATED', 'FETCH_FAILED', 'RATE_LIMITED', 'AUTH_FAILED');

-- AlterTable
ALTER TABLE "Repository" ADD COLUMN     "isPrivate" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "RepositoryReadmeEvidence" (
    "id" TEXT NOT NULL,
    "repositoryId" TEXT NOT NULL,
    "sourcePath" TEXT,
    "githubSha" TEXT,
    "content" TEXT,
    "contentHash" TEXT,
    "contentBytes" INTEGER,
    "truncated" BOOLEAN NOT NULL DEFAULT false,
    "encoding" TEXT NOT NULL DEFAULT 'utf-8',
    "status" "RepositoryReadmeStatus" NOT NULL,
    "fetchedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RepositoryReadmeEvidence_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RepositoryReadmeEvidence_repositoryId_key" ON "RepositoryReadmeEvidence"("repositoryId");

-- CreateIndex
CREATE INDEX "RepositoryReadmeEvidence_status_idx" ON "RepositoryReadmeEvidence"("status");

-- AddForeignKey
ALTER TABLE "RepositoryReadmeEvidence" ADD CONSTRAINT "RepositoryReadmeEvidence_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES "Repository"("id") ON DELETE CASCADE ON UPDATE CASCADE;
