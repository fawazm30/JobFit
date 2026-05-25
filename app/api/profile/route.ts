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
    select: { id: true, name: true, email: true, password: true },
  });

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  return NextResponse.json({
    name: user.name,
    email: user.email,
    hasPassword: !!user.password,
  });
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name, email } = await req.json();

  const user = await prisma.user.update({
    where: { email: session.user.email },
    data: {
      ...(name && { name }),
      ...(email && { email }),
    },
  });

  return NextResponse.json({ user });
}

export async function DELETE() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await prisma.user.delete({
    where: { email: session.user.email },
  });

  return NextResponse.json({ success: true });
}