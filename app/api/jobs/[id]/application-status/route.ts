/**
 * @file app/api/jobs/[id]/application-status/route.ts
 * @description Updates a job posting's application status (interested, applied,
 * interview, offer, rejected, ghosted). Setting it moves the job into the
 * Applications tracker view.
 */

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

/**
 * PATCH /api/jobs/:id/application-status - Set the application pipeline stage for a job.
 * @param {Request} req - JSON body with { applicationStatus }
 * @param {{ params: Promise<{ id: string }> }} context - Route params with job ID
 * @returns {NextResponse} JSON { job } with the updated application status
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
  const { applicationStatus } = await req.json();

  const job = await prisma.jobPosting.update({
    where: { id },
    data: { applicationStatus: applicationStatus as "interested" | "applied" | "interview" | "rejected" | "offer" | "ghosted"},
  });

  return NextResponse.json({ job });
}