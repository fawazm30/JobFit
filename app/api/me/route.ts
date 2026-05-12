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