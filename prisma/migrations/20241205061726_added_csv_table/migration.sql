-- CreateTable
CREATE TABLE "CSV" (
    "id" SERIAL NOT NULL,
    "csvName" TEXT NOT NULL,
    "csvUrl" TEXT NOT NULL,
    "csvExternalTableName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CSV_pkey" PRIMARY KEY ("id")
);
