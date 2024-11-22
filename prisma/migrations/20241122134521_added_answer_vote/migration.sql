-- AlterTable
ALTER TABLE "Answer" ADD COLUMN     "downvotesCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "upvotesCount" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "AnswerVote" (
    "id" SERIAL NOT NULL,
    "answerId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "type" "VoteType" NOT NULL,

    CONSTRAINT "AnswerVote_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "AnswerVote" ADD CONSTRAINT "AnswerVote_answerId_fkey" FOREIGN KEY ("answerId") REFERENCES "Answer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnswerVote" ADD CONSTRAINT "AnswerVote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
