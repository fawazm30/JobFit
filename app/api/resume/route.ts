import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { supabase } from "@/lib/supabase";
import { extractText } from "unpdf";

export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("resume") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json({ error: "Only PDF files are allowed" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    console.log("Extracting text from PDF...");
    const { text } = await extractText(new Uint8Array(buffer), { mergePages: true });
    const resumeText = typeof text === "string" ? text : (text as string[]).join(" ");
    console.log("Text extracted, length:", resumeText.length);

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    console.log("User found:", user?.id);

    if (user?.resumeUrl) {
      const oldPath = user.resumeUrl.split("/resumes/")[1];
      if (oldPath) {
        await supabase.storage.from("resumes").remove([oldPath]);
      }
    }

    const fileName = `${user?.id}-${Date.now()}.pdf`;
    console.log("Uploading to Supabase storage:", fileName);

    const { error: uploadError } = await supabase.storage
      .from("resumes")
      .upload(fileName, buffer, { contentType: "application/pdf" });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return NextResponse.json({ error: "Upload failed", details: uploadError }, { status: 500 });
    }

    console.log("Upload successful");

    const { data: urlData } = supabase.storage
      .from("resumes")
      .getPublicUrl(fileName);

    await prisma.user.update({
      where: { email: session.user.email },
      data: {
        resumeUrl: urlData.publicUrl,
        resumeText,
        resumeFileName: file.name,
      },
    });

    console.log("Database updated successfully");

    return NextResponse.json({ success: true, resumeText });
  } catch (err) {
    console.error("Resume upload error:", err);
    return NextResponse.json({ error: "Internal server error", details: String(err) }, { status: 500 });
  }
}