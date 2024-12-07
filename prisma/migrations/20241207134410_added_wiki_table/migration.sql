-- CreateTable
CREATE TABLE "Wiki" (
    "id" SERIAL NOT NULL,
    "wikiUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Wiki_pkey" PRIMARY KEY ("id")
);
