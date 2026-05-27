/**
 * @file app/onboarding/page.tsx
 * @description Multi-step onboarding wizard for new users. Collects industry
 * preferences, preferred locations, job types, and an optional resume upload
 * across four sequential steps.
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const INDUSTRIES = [
  "Technology", "Healthcare", "Education", "Finance & Banking",
  "Legal", "Engineering", "Trades & Construction", "Social Services",
  "Marketing & Communications", "Retail & Hospitality",
  "Government & Public Service", "Arts & Media", "Science & Research",
  "Transportation & Logistics", "Other",
];

const PROVINCES: Record<string, string[]> = {
  "Alberta": ["Edmonton", "Calgary", "Red Deer", "Lethbridge", "Medicine Hat"],
  "British Columbia": ["Vancouver", "Victoria", "Kelowna", "Burnaby", "Surrey"],
  "Ontario": ["Toronto", "Ottawa", "Mississauga", "Brampton", "Hamilton"],
  "Quebec": ["Montreal", "Quebec City", "Laval", "Gatineau", "Longueuil"],
  "Manitoba": ["Winnipeg", "Brandon", "Steinbach"],
  "Saskatchewan": ["Saskatoon", "Regina", "Prince Albert"],
  "Nova Scotia": ["Halifax", "Sydney", "Truro"],
  "New Brunswick": ["Moncton", "Fredericton", "Saint John"],
  "Newfoundland": ["St. John's", "Corner Brook"],
  "PEI": ["Charlottetown", "Summerside"],
};

const SPECIAL_LOCATIONS = ["Remote", "Canada-wide"];

const JOB_TYPES = [
  { value: "internship", label: "Internship", icon: "/intern.svg" },
  { value: "co-op", label: "Co-op", icon: "/coop.svg" },
  { value: "part-time", label: "Part-time", icon: "/part_time.svg" },
  { value: "full-time", label: "Full-time", icon: "/case.svg" },
  { value: "new-grad", label: "New Grad", icon: "/new_grad.svg" },
  { value: "contract", label: "Contract", icon: "/contract.svg" },
  { value: "volunteer", label: "Volunteer", icon: "/volunteer.svg" },
];

const STEPS = ["Industry", "Location", "Job Type", "Resume"];

/**
 * Four-step onboarding wizard: Industry → Location → Job Type → Resume upload.
 * @returns {JSX.Element} The onboarding flow with progress bar and step content
 */
export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);
  const [jobTitle, setJobTitle] = useState("");
  const [expandedProvince, setExpandedProvince] = useState<string | null>(null);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [jobTypes, setJobTypes] = useState<string[]>([]);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeName, setResumeName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  /**
   * Toggles a single industry in the selectedIndustries list.
   * @param {string} val - The industry label to add or remove
   */
  function toggleIndustry(val: string) {
    setSelectedIndustries((prev) =>
      prev.includes(val) ? prev.filter((v) => v !== val) : [...prev, val]
    );
  }

  /**
   * Toggles a single location in the selectedLocations list.
   * @param {string} val - The city or special location label to add or remove
   */
  function toggleLocation(val: string) {
    setSelectedLocations((prev) =>
      prev.includes(val) ? prev.filter((v) => v !== val) : [...prev, val]
    );
  }

  /**
   * Toggles a single job type in the jobTypes list.
   * @param {string} val - The job type value to add or remove
   */
  function toggleJobType(val: string) {
    setJobTypes((prev) =>
      prev.includes(val) ? prev.filter((v) => v !== val) : [...prev, val]
    );
  }

  /**
   * Advances to the next step after validating the current step's selection.
   * Sets an error message if the required selection is empty.
   */
  function nextStep() {
    setError("");
    if (step === 0 && selectedIndustries.length === 0) {
      return setError("Please select at least one industry.");
    }
    if (step === 1 && selectedLocations.length === 0) {
      return setError("Please select at least one location.");
    }
    if (step === 2 && jobTypes.length === 0) {
      return setError("Please select at least one job type.");
    }
    setStep((s) => s + 1);
  }

  /**
   * Submits onboarding preferences and optionally uploads a resume, then
   * redirects to the dashboard.
   * @returns {Promise<void>}
   */
  async function handleSubmit() {
    setError("");
    setLoading(true);

    const res = await fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        industries: selectedIndustries,
        jobTitles: [jobTitle.trim()],
        locations: selectedLocations,
        jobTypes,
      }),
    });

    if (!res.ok) {
      setError("Something went wrong. Please try again.");
      setLoading(false);
      return;
    }

    if (resumeFile) {
      const formData = new FormData();
      formData.append("resume", resumeFile);
      formData.append("name", resumeName.trim() || "My Resume");
      await fetch("/api/resume/versions", { method: "POST", body: formData });
    }

    router.push("/dashboard");
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Logo */}
      <div className="flex justify-center pt-8 pb-4">
        <Link href="/">
          <img src="/jobfit_logo.png" alt="JobFit" className="h-20 w-auto" />
        </Link>
      </div>

      {/* Progress bar */}
      <div className="max-w-lg mx-auto w-full px-4 mb-8">
        <div className="flex items-center justify-between mb-2">
          {STEPS.map((label, i) => (
            <div key={label} className="flex flex-col items-center gap-1 flex-1">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                style={
                  i < step
                    ? { background: "linear-gradient(135deg, #F97316, #EC4899)", color: "white" }
                    : i === step
                    ? { background: "linear-gradient(135deg, #F97316, #EC4899)", color: "white", boxShadow: "0 0 0 4px rgba(249,115,22,0.2)" }
                    : { backgroundColor: "#e5e7eb", color: "#9ca3af" }
                }
              >
                {i < step ? "✓" : i + 1}
              </div>
              <span className={`text-xs font-medium ${i === step ? "text-gray-900" : "text-gray-400"}`}>
                {label}
              </span>
            </div>
          ))}
        </div>
        {/* Progress line */}
        <div className="relative h-1 bg-gray-200 rounded-full mt-1">
          <div
            className="absolute left-0 top-0 h-1 rounded-full transition-all duration-500"
            style={{
              width: `${(step / (STEPS.length - 1)) * 100}%`,
              background: "linear-gradient(135deg, #F97316, #EC4899)"
            }}
          />
        </div>
      </div>

      {/* Content */}
      <div className="max-w-lg mx-auto w-full px-4 flex-1">

        {/* Step 0 — Industry */}
        {step === 0 && (
          <div>
            <h1 className="text-3xl font-black text-gray-900 mb-1 tracking-tight">What industry are you in?</h1>
            <p className="text-gray-400 text-sm mb-6">Select all that apply.</p>

            <div className="flex flex-wrap gap-2 mb-6">
              {INDUSTRIES.map((ind) => (
                <button
                  key={ind}
                  onClick={() => toggleIndustry(ind)}
                  className="px-4 py-2 rounded-full text-sm font-medium transition-all"
                  style={
                    selectedIndustries.includes(ind)
                      ? { background: "linear-gradient(135deg, #F97316, #EC4899)", color: "white" }
                      : { backgroundColor: "white", color: "#4b5563", border: "1px solid #e5e7eb" }
                  }
                >
                  {ind}
                </button>
              ))}
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Job title <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                type="text"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="e.g. Software Developer, Registered Nurse"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
              <p className="text-xs text-gray-400 mt-2">Leave blank to find jobs based on your resume and industry.</p>
            </div>
          </div>
        )}

        {/* Step 1 — Location */}
        {step === 1 && (
          <div>
            <h1 className="text-3xl font-black text-gray-900 mb-1 tracking-tight">Where are you looking to work?</h1>
            <p className="text-gray-400 text-sm mb-6">Select all that apply.</p>

            {/* Special locations */}
            <div className="flex gap-2 mb-4">
              {SPECIAL_LOCATIONS.map((loc) => (
                <button
                  key={loc}
                  onClick={() => toggleLocation(loc)}
                  className="px-4 py-2 rounded-full text-sm font-medium transition-all"
                  style={
                    selectedLocations.includes(loc)
                      ? { background: "linear-gradient(135deg, #F97316, #EC4899)", color: "white" }
                      : { backgroundColor: "white", color: "#4b5563", border: "1px solid #e5e7eb" }
                  }
                >
                  {loc}
                </button>
              ))}
            </div>

            {/* Province accordion */}
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden mb-4">
              {Object.entries(PROVINCES).map(([province, cities], idx) => (
                <div key={province} className={idx > 0 ? "border-t border-gray-100" : ""}>
                  <button
                    onClick={() => setExpandedProvince(expandedProvince === province ? null : province)}
                    className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700"
                  >
                    <span>{province}</span>
                    <span className="text-gray-400 text-xs">{expandedProvince === province ? "▲" : "▼"}</span>
                  </button>
                  {expandedProvince === province && (
                    <div className="flex flex-wrap gap-2 px-5 pb-4">
                      {cities.map((city) => (
                        <button
                          key={city}
                          onClick={() => toggleLocation(city)}
                          className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                          style={
                            selectedLocations.includes(city)
                              ? { background: "linear-gradient(135deg, #F97316, #EC4899)", color: "white" }
                              : { backgroundColor: "#f3f4f6", color: "#4b5563" }
                          }
                        >
                          {city}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Selected locations */}
            {selectedLocations.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedLocations.map((loc) => (
                  <span
                    key={loc}
                    className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium text-white"
                    style={{ background: "linear-gradient(135deg, #F97316, #EC4899)" }}
                  >
                    {loc}
                    <button onClick={() => toggleLocation(loc)} className="ml-1 opacity-80 hover:opacity-100">×</button>
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 2 — Job Type */}
        {step === 2 && (
          <div>
            <h1 className="text-3xl font-black text-gray-900 mb-1 tracking-tight">What type of role are you looking for?</h1>
            <p className="text-gray-400 text-sm mb-6">Select all that apply.</p>

            <div className="grid grid-cols-2 gap-3">
              {JOB_TYPES.map((jt) => (
                <button
                  key={jt.value}
                  onClick={() => toggleJobType(jt.value)}
                  className="flex items-center gap-3 px-4 py-4 rounded-2xl text-sm font-medium transition-all border"
                  style={
                    jobTypes.includes(jt.value)
                      ? { background: "linear-gradient(135deg, #F97316, #EC4899)", color: "white", border: "none" }
                      : { backgroundColor: "white", color: "#4b5563", borderColor: "#e5e7eb" }
                  }
                >
                  <img
                    src={jt.icon}
                    alt={jt.label}
                    className="w-5 h-5"
                    style={jobTypes.includes(jt.value) ? { filter: "brightness(0) invert(1)" } : { filter: "invert(40%)" }}
                  />
                  <span>{jt.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3 — Resume */}
        {step === 3 && (
          <div>
            <h1 className="text-3xl font-black text-gray-900 mb-1 tracking-tight">Upload your resume</h1>
            <p className="text-gray-400 text-sm mb-6">Optional — you can always do this later.</p>

            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Resume name</label>
                <input
                  type="text"
                  value={resumeName}
                  onChange={(e) => setResumeName(e.target.value)}
                  placeholder="e.g. Software Developer Resume"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>

              <label className={`flex flex-col items-center justify-center w-full h-40 rounded-xl cursor-pointer transition-colors ${
                resumeFile ? "bg-orange-50 border-2 border-orange-400" : "bg-gray-100 hover:bg-gray-200"
              }`}>
                <input
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
                />
                {resumeFile ? (
                  <>
                    <svg className="w-8 h-8 text-orange-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-sm font-medium text-gray-900">{resumeFile.name}</p>
                    <p className="text-xs text-gray-500 mt-1">Click to change</p>
                  </>
                ) : (
                  <>
                    <svg className="w-8 h-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    <p className="text-sm font-medium text-gray-700">Click to upload your resume</p>
                    <p className="text-xs text-gray-400 mt-1">PDF only</p>
                  </>
                )}
              </label>
            </div>
          </div>
        )}

        {/* Error */}
        {error && <p className="text-sm text-red-500 mt-4">{error}</p>}

        {/* Navigation buttons */}
        <div className="flex gap-3 mt-8 mb-12 items-center justify-between">
          {step > 0 && (
            <button
              onClick={() => { setStep((s) => s - 1); setError(""); }}
              className="p-3 rounded-xl hover:bg-gray-100 transition-colors flex items-center justify-center"
            >
              <img
                src="/back_arrow.svg"
                alt="Back"
                className="w-5 h-5"
                style={{ filter: "invert(48%) sepia(79%) saturate(2476%) hue-rotate(330deg) brightness(118%) contrast(119%)" }}
              />
            </button>
          )}
          {step < STEPS.length - 1 ? (
            <button
              onClick={nextStep}
              className="px-6 py-2.5 rounded-full text-sm font-bold text-white transition-colors"
              style={{ background: "linear-gradient(135deg, #F97316, #EC4899)" }}
            >
              Next →
            </button>
          ) : (
            <div className="flex flex-col gap-2 flex-1">
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full py-3 rounded-xl text-sm font-bold text-white disabled:opacity-50 transition-colors"
                style={{ background: "linear-gradient(135deg, #F97316, #EC4899)" }}
              >
                {loading ? "Setting up your account..." : resumeFile ? "Upload & continue →" : "Continue to dashboard →"}
              </button>
              {!resumeFile && (
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="w-full text-gray-400 text-sm py-2 hover:text-gray-600 transition-colors"
                >
                  Skip for now
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}