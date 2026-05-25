"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

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
  const router = useRouter();

  useEffect(() => {
    fetchVersions();
  }, []);

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
      setTimeout(() => setSuccess(false), 3000);
    } else {
      const data = await res.json();
      setError(data.error || "Something went wrong.");
    }
    setLoading(false);
  }

  async function deleteVersion(id: string) {
    const res = await fetch(`/api/resume/versions/${id}`, { method: "DELETE" });
    if (res.ok) fetchVersions();
  }

  return (
    <div className="min-h-screen bg-gray-50">
  <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between h-16">
    <Link href="/dashboard">
      <img src="/jobfit_logo.png" alt="JobFit" className="h-16 w-auto" />
    </Link>
    <div className="flex items-center gap-4">
      <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">Dashboard</Link>
      <Link href="/jobs" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">Jobs</Link>
      <Link href="/applications" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">Applications</Link>
    </div>
  </nav>

  <div className="max-w-xl mx-auto px-4 py-12">

        {/* Upload new version */}
        <div className="bg-white border border-gray-200 rounded-xl p-8 mb-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Upload new version</h2>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Resume name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Software Developer Resume"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>

          <label className={`flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
            file ? "border-gray-900 bg-gray-50" : "border-gray-300 hover:border-gray-400"
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
                <span className="text-2xl mb-2">📄</span>
                <p className="text-sm font-medium text-gray-900">{file.name}</p>
                <p className="text-xs text-gray-500 mt-1">Click to change file</p>
              </>
            ) : (
              <>
                <span className="text-2xl mb-2">⬆️</span>
                <p className="text-sm font-medium text-gray-700">Click to upload your resume</p>
                <p className="text-xs text-gray-500 mt-1">PDF only</p>
              </>
            )}
          </label>

          {error && <p className="text-sm text-red-500 mt-4">{error}</p>}
          {success && <p className="text-sm text-green-600 mt-4">✓ Resume uploaded successfully!</p>}

          <button
            onClick={handleUpload}
            disabled={!file || loading}
            className="w-full mt-6 bg-gray-900 text-white py-3 rounded-xl text-sm font-medium hover:bg-gray-700 disabled:opacity-50 transition-colors"
          >
            {loading ? "Uploading..." : "Upload resume"}
          </button>
        </div>

        {/* Existing versions */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Your resume versions</h2>
          {loadingVersions ? (
            <p className="text-sm text-gray-400">Loading...</p>
          ) : versions.length === 0 ? (
            <p className="text-sm text-gray-400">No resume versions uploaded yet.</p>
          ) : (
            <div className="space-y-3">
              {versions.map((v) => (
                <div key={v.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{v.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(v.createdAt).toLocaleDateString()} · {v.skills.length} skills detected
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {v.resumeUrl && (
                      <a
                        href={v.resumeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline"
                      >
                        View
                      </a>
                    )}
                    <button
                      onClick={() => deleteVersion(v.id)}
                      className="text-xs text-red-400 hover:text-red-600 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}