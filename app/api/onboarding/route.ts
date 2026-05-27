/**
 * @file app/api/onboarding/route.ts
 * @description Saves a user's onboarding preferences (industries, job titles,
 * locations, job types) and marks onboarding as complete.
 */

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/onboarding - Save onboarding preferences for the current user.
 * @param {Request} req - JSON body with industries, jobTitles, locations, jobTypes
 * @returns {NextResponse} { success: true } or 401 if unauthenticated
 */
export async function POST(req: Request) {
  const session = await auth();

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { industries, jobTitles, locations, jobTypes } = await req.json();

  await prisma.user.update({
    where: { email: session.user.email },
    data: {
      industries,
      jobTitles,
      locations,
      jobTypes,
      onboardingComplete: true,
    },
  });

  return NextResponse.json({ success: true });
}