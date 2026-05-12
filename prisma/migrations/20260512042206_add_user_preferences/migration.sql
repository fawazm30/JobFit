-- AlterTable
ALTER TABLE "User" ADD COLUMN     "jobTypes" TEXT[],
ADD COLUMN     "locations" TEXT[],
ADD COLUMN     "onboardingComplete" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "roleTypes" TEXT[];
