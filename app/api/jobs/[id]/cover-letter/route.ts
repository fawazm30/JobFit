import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const job = await prisma.jobPosting.findFirst({
    where: { id },
    select: { coverLetter: true },
  });

  if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });

  return NextResponse.json({ coverLetter: job.coverLetter });
}

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { coverLetter } = await req.json();

  const job = await prisma.jobPosting.update({
    where: { id },
    data: { coverLetter },
  });

  return NextResponse.json({ job });
}