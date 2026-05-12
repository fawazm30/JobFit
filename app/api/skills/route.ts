import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { skill } = await req.json();
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const updatedSkills = [...(user.skills || []), skill];
  await prisma.user.update({
    where: { email: session.user.email },
    data: { skills: updatedSkills },
  });

  return NextResponse.json({ skills: updatedSkills });
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { skill } = await req.json();
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const updatedSkills = (user.skills || []).filter((s) => s !== skill);
  await prisma.user.update({
    where: { email: session.user.email },
    data: { skills: updatedSkills },
  });

  return NextResponse.json({ skills: updatedSkills });
}