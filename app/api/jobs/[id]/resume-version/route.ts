/**
 * @file app/api/jobs/[id]/resume-version/route.ts
 * @description Associates a resume version with a specific job posting so
 * the dashboard can track which resume version led to interviews.
 */

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

/**
 * PATCH /api/jobs/:id/resume-version - Assign or clear the resume version for a job.
 * @param {Request} req - JSON body with { resumeVersionId: string | null }
 * @param {{ params: Promise<{ id: string }> }} context - Route params with job ID
 * @returns {NextResponse} JSON { job } with the updated resumeVersionId
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { resumeVersionId } = await req.json();

  const job = await prisma.jobPosting.update({
    where: { id },
    data: { resumeVersionId: resumeVersionId || null },
  });

  return NextResponse.json({ job });
}