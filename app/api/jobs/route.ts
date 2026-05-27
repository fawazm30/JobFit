/**
 * @file app/api/jobs/route.ts
 * @description Fetch all saved jobs or manually add a new job posting for the
 * current user. Newly added jobs are scored against the user's resume via Claude.
 */

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/jobs - Retrieve all saved job postings for the current user.
 * @returns {NextResponse} JSON { jobs } ordered by match score descending or 401/404
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const jobs = await prisma.jobPosting.findMany({
    where: { userId: user.id },
    orderBy: { matchScore: "desc" },
  });

  return NextResponse.json({ jobs });
}

/**
 * POST /api/jobs - Manually create a new job posting and score it with Claude.
 * @param {Request} req - JSON body with { title, company, description, location?, applicationLink? }
 * @returns {NextResponse} JSON { job } with AI match scores, or 400 if required fields are missing
 */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { title, company, location, description, applicationLink } = await req.json();

  if (!title || !company || !description) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  let matchScore = null;
  let matchReason = null;
  let requirements: string[] = [];
  let matchedSkills: string[] = [];
  let missingSkills: string[] = [];
  let interestMatch: string | null = null;

  if (user.resumeText) {
    try {
      const Anthropic = (await import("@anthropic-ai/sdk")).default;
      const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

      const matchMsg = await anthropic.messages.create({
        model: "claude-sonnet-4-5",
        max_tokens: 512,
        messages: [
          {
            role: "user",
            content: `Compare this resume to the job description and return a match score.

Resume:
${user.resumeText}
Skills: ${user.skills?.join(", ")}
Location preferences: ${user.locations?.join(", ")}
Job type preferences: ${user.jobTypes?.join(", ")}

Job Title: ${title}
Company: ${company}
Job Description:
${description}

Return ONLY a JSON object like this, no markdown:
{"score": 75, "reason": "Plain language explanation", "requirements": ["Requirement 1"], "matchedSkills": ["Skill 1"], "missingSkills": ["Skill 2"], "interestMatch": "Brief note on location/job type alignment"}`,
          },
        ],
      });

      const matchContent = matchMsg.content[0];
      if (matchContent.type === "text") {
        const cleaned = matchContent.text
          .replace(/```json\n?/g, "")
          .replace(/```\n?/g, "")
          .trim();
        const result = JSON.parse(cleaned);
        matchScore = result.score;
        matchReason = result.reason;
        requirements = result.requirements || [];
        matchedSkills = result.matchedSkills || [];
        missingSkills = result.missingSkills || [];
        interestMatch = result.interestMatch || null;
      }
    } catch (e) {
      console.error("Claude processing failed:", e);
    }
  }

  const job = await prisma.jobPosting.create({
    data: {
      userId: user.id,
      title,
      company,
      location,
      description,
      applicationLink,
      source: "manual",
      matchScore,
      matchReason,
      requirements,
      matchedSkills,
      missingSkills,
      interestMatch,
    },
  });

  return NextResponse.json({ job });
}