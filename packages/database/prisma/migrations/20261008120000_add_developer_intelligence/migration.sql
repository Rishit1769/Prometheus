CREATE TYPE "RepositoryAnalysisStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETE', 'FAILED', 'STALE');

CREATE TABLE "RepositoryAnalysis" (
    "id" TEXT NOT NULL,
    "repositoryId" TEXT NOT NULL,
    "status" "RepositoryAnalysisStatus" NOT NULL DEFAULT 'PENDING',
    "evidenceHash" TEXT NOT NULL,
    "promptVersion" TEXT NOT NULL,
    "modelProvider" TEXT NOT NULL,
    "modelName" TEXT NOT NULL,
    "output" JSONB,
    "errorMessage" TEXT,
    "analyzedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "RepositoryAnalysis_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "RepositoryAnalysis_repositoryId_key" ON "RepositoryAnalysis"("repositoryId");
CREATE INDEX "RepositoryAnalysis_status_idx" ON "RepositoryAnalysis"("status");
CREATE INDEX "RepositoryAnalysis_evidenceHash_idx" ON "RepositoryAnalysis"("evidenceHash");
ALTER TABLE "RepositoryAnalysis" ADD CONSTRAINT "RepositoryAnalysis_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES "Repository"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TYPE "DeveloperIntelligenceStatus" AS ENUM ('COMPLETE', 'PARTIAL', 'FAILED');

CREATE TABLE "DeveloperIntelligence" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "DeveloperIntelligenceStatus" NOT NULL,
    "evidenceHash" TEXT NOT NULL,
    "promptVersion" TEXT NOT NULL,
    "scoringVersion" TEXT NOT NULL,
    "modelProvider" TEXT NOT NULL,
    "modelName" TEXT NOT NULL,
    "profileSummary" TEXT,
    "overallConfidence" DOUBLE PRECISION NOT NULL,
    "eligibleRepositories" INTEGER NOT NULL,
    "analyzedRepositories" INTEGER NOT NULL,
    "reusedRepositories" INTEGER NOT NULL,
    "failedRepositories" INTEGER NOT NULL,
    "coverage" DOUBLE PRECISION NOT NULL,
    "output" JSONB NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "DeveloperIntelligence_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "DeveloperIntelligence_userId_key" ON "DeveloperIntelligence"("userId");
CREATE INDEX "DeveloperIntelligence_evidenceHash_idx" ON "DeveloperIntelligence"("evidenceHash");
ALTER TABLE "DeveloperIntelligence" ADD CONSTRAINT "DeveloperIntelligence_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
