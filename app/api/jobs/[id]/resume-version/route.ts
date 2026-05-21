import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

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