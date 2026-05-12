/*
  Warnings:

  - You are about to drop the column `roleTypes` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "roleTypes",
ADD COLUMN     "industries" TEXT[],
ADD COLUMN     "jobTitles" TEXT[];
