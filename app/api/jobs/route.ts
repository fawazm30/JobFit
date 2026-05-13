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

  const jobs = await prisma.jobPosting.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ jobs });
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

  const { title, company, location, description, applicationLink } = await req.json();

  if (!title || !company || !description) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Use Claude to calculate match score
  let matchScore = null;
  let matchReason = null;

  if (user.resumeText) {
    try {
      const Anthropic = (await import("@anthropic-ai/sdk")).default;
      const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

      const message = await anthropic.messages.create({
        model: "claude-sonnet-4-5",
        max_tokens: 512,
        messages: [
          {
            role: "user",
            content: `Compare this resume to the job description and return a match score.

Resume:
${user.resumeText}

Job Title: ${title}
Company: ${company}
Job Description:
${description}

Return ONLY a JSON object like this, no markdown:
{"score": 75, "reason": "Strong match on React and Node.js, but missing Docker experience"}`,
          },
        ],
      });

      const content = message.content[0];
      if (content.type === "text") {
        const cleaned = content.text
          .replace(/```json\n?/g, "")
          .replace(/```\n?/g, "")
          .trim();
        const result = JSON.parse(cleaned);
        matchScore = result.score;
        matchReason = result.reason;
      }
    } catch (e) {
      console.error("Match scoring failed:", e);
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
    },
  });

  return NextResponse.json({ job });
}