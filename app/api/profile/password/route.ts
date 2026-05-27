/**
 * @file app/api/profile/password/route.ts
 * @description Allows credentials-based users to change their password after
 * verifying their current password.
 */

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

/**
 * PATCH /api/profile/password - Change the current user's password.
 * @param {Request} req - JSON body with { currentPassword, newPassword }
 * @returns {NextResponse} { success: true } or 400 if current password is wrong
 */
export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { currentPassword, newPassword } = await req.json();

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user || !user.password) {
    return NextResponse.json({ error: "No password set" }, { status: 400 });
  }

  const valid = await bcrypt.compare(currentPassword, user.password);
  if (!valid) {
    return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
  }

  const hashed = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { email: session.user.email },
    data: { password: hashed },
  });

  return NextResponse.json({ success: true });
}