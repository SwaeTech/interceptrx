-- AlterTable
ALTER TABLE "Secret" ADD COLUMN     "orgId" TEXT;

-- CreateIndex
CREATE INDEX "Secret_orgId_idx" ON "Secret"("orgId");
