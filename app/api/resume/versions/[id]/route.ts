import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { supabase } from "@/lib/supabase";

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