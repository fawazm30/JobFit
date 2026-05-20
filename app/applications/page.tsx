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
};

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  interested: { bg: "#dbeafe", color: "#1d4ed8" },
  applied: { bg: "#fef9c3", color: "#a16207" },
  interview: { bg: "#f3e8ff", color: "#7e22ce" },
  rejected: { bg: "#fee2e2", color: "#b91c1c" },
  offer: { bg: "#dcfce7", color: "#15803d" },
  ghosted: { bg: "#f3f4f6", color: "#6b7280" },
};

export default function ApplicationsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [applications, setApplications] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (session) fetchApplications();
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

  const filteredApplications = applications.filter(
    (job) => filterStatus === "all" || job.applicationStatus === filterStatus
  );

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
        <Link href="/dashboard" className="text-lg font-semibold text-gray-900">
          JobFit
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-900">
            Dashboard
          </Link>
          <Link href="/jobs" className="text-sm text-gray-500 hover:text-gray-900">
            Jobs
          </Link>
          <Link href="/resume" className="text-sm text-gray-500 hover:text-gray-900">
            Resume
          </Link>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">My Applications</h1>
            <p className="text-sm text-gray-500 mt-1">
              {applications.length} application{applications.length !== 1 ? "s" : ""}
            </p>
          </div>
          <Link
            href="/jobs/new?from=applications"
            className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors"
          >
            + Add application
          </Link>
        </div>

        {/* Filter */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {["all", "interested", "applied", "interview", "rejected", "offer", "ghosted"].map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                filterStatus === s
                  ? "bg-gray-900 text-white border-gray-900"
                  : "bg-white text-gray-600 border-gray-300 hover:border-gray-400"
              }`}
            >
              {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        {/* Applications list */}
        {filteredApplications.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
            <p className="text-gray-400 text-sm mb-4">
              {filterStatus === "all" ? "No applications yet." : `No ${filterStatus} applications.`}
            </p>
            <Link
              href="/jobs/new?from=applications"
              className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors"
            >
              Add your first application
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredApplications.map((job) => {
              const statusColor = STATUS_COLORS[job.applicationStatus || ""] || { bg: "#f3f4f6", color: "#6b7280" };
              return (
                <div key={job.id} className="bg-white border border-gray-200 rounded-xl p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h2 className="text-sm font-semibold text-gray-900">{job.title}</h2>
                        {job.applicationStatus && (
                          <span
                            style={{ backgroundColor: statusColor.bg, color: statusColor.color }}
                            className="px-2 py-0.5 rounded-full text-xs font-semibold"
                          >
                            {job.applicationStatus.charAt(0).toUpperCase() + job.applicationStatus.slice(1)}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">{job.company}</p>
                      {job.location && (
                        <p className="text-xs text-gray-400 mt-0.5">{job.location}</p>
                      )}
                      {job.matchScore !== null && (
                        <p className="text-xs text-gray-500 mt-1">{job.matchScore}% match</p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      {job.applicationLink && (
                        <a
                          href={job.applicationLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:underline"
                        >
                          View posting
                        </a>
                      )}
                      <select
                        value={job.applicationStatus || ""}
                        onChange={(e) => updateStatus(job.id, e.target.value)}
                        className="text-xs border border-gray-300 rounded-lg px-2 py-1 text-gray-700 focus:outline-none focus:ring-1 focus:ring-gray-900"
                      >
                        <option value="">Set status</option>
                        <option value="interested">Interested</option>
                        <option value="applied">Applied</option>
                        <option value="interview">Interview</option>
                        <option value="rejected">Rejected</option>
                        <option value="offer">Offer</option>
                        <option value="ghosted">Ghosted</option>
                      </select>
                      <button
                        onClick={() => removeApplication(job.id)}
                        className="text-xs text-red-400 hover:text-red-600 transition-colors"
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