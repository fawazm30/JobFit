"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ResumePage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  async function handleUpload() {
    if (!file) return setError("Please select a file.");
    setError("");
    setLoading(true);

    const formData = new FormData();
    formData.append("resume", file);

    const res = await fetch("/api/resume", {
      method: "POST",
      body: formData,
    });

    if (res.ok) {
      setSuccess(true);
      setTimeout(() => router.push("/dashboard"), 1500);
    } else {
      const data = await res.json();
      setError(data.error || "Something went wrong.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-12">
      <div className="max-w-xl mx-auto">
        <h1 className="text-3xl font-semibold text-gray-900 mb-2">Upload your resume</h1>
        <p className="text-gray-500 mb-8">PDF format only. We'll extract your skills and experience automatically.</p>

        <div className="bg-white border border-gray-200 rounded-xl p-8">
          <label
            className={`flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
              file ? "border-gray-900 bg-gray-50" : "border-gray-300 hover:border-gray-400"
            }`}
          >
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
          {success && <p className="text-sm text-green-600 mt-4">✓ Resume uploaded successfully! Redirecting...</p>}

          <button
            onClick={handleUpload}
            disabled={!file || loading}
            className="w-full mt-6 bg-gray-900 text-white py-3 rounded-xl text-sm font-medium hover:bg-gray-700 disabled:opacity-50 transition-colors"
          >
            {loading ? "Uploading..." : "Upload resume"}
          </button>
        </div>
      </div>
    </div>
  );
}