/**
 * @file app/api/resume/activate/route.ts
 * @description Sets a specific resume version as the user's active resume by
 * copying its text, URL, and skills to the user record.
 */

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

/**
 * PATCH /api/resume/activate - Activate a resume version as the user's current resume.
 * @param {Request} req - JSON body with { resumeVersionId: string }
 * @returns {NextResponse} JSON { success: true } or 401/404
 */
export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { resumeVersionId } = await req.json();

  const version = await prisma.resumeVersion.findUnique({
    where: { id: resumeVersionId },
  });

  if (!version) return NextResponse.json({ error: "Version not found" }, { status: 404 });

  await prisma.user.update({
    where: { email: session.user.email },
    data: {
      resumeText: version.resumeText,
      resumeUrl: version.resumeUrl,
      skills: version.skills,
    },
  });

  return NextResponse.json({ success: true });
}