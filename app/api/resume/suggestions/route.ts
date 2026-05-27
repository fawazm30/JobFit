/**
 * @file app/api/resume/suggestions/route.ts
 * @description Uses Claude to analyze the user's resume against missing skills
 * from their saved jobs, produces actionable improvement suggestions, generates
 * an improved LaTeX resume, and compiles it to PDF via latex.ytotech.com.
 */

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

/**
 * POST /api/resume/suggestions - Generate AI resume suggestions and an improved LaTeX/PDF resume.
 * @param {Request} req - JSON body with optional { pageCount: "1" | "2" }
 * @returns {NextResponse} JSON { suggestions, latexResume, pdfUrl } or 400/401/500
 */
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { pageCount = "1" } = await req.json();

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
    if (!user.resumeText) return NextResponse.json({ error: "No resume uploaded" }, { status: 400 });

    // Collect all missing skills from saved jobs
    const jobs = await prisma.jobPosting.findMany({
      where: {
        userId: user.id,
        missingSkills: { isEmpty: false },
      },
    });

    const allMissingSkills = [...new Set(jobs.flatMap((job) => job.missingSkills))];

    // Call Claude for suggestions and improved resume
    const msg = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 4000,
      messages: [
        {
          role: "user",
          content: `You are a professional resume writer. Analyze this resume and provide improvement suggestions, then generate an improved LaTeX resume.

Current Resume:
${user.resumeText}

Current Skills: ${user.skills?.join(", ")}

Skills commonly missing from job matches: ${allMissingSkills.join(", ")}

IMPORTANT FORMATTING REQUIREMENTS:
- Generate a ${pageCount === "1" ? "ONE page" : "TWO page"} resume ONLY
- Use a clean, minimal LaTeX template similar to this structure:
  - Name and contact info at top
  - Sections: Summary, Education, Technical Skills, Experience, Projects
  - Use \\section{} for headers
  - Use itemize for bullet points
  - Use \\textbf{} for emphasis
  - Font size: 10pt for body, 11pt for section headers
  - Margins: ${pageCount === "1" ? "0.6 inch" : "0.75 inch"} all sides
  - ${pageCount === "1" ? `ONE PAGE MAXIMUM - hard requirement. Achieve this by:
  1. Use 10pt font size (not smaller)
  2. Margins: 0.6 inch all sides
  3. Reduce to maximum 2 bullet points per role/project
  4. Keep bullet points concise - max 1.5 lines each
  5. Remove least important projects if needed (keep 2-3 max)
  6. Use \\\\vspace{-4pt} between sections only
  7. Do NOT shrink fonts below 10pt
  8. Prioritize quality over quantity - cut content, not font size` 
  : "Allow content to flow naturally across TWO pages."}
- Keep ALL real experience, education, and projects from the original
- Incorporate missing skills naturally where genuinely applicable
- Make it ATS-friendly with clean formatting

Return ONLY a JSON object with this exact format, no markdown:
{
  "suggestions": [
    {
      "category": "Skills Gap",
      "suggestion": "Specific actionable suggestion here",
      "priority": "high"
    }
  ],
  "latexResume": "\\\\documentclass[10pt]{article}... (full LaTeX code here)"
}

For suggestions include 5-8 specific actionable items. Categories: "Skills Gap", "Formatting", "Content", "Keywords", "Projects". Priority: "high", "medium", "low".`,
        },
      ],
    });

    const content = msg.content[0];
    if (content.type !== "text") {
      return NextResponse.json({ error: "Unexpected response from Claude" }, { status: 500 });
    }

    const cleaned = content.text
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    const result = JSON.parse(cleaned);

    // Compile LaTeX to PDF via latex.ytotech.com
    let pdfUrl = null;
    if (result.latexResume) {
        try {
            const compileRes = await fetch("https://latex.ytotech.com/builds/sync", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                compiler: "pdflatex",
                resources: [
                {
                    main: true,
                    content: result.latexResume,
                },
                ],
            }),
            });
            console.log("LaTeX compile status:", compileRes.status);
            if (compileRes.ok) {
            const pdfBuffer = await compileRes.arrayBuffer();
            const base64 = Buffer.from(pdfBuffer).toString("base64");
            pdfUrl = `data:application/pdf;base64,${base64}`;
            } else {
            const errorText = await compileRes.text();
            console.error("LaTeX compile error:", errorText.slice(0, 300));
            }
        } catch (e) {
            console.error("LaTeX compilation failed:", e);
        }
    }

    return NextResponse.json({
      suggestions: result.suggestions || [],
      latexResume: result.latexResume || null,
      pdfUrl,
    });

  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}