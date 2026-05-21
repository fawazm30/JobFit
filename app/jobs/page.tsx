"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

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

function MatchBadge({ score }: { score: number | null }) {
  if (score === null) return null;
  if (score >= 75) {
    return (
      <span style={{ backgroundColor: "#dcfce7", color: "#15803d" }} className="px-2 py-0.5 rounded-full text-xs font-semibold">
        {score}% match
      </span>
    );
  }
  if (score >= 50) {
    return (
      <span style={{ backgroundColor: "#fef9c3", color: "#a16207" }} className="px-2 py-0.5 rounded-full text-xs font-semibold">
        {score}% match
      </span>
    );
  }
  return (
    <span style={{ backgroundColor: "#fee2e2", color: "#b91c1c" }} className="px-2 py-0.5 rounded-full text-xs font-semibold">
      {score}% match
    </span>
  );
}
function CoverLetterEditor({ jobId, initialContent }: { jobId: string; initialContent: string | null }) {
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
    <div className="mt-4 pt-4 border-t border-gray-100">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold text-gray-500">Cover letter</p>
        <button
          onClick={generate}
          disabled={generating}
          className="px-3 py-1 bg-gray-900 text-white rounded-lg text-xs font-medium hover:bg-gray-700 disabled:opacity-50 transition-colors"
        >
          {generating ? "Generating..." : initialContent ? "Regenerate" : "Generate"}
        </button>
      </div>

      {(editor?.getText() || initialContent) ? (
        <>
          <div className="border border-gray-200 rounded-lg p-3 min-h-32 text-sm text-gray-800 mb-3 [&_.ProseMirror]:outline-none [&_.ProseMirror_p]:mb-3">
            <EditorContent editor={editor} />
          </div>
          <div className="flex gap-2">
            <button
              onClick={save}
              disabled={saving}
              className="px-3 py-1 bg-gray-900 text-white rounded-lg text-xs font-medium hover:bg-gray-700 disabled:opacity-50 transition-colors"
            >
              {saving ? "Saving..." : saved ? "Saved!" : "Save"}
            </button>
            <button
              onClick={downloadDocx}
              className="px-3 py-1 border border-gray-300 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-50 transition-colors"
            >
              Download .docx
            </button>
          </div>
        </>
      ) : (
        <p className="text-xs text-gray-400">Click Generate to create a cover letter for this job.</p>
      )}
    </div>
  );
}

function JobRequirements({
  jobId, requirements, editingReqs, newReqInput, onAddReq, onRemoveReq, onReqInput, onRecalculate, recalculating, matchedSkills, missingSkills, interestMatch, coverLetter
}: {
  jobId: string; 
  requirements: string[]; 
  editingReqs: { [id: string]: string[] }; 
  newReqInput: { [id: string]: string };
  onAddReq: (id: string) => void; 
  onRemoveReq: (id: string, req: string) => void; 
  onReqInput: (id: string, val: string) => void;
  onRecalculate: (id: string) => void; 
  recalculating: string | null; 
  matchedSkills: string[]; 
  missingSkills: string[]; 
  interestMatch: string | null;
  coverLetter: string | null;
}) {
  const currentReqs = editingReqs[jobId] ?? requirements;
  return (
    <div className="mt-4 pt-4 border-t border-gray-100">
      <p className="text-xs font-semibold text-gray-500 mb-2">Job requirements</p>
      <div className="flex flex-wrap gap-1.5 mb-3">
        {currentReqs.length === 0 ? (
          <p className="text-xs text-gray-400">No requirements extracted.</p>
        ) : (
          currentReqs.map((req) => (
            <span key={req} className="flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
              {req}
              <button onClick={() => onRemoveReq(jobId, req)} className="text-gray-400 hover:text-red-500 transition-colors">x</button>
            </span>
          ))
        )}
      </div>
      {matchedSkills.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-xs font-semibold text-green-600 mb-1">Matched skills</p>
          <div className="flex flex-wrap gap-1.5">
            {matchedSkills.map((skill) => (
              <span key={skill} style={{ backgroundColor: "#dcfce7", color: "#15803d" }} className="px-2 py-1 rounded-full text-xs font-medium">{skill}</span>
            ))}
          </div>
        </div>
      )}
      {missingSkills.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-xs font-semibold text-red-600 mb-1">Missing skills</p>
          <div className="flex flex-wrap gap-1.5">
            {missingSkills.map((skill) => (
              <span key={skill} style={{ backgroundColor: "#fee2e2", color: "#b91c1c" }} className="px-2 py-1 rounded-full text-xs font-medium">{skill}</span>
            ))}
          </div>
        </div>
      )}
      {interestMatch && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-xs font-semibold text-gray-500 mb-1">Interest match</p>
          <p className="text-xs text-gray-600">{interestMatch}</p>
        </div>
      )}
      <div className="mt-4 flex items-center justify-between gap-2">
        <button onClick={() => onRecalculate(jobId)} disabled={recalculating === jobId} className="px-3 py-1 bg-gray-900 text-white rounded-lg text-xs font-medium hover:bg-gray-700 disabled:opacity-50 transition-colors">
          {recalculating === jobId ? "Recalculating..." : "Recalculate score"}
        </button>
      </div>
      <div className="flex gap-2 mt-3">
        <input type="text" value={newReqInput[jobId] || ""} onChange={(e) => onReqInput(jobId, e.target.value)} onKeyDown={(e) => e.key === "Enter" && onAddReq(jobId)} placeholder="Add a requirement..." className="flex-1 px-2 py-1 border border-gray-300 rounded-lg text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900" />
        <button onClick={() => onAddReq(jobId)} className="px-3 py-1 bg-gray-900 text-white rounded-lg text-xs font-medium hover:bg-gray-700 transition-colors">Add</button>
      </div>
      <CoverLetterEditor jobId={jobId} initialContent={coverLetter} />
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
    // Let the link open naturally via target="_blank"
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

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <Link href="/dashboard" className="text-lg font-semibold text-gray-900">JobFit</Link>
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-900">Dashboard</Link>
          <Link href="/resume" className="text-sm text-gray-500 hover:text-gray-900">Resume</Link>
          <Link href="/applications" className="text-sm text-gray-500 hover:text-gray-900">Applications</Link>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Jobs</h1>
            <p className="text-sm text-gray-500 mt-1">{jobs.length} job{jobs.length !== 1 ? "s" : ""} saved</p>
          </div>
          <div className="flex gap-2">
            <button onClick={discoverJobs} disabled={discovering} className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors">
              {discovering ? "Searching..." : "Find jobs for me"}
            </button>
            <Link href="/jobs/new" className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors">+ Add job</Link>
          </div>
        </div>

        {discoverMsg && <p className="text-sm text-green-600 mb-6">{discoverMsg}</p>}

        {/* Suggested jobs section */}
        {suggestions.length > 0 && (
          <div className="mb-10">
            <h2 className="text-base font-semibold text-gray-900 mb-3">Suggested for you</h2>
            <div className="space-y-3">
              {suggestions.filter((s) => !ignoredIds.has(s.externalId)).map((s) => (
                <div key={s.externalId} className="bg-white border border-blue-100 rounded-xl p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h2 className="text-sm font-semibold text-gray-900">{s.title}</h2>
                        <MatchBadge score={s.matchScore} />
                        <span style={{ backgroundColor: "#dbeafe", color: "#1d4ed8" }} className="px-2 py-0.5 rounded-full text-xs font-medium">Suggested</span>
                      </div>
                      <p className="text-sm text-gray-600">{s.company}</p>
                      {s.location && <p className="text-xs text-gray-400 mt-0.5">{s.location}</p>}
                      {s.matchReason && <p className="text-xs text-gray-500 mt-2 italic">{s.matchReason}</p>}
                      {s.requirements.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {s.requirements.slice(0, 5).map((req) => (
                            <span key={req} className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">{req}</span>
                          ))}
                          {s.requirements.length > 5 && <span className="px-2 py-1 text-gray-400 text-xs">+{s.requirements.length - 5} more</span>}
                        </div>
                      )}
                      {(s.matchedSkills || []).length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {s.matchedSkills.map((skill) => <span key={skill} className="px-2 py-1 bg-green-100 text-green-600 rounded-full text-xs">{skill}</span>)}
                        </div>
                      )}
                      {(s.missingSkills || []).length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {s.missingSkills.map((skill) => <span key={skill} className="px-2 py-1 bg-red-100 text-red-600 rounded-full text-xs">{skill}</span>)}
                        </div>
                      )}
                      {(s.matchedSkills || []).length === 0 && (s.missingSkills || []).length === 0 && (
                        <p className="text-xs text-gray-400 mt-2 italic">No skill match data available.</p>
                      )}
                      {!s.interestMatch && <p className="text-xs text-gray-400 mt-2 italic">No location/job type match data available.</p>}
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      {s.applicationLink && (
                        <a
                          href={s.applicationLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => {
                            setTimeout(() => setApplyingSuggestion(s), 500);
                          }}
                          className="text-xs text-blue-600 hover:underline"
                        >
                          View posting
                        </a>
                      )}
                      <button onClick={() => saveJob(s)} disabled={savedIds.has(s.externalId)} className="px-3 py-1 bg-gray-900 text-white rounded-lg text-xs font-medium hover:bg-gray-700 disabled:opacity-50 transition-colors">
                        {savedIds.has(s.externalId) ? "Saved" : "Save"}
                      </button>
                      <button onClick={() => ignoreSuggestion(s.externalId)} disabled={ignoredIds.has(s.externalId)} className="px-3 py-1 bg-red-100 text-red-600 rounded-lg text-xs font-medium hover:bg-red-200 disabled:opacity-50 transition-colors">
                        {ignoredIds.has(s.externalId) ? "Ignored" : "Ignore"}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Saved jobs section */}
        <h2 className="text-base font-semibold text-gray-900 mb-3">Saved jobs</h2>
        {jobs.filter((job) => job.status !== "ignored").length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
            <p className="text-gray-400 text-sm mb-4">No saved jobs yet.</p>
            <div className="flex gap-2 justify-center">
              <button onClick={discoverJobs} className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">Find jobs for me</button>
              <Link href="/jobs/new" className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors">Add manually</Link>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {jobs.filter((job) => job.status !== "ignored").map((job) => (
              <div key={job.id} className="bg-white border border-gray-200 rounded-xl p-5 hover:border-gray-300 transition-colors">
                <div className="flex items-start justify-between gap-4 cursor-pointer" onClick={() => toggleExpand(job.id)}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h2 className="text-sm font-semibold text-gray-900">{job.title}</h2>
                      <MatchBadge score={job.matchScore} />
                    </div>
                    <p className="text-sm text-gray-600">{job.company}</p>
                    {job.location && <p className="text-xs text-gray-400 mt-0.5">{job.location}</p>}
                    {job.matchReason && <p className="text-xs text-gray-500 mt-2 italic">{job.matchReason}</p>}
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    {job.applicationLink && (
                      <a
                        href={job.applicationLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => handleApplyClick(job, e)}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        Apply
                      </a>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); ignoreJob(job.id); }}
                      className="px-3 py-1 bg-red-100 text-red-600 rounded-lg text-xs font-medium hover:bg-red-200 transition-colors"
                    >
                      {job.status === "ignored" ? "Ignored" : "Ignore"}
                    </button>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      job.status === "applied" ? "bg-blue-100 text-blue-700" :
                      job.status === "interviewing" ? "bg-purple-100 text-purple-700" :
                      job.status === "offered" ? "bg-green-100 text-green-700" :
                      job.status === "rejected" ? "bg-red-100 text-red-700" :
                      "bg-gray-100 text-gray-600"
                    }`}>
                      {job.status}
                    </span>
                    <span className="text-xs text-gray-400">{expandedId === job.id ? "▲" : "▼"}</span>
                  </div>
                </div>
                {expandedId === job.id && (
                  <JobRequirements
                    jobId={job.id}
                    requirements={job.requirements}
                    editingReqs={editingReqs}
                    newReqInput={newReqInput}
                    onAddReq={addReq}
                    onRemoveReq={removeReq}
                    onReqInput={(id, val) => setNewReqInput((prev) => ({ ...prev, [id]: val }))}
                    onRecalculate={recalculateScore}
                    recalculating={recalculating}
                    matchedSkills={job.matchedSkills}
                    missingSkills={job.missingSkills}
                    interestMatch={job.interestMatch}
                    coverLetter={job.coverLetter}
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Ignored jobs section */}
        {jobs.filter((job) => job.status === "ignored").length > 0 && (
          <div className="mt-10">
            <h2 className="text-base font-semibold text-gray-400 mb-3">
              Ignored jobs ({jobs.filter((job) => job.status === "ignored").length})
            </h2>
            <div className="space-y-2">
              {jobs.filter((job) => job.status === "ignored").map((job) => (
                <div key={job.id} className="bg-white border border-gray-100 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">{job.title}</p>
                    <p className="text-xs text-gray-400">{job.company}</p>
                  </div>
                  <button onClick={() => unignoreJob(job.id)} className="px-3 py-1 bg-gray-900 text-white rounded-lg text-xs font-medium hover:bg-gray-700 transition-colors">
                    Unignore
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

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
                className="flex-1 bg-gray-900 text-white py-2 rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors"
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