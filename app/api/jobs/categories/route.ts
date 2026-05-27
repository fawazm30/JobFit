/**
 * @file app/api/jobs/categories/route.ts
 * @description Uses Claude to categorize the user's saved jobs into their
 * preferred industries and computes an average match score per category.
 * Powers the "Best-fit Categories" widget on the dashboard.
 */

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

/**
 * GET /api/jobs/categories - Categorize saved jobs by industry and compute average scores.
 * @returns {NextResponse} JSON { categories } sorted by avgScore descending, or 401/404
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
    where: {
      userId: user.id,
      status: { not: "ignored" },
      matchScore: { not: null },
    },
    select: {
      id: true,
      title: true,
      matchScore: true,
    },
  });

  if (jobs.length === 0) {
    return NextResponse.json({ categories: [] });
  }

  try {
    const msg = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `You are a job categorization assistant. Categorize each job into one of the user's preferred industries.

User's industries: ${user.industries?.join(", ")}

Jobs to categorize:
${jobs.map((j) => `- ID: ${j.id} | Title: ${j.title}`).join("\n")}

Return ONLY a JSON array like this, no markdown:
[
  {"industry": "Technology", "jobId": "abc123"},
  {"industry": "Healthcare", "jobId": "def456"}
]

Only use industries from the user's list. If a job doesn't fit any industry, use the closest one.`,
        },
      ],
    });

    const content = msg.content[0];
    if (content.type !== "text") {
      return NextResponse.json({ categories: [] });
    }

    const cleaned = content.text
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    const categorized: { industry: string; jobId: string }[] = JSON.parse(cleaned);
    const industryMap: Record<string, { total: number; count: number }> = {};

    for (const item of categorized) {
      const job = jobs.find((j) => j.id === item.jobId);
      if (job && job.matchScore !== null) {
        if (!industryMap[item.industry]) {
          industryMap[item.industry] = { total: 0, count: 0 };
        }
        industryMap[item.industry].total += job.matchScore;
        industryMap[item.industry].count += 1;
      }
    }

    const categories = Object.entries(industryMap)
      .map(([name, { total, count }]) => ({
        name,
        avgScore: Math.round(total / count),
        jobCount: count,
      }))
      .sort((a, b) => b.avgScore - a.avgScore);

    return NextResponse.json({ categories });
  } catch (e) {
    console.error("Categories failed:", e);
    return NextResponse.json({ categories: [] });
  }
}