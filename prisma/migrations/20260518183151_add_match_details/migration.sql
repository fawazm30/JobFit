-- AlterTable
ALTER TABLE "JobPosting" ADD COLUMN     "interestMatch" TEXT,
ADD COLUMN     "matchedSkills" TEXT[],
ADD COLUMN     "missingSkills" TEXT[];
