-- CreateTable
CREATE TABLE "RepositoryStructure" (
    "id" SERIAL NOT NULL,
    "repoUrl" TEXT NOT NULL,
    "owner" TEXT NOT NULL,
    "repoName" TEXT NOT NULL,
    "structure" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RepositoryStructure_pkey" PRIMARY KEY ("id")
);
