-- CreateTable
CREATE TABLE "QueryAnalytics" (
    "id" SERIAL NOT NULL,
    "totalQuestions" INTEGER NOT NULL DEFAULT 0,
    "totalAnswers" INTEGER NOT NULL DEFAULT 0,
    "tagCounts" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QueryAnalytics_pkey" PRIMARY KEY ("id")
);
