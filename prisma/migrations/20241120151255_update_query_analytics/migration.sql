/*
  Warnings:

  - A unique constraint covering the columns `[date,queryAnalyticsId]` on the table `DailyData` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "DailyData" ALTER COLUMN "date" DROP DEFAULT;

-- CreateIndex
CREATE UNIQUE INDEX "DailyData_date_queryAnalyticsId_key" ON "DailyData"("date", "queryAnalyticsId");
