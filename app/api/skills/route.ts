/**
 * @file app/api/skills/route.ts
 * @description Manages the authenticated user's manually curated skills list.
 * Supports adding and removing individual skills.
 */

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/skills - Add a skill to the current user's skills list.
 * @param {Request} req - JSON body with { skill: string }
 * @returns {NextResponse} JSON { skills } with the updated full skills array
 */
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

/**
 * DELETE /api/skills - Remove a skill from the current user's skills list.
 * @param {Request} req - JSON body with { skill: string }
 * @returns {NextResponse} JSON { skills } with the updated full skills array
 */
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