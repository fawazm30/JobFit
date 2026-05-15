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
    orderBy: { matchScore: "desc" },
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

  let matchScore = null;
  let matchReason = null;
  let requirements: string[] = [];

  if (user.resumeText) {
    try {
      const Anthropic = (await import("@anthropic-ai/sdk")).default;
      const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

      const [matchMsg, reqMsg] = await Promise.all([
        anthropic.messages.create({
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
        }),
        anthropic.messages.create({
          model: "claude-sonnet-4-5",
          max_tokens: 512,
          messages: [
            {
              role: "user",
              content: `Extract all requirements from this job description. Include skills, years of experience, education, certifications, licenses, languages, and any other requirements. Return ONLY a JSON array of strings, no markdown. Be specific and concise for each item.

Job Title: ${title}
Job Description:
${description}

Example: ["3+ years experience", "Bachelor's degree in Computer Science", "React", "Class 5 Driver's License", "Clean Driver's Abstract", "Bilingual English/French"]`,
            },
          ],
        }),
      ]);

      const matchContent = matchMsg.content[0];
      if (matchContent.type === "text") {
        const cleaned = matchContent.text
          .replace(/```json\n?/g, "")
          .replace(/```\n?/g, "")
          .trim();
        const result = JSON.parse(cleaned);
        matchScore = result.score;
        matchReason = result.reason;
      }

      const reqContent = reqMsg.content[0];
      if (reqContent.type === "text") {
        const cleaned = reqContent.text
          .replace(/```json\n?/g, "")
          .replace(/```\n?/g, "")
          .trim();
        requirements = JSON.parse(cleaned);
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
    },
  });

  return NextResponse.json({ job });
}