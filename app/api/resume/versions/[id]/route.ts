/**
 * @file app/api/resume/versions/[id]/route.ts
 * @description Deletes a specific resume version by ID, removing both the
 * database record and the associated file from Supabase Storage.
 */

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { supabase } from "@/lib/supabase";

/**
 * DELETE /api/resume/versions/:id - Delete a resume version and its stored PDF.
 * @param {Request} req - Incoming request
 * @param {{ params: Promise<{ id: string }> }} context - Route params with version ID
 * @returns {NextResponse} JSON { success: true } or 401/404
 */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // check session (authenticate user)
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // await params to get id of version to delete
  const { id } = await params;

  const version = await prisma.resumeVersion.findUnique({ where: { id } });
  
  if (!version) {
    return NextResponse.json({ error: "Version not found" }, { status: 404 });
  }

  // Extract filename from URL and delete from Supabase
  if (version.resumeUrl) {
    const fileName = version.resumeUrl.split("/resumes/")[1];
    if (fileName) {
      await supabase.storage.from("resumes").remove([fileName]);
    }
  }

  await prisma.resumeVersion.delete({ where: { id } });

  return NextResponse.json({ success: true });
}