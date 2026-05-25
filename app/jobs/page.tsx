"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { signOut } from "next-auth/react";

type Job = {
  id: string;
  title: string;
  company: string;
  location: string | null;
  description: string;
  applicationLink: string | null;
  source: string;
  matchScore: number | null;
  matchReason: string | null;
  requirements: string[];
  missingSkills: string[];
  matchedSkills: string[];
  interestMatch: string | null;
  status: string;
  createdAt: string;
  externalId?: string | null;
  coverLetter: string | null;
};

type Suggestion = {
  externalId: string;
  title: string;
  company: string;
  location: string;
  description: string;
  applicationLink: string;
  matchScore: number | null;
  matchReason: string | null;
  requirements: string[];
  missingSkills: string[];
  matchedSkills: string[];
  interestMatch: string | null;
};

function CircleScore({ score }: { score: number | null }) {
  if (score === null) return (
    <div className="w-16 h-16 rounded-full border-4 border-gray-200 flex items-center justify-center">
      <span className="text-xs text-gray-400">N/A</span>
    </div>
  );

  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-16 h-16">
        <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
          <circle cx="32" cy="32" r={radius} fill="none" stroke="#f3f4f6" strokeWidth="5" />
          <circle
            cx="32" cy="32" r={radius} fill="none"
            stroke="url(#scoreGradient)" strokeWidth="5"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
          />
          <defs>
            <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#F97316" />
              <stop offset="100%" stopColor="#EC4899" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-black text-gray-900">{score}%</span>
        </div>
      </div>
      <span className="text-xs text-gray-400">Match Score</span>
    </div>
  );
}

function CoverLetterPanel({ jobId, initialContent, onClose }: { jobId: string; initialContent: string | null; onClose: () => void }) {
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const editor = useEditor({
    extensions: [StarterKit],
    content: initialContent || "",
  });

  async function generate() {
    setGenerating(true);
    const res = await fetch(`/api/jobs/${jobId}/generate-cover-letter`, { method: "POST" });
    const data = await res.json();
    if (res.ok && editor) {
      editor.commands.setContent(data.coverLetter);
    }
    setGenerating(false);
  }

  async function save() {
    setSaving(true);
    const content = editor?.getHTML() || "";
    await fetch(`/api/jobs/${jobId}/cover-letter`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ coverLetter: content }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function downloadDocx() {
    const { Document, Paragraph, TextRun, Packer } = await import("docx");
    const { saveAs } = await import("file-saver");
    const text = editor?.getText() || "";
    const paragraphs = text.split("\n").filter(Boolean).map(
      (line) => new Paragraph({ children: [new TextRun(line)] })
    );
    const doc = new Document({ sections: [{ properties: {}, children: paragraphs }] });
    const blob = await Packer.toBlob(doc);
    saveAs(blob, "cover-letter.docx");
  }

  return (
    <div className="w-96 bg-white border-l border-gray-200 flex flex-col h-full fixed right-0 top-16 bottom-0 shadow-xl z-30">
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h3 className="text-sm font-bold text-gray-900">Cover Letter</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg font-bold">×</button>
      </div>
      <div className="flex gap-2 p-4 border-b border-gray-100">
        <button
          onClick={generate}
          disabled={generating}
          className="flex-1 py-2 rounded-lg text-xs font-medium text-white disabled:opacity-50 transition-colors"
          style={{ background: "linear-gradient(135deg, #F97316, #EC4899)" }}
        >
          {generating ? "Generating..." : initialContent ? "Regenerate" : "Generate"}
        </button>
        <button
          onClick={save}
          disabled={saving}
          className="flex-1 py-2 rounded-lg text-xs font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
        >
          {saving ? "Saving..." : saved ? "Saved!" : "Save"}
        </button>
        <button
          onClick={downloadDocx}
          className="flex-1 py-2 rounded-lg text-xs font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
        >
          .docx
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {editor?.getText() || initialContent ? (
          <div className="text-sm text-gray-800 [&_.ProseMirror]:outline-none [&_.ProseMirror_p]:mb-3">
            <EditorContent editor={editor} />
          </div>
        ) : (
          <p className="text-xs text-gray-400 text-center mt-8">Click Generate to create a cover letter for this job.</p>
        )}
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 animate-pulse">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          {/* Title */}
          <div className="h-5 bg-gray-200 rounded-full w-2/3 mb-3" />
          {/* Company + location */}
          <div className="flex items-center gap-2 mb-4">
            <div className="h-3 bg-gray-200 rounded-full w-24" />
            <div className="h-3 bg-gray-200 rounded-full w-32" />
          </div>
          {/* Skills label */}
          <div className="h-3 bg-gray-200 rounded-full w-28 mb-2" />
          {/* Skill chips */}
          <div className="flex gap-2 mb-4">
            <div className="h-6 bg-gray-200 rounded-full w-16" />
            <div className="h-6 bg-gray-200 rounded-full w-20" />
            <div className="h-6 bg-gray-200 rounded-full w-14" />
          </div>
          {/* AI summary box */}
          <div className="rounded-xl p-4 bg-gray-100">
            <div className="h-3 bg-gray-200 rounded-full w-24 mb-2" />
            <div className="h-3 bg-gray-200 rounded-full w-full mb-1" />
            <div className="h-3 bg-gray-200 rounded-full w-4/5" />
          </div>
        </div>
        {/* Circle score */}
        <div className="w-16 h-16 rounded-full bg-gray-200 shrink-0" />
      </div>
    </div>
  );
}

export default function JobsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [discovering, setDiscovering] = useState(false);
  const [discoverMsg, setDiscoverMsg] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingReqs, setEditingReqs] = useState<{ [id: string]: string[] }>({});
  const [newReqInput, setNewReqInput] = useState<{ [id: string]: string }>({});
  const [recalculating, setRecalculating] = useState<string | null>(null);
  const [ignoredIds, setIgnoredIds] = useState<Set<string>>(new Set());
  const [applyingJobId, setApplyingJobId] = useState<string | null>(null);
  const [applyingSuggestion, setApplyingSuggestion] = useState<Suggestion | null>(null);
  const [activeTab, setActiveTab] = useState<"suggested" | "saved">("suggested");
  const [coverLetterJobId, setCoverLetterJobId] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (session) fetchJobs();
  }, [session]);

  async function fetchJobs() {
    const res = await fetch("/api/jobs");
    const data = await res.json();
    const sorted = (data.jobs || []).sort((a: Job, b: Job) => {
      if (b.matchScore === null) return -1;
      if (a.matchScore === null) return 1;
      return b.matchScore - a.matchScore;
    });
    setJobs(sorted);
    setLoading(false);
  }

  async function discoverJobs() {
    setDiscovering(true);
    setDiscoverMsg("");
    setSuggestions([]);
    setActiveTab("suggested");
    const res = await fetch("/api/jobs/discover", { method: "POST" });
    const data = await res.json();
    if (res.ok) {
      const savedExternalIds = new Set(jobs.map((j) => j.externalId).filter(Boolean));
      const filteredSuggestions = (data.suggestions || []).filter((s: Suggestion) => !savedExternalIds.has(s.externalId));
      const sortedSuggestions = filteredSuggestions.sort((a: Suggestion, b: Suggestion) => {
        if (b.matchScore === null) return -1;
        if (a.matchScore === null) return 1;
        return b.matchScore - a.matchScore;
      });
      setSuggestions(sortedSuggestions);
      setDiscoverMsg(`Found ${sortedSuggestions.length} suggested jobs. Save the ones you like!`);
      setActiveTab("suggested");
    } else {
      setDiscoverMsg(data.error || "Something went wrong.");
    }
    setDiscovering(false);
  }

  async function saveJob(suggestion: Suggestion) {
    const res = await fetch("/api/jobs/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(suggestion),
    });
    if (res.ok) {
      setSavedIds((prev) => new Set([...prev, suggestion.externalId]));
      fetchJobs();
      setTimeout(() => fetchJobs(), 8000);
      setTimeout(() => fetchJobs(), 15000);
    }
  }

  async function recalculateScore(jobId: string) {
    setRecalculating(jobId);
    const res = await fetch(`/api/jobs/${jobId}/recalculate`, { method: "POST" });
    if (res.ok) fetchJobs();
    setRecalculating(null);
  }

  async function ignoreJob(jobId: string) {
    const res = await fetch(`/api/jobs/${jobId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "ignored" }),
    });
    if (res.ok) fetchJobs();
  }

  async function unignoreJob(jobId: string) {
    const res = await fetch(`/api/jobs/${jobId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "saved" }),
    });
    if (res.ok) fetchJobs();
  }

  function handleApplyClick(job: Job, e: React.MouseEvent) {
    e.stopPropagation();
    setTimeout(() => setApplyingJobId(job.id), 500);
  }

  function toggleExpand(id: string) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  function removeReq(jobId: string, req: string) {
    const current = editingReqs[jobId] ?? jobs.find((j) => j.id === jobId)?.requirements ?? [];
    setEditingReqs((prev) => ({ ...prev, [jobId]: current.filter((r) => r !== req) }));
  }

  function addReq(jobId: string) {
    const req = newReqInput[jobId]?.trim();
    if (!req) return;
    const current = editingReqs[jobId] ?? jobs.find((j) => j.id === jobId)?.requirements ?? [];
    setEditingReqs((prev) => ({ ...prev, [jobId]: [...current, req] }));
    setNewReqInput((prev) => ({ ...prev, [jobId]: "" }));
  }

  async function ignoreSuggestion(externalId: string) {
    setIgnoredIds((prev) => new Set([...prev, externalId]));
    const suggestion = suggestions.find((s) => s.externalId === externalId);
    if (suggestion) {
      await fetch("/api/jobs/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...suggestion, status: "ignored" }),
      });
      fetchJobs();
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  const coverLetterJob = jobs.find((j) => j.id === coverLetterJobId);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between h-16 fixed top-0 left-0 right-0 z-40">
        <Link href="/dashboard">
          <img src="/jobfit_logo.png" alt="JobFit" className="h-16 w-auto" />
        </Link>
        <div className="flex items-center gap-6">
          <Link href="/applications" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">Applications</Link>
          <Link href="/resume" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">Resumes</Link>
          <Link href="/jobs" className="text-sm font-medium text-gray-900">Find Jobs</Link>
          <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">Dashboard</Link>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
          >
            Log out
          </button>
        </div>
      </nav>

      <div className={`pt-16 transition-all duration-300 ${coverLetterJobId ? "mr-96" : ""}`}>
        <div className="max-w-4xl mx-auto px-4 py-10">

          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <h1 className="text-4xl font-black text-gray-900 tracking-tight">START SEARCHING</h1>
            <button
              onClick={discoverJobs}
              disabled={discovering}
              className="px-4 py-2 rounded-full text-sm font-medium text-white disabled:opacity-50 transition-colors"
              style={{ background: "linear-gradient(135deg, #F97316, #EC4899)" }}
            >
              {discovering ? "Searching..." : "Find Jobs"}
            </button>
            <Link
              href="/jobs/new"
              className="px-4 py-2 rounded-full text-sm font-medium text-white bg-gray-900 hover:bg-gray-700 transition-colors"
            >
              + Add Job
            </Link>
          </div>

          {discoverMsg && (
            <p className="text-sm text-green-600 mb-6">{discoverMsg}</p>
          )}

          {/* Tabs */}
          <div className="flex gap-1 mb-6 bg-gray-100 rounded-xl p-1 w-fit">
            <button
              onClick={() => setActiveTab("suggested")}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === "suggested"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Suggested for you
              {suggestions.filter((s) => !ignoredIds.has(s.externalId)).length > 0 && (
                <span className="ml-2 px-1.5 py-0.5 rounded-full text-xs text-white" style={{ background: "linear-gradient(135deg, #F97316, #EC4899)" }}>
                  {suggestions.filter((s) => !ignoredIds.has(s.externalId)).length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("saved")}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === "saved"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Saved for you
              {jobs.filter((j) => j.status !== "ignored").length > 0 && (
                <span className="ml-2 px-1.5 py-0.5 rounded-full text-xs bg-gray-200 text-gray-600">
                  {jobs.filter((j) => j.status !== "ignored").length}
                </span>
              )}
            </button>
          </div>

          {/* Suggested tab */}
          {activeTab === "suggested" && (
          <div className="space-y-4">
            {discovering ? (
              // Show 5 skeleton cards while searching
              <>
                {[...Array(5)].map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </>
            ) : suggestions.filter((s) => !ignoredIds.has(s.externalId)).length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
                <p className="text-gray-400 text-sm mb-4">No suggestions yet. Click "Find Jobs" to discover jobs!</p>
                <button
                  onClick={discoverJobs}
                  disabled={discovering}
                  className="px-4 py-2 rounded-full text-sm font-medium text-white disabled:opacity-50"
                  style={{ background: "linear-gradient(135deg, #F97316, #EC4899)" }}
                >
                  Find Jobs
                </button>
              </div>
              ) : (
                suggestions.filter((s) => !ignoredIds.has(s.externalId)).map((s) => (
                  <div key={s.externalId} className="bg-white border border-gray-200 rounded-xl p-6 hover:border-gray-300 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h2 className="text-lg font-bold text-gray-900 mb-1">{s.title}</h2>
                        <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                          <img src="/case.svg" alt="" className="w-4 h-4 opacity-40" />
                          <span>{s.company}</span>
                          {s.location && (
                            <>
                              <span>·</span>
                              <span>{s.location}</span>
                            </>
                          )}
                        </div>

                        {/* Skills */}
                        {s.matchedSkills?.length > 0 && (
                          <div className="mb-3">
                            <p className="text-xs font-bold text-green-600 uppercase tracking-wide mb-2">Matching Skills</p>
                            <div className="flex flex-wrap gap-1.5">
                              {s.matchedSkills.map((skill) => (
                                <span key={skill} className="px-3 py-1 rounded-full text-xs font-medium border border-green-300 text-green-700 bg-green-50">{skill}</span>
                              ))}
                            </div>
                          </div>
                        )}
                        {s.missingSkills?.length > 0 && (
                          <div className="mb-3">
                            <p className="text-xs font-bold text-red-500 uppercase tracking-wide mb-2">Missing Skills</p>
                            <div className="flex flex-wrap gap-1.5">
                              {s.missingSkills.map((skill) => (
                                <span key={skill} className="px-3 py-1 rounded-full text-xs font-medium border border-red-300 text-red-600 bg-red-50">{skill}</span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* AI Summary */}
                        {s.matchReason && (
                          <div className="rounded-xl p-4 mb-4" style={{ background: "linear-gradient(135deg, #FFF7ED, #FDF2F8)" }}>
                            <p className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: "#F97316" }}>AI Summary</p>
                            <p className="text-sm text-gray-700">{s.matchReason}</p>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-2">
                          <button
                            onClick={() => saveJob(s)}
                            disabled={savedIds.has(s.externalId)}
                            className="px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50 transition-colors"
                            style={{ background: "linear-gradient(135deg, #F97316, #EC4899)" }}
                          >
                            {savedIds.has(s.externalId) ? "Saved" : "Save Job"}
                          </button>
                          {s.applicationLink && (
                            <a
                              href={s.applicationLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={() => setTimeout(() => setApplyingSuggestion(s), 500)}
                              className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                              View Full Posting
                            </a>
                          )}
                          <button
                            onClick={() => ignoreSuggestion(s.externalId)}
                            className="px-4 py-2 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
                          >
                            Ignore
                          </button>
                        </div>
                      </div>

                      {/* Circle score */}
                      <div className="shrink-0">
                        <CircleScore score={s.matchScore} />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Saved tab */}
          {activeTab === "saved" && (
            <div className="space-y-4">
              {jobs.filter((job) => job.status !== "ignored").length === 0 ? (
                <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
                  <p className="text-gray-400 text-sm mb-4">No saved jobs yet.</p>
                  <div className="flex gap-2 justify-center">
                    <button onClick={discoverJobs} className="px-4 py-2 rounded-full text-sm font-medium text-white" style={{ background: "linear-gradient(135deg, #F97316, #EC4899)" }}>Find Jobs</button>
                    <Link href="/jobs/new" className="px-4 py-2 rounded-full text-sm font-medium bg-gray-900 text-white hover:bg-gray-700 transition-colors">Add manually</Link>
                  </div>
                </div>
              ) : (
                jobs.filter((job) => job.status !== "ignored").map((job) => (
                  <div key={job.id} className="bg-white border border-gray-200 rounded-xl p-6 hover:border-gray-300 transition-colors">
                    <div
                      className="flex items-start justify-between gap-4 cursor-pointer"
                      onClick={() => toggleExpand(job.id)}
                    >
                      <div className="flex-1 min-w-0">
                        <h2 className="text-lg font-bold text-gray-900 mb-1">{job.title}</h2>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <img src="/case.svg" alt="" className="w-4 h-4 opacity-40" />
                          <span>{job.company}</span>
                          {job.location && (
                            <>
                              <span>·</span>
                              <span>{job.location}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="shrink-0 flex flex-col items-center gap-2">
                        <CircleScore score={job.matchScore} />
                        <span className="text-xs text-gray-400">{expandedId === job.id ? "▲ less" : "▼ more"}</span>
                      </div>
                    </div>

                    {/* Expanded */}
                    {expandedId === job.id && (
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        {/* Skills */}
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          {job.matchedSkills.length > 0 && (
                            <div>
                              <p className="text-xs font-bold text-green-600 uppercase tracking-wide mb-2">Matching Skills</p>
                              <div className="flex flex-wrap gap-1.5">
                                {job.matchedSkills.map((skill) => (
                                  <span key={skill} className="px-3 py-1 rounded-full text-xs font-medium border border-green-300 text-green-700 bg-green-50">{skill}</span>
                                ))}
                              </div>
                            </div>
                          )}
                          {job.missingSkills.length > 0 && (
                            <div>
                              <p className="text-xs font-bold text-red-500 uppercase tracking-wide mb-2">Missing Skills</p>
                              <div className="flex flex-wrap gap-1.5">
                                {job.missingSkills.map((skill) => (
                                  <span key={skill} className="px-3 py-1 rounded-full text-xs font-medium border border-red-300 text-red-600 bg-red-50">{skill}</span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* AI Summary */}
                        {job.matchReason && (
                          <div className="rounded-xl p-4 mb-4" style={{ background: "linear-gradient(135deg, #FFF7ED, #FDF2F8)" }}>
                            <p className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: "#F97316" }}>AI Summary</p>
                            <p className="text-sm text-gray-700">{job.matchReason}</p>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-2 flex-wrap">
                          <button
                            onClick={(e) => { e.stopPropagation(); setCoverLetterJobId(job.id); }}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors"
                            style={{ background: "linear-gradient(135deg, #F97316, #EC4899)" }}
                          >
                            Generate Cover Letter
                          </button>
                          {job.applicationLink && (
                              <a
                                href={job.applicationLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => handleApplyClick(job, e)}
                                className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                              >
                                View Full Posting
                              </a>
                          )}
                          <button
                            onClick={(e) => { e.stopPropagation(); ignoreJob(job.id); }}
                            className="px-4 py-2 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
                          >
                            Ignore
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); recalculateScore(job.id); }}
                            disabled={recalculating === job.id}
                            className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                          >
                            {recalculating === job.id ? "Recalculating..." : "Recalculate Score"}
                          </button>
                        </div>

                        {/* Requirements editor */}
                        <div className="mt-4">
                          <p className="text-xs font-semibold text-gray-500 mb-2">Job requirements</p>
                          <div className="flex flex-wrap gap-1.5 mb-3">
                            {(editingReqs[job.id] ?? job.requirements).map((req) => (
                              <span key={req} className="flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                                {req}
                                <button onClick={() => removeReq(job.id, req)} className="text-gray-400 hover:text-red-500">×</button>
                              </span>
                            ))}
                          </div>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={newReqInput[job.id] || ""}
                              onChange={(e) => setNewReqInput((prev) => ({ ...prev, [job.id]: e.target.value }))}
                              onKeyDown={(e) => e.key === "Enter" && addReq(job.id)}
                              placeholder="Add a requirement..."
                              className="flex-1 px-2 py-1 border border-gray-300 rounded-lg text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-orange-400"
                            />
                            <button onClick={() => addReq(job.id)} className="px-3 py-1 text-white rounded-lg text-xs font-medium" style={{ background: "linear-gradient(135deg, #F97316, #EC4899)" }}>Add</button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}

              {/* Ignored jobs */}
              {jobs.filter((job) => job.status === "ignored").length > 0 && (
                <div className="mt-6">
                  <h3 className="text-sm font-semibold text-gray-400 mb-3">
                    Ignored ({jobs.filter((job) => job.status === "ignored").length})
                  </h3>
                  <div className="space-y-2">
                    {jobs.filter((job) => job.status === "ignored").map((job) => (
                      <div key={job.id} className="bg-white border border-gray-100 rounded-xl p-4 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-500">{job.title}</p>
                          <p className="text-xs text-gray-400">{job.company}</p>
                        </div>
                        <button onClick={() => unignoreJob(job.id)} className="px-3 py-1 text-white rounded-lg text-xs font-medium" style={{ background: "linear-gradient(135deg, #F97316, #EC4899)" }}>
                          Unignore
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Cover letter side panel */}
      {coverLetterJobId && coverLetterJob && (
        <CoverLetterPanel
          jobId={coverLetterJobId}
          initialContent={coverLetterJob.coverLetter}
          onClose={() => setCoverLetterJobId(null)}
        />
      )}

      {/* Apply confirmation popup */}
      {(applyingJobId || applyingSuggestion) && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 shadow-xl max-w-sm w-full mx-4">
            <h3 className="text-base font-semibold text-gray-900 mb-2">Did you apply?</h3>
            <p className="text-sm text-gray-500 mb-6">
              We noticed you visited the job posting. Did you submit an application?
            </p>
            <div className="flex gap-3">
              <button
                onClick={async () => {
                  if (applyingJobId) {
                    await fetch(`/api/jobs/${applyingJobId}/application-status`, {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ applicationStatus: "applied" }),
                    });
                    setApplyingJobId(null);
                    fetchJobs();
                  } else if (applyingSuggestion) {
                    const res = await fetch("/api/jobs/save", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ ...applyingSuggestion, status: "saved" }),
                    });
                    if (res.ok) {
                      const data = await res.json();
                      await fetch(`/api/jobs/${data.job.id}/application-status`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ applicationStatus: "applied" }),
                      });
                    }
                    setApplyingSuggestion(null);
                    fetchJobs();
                  }
                }}
                className="flex-1 text-white py-2 rounded-lg text-sm font-medium transition-colors"
                style={{ background: "linear-gradient(135deg, #F97316, #EC4899)" }}
              >
                Yes, I applied
              </button>
              <button
                onClick={() => { setApplyingJobId(null); setApplyingSuggestion(null); }}
                className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                No, just browsing
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}