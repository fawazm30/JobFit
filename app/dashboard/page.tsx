/**
 * @file app/dashboard/page.tsx
 * @description Main authenticated dashboard. Displays the user's active resume
 * preview with a version switcher, their skills list, top-performing resume
 * versions by interview count, best-fit job categories, and an AI-powered
 * resume suggestions section that generates an improved LaTeX/PDF resume.
 */

"use client";

import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";

const ResumePreview = dynamic(() => import("@/app/components/ResumePreview"), {
  ssr: false,
  loading: () => <div className="h-96 bg-gray-100 rounded-xl animate-pulse" />,
});

type ResumeSuggestion = {
  category: string;
  suggestion: string;
  priority: string;
};

type ResumeVersion = {
  id: string;
  name: string;
  resumeUrl: string | null;
  skills: string[];
};

/**
 * Main dashboard page for authenticated users.
 * @returns {JSX.Element} The dashboard UI, or a skeleton while loading
 */
export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState("");
  const [resumeSuggestions, setResumeSuggestions] = useState<ResumeSuggestion[]>([]);
  const [latexResume, setLatexResume] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [generatingSuggestions, setGeneratingSuggestions] = useState(false);
  const [suggestionsError, setSuggestionsError] = useState("");
  const [resumeUrl, setResumeUrl] = useState<string | null>(null);
  const [pageCount, setPageCount] = useState<"1" | "2">("1");
  const [versionStats, setVersionStats] = useState<Record<string, number>>({});
  const [resumeVersions, setResumeVersions] = useState<ResumeVersion[]>([]);
  const [jobCategories, setJobCategories] = useState<{name: string; avgScore: number; jobCount: number}[]>([]);
  const [showResumeSwitcher, setShowResumeSwitcher] = useState(false);
  const [activatingVersion, setActivatingVersion] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (session?.user?.email) {
      fetch("/api/me")
        .then((r) => r.json())
        .then((data) => {
          if (!data.industries || data.industries.length === 0) {
            router.push("/onboarding");
            return;
          }
          setSkills(data.skills || []);
          setResumeUrl(data.resumeUrl || null);
          setLoading(false);
        });
      fetchVersionStats();
      fetchVersions();
      fetchJobCategories();
    }
  }, [session]);

  /**
   * Adds a new skill to the user's skills list via POST /api/skills.
   * @returns {Promise<void>}
   */
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

  /**
   * Removes a skill from the user's skills list via DELETE /api/skills.
   * @param {string} skill - The skill label to remove
   * @returns {Promise<void>}
   */
  async function removeSkill(skill: string) {
    const res = await fetch("/api/skills", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ skill }),
    });
    const data = await res.json();
    setSkills(data.skills);
  }

  /**
   * Calls /api/resume/suggestions to generate AI resume feedback and an improved PDF.
   * Animates a progress bar while waiting for the response.
   * @returns {Promise<void>}
   */
  async function generateSuggestions() {
    setGeneratingSuggestions(true);
    setSuggestionsError("");
    setProgress(10);

    progressRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 85) {
          clearInterval(progressRef.current!);
          return 85;
        }
        return prev + Math.random() * 3;
      });
    }, 300);

    const res = await fetch("/api/resume/suggestions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pageCount }),
    });
    const data = await res.json();

    clearInterval(progressRef.current!);
    setProgress(100);

    setTimeout(() => {
      if (res.ok) {
        setResumeSuggestions(data.suggestions || []);
        setLatexResume(data.latexResume || null);
        setPdfUrl(data.pdfUrl || null);
      } else {
        setSuggestionsError(data.error || "Something went wrong.");
      }
      setGeneratingSuggestions(false);
      setProgress(0);
    }, 500);
  }

  /**
   * Counts interview-stage applications per resume version for the Top Resumes widget.
   * @returns {Promise<void>}
   */
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

  /**
   * Loads all resume versions for the inline version switcher panel.
   * @returns {Promise<void>}
   */
  async function fetchVersions() {
    const res = await fetch("/api/resume/versions");
    const data = await res.json();
    const versions = data.versions || [];
    setResumeVersions(versions);
    if (versions.length > 0 && versions[0].resumeUrl) {
      setResumeUrl((prev) => prev || versions[0].resumeUrl);
    }
  }

  /**
   * Fetches AI-categorized job match data for the Best-fit Categories widget.
   * @returns {Promise<void>}
   */
  async function fetchJobCategories() {
    const res = await fetch("/api/jobs/categories");
    const data = await res.json();
    setJobCategories(data.categories || []);
  }

  /**
   * Activates a resume version as the user's current resume and updates local state.
   * @param {ResumeVersion} version - The resume version to activate
   * @returns {Promise<void>}
   */
  async function activateVersion(version: ResumeVersion) {
    setActivatingVersion(version.id);
    const res = await fetch("/api/resume/activate", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resumeVersionId: version.id }),
    });
    if (res.ok) {
      setResumeUrl(version.resumeUrl);
      setSkills(version.skills);
      setShowResumeSwitcher(false);
    }
    setActivatingVersion(null);
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-50 animate-pulse pt-16">
        <div className="max-w-4xl mx-auto px-4 py-10">
          <div className="h-10 w-64 bg-gray-200 rounded-full mb-8" />
          <div className="bg-white rounded-2xl h-96 mb-6 border border-gray-100" />
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div className="bg-white rounded-2xl h-48 border border-gray-100" />
            <div className="bg-white rounded-2xl h-48 border border-gray-100" />
          </div>
          <div className="bg-white rounded-2xl h-40 border border-gray-100" />
        </div>
      </div>
    );
  }

  const priorityColors: Record<string, { bg: string; color: string }> = {
    high: { bg: "#fee2e2", color: "#b91c1c" },
    medium: { bg: "#fef9c3", color: "#a16207" },
    low: { bg: "#dcfce7", color: "#15803d" },
  };

  const svgFilter = "invert(48%) sepia(79%) saturate(2476%) hue-rotate(330deg) brightness(118%) contrast(119%)";

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="max-w-4xl mx-auto px-4 py-10">
        {/* Title */}
        <h1 className="text-4xl font-black text-gray-900 mb-8 tracking-tight">DASHBOARD</h1>

        {/* Resume Preview with switcher */}
        <div className="relative mb-10">
          <h2 className="text-xl text-gray-500 mb-4">Your Resume</h2>

          {/* Resume card — button and panel live inside here */}
          <div
            className="relative bg-white rounded-t-xl overflow-hidden border border-gray-200"
            style={{ height: "400px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" }}
          >
            {resumeUrl ? (
              <div className="relative w-full h-full bg-white overflow-y-auto">
                <ResumePreview url={resumeUrl} />
                <div
                  className="sticky bottom-0 left-0 right-0 h-16 pointer-events-none"
                  style={{ background: "linear-gradient(to top, rgba(0,0,0,0.08), transparent)" }}
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <p className="text-gray-400 text-sm mb-3">No resume uploaded yet.</p>
                <Link
                  href="/resume"
                  className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors"
                  style={{ background: "linear-gradient(135deg, #F97316, #EC4899)" }}
                >
                  Upload resume
                </Link>
              </div>
            )}

            {/* Switcher toggle button — inside card */}
            <button
              onClick={() => setShowResumeSwitcher(!showResumeSwitcher)}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center shadow-lg z-10 rounded-full border-2 border-white text-base"
              style={{ background: "linear-gradient(135deg, #F97316, #EC4899)", color: "white", fontWeight: "bold" }}
            >
              {showResumeSwitcher ? "›" : "‹"}
            </button>

            {/* Switcher panel — inside card */}
            {showResumeSwitcher && (
              <div className="absolute right-14 top-4 w-56 bg-white border border-gray-200 rounded-xl shadow-xl p-4 z-20">
                <p className="text-xs font-bold text-gray-700 mb-3 uppercase tracking-wide">Switch resume</p>
                {resumeVersions.length === 0 ? (
                  <p className="text-xs text-gray-400">No versions uploaded yet.</p>
                ) : (
                  <div className="space-y-2">
                    {resumeVersions.map((v) => (
                      <button
                        key={v.id}
                        onClick={() => activateVersion(v)}
                        disabled={activatingVersion === v.id}
                        className="w-full text-left px-3 py-2.5 rounded-lg text-xs font-semibold text-gray-800 hover:text-orange-600 hover:bg-orange-50 transition-colors border border-gray-100 disabled:opacity-50"
                      >
                        {activatingVersion === v.id ? "Activating..." : v.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="h-0.5 bg-gray-300 w-full" />
        </div>

        {/* Skills section */}
        <div className="mb-10">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Your Skills</h2>
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="flex flex-wrap gap-2 mb-4">
              {skills.length === 0 ? (
                <p className="text-sm text-gray-400">
                  No skills detected yet.{" "}
                  <Link href="/resume" className="text-orange-500 underline">Upload your resume</Link> to get started.
                </p>
              ) : (
                skills.map((skill) => (
                  <span
                    key={skill}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium"
                    style={{ backgroundColor: "#FFE8CC", color: "#92400e" }}
                  >
                    {skill}
                    <button onClick={() => removeSkill(skill)} className="ml-1 text-xs opacity-60 hover:opacity-100 transition-opacity">×</button>
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
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
              <button
                onClick={addSkill}
                className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors"
                style={{ background: "linear-gradient(135deg, #F97316, #EC4899)" }}
              >
                Add
              </button>
            </div>
          </div>
        </div>

        {/* Top Resumes + Best-fit Categories */}
        <div className="grid grid-cols-2 gap-6 mb-10">
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h2 className="text-base font-bold text-gray-900 mb-4">Top Resumes</h2>
            {Object.keys(versionStats).length === 0 ? (
              <p className="text-sm text-gray-400">No interview data yet. Assign resume versions to applications to track performance.</p>
            ) : (
              <div className="space-y-2">
                {Object.entries(versionStats)
                  .sort((a, b) => b[1] - a[1])
                  .map(([versionId, count], i) => (
                    <div key={versionId} className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: "#FFF7ED" }}>
                      <div className="flex items-center gap-2">
                        {i === 0 && <img src="/star.svg" alt="top" className="w-4 h-4" style={{ filter: svgFilter }} />}
                        <span className="text-sm text-gray-700 font-medium">
                          {resumeVersions.find((v) => v.id === versionId)?.name || "Unknown"}
                        </span>
                      </div>
                      <span className="text-xs font-semibold text-orange-600">{count} interview{count !== 1 ? "s" : ""}</span>
                    </div>
                  ))}
              </div>
            )}
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h2 className="text-base font-bold text-gray-900 mb-4">Best-fit Categories for you</h2>
            {jobCategories.length === 0 ? (
              <p className="text-sm text-gray-400">Save and score jobs to see your best-fit categories.</p>
            ) : (
              <div className="space-y-3">
                {jobCategories.map((cat, i) => (
                  <div key={cat.name} className="p-3 rounded-lg" style={{ backgroundColor: "#FFF7ED" }}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        {i === 0 && <img src="/case.svg" alt="best fit" className="w-4 h-4" style={{ filter: svgFilter }} />}
                        <span className="text-sm font-medium text-gray-900">{cat.name}</span>
                      </div>
                      <span className="text-xs font-semibold text-orange-600">{cat.avgScore}%</span>
                    </div>
                    <div className="w-full bg-orange-100 rounded-full h-1.5">
                      <div
                        className="h-1.5 rounded-full"
                        style={{ width: `${cat.avgScore}%`, background: "linear-gradient(135deg, #F97316, #EC4899)" }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Resume Suggestions */}
        <div className="mb-10">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Resume Suggestions</h2>
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600">Pages:</span>
                <button
                  onClick={() => setPageCount("1")}
                  className="px-3 py-1 rounded-full text-xs font-medium border transition-colors"
                  style={pageCount === "1"
                    ? { background: "linear-gradient(135deg, #F97316, #EC4899)", color: "white", border: "none" }
                    : { backgroundColor: "white", color: "#4b5563", borderColor: "#d1d5db" }}
                >
                  1 page
                </button>
                <button
                  onClick={() => setPageCount("2")}
                  className="px-3 py-1 rounded-full text-xs font-medium border transition-colors"
                  style={pageCount === "2"
                    ? { background: "linear-gradient(135deg, #F97316, #EC4899)", color: "white", border: "none" }
                    : { backgroundColor: "white", color: "#4b5563", borderColor: "#d1d5db" }}
                >
                  2 pages
                </button>
              </div>

              <button
                onClick={generateSuggestions}
                disabled={generatingSuggestions}
                className="relative px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-100 transition-colors overflow-hidden min-w-52"
                style={{ background: "linear-gradient(135deg, #F97316, #EC4899)" }}
              >
                {generatingSuggestions && (
                  <div
                    className="absolute left-0 top-0 h-full transition-all duration-300 rounded-lg"
                    style={{ width: `${progress}%`, background: "rgba(255,255,255,0.2)" }}
                  />
                )}
                <span className="relative z-10">
                  {generatingSuggestions
                    ? `${Math.round(progress)}% ${progress < 40 ? "Analyzing resume..." : progress < 70 ? "Looking over skills..." : progress < 90 ? "Almost there..." : "Done!"}`
                    : "Generate suggestions"}
                </span>
              </button>
            </div>

            <p className="text-sm text-gray-500 mb-4">AI-powered suggestions based on your saved jobs.</p>

            {resumeSuggestions.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <p className="text-xs text-yellow-800 font-medium mb-1">⚠️ Important note</p>
                <p className="text-xs text-yellow-700">
                  The generated resume is a starting point only. We recommend downloading the LaTeX source and making adjustments in{" "}
                  <a href="https://www.overleaf.com" target="_blank" rel="noopener noreferrer" className="underline font-medium">Overleaf</a>.
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
                  className="inline-block px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors"
                  style={{ background: "linear-gradient(135deg, #F97316, #EC4899)" }}
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
    </div>
  );
}