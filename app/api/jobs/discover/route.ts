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
  const locations = user.locations || [];

  if (jobTitles.length === 0) {
    return NextResponse.json({ error: "No job preferences set" }, { status: 400 });
  }

  const query = jobTitles[0];
  const hasRemote = locations.includes("Remote") || locations.includes("Canada-wide");
  const specificLocation = locations.find(
    (l) => l !== "Remote" && l !== "Canada-wide"
  );
  const location = specificLocation || "Canada";
  const appId = process.env.ADZUNA_APP_ID;
  const apiKey = process.env.ADZUNA_API_KEY;

  // Simplify query - just use job title, search all of Canada
  const simplifiedQuery = query.replace(/intern(ship)?/i, "").trim();

  const url = `https://api.adzuna.com/v1/api/jobs/ca/search/1?app_id=${appId}&app_key=${apiKey}&results_per_page=5&what=${encodeURIComponent(simplifiedQuery)}&where=Canada`;

  console.log("Adzuna URL:", url); // debug log
  const res = await fetch(url);
  const text = await res.text();
  console.log("Adzuna response status:", res.status);
  console.log("Adzuna response:", text.slice(0, 500));

  let data;
  try {
    data = JSON.parse(text);
  } catch {
    return NextResponse.json({ error: "Adzuna API error", details: text.slice(0, 200) }, { status: 500 });
  }

  if (!data.results) {
    return NextResponse.json({ error: "No results from Adzuna", details: data }, { status: 500 });
  }

  const suggestions = [];

  for (const result of data.results) {
  let matchScore = null;
  let matchReason = null;
  let requirements: string[] = [];

  if (user.resumeText) {
    // Add small delay between jobs to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 2000));

    try {
      // Do match and requirements in one single call to reduce API load
      const msg = await anthropic.messages.create({
        model: "claude-sonnet-4-5",
        max_tokens: 512,
        messages: [
          {
            role: "user",
            content: `Analyze this job against the candidate's resume. Return ONLY JSON, no markdown.

Candidate prefers: ${user.locations?.join(", ")} and ${user.jobTypes?.join(", ")} positions.

Resume (first 1000 chars): ${user.resumeText?.slice(0, 1000)}

Job: ${result.title} at ${result.company?.display_name}
Location: ${result.location?.display_name}
Description: ${result.description?.slice(0, 500)}

Return this exact format:
{"score": 75, "reason": "Brief reason", "requirements": ["Requirement 1", "Requirement 2", "Requirement 3"]}`,
          },
        ],
      });

      const content = msg.content[0];
      if (content.type === "text") {
        const cleaned = content.text
          .replace(/```json\n?/g, "")
          .replace(/```\n?/g, "")
          .trim();
        const parsed = JSON.parse(cleaned);
        matchScore = parsed.score;
        matchReason = parsed.reason;
        requirements = parsed.requirements || [];
      }
    } catch (e) {
      console.error("Claude processing failed:", e);
    }
  }

  suggestions.push({
    externalId: result.id,
    title: result.title,
    company: result.company?.display_name || "Unknown",
    location: result.location?.display_name || location,
    description: result.description || "",
    applicationLink: result.redirect_url,
    source: "adzuna",
    matchScore,
    matchReason,
    requirements,
  });
}

  const sortedSuggestions = suggestions.sort((a, b) => {
    if (b.matchScore === null) return -1;
    if (a.matchScore === null) return 1;
    return b.matchScore - a.matchScore;
  });

  return NextResponse.json({ suggestions: sortedSuggestions });
}