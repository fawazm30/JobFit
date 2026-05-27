/**
 * @file app/api/jobs/save/route.ts
 * @description Saves a job discovered via the Adzuna search to the user's list,
 * preserving AI scores already computed during discovery. Prevents duplicates
 * by checking the externalId.
 */

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/jobs/save - Persist a discovered job suggestion to the user's saved jobs.
 * @param {Request} req - JSON body with job data including externalId and pre-computed scores
 * @returns {NextResponse} JSON { job } or 409 if the job was already saved
 */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const {
    title,
    company,
    location,
    description,
    applicationLink,
    externalId,
    status = "saved",
    // Accept scores from the discover call directly
    matchScore = null,
    matchReason = null,
    requirements = [],
    matchedSkills = [],
    missingSkills = [],
    interestMatch = null,
  } = await req.json();

  // Don't save duplicates
  const existing = await prisma.jobPosting.findFirst({
    where: { userId: user.id, externalId },
  });

  if (existing) {
    return NextResponse.json({ error: "Already saved" }, { status: 409 });
  }

  // Save with scores from discover call
  const job = await prisma.jobPosting.create({
    data: {
      userId: user.id,
      title,
      company,
      location,
      description,
      applicationLink,
      source: "adzuna",
      externalId,
      status,
      matchScore,
      matchReason,
      requirements,
      matchedSkills,
      missingSkills,
      interestMatch,
    },
  });

  return NextResponse.json({ job });
}