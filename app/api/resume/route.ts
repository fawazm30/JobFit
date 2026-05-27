/**
 * @file app/api/resume/route.ts
 * @description Handles uploading a user's primary resume PDF: extracts text
 * with unpdf, extracts skills via Claude, uploads the file to Supabase Storage,
 * and updates the user record.
 */

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { supabase } from "@/lib/supabase";
import { extractText } from "unpdf";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

/**
 * POST /api/resume - Upload a PDF resume, extract text and skills, and store everything.
 * @param {Request} req - Multipart form data with a "resume" PDF file field
 * @returns {NextResponse} JSON { success, skills } or 400/401/500 on failure
 */
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

    // Extract text from PDF
    const { text } = await extractText(new Uint8Array(buffer), { mergePages: true });
    const resumeText = typeof text === "string" ? text : (text as string[]).join(" ");

    // Use Claude to detect skills
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `Extract all skills from this resume. Include technical skills, soft skills, certifications, tools, and domain-specific skills from ANY field (medical, legal, trades, education, etc.). Return ONLY a JSON array of strings, no explanation, no markdown, just the raw JSON array. Example: ["JavaScript", "Patient Care", "AutoCAD", "Team Leadership"]

Resume:
${resumeText}`,
        },
      ],
    });

    const content = message.content[0];
    let skills: string[] = [];

    if (content.type === "text") {
      try {
        const cleaned = content.text
          .replace(/```json\n?/g, "")
          .replace(/```\n?/g, "")
          .trim();
        skills = JSON.parse(cleaned);
        console.log("Parsed skills:", skills);
      } catch (e) {
        console.log("JSON parse failed:", e);
        skills = [];
      }
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    // Delete old resume if exists
    if (user?.resumeUrl) {
      const oldPath = user.resumeUrl.split("/resumes/")[1];
      if (oldPath) {
        await supabase.storage.from("resumes").remove([oldPath]);
      }
    }

    // Upload to Supabase Storage
    const fileName = `${user?.id}-${Date.now()}.pdf`;
    const { error: uploadError } = await supabase.storage
      .from("resumes")
      .upload(fileName, buffer, { contentType: "application/pdf" });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return NextResponse.json({ error: "Upload failed" }, { status: 500 });
    }

    const { data: urlData } = supabase.storage
      .from("resumes")
      .getPublicUrl(fileName);

    // Save everything to database
    await prisma.user.update({
      where: { email: session.user.email },
      data: {
        resumeUrl: urlData.publicUrl,
        resumeText,
        resumeFileName: file.name,
        skills,
      },
    });

    return NextResponse.json({ success: true, skills });
  } catch (err) {
    console.error("Resume upload error:", err);
    return NextResponse.json({ error: "Internal server error", details: String(err) }, { status: 500 });
  }
}