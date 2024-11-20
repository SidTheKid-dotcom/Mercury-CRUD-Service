/*
  Warnings:

  - You are about to drop the column `answersPerTag` on the `QueryAnalytics` table. All the data in the column will be lost.
  - You are about to drop the column `dailyData` on the `QueryAnalytics` table. All the data in the column will be lost.
  - You are about to drop the column `timestamps` on the `QueryAnalytics` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "QueryAnalytics" DROP COLUMN "answersPerTag",
DROP COLUMN "dailyData",
DROP COLUMN "timestamps";

-- CreateTable
CREATE TABLE "DailyData" (
    "id" SERIAL NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "queries" INTEGER NOT NULL DEFAULT 0,
    "answers" INTEGER NOT NULL DEFAULT 0,
    "queryAnalyticsId" INTEGER NOT NULL,

    CONSTRAINT "DailyData_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "DailyData" ADD CONSTRAINT "DailyData_queryAnalyticsId_fkey" FOREIGN KEY ("queryAnalyticsId") REFERENCES "QueryAnalytics"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
