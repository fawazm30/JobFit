"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

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
  matchedSkills: string[];
  missingSkills: string[];
  interestMatch: string | null;
  status: string;
  applicationStatus: string | null;
  createdAt: string;
  externalId?: string | null;
  resumeVersionId: string | null;
};

type ResumeVersion = {
  id: string;
  name: string;
};

const STATUSES = ["all", "interested", "applied", "interview", "offer", "rejected", "ghosted"];

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  interested: { bg: "#dbeafe", color: "#1d4ed8" },
  applied: { bg: "#FFE8CC", color: "#92400e" },
  interview: { bg: "#dcfce7", color: "#15803d" },
  rejected: { bg: "#fee2e2", color: "#b91c1c" },
  offer: { bg: "#f3e8ff", color: "#7e22ce" },
  ghosted: { bg: "#f3f4f6", color: "#6b7280" },
};

function CircleScore({ score }: { score: number | null }) {
  if (score === null) return (
    <div className="flex flex-col items-center gap-1">
      <div className="w-16 h-16 rounded-full border-4 border-gray-200 flex items-center justify-center">
        <span className="text-xs text-gray-400">N/A</span>
      </div>
      <span className="text-xs text-gray-400">Match Score</span>
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
            stroke="url(#appScoreGradient)" strokeWidth="5"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
          />
          <defs>
            <linearGradient id="appScoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
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

export default function ApplicationsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [applications, setApplications] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [resumeVersions, setResumeVersions] = useState<ResumeVersion[]>([]);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetchApplications();
      fetchVersions();
    }
  }, [session]);

  async function fetchApplications() {
    setLoading(true);
    const res = await fetch("/api/applications");
    const data = await res.json();
    setApplications(data.applications || []);
    setLoading(false);
  }

  async function updateStatus(jobId: string, applicationStatus: string) {
    const res = await fetch(`/api/jobs/${jobId}/application-status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ applicationStatus }),
    });
    if (res.ok) fetchApplications();
  }

  async function removeApplication(jobId: string) {
    const res = await fetch(`/api/jobs/${jobId}/application-status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ applicationStatus: null }),
    });
    if (res.ok) fetchApplications();
  }

  async function fetchVersions() {
    const res = await fetch("/api/resume/versions");
    const data = await res.json();
    setResumeVersions(data.versions || []);
  }

  async function updateResumeVersion(jobId: string, resumeVersionId: string) {
    const res = await fetch(`/api/jobs/${jobId}/resume-version`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resumeVersionId }),
    });
    if (res.ok) fetchApplications();
  }

  const filteredApplications = applications.filter(
    (job) => filterStatus === "all" || job.applicationStatus === filterStatus
  );

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

  return (
    <div className="min-h-screen bg-gray-50 pt-16">

      <div className="max-w-4xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">My Applications</h1>
          <Link
            href="/jobs/new?from=applications"
            className="px-5 py-2.5 bg-gray-900 text-white rounded-full text-sm font-medium hover:bg-gray-700 transition-colors"
          >
            + Add Application
          </Link>
        </div>
        <p className="text-gray-400 text-sm mb-6">
          {applications.length} Application{applications.length !== 1 ? "s" : ""}
        </p>

        {/* Status filter pills */}
        <div className="flex gap-2 mb-8 flex-wrap">
          {STATUSES.map((s) => {
            const isActive = filterStatus === s;
            const statusColor = STATUS_COLORS[s];
            return (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className="px-4 py-1.5 rounded-full text-sm font-medium transition-all"
                style={
                  isActive
                    ? s === "all"
                      ? { background: "linear-gradient(135deg, #F97316, #EC4899)", color: "white" }
                      : { backgroundColor: statusColor?.bg, color: statusColor?.color, fontWeight: 700 }
                    : { backgroundColor: statusColor ? `${statusColor.bg}80` : "#f3f4f680", color: statusColor ? `${statusColor.color}80` : "#6b728080" }
                }
              >
                {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            );
          })}
        </div>

        {/* Applications list */}
        {filteredApplications.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
            <p className="text-gray-400 text-sm mb-4">
              {filterStatus === "all" ? "No applications yet." : `No ${filterStatus} applications.`}
            </p>
            <Link
              href="/jobs/new?from=applications"
              className="px-4 py-2 rounded-full text-sm font-medium text-white"
              style={{ background: "linear-gradient(135deg, #F97316, #EC4899)" }}
            >
              Add your first application
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredApplications.map((job) => {
              const statusColor = STATUS_COLORS[job.applicationStatus || ""] || { bg: "#f3f4f6", color: "#6b7280" };
              const assignedResume = resumeVersions.find((v) => v.id === job.resumeVersionId);

              return (
                <div key={job.id} className="bg-white border border-gray-200 rounded-xl p-6 hover:border-gray-300 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    {/* Left: info + circle score */}
                    <div className="flex gap-4 items-start">
                      <div className="shrink-0">
                        <CircleScore score={job.matchScore} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h2 className="text-lg font-bold text-gray-900">{job.title}</h2>
                          {job.applicationStatus && (
                            <span
                              style={{ backgroundColor: statusColor.bg, color: statusColor.color }}
                              className="px-3 py-0.5 rounded-full text-xs font-bold"
                            >
                              {job.applicationStatus.charAt(0).toUpperCase() + job.applicationStatus.slice(1)}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">{job.company}</p>
                        {job.location && (
                          <p className="text-xs text-gray-400 mt-0.5">{job.location}</p>
                        )}
                      </div>
                    </div>

                    {/* Right: actions */}
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      {job.applicationLink && (
                        <a
                          href={job.applicationLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-500 hover:underline font-medium"
                        >
                          View posting
                        </a>
                      )}

                      {/* Status dropdown */}
                      <select
                        value={job.applicationStatus || ""}
                        onChange={(e) => updateStatus(job.id, e.target.value)}
                        className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 text-gray-700 focus:outline-none focus:ring-1 focus:ring-orange-400 bg-white min-w-32"
                      >
                        <option value="">Set status</option>
                        <option value="interested">Interested</option>
                        <option value="applied">Applied</option>
                        <option value="interview">Interview</option>
                        <option value="offer">Offer</option>
                        <option value="rejected">Rejected</option>
                        <option value="ghosted">Ghosted</option>
                      </select>

                      {/* Resume version dropdown */}
                      <select
                        value={job.resumeVersionId || ""}
                        onChange={(e) => updateResumeVersion(job.id, e.target.value)}
                        className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 text-gray-700 focus:outline-none focus:ring-1 focus:ring-orange-400 bg-white min-w-32"
                      >
                        <option value="">No resume assigned</option>
                        {resumeVersions.map((v) => (
                          <option key={v.id} value={v.id}>{v.name}</option>
                        ))}
                      </select>

                      {/* Remove */}
                      <button
                        onClick={() => removeApplication(job.id)}
                        className="text-xs text-red-400 hover:text-red-600 transition-colors font-medium"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}