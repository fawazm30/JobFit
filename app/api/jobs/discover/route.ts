import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

export async function POST() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const jobTitles = user.jobTitles || [];
  let query = jobTitles[0]?.trim() || "";

  if (!query) {
    try {
      const msg = await anthropic.messages.create({
        model: "claude-sonnet-4-5",
        max_tokens: 100,
        messages: [
          {
            role: "user",
            content: `Based on this person's skills and industries, suggest ONE short job search query (2-4 words max) that would find relevant jobs on a job board. Return ONLY the search query, nothing else.

Industries: ${user.industries?.join(", ")}
Skills: ${user.skills?.slice(0, 10).join(", ")}

Example outputs: "Software Developer", "Registered Nurse", "Civil Engineer"`,
          },
        ],
      });

      const content = msg.content[0];
      if (content.type === "text") {
        query = content.text.trim().replace(/"/g, "");
      }
    } catch (e) {
      console.error("Failed to generate query:", e);
      query = user.industries?.[0] || "Software Developer";
    }
  }

  const locations = user.locations || [];
  const specificLocation = locations.find((l) => l !== "Remote" && l !== "Canada-wide");
  const location = specificLocation || "Canada";
  const appId = process.env.ADZUNA_APP_ID;
  const apiKey = process.env.ADZUNA_API_KEY;
  const simplifiedQuery = query.replace(/intern(ship)?/i, "").trim();

  const url = `https://api.adzuna.com/v1/api/jobs/ca/search/1?app_id=${appId}&app_key=${apiKey}&results_per_page=20&what=${encodeURIComponent(simplifiedQuery)}&where=Canada`;

  console.log("Adzuna URL:", url);
  const res = await fetch(url);
  const text = await res.text();
  console.log("Adzuna response status:", res.status);

  let data;
  try {
    data = JSON.parse(text);
  } catch {
    return NextResponse.json({ error: "Adzuna API error", details: text.slice(0, 200) }, { status: 500 });
  }

  if (!data.results) {
    return NextResponse.json({ error: "No results from Adzuna", details: data }, { status: 500 });
  }

  // Build job list for batch scoring
  const jobs = data.results.map((result: {
    id: string;
    title: string;
    company?: { display_name: string };
    location?: { display_name: string };
    description?: string;
    redirect_url: string;
  }) => ({
    externalId: result.id,
    title: result.title,
    company: result.company?.display_name || "Unknown",
    location: result.location?.display_name || location,
    description: result.description || "",
    applicationLink: result.redirect_url,
  }));

  // Score all jobs in one Claude call
  let scoredJobs: {
    externalId: string;
    score: number;
    reason: string;
    requirements: string[];
    matchedSkills: string[];
    missingSkills: string[];
    interestMatch: string;
  }[] = [];

  if (user.resumeText) {
    try {
      const jobList = jobs.map((j: { externalId: string; title: string; company: string; location: string; description: string }, i: number) =>
        `Job ${i + 1} (ID: ${j.externalId}):
Title: ${j.title}
Company: ${j.company}
Location: ${j.location}
Description: ${j.description.slice(0, 300)}`
      ).join("\n\n");

      const msg = await anthropic.messages.create({
        model: "claude-sonnet-4-5",
        max_tokens: 4096,
        messages: [
          {
            role: "user",
            content: `You are a job matching assistant. Analyze each job against the candidate's resume and return scores.

Candidate info:
- Skills: ${user.skills?.join(", ")}
- Industries: ${user.industries?.join(", ")}
- Preferred locations: ${user.locations?.join(", ")}
- Preferred job types: ${user.jobTypes?.join(", ")}
- Resume: ${user.resumeText?.slice(0, 1500)}

Jobs to analyze:
${jobList}

Return ONLY a JSON array, no markdown, no explanation:
[
  {
    "externalId": "job_id_here",
    "score": 75,
    "reason": "Brief 1-2 sentence explanation of match",
    "requirements": ["req1", "req2", "req3"],
    "matchedSkills": ["skill1", "skill2"],
    "missingSkills": ["skill3", "skill4"],
    "interestMatch": "Brief note on location/job type match"
  }
]

Analyze ALL ${jobs.length} jobs. Be accurate with matchedSkills and missingSkills based on the candidate's actual skills.`,
          },
        ],
      });

      const content = msg.content[0];
      if (content.type === "text") {
        const cleaned = content.text
          .replace(/```json\n?/g, "")
          .replace(/```\n?/g, "")
          .trim();
        scoredJobs = JSON.parse(cleaned);
      }
    } catch (e) {
      console.error("Batch Claude scoring failed:", e);
    }
  }

  // Merge scores with job data
  const suggestions = jobs.map((job: { externalId: string; title: string; company: string; location: string; description: string; applicationLink: string }) => {
    const scored = scoredJobs.find((s) => s.externalId === job.externalId);
    return {
      externalId: job.externalId,
      title: job.title,
      company: job.company,
      location: job.location,
      description: job.description,
      applicationLink: job.applicationLink,
      source: "adzuna",
      matchScore: scored?.score ?? null,
      matchReason: scored?.reason ?? null,
      requirements: scored?.requirements ?? [],
      matchedSkills: scored?.matchedSkills ?? [],
      missingSkills: scored?.missingSkills ?? [],
      interestMatch: scored?.interestMatch ?? null,
    };
  });

  // Sort by match score
  const sortedSuggestions = suggestions.sort((a: { matchScore: number | null }, b: { matchScore: number | null }) => {
    if (b.matchScore === null) return -1;
    if (a.matchScore === null) return 1;
    return b.matchScore - a.matchScore;
  });

  return NextResponse.json({ suggestions: sortedSuggestions });
}