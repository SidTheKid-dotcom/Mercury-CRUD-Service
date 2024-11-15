-- CreateTable
CREATE TABLE "Tag" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_QueryTags" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Tag_name_key" ON "Tag"("name");

-- CreateIndex
CREATE UNIQUE INDEX "_QueryTags_AB_unique" ON "_QueryTags"("A", "B");

-- CreateIndex
CREATE INDEX "_QueryTags_B_index" ON "_QueryTags"("B");

-- AddForeignKey
ALTER TABLE "_QueryTags" ADD CONSTRAINT "_QueryTags_A_fkey" FOREIGN KEY ("A") REFERENCES "Query"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_QueryTags" ADD CONSTRAINT "_QueryTags_B_fkey" FOREIGN KEY ("B") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;
