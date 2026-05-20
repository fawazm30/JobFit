import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const applications = await prisma.jobPosting.findMany({
    where: { 
      userId: user.id,
      applicationStatus: { not: null },  // only jobs with an application status
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({ applications });
}