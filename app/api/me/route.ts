/**
 * @file app/api/me/route.ts
 * @description Returns the authenticated user's full profile including
 * skills, resume info, and job preferences.
 */

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/me - Fetch the current user's profile data.
 * @returns {NextResponse} JSON user object or 401 if unauthenticated
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      name: true,
      email: true,
      skills: true,
      resumeFileName: true,
      resumeUrl: true,
      onboardingComplete: true,
      industries: true,
      jobTitles: true,
      locations: true,
      jobTypes: true,
    },
  });

  return NextResponse.json(user);
}