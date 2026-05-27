/**
 * @file app/api/profile/route.ts
 * @description CRUD operations for the authenticated user's profile:
 * fetch name/email, update name/email, and permanently delete the account.
 */

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/profile - Fetch the current user's name, email, and password status.
 * @returns {NextResponse} JSON { name, email, hasPassword } or 401/404
 */
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

/**
 * PATCH /api/profile - Update the current user's name and/or email.
 * @param {Request} req - JSON body with optional { name, email }
 * @returns {NextResponse} JSON { user } with updated fields or 401
 */
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

/**
 * DELETE /api/profile - Permanently delete the current user's account and all data.
 * @returns {NextResponse} JSON { success: true } or 401 if unauthenticated
 */
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