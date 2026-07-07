-- DropIndex
DROP INDEX "Submission_email_idx";

-- DropIndex
DROP INDEX "Submission_phone_idx";

-- AlterTable
ALTER TABLE "Submission" ALTER COLUMN "phone" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Submission_email_key" ON "Submission"("email");
