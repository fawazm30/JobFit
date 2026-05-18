import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

async function scoreJobInBackground(
  jobId: string,
  userId: string,
  title: string,
  company: string,
  description: string,
  resumeText: string,
  skills: string[],
  locations: string[],
  jobTypes: string[]
) {
  try {
    const matchMsg = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 512,
      messages: [
        {
          role: "user",
          content: `Compare this resume to the job description and return a match score, with matching skills, missing skills, and interest match.

Resume:
${resumeText}
Skills: ${skills?.join(", ")}
Location preferences: ${locations?.join(", ")}
Job type preferences: ${jobTypes?.join(", ")}

Job Title: ${title}
Company: ${company}
Job Description:
${description}

Return ONLY a JSON object like this, no markdown:
{"score": 75, "reason": "Plain language explanation", "requirements": ["Requirement 1"], "matchedSkills": ["Skill 1"], "missingSkills": ["Skill 2"], "interestMatch": "Brief note on location/job type alignment"}`,
        },
      ],
    });

    const content = matchMsg.content[0];
    if (content.type === "text") {
      const cleaned = content.text
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();
      const result = JSON.parse(cleaned);

      await prisma.jobPosting.update({
        where: { id: jobId },
        data: {
          matchScore: result.score,
          matchReason: result.reason,
          requirements: result.requirements || [],
          matchedSkills: result.matchedSkills || [],
          missingSkills: result.missingSkills || [],
          interestMatch: result.interestMatch || null,
        },
      });
    }
  } catch (error) {
    console.error("Background scoring failed:", error);
  }
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

  const {
    title,
    company,
    location,
    description,
    applicationLink,
    externalId,
    status = "saved",
  } = await req.json();

  // Don't save duplicates
  const existing = await prisma.jobPosting.findFirst({
    where: { userId: user.id, externalId },
  });

  if (existing) {
    return NextResponse.json({ error: "Already saved" }, { status: 409 });
  }

  // Save immediately with empty scores
  const job = await prisma.jobPosting.create({
    data: {
      userId: user.id,
      title,
      company,
      location,
      description,
      applicationLink,
      source: "adzuna",
      externalId,
      matchScore: null, status,
      matchReason: null,
      requirements: [],
      matchedSkills: [],
      missingSkills: [],
      interestMatch: null,
    },
  });

  // Score in background without awaiting
  if (user.resumeText) {
    scoreJobInBackground(
      job.id,
      user.id,
      title,
      company,
      description,
      user.resumeText,
      user.skills || [],
      user.locations || [],
      user.jobTypes || []
    );
  }

  return NextResponse.json({ job });
}