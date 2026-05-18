/*
  Warnings:

  - You are about to drop the column `requiredSkills` on the `JobPosting` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "JobPosting" DROP COLUMN "requiredSkills",
ADD COLUMN     "requirements" TEXT[];
