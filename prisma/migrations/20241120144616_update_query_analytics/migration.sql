/*
  Warnings:

  - You are about to drop the column `tagCounts` on the `QueryAnalytics` table. All the data in the column will be lost.
  - You are about to drop the column `totalAnswers` on the `QueryAnalytics` table. All the data in the column will be lost.
  - You are about to drop the column `totalQuestions` on the `QueryAnalytics` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[tagName]` on the table `QueryAnalytics` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `dailyData` to the `QueryAnalytics` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tagName` to the `QueryAnalytics` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "QueryAnalytics" DROP COLUMN "tagCounts",
DROP COLUMN "totalAnswers",
DROP COLUMN "totalQuestions",
ADD COLUMN     "answerCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "dailyData" JSONB NOT NULL,
ADD COLUMN     "queryCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "tagName" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "QueryAnalytics_tagName_key" ON "QueryAnalytics"("tagName");
