"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import Link from "next/link";

type ResumeSuggestion = {
  category: string;
  suggestion: string;
  priority: string;
};

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState("");
  const [loading, setLoading] = useState(true);
  const [resumeSuggestions, setResumeSuggestions] = useState<ResumeSuggestion[]>([]);
  const [latexResume, setLatexResume] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [generatingSuggestions, setGeneratingSuggestions] = useState(false);
  const [suggestionsError, setSuggestionsError] = useState("");
  const [resumeUrl, setResumeUrl] = useState<string | null>(null);
  const [pageCount, setPageCount] = useState<"1" | "2">("1");
  const [versionStats, setVersionStats] = useState<Record<string, number>>({});
  const [resumeVersions, setResumeVersions] = useState<{id: string; name: string}[]>([]);
  const [jobCategories, setJobCategories] = useState<{name: string; avgScore: number; jobCount: number}[]>([]);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (session?.user?.email) {
        fetch("/api/me")
        .then((r) => r.json())
        .then((data) => {
            setSkills(data.skills || []);
            setResumeUrl(data.resumeUrl || null);
            setLoading(false);
        });
        fetchVersionStats();
        fetchVersions();
        fetchJobCategories();
    }
   }, [session]);

  async function addSkill() {
    if (!newSkill.trim()) return;
    const res = await fetch("/api/skills", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ skill: newSkill.trim() }),
    });
    const data = await res.json();
    setSkills(data.skills);
    setNewSkill("");
  }

  async function removeSkill(skill: string) {
    const res = await fetch("/api/skills", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ skill }),
    });
    const data = await res.json();
    setSkills(data.skills);
  }

  async function generateSuggestions() {
    setGeneratingSuggestions(true);
    setSuggestionsError("");
    const res = await fetch("/api/resume/suggestions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pageCount }),
    });
    const data = await res.json();
    if (res.ok) {
      setResumeSuggestions(data.suggestions || []);
      setLatexResume(data.latexResume || null);
      setPdfUrl(data.pdfUrl || null);
    } else {
      setSuggestionsError(data.error || "Something went wrong.");
    }
    setGeneratingSuggestions(false);
  }

  async function fetchVersionStats() {
    const res = await fetch("/api/applications");
    const data = await res.json();
    const apps = data.applications || [];
    
    const stats: Record<string, number> = {};
    apps
        .filter((a: { applicationStatus: string }) => a.applicationStatus === "interview")
        .forEach((a: { resumeVersionId: string | null }) => {
        if (a.resumeVersionId) {
            stats[a.resumeVersionId] = (stats[a.resumeVersionId] || 0) + 1;
        }
        });
    setVersionStats(stats);
  }

  async function fetchVersions() {
    const res = await fetch("/api/resume/versions");
    const data = await res.json();
    const versions = data.versions || [];
    setResumeVersions(versions);
    // Use the most recent version's URL if user has no resumeUrl
    if (versions.length > 0 && versions[0].resumeUrl) {
        setResumeUrl((prev) => prev || versions[0].resumeUrl);
    }
  }

  async function fetchJobCategories() {
    const res = await fetch("/api/jobs/categories");
    const data = await res.json();
    setJobCategories(data.categories || []);
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  const priorityColors: Record<string, { bg: string; color: string }> = {
    high: { bg: "#fee2e2", color: "#b91c1c" },
    medium: { bg: "#fef9c3", color: "#a16207" },
    low: { bg: "#dcfce7", color: "#15803d" },
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between h-16">
        <Link href="/dashboard">
        <img src="/jobfit_logo.png" alt="JobFit" className="h-16 w-auto" />
      </Link>
        <div className="flex items-center gap-4">
          <Link href="/jobs" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">Jobs</Link>
          <Link href="/applications" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">Applications</Link>
          <span className="text-sm text-gray-500">{session?.user?.name}</span>
          <button onClick={() => signOut({ callbackUrl: "/login" })} className="text-sm text-gray-500 hover:text-gray-900 transition-colors">Log out</button>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-10">
        <h2 className="text-2xl font-semibold text-gray-900 mb-1">
          Welcome back, {session?.user?.name?.split(" ")[0]}!
        </h2>
        <p className="text-gray-500 mb-10">Here's what we know about you so far.</p>

        {/* Skills section */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-4">
          <h3 className="text-base font-semibold text-gray-900 mb-1">Your skills</h3>
          <p className="text-sm text-gray-500 mb-4">Detected from your resume. Add or remove as needed.</p>
          <div className="flex flex-wrap gap-2 mb-6">
            {skills.length === 0 ? (
              <p className="text-sm text-gray-400">
                No skills detected yet.{" "}
                <a href="/resume" className="text-gray-900 underline">Upload your resume</a> to get started.
              </p>
            ) : (
              skills.map((skill) => (
                <span key={skill} className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
                  {skill}
                  <button onClick={() => removeSkill(skill)} className="text-gray-400 hover:text-red-500 transition-colors ml-1 text-xs">x</button>
                </span>
              ))
            )}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addSkill()}
              placeholder="Add a skill..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
            <button onClick={addSkill} className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors">Add</button>
          </div>
        </div>

        {/* Resume section */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-4">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-base font-semibold text-gray-900">Resume</h3>
            <a href="/resume" className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
              Manage resume
            </a>
          </div>
          <p className="text-sm text-gray-500 mb-4">Your current resume.</p>
          {resumeUrl ? (
            <iframe
              src={resumeUrl}
              className="w-full h-96 rounded-lg border border-gray-200"
              title="Your resume"
            />
          ) : (
            <p className="text-sm text-gray-400">
              No resume uploaded yet.{" "}
              <a href="/resume" className="text-gray-900 underline">Upload one</a> to get started.
            </p>
          )}
        </div>

        {/* Role fit section */}
        {jobCategories.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-4">
            <h3 className="text-base font-semibold text-gray-900 mb-1">Best-fit role categories</h3>
            <p className="text-sm text-gray-500 mb-4">Based on your average match scores across saved jobs.</p>
            <div className="space-y-3">
            {jobCategories.map((cat, i) => (
                <div key={cat.name} className="p-3 border border-gray-100 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                    {i === 0 && (
                        <span style={{ backgroundColor: "#dcfce7", color: "#15803d" }} className="px-2 py-0.5 rounded-full text-xs font-semibold">
                        ⭐ Best fit
                        </span>
                    )}
                    <span className="text-sm font-medium text-gray-900">{cat.name}</span>
                    <span className="text-xs text-gray-400">{cat.jobCount} job{cat.jobCount !== 1 ? "s" : ""}</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">{cat.avgScore}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5">
                    <div
                    className="h-1.5 rounded-full"
                    style={{
                        width: `${cat.avgScore}%`,
                        backgroundColor: cat.avgScore >= 75 ? "#16a34a" : cat.avgScore >= 50 ? "#ca8a04" : "#dc2626"
                    }}
                    />
                </div>
                </div>
            ))}
            </div>
            {jobCategories.length === 1 && (
            <p className="text-xs text-gray-400 mt-3">Save jobs from more industries to see a fuller comparison.</p>
            )}
        </div>
        )}

        {/* Resume version stats */}
        {Object.keys(versionStats).length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-4">
            <h3 className="text-base font-semibold text-gray-900 mb-1">Resume performance</h3>
            <p className="text-sm text-gray-500 mb-4">Which resume version is getting you interviews.</p>
            <div className="space-y-2">
            {Object.entries(versionStats)
                .sort((a, b) => b[1] - a[1])
                .map(([versionId, count], i) => (
                <div key={versionId} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg">
                    <div className="flex items-center gap-2">
                    {i === 0 && (
                        <span style={{ backgroundColor: "#dcfce7", color: "#15803d" }} className="px-2 py-0.5 rounded-full text-xs font-semibold">
                        ⭐ Best performing
                        </span>
                    )}
                    <span className="text-sm text-gray-700">
                    {resumeVersions.find((v) => v.id === versionId)?.name || "Unknown version"}
                    </span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">{count} interview{count !== 1 ? "s" : ""}</span>
                </div>
                ))}
            </div>
        </div>
        )}

        {/* Resume suggestions section */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-semibold text-gray-900">Resume suggestions</h3>
            <button
              onClick={generateSuggestions}
              disabled={generatingSuggestions}
              className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-700 disabled:opacity-50 transition-colors"
            >
              {generatingSuggestions ? "Analyzing..." : "Generate suggestions"}
            </button>
          </div>

          <div className="flex items-center gap-3 mb-4">
            <span className="text-sm text-gray-600">Pages:</span>
            <button
              onClick={() => setPageCount("1")}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                pageCount === "1" ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-600 border-gray-300"
              }`}
            >
              1 page
            </button>
            <button
              onClick={() => setPageCount("2")}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                pageCount === "2" ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-600 border-gray-300"
              }`}
            >
              2 pages
            </button>
          </div>

          <p className="text-sm text-gray-500 mb-4">AI-powered suggestions based on your saved jobs.</p>

          {resumeSuggestions.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <p className="text-xs text-yellow-800 font-medium mb-1">⚠️ Important note</p>
              <p className="text-xs text-yellow-700">
                The generated resume is a starting point only. AI may trim bullet points or adjust content to fit your page preference.
                We recommend downloading the LaTeX source and making your own adjustments in{" "}
                <a href="https://www.overleaf.com" target="_blank" rel="noopener noreferrer" className="underline font-medium">
                  Overleaf
                </a>{" "}
                for best results.
              </p>
            </div>
          )}

          {suggestionsError && <p className="text-sm text-red-500 mb-4">{suggestionsError}</p>}

          {resumeSuggestions.length > 0 && (
            <div className="space-y-3 mb-4">
              {resumeSuggestions.map((s, i) => {
                const color = priorityColors[s.priority] || priorityColors.low;
                return (
                  <div key={i} className="border border-gray-100 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-semibold text-gray-600">{s.category}</span>
                      <span style={{ backgroundColor: color.bg, color: color.color }} className="px-2 py-0.5 rounded-full text-xs font-medium">
                        {s.priority}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">{s.suggestion}</p>
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex gap-3 flex-wrap">
            {pdfUrl && (
              <a
                href={pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
              >
                Download improved resume (PDF)
              </a>
            )}

            {latexResume && (
              <button
                onClick={() => {
                  const blob = new Blob([latexResume], { type: "text/plain" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = "improved_resume.tex";
                  a.click();
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Download LaTeX source
              </button>
            )}
          </div>

          {resumeSuggestions.length === 0 && !generatingSuggestions && !suggestionsError && (
            <p className="text-sm text-gray-400">Click "Generate suggestions" to get personalized resume feedback based on your saved jobs.</p>
          )}
        </div>
      </div>
    </div>
  );
}