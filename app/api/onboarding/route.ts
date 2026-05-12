import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await auth();

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { industries, jobTitles, locations, jobTypes } = await req.json();

  await prisma.user.update({
    where: { email: session.user.email },
    data: {
      industries,
      jobTitles,
      locations,
      jobTypes,
      onboardingComplete: true,
    },
  });

  return NextResponse.json({ success: true });
}