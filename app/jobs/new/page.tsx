"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NewJobPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    title: "",
    company: "",
    location: "",
    description: "",
    applicationLink: "",
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!form.title || !form.company || !form.description) {
      return setError("Title, company, and description are required.");
    }

    setLoading(true);

    const res = await fetch("/api/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (res.ok) {
      router.push("/jobs");
    } else {
      const data = await res.json();
      setError(data.error || "Something went wrong.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="max-w-2xl mx-auto px-4 py-10">

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/jobs"
            className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <img
              src="/back_arrow.svg"
              alt="Back"
              className="w-5 h-5"
              style={{ filter: "invert(48%) sepia(79%) saturate(2476%) hue-rotate(330deg) brightness(118%) contrast(119%)" }}
            />
          </Link>
          <div>
            <h1 className="text-4xl font-black text-gray-900 tracking-tight">Add a Job</h1>
            <p className="text-gray-400 text-sm mt-1">Paste a job posting and we'll score it against your resume.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-5 shadow-sm">

            {/* Job title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Job title <span className="text-red-400">*</span></label>
              <input
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="e.g. Software Developer"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-400 transition-colors"
              />
            </div>

            {/* Company */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Company <span className="text-red-400">*</span></label>
              <input
                name="company"
                value={form.company}
                onChange={handleChange}
                placeholder="e.g. Acme Corp"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-400 transition-colors"
              />
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
              <input
                name="location"
                value={form.location}
                onChange={handleChange}
                placeholder="e.g. Calgary, AB or Remote"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-400 transition-colors"
              />
            </div>

            {/* Application link */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Application link</label>
              <input
                name="applicationLink"
                value={form.applicationLink}
                onChange={handleChange}
                placeholder="https://..."
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-400 transition-colors"
              />
            </div>

            {/* Job description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Job description <span className="text-red-400">*</span></label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Paste the full job description here..."
                rows={10}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-400 transition-colors resize-none"
              />
            </div>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-3 rounded-xl text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 rounded-xl text-sm font-bold text-white disabled:opacity-50 transition-colors"
              style={{ background: "linear-gradient(135deg, #F97316, #EC4899)" }}
            >
              {loading ? "Saving & scoring..." : "Save job"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}