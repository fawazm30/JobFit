import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

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
  const location = locations.find(
    (l) => l !== "Remote" && l !== "Canada-wide"
  ) || "Canada";

  const appId = process.env.ADZUNA_APP_ID;
  const apiKey = process.env.ADZUNA_API_KEY;

  const url = `https://api.adzuna.com/v1/api/jobs/ca/search/1?app_id=${appId}&app_key=${apiKey}&results_per_page=10&what=${encodeURIComponent(query)}&where=${encodeURIComponent(location)}&content-type=application/json`;

  const res = await fetch(url);
  const data = await res.json();

  if (!data.results) {
    return NextResponse.json({ error: "No results from Adzuna" }, { status: 500 });
  }

  // Score each job with Claude but don't save yet
  const Anthropic = (await import("@anthropic-ai/sdk")).default;
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

  const suggestions = [];

  for (const result of data.results) {
    let matchScore = null;
    let matchReason = null;

    if (user.resumeText) {
      try {
        const message = await anthropic.messages.create({
          model: "claude-sonnet-4-5",
          max_tokens: 256,
          messages: [
            {
              role: "user",
              content: `Compare this resume to the job and return a match score.

Resume summary (first 1000 chars): ${user.resumeText?.slice(0, 1000)}

Job: ${result.title} at ${result.company?.display_name}
Description: ${result.description?.slice(0, 500)}

Return ONLY JSON, no markdown: {"score": 75, "reason": "Brief reason"}`,
            },
          ],
        });

        const content = message.content[0];
        if (content.type === "text") {
          const cleaned = content.text
            .replace(/```json\n?/g, "")
            .replace(/```\n?/g, "")
            .trim();
          const parsed = JSON.parse(cleaned);
          matchScore = parsed.score;
          matchReason = parsed.reason;
        }
      } catch (e) {
        console.error("Scoring failed:", e);
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
    });
  }

  return NextResponse.json({ suggestions });
}