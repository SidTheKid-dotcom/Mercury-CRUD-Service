-- AlterTable
ALTER TABLE "QueryAnalytics" ADD COLUMN     "answersPerTag" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN     "timestamps" TIMESTAMP(3)[] DEFAULT ARRAY[]::TIMESTAMP(3)[],
ALTER COLUMN "dailyData" SET DEFAULT '{}';
