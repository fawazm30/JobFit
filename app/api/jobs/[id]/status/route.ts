/**
 * @file app/api/jobs/[id]/status/route.ts
 * @description Updates a job posting's general status (e.g. "saved", "ignored").
 */

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

/**
 * PATCH /api/jobs/:id/status - Update a job's save/ignore status.
 * @param {Request} req - JSON body with { status: string }
 * @param {{ params: Promise<{ id: string }> }} context - Route params with job ID
 * @returns {NextResponse} JSON { job } with the updated record
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
  const { status } = await req.json();

  const job = await prisma.jobPosting.update({
    where: { id },
    data: { status },
  });

  return NextResponse.json({ job });
}
