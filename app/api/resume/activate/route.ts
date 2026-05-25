import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

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