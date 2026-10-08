-- CreateEnum
CREATE TYPE "GitHubSyncStatus" AS ENUM ('SUCCESS', 'PARTIAL', 'FAILED', 'RATE_LIMITED');

-- CreateTable
CREATE TABLE "Repository" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "githubRepositoryId" BIGINT NOT NULL,
    "ownerLogin" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "description" TEXT,
    "url" TEXT NOT NULL,
    "isFork" BOOLEAN NOT NULL DEFAULT false,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "isTemplate" BOOLEAN NOT NULL DEFAULT false,
    "defaultBranch" TEXT,
    "primaryLanguage" TEXT,
    "stars" INTEGER NOT NULL DEFAULT 0,
    "forks" INTEGER NOT NULL DEFAULT 0,
    "watchers" INTEGER NOT NULL DEFAULT 0,
    "openIssues" INTEGER NOT NULL DEFAULT 0,
    "size" INTEGER NOT NULL DEFAULT 0,
    "topics" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "githubCreatedAt" TIMESTAMP(3),
    "githubUpdatedAt" TIMESTAMP(3),
    "githubPushedAt" TIMESTAMP(3),
    "lastSyncedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Repository_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RepositoryLanguage" (
    "id" TEXT NOT NULL,
    "repositoryId" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "bytes" INTEGER NOT NULL,
    "percentage" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "RepositoryLanguage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GitHubRepositorySync" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "GitHubSyncStatus" NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "repositoriesFound" INTEGER NOT NULL DEFAULT 0,
    "repositoriesCreated" INTEGER NOT NULL DEFAULT 0,
    "repositoriesUpdated" INTEGER NOT NULL DEFAULT 0,
    "repositoriesFailed" INTEGER NOT NULL DEFAULT 0,
    "rateLimitLimit" INTEGER,
    "rateLimitRemaining" INTEGER,
    "rateLimitResetAt" TIMESTAMP(3),
    "errorMessage" TEXT,

    CONSTRAINT "GitHubRepositorySync_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Repository_githubRepositoryId_key" ON "Repository"("githubRepositoryId");

-- CreateIndex
CREATE INDEX "Repository_userId_idx" ON "Repository"("userId");

-- CreateIndex
CREATE INDEX "RepositoryLanguage_repositoryId_idx" ON "RepositoryLanguage"("repositoryId");

-- CreateIndex
CREATE UNIQUE INDEX "RepositoryLanguage_repositoryId_language_key" ON "RepositoryLanguage"("repositoryId", "language");

-- CreateIndex
CREATE INDEX "GitHubRepositorySync_userId_idx" ON "GitHubRepositorySync"("userId");

-- AddForeignKey
ALTER TABLE "Repository" ADD CONSTRAINT "Repository_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RepositoryLanguage" ADD CONSTRAINT "RepositoryLanguage_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES "Repository"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GitHubRepositorySync" ADD CONSTRAINT "GitHubRepositorySync_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
