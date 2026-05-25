"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";

type ResumeVersion = {
  id: string;
  name: string;
  resumeUrl: string | null;
  createdAt: string;
  skills: string[];
};

export default function ResumePage() {
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [versions, setVersions] = useState<ResumeVersion[]>([]);
  const [loadingVersions, setLoadingVersions] = useState(true);
  const [currentResumeUrl, setCurrentResumeUrl] = useState<string | null>(null);
  const [activating, setActivating] = useState<string | null>(null);

  useEffect(() => {
    fetchVersions();
    fetchCurrentResume();
  }, []);

  async function fetchCurrentResume() {
    const res = await fetch("/api/me");
    const data = await res.json();
    setCurrentResumeUrl(data.resumeUrl || null);
  }

  async function fetchVersions() {
    const res = await fetch("/api/resume/versions");
    const data = await res.json();
    setVersions(data.versions || []);
    setLoadingVersions(false);
  }

  async function handleUpload() {
    if (!file) return setError("Please select a file.");
    if (!name.trim()) return setError("Please give your resume a name.");
    setError("");
    setLoading(true);

    const formData = new FormData();
    formData.append("resume", file);
    formData.append("name", name.trim());

    const res = await fetch("/api/resume/versions", {
      method: "POST",
      body: formData,
    });

    if (res.ok) {
      setSuccess(true);
      setFile(null);
      setName("");
      fetchVersions();
      fetchCurrentResume();
      setTimeout(() => setSuccess(false), 3000);
    } else {
      const data = await res.json();
      setError(data.error || "Something went wrong.");
    }
    setLoading(false);
  }

  async function deleteVersion(id: string) {
    const res = await fetch(`/api/resume/versions/${id}`, { method: "DELETE" });
    if (res.ok) {
      fetchVersions();
      fetchCurrentResume();
    }
  }

  async function activateVersion(version: ResumeVersion) {
    setActivating(version.id);
    const res = await fetch("/api/resume/activate", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resumeVersionId: version.id }),
    });
    if (res.ok) {
      setCurrentResumeUrl(version.resumeUrl);
      fetchVersions();
    }
    setActivating(null);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between h-16">
        <Link href="/dashboard">
          <img src="/jobfit_logo.png" alt="JobFit" className="h-16 w-auto" />
        </Link>
        <div className="flex items-center gap-6">
          <Link href="/applications" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">Applications</Link>
          <Link href="/resume" className="text-sm font-medium text-gray-900">Resumes</Link>
          <Link href="/jobs" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">Find Jobs</Link>
          <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">Dashboard</Link>
          <Link href="/profile" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">Profile</Link>
          <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
            >
              Log out
            </button>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-1">Resume Versions</h1>
          <p className="text-gray-400">Upload and manage multiple resumes here</p>
        </div>

        {/* Upload new version */}
        <div className="mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Upload new version</h2>
          <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">

            {/* Resume name */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Resume Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="File name"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-400 transition-colors"
              />
            </div>

            {/* Upload dropzone */}
            <label className={`flex flex-col items-center justify-center w-full h-48 rounded-xl cursor-pointer transition-colors mb-6 ${
              file
                ? "border-2 border-orange-400 bg-orange-50"
                : "bg-gray-100 hover:bg-gray-200"
            }`}>
              <input
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={(e) => {
                  setFile(e.target.files?.[0] || null);
                  setError("");
                  setSuccess(false);
                }}
              />
              {file ? (
                <>
                  <svg className="w-10 h-10 text-orange-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-sm font-medium text-gray-900">{file.name}</p>
                  <p className="text-xs text-gray-500 mt-1">Click to change file</p>
                </>
              ) : (
                <>
                  <svg className="w-10 h-10 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  <p className="text-sm font-medium text-gray-700">Click to upload your resume</p>
                  <p className="text-xs text-gray-400 mt-1">PDF only</p>
                </>
              )}
            </label>

            {error && <p className="text-sm text-red-500 mb-4">{error}</p>}
            {success && <p className="text-sm text-green-600 mb-4">✓ Resume uploaded successfully!</p>}

            {/* Upload button */}
            <button
              onClick={handleUpload}
              disabled={!file || loading}
              className="w-full py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-50 transition-colors"
              style={{ background: "linear-gradient(135deg, #F97316, #EC4899)" }}
            >
              {loading ? "Uploading..." : "Upload Resume"}
            </button>
          </div>
        </div>

        {/* Existing versions */}
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-4">Your resume versions</h2>
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            {loadingVersions ? (
              <div className="p-6">
                <p className="text-sm text-gray-400">Loading...</p>
              </div>
            ) : versions.length === 0 ? (
              <div className="p-6">
                <p className="text-sm text-gray-400">No resume versions uploaded yet.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {versions.map((v) => {
                  const isCurrent = v.resumeUrl === currentResumeUrl;
                  return (
                    <div
                      key={v.id}
                      className={`flex items-center justify-between px-6 py-4 transition-colors ${
                        isCurrent ? "bg-orange-50" : "hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-gray-900">{v.name}</p>
                          {isCurrent && (
                            <span className="text-xs font-semibold text-green-600">Current</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {new Date(v.createdAt).toLocaleDateString()} · {v.skills.length} skills detected
                        </p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        {!isCurrent && (
                          <button
                            onClick={() => activateVersion(v)}
                            disabled={activating === v.id}
                            className="text-xs font-medium px-3 py-1 rounded-full text-white disabled:opacity-50 transition-colors"
                            style={{ background: "linear-gradient(135deg, #F97316, #EC4899)" }}
                          >
                            {activating === v.id ? "Setting..." : "Set as Current"}
                          </button>
                        )}
                        {v.resumeUrl && (
                          <a
                            href={v.resumeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-500 hover:underline font-medium"
                          >
                            View
                          </a>
                        )}
                        <button
                          onClick={() => deleteVersion(v.id)}
                          className="text-xs text-red-400 hover:text-red-600 transition-colors font-medium"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}