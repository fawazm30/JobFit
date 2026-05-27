/**
 * @file app/api/register/route.ts
 * @description Creates a new credentials-based user account with a hashed password.
 */

import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/register - Register a new user with email and password.
 * @param {Request} req - JSON body with name, email, password
 * @returns {NextResponse} Created user's id and email, 400 if email already in use
 */
export async function POST(req: Request) {
  const { name, email, password } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "Email already in use" }, { status: 400 });
  }

  const hashed = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { name, email, password: hashed },
  });

  return NextResponse.json({ user: { id: user.id, email: user.email } });
}