import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

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
    matchScore,
    matchReason,
    requirements,
  } = await req.json();

  // Don't save duplicates
  const existing = await prisma.jobPosting.findFirst({
    where: { userId: user.id, externalId },
  });

  if (existing) {
    return NextResponse.json({ error: "Already saved" }, { status: 409 });
  }

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
      matchScore,
      matchReason,
      requirements: requirements || [],
    },
  });

  return NextResponse.json({ job });
}