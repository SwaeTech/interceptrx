/*
  Warnings:

  - You are about to drop the column `token` on the `Secret` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Secret" DROP COLUMN "token",
ADD COLUMN     "encryptedDek" TEXT,
ADD COLUMN     "encryptedToken" TEXT;
