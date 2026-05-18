import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
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

  const job = await prisma.jobPosting.findFirst({
    where: { id: params.id, userId: user.id },
  });

  if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });

  try {
    const msg = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 512,
      messages: [
        {
          role: "user",
          content: `Analyze this job against the candidate's resume. Return ONLY JSON, no markdown.

Candidate prefers: ${user.locations?.join(", ")} and ${user.jobTypes?.join(", ")} positions.
Candidate skills: ${user.skills?.join(", ")}

Resume (first 1000 chars): ${user.resumeText?.slice(0, 1000)}

Job: ${job.title} at ${job.company}
Location: ${job.location}
Current job requirements: ${job.requirements?.join(", ")}
Description: ${job.description?.slice(0, 500)}

Return this exact format:
{"score": 75, "reason": "Plain language explanation", "requirements": ["Requirement 1"], "matchedSkills": ["Skill 1"], "missingSkills": ["Skill 2"], "interestMatch": "Brief note on location/job type alignment"}`,
        },
      ],
    });

    const content = msg.content[0];
    if (content.type !== "text") throw new Error("Unexpected response type");

    const cleaned = content.text
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();
    const parsed = JSON.parse(cleaned);

    const updated = await prisma.jobPosting.update({
      where: { id: job.id },
      data: {
        matchScore: parsed.score,
        matchReason: parsed.reason,
        requirements: parsed.requirements || job.requirements,
        matchedSkills: parsed.matchedSkills || job.matchedSkills,
        missingSkills: parsed.missingSkills || job.missingSkills,
        interestMatch: parsed.interestMatch || job.interestMatch,
      },
    });

    return NextResponse.json({ job: updated });
  } catch (e) {
    console.error("Recalculate failed:", e);
    return NextResponse.json({ error: "Recalculation failed" }, { status: 500 });
  }
}