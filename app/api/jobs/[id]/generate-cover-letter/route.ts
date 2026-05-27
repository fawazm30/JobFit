/**
 * @file app/api/jobs/[id]/generate-cover-letter/route.ts
 * @description Uses Claude to generate a personalised HTML cover letter for a
 * specific job based on the user's resume, skills, and the job description.
 */

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

/**
 * POST /api/jobs/:id/generate-cover-letter - AI-generate a cover letter for a job.
 * @param {Request} req - Incoming request (no body required)
 * @param {{ params: Promise<{ id: string }> }} context - Route params with job ID
 * @returns {NextResponse} JSON { coverLetter } as raw HTML, or 400/404/500
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  if (!user.resumeText) return NextResponse.json({ error: "No resume uploaded" }, { status: 400 });

  const { id } = await params;

  const job = await prisma.jobPosting.findFirst({
    where: { id, userId: user.id },
  });

  if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });

  try {
    const msg = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `Write a professional cover letter for this job application.

Job Title: ${job.title}
Company: ${job.company}
Job Description: ${job.description?.slice(0, 1000)}

Applicant's Resume:
${user.resumeText?.slice(0, 1500)}

Applicant's Skills: ${user.skills?.join(", ")}

Write a compelling, personalized cover letter that:
- Opens with a strong introduction
- Highlights 2-3 relevant skills/experiences from the resume
- Shows enthusiasm for the specific company and role
- Ends with a clear call to action
- Is 3-4 paragraphs, professional but not stiff
- Does NOT include placeholders like [Your Name] - write it ready to use

Return ONLY the HTML, no markdown code fences, no backticks, no \`\`\`html. Just the raw HTML starting with <p>.`,
        },
      ],
    });

    const content = msg.content[0];
    if (content.type !== "text") {
      return NextResponse.json({ error: "Unexpected response" }, { status: 500 });
    }

    const cleaned = content.text
      .replace(/```html\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    return NextResponse.json({ coverLetter: cleaned });
  } catch (e) {
    console.error("Cover letter generation failed:", e);
    return NextResponse.json({ error: "Generation failed" }, { status: 500 });
  }
}