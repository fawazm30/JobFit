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
  });

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const versions = await prisma.resumeVersion.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ versions });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const formData = await req.formData();
  const file = formData.get("resume") as File;

  if (!file) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }

  const name = formData.get("name") as string || "Untitled Resume";

  if (file.type !== "application/pdf") {
    return NextResponse.json({ error: "Only PDF files are allowed" }, { status: 400 });
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Extract text from PDF
  const { extractText } = await import("unpdf");
  const { text } = await extractText(new Uint8Array(buffer), { mergePages: true });
  const resumeText = typeof text === "string" ? text : (text as string[]).join(" ");

  // Extract skills with Claude
  const Anthropic = (await import("@anthropic-ai/sdk")).default;
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `Extract all skills from this resume. Return ONLY a JSON array of strings, no explanation, no markdown.

Resume:
${resumeText}`,
      },
    ],
  });

  let skills: string[] = [];
  const content = message.content[0];
  if (content.type === "text") {
    try {
      const cleaned = content.text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      skills = JSON.parse(cleaned);
    } catch (e) {
      skills = [];
    }
  }

  // Upload to Supabase
  const { supabase } = await import("@/lib/supabase");
  const fileName = `${user.id}-${Date.now()}.pdf`;
  const { error: uploadError } = await supabase.storage
    .from("resumes")
    .upload(fileName, buffer, { contentType: "application/pdf" });

  if (uploadError) {
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }

  const { data: urlData } = supabase.storage.from("resumes").getPublicUrl(fileName);

  // Save to database
  const version = await prisma.resumeVersion.create({
    data: {
      userId: user.id,
      name,
      resumeUrl: urlData.publicUrl,
      resumeText,
      skills,
    },
  });

  await prisma.user.update({
    where: { id: user.id },
    data: { 
      skills,
      resumeText,
      resumeUrl: urlData.publicUrl,
    },
  });

  return NextResponse.json({ version });
}