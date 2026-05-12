"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const INDUSTRIES = [
  "Technology",
  "Healthcare",
  "Education",
  "Finance & Banking",
  "Legal",
  "Engineering",
  "Trades & Construction",
  "Social Services",
  "Marketing & Communications",
  "Retail & Hospitality",
  "Government & Public Service",
  "Arts & Media",
  "Science & Research",
  "Transportation & Logistics",
  "Other",
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
  { value: "internship", label: "Internship" },
  { value: "co-op", label: "Co-op" },
  { value: "part-time", label: "Part-time" },
  { value: "full-time", label: "Full-time" },
  { value: "new-grad", label: "New Grad" },
  { value: "contract", label: "Contract" },
  { value: "volunteer", label: "Volunteer" },
];

const STEPS = ["Role", "Location", "Job Type"];

export default function OnboardingPage() {
  const [step, setStep] = useState(0);

  // Role
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);
  const [jobTitle, setJobTitle] = useState("");

  // Location
  const [expandedProvince, setExpandedProvince] = useState<string | null>(null);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);

  // Job type
  const [jobTypes, setJobTypes] = useState<string[]>([]);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  function toggleIndustry(val: string) {
    setSelectedIndustries((prev) =>
      prev.includes(val) ? prev.filter((v) => v !== val) : [...prev, val]
    );
  }

  function toggleLocation(val: string) {
    setSelectedLocations((prev) =>
      prev.includes(val) ? prev.filter((v) => v !== val) : [...prev, val]
    );
  }

  function toggleJobType(val: string) {
    setJobTypes((prev) =>
      prev.includes(val) ? prev.filter((v) => v !== val) : [...prev, val]
    );
  }

  function nextStep() {
    setError("");
    if (step === 0) {
      if (selectedIndustries.length === 0) return setError("Please select at least one industry.");
      if (!jobTitle.trim()) return setError("Please enter a job title.");
    }
    if (step === 1 && selectedLocations.length === 0)
      return setError("Please select at least one location.");
    setStep((s) => s + 1);
  }

  async function handleSubmit() {
    setError("");
    if (jobTypes.length === 0) return setError("Please select at least one job type.");
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

    if (res.ok) {
      router.push("/dashboard");
    } else {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-12">
      <div className="max-w-xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-gray-900 mb-2">
            Let's set up your profile
          </h1>
          <p className="text-gray-500">Tell us what you're looking for.</p>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2 mb-10">
          {STEPS.map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              <div className={`flex items-center gap-2 text-sm font-medium ${
                i === step ? "text-gray-900" : i < step ? "text-green-600" : "text-gray-400"
              }`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                  i < step
                    ? "bg-green-600 text-white"
                    : i === step
                    ? "bg-gray-900 text-white"
                    : "bg-gray-200 text-gray-400"
                }`}>
                  {i < step ? "✓" : i + 1}
                </div>
                {label}
              </div>
              {i < STEPS.length - 1 && (
                <div className="w-8 h-px bg-gray-300 mx-1" />
              )}
            </div>
          ))}
        </div>

        {/* Step 0 - Role */}
        {step === 0 && (
          <div className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h2 className="text-base font-semibold text-gray-900 mb-1">Industry</h2>
              <p className="text-sm text-gray-500 mb-4">Select all that apply.</p>
              <div className="flex flex-wrap gap-2">
                {INDUSTRIES.map((ind) => (
                  <button
                    key={ind}
                    type="button"
                    onClick={() => toggleIndustry(ind)}
                    className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                      selectedIndustries.includes(ind)
                        ? "bg-gray-900 text-white border-gray-900"
                        : "bg-white text-gray-600 border-gray-300 hover:border-gray-400"
                    }`}
                  >
                    {ind}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h2 className="text-base font-semibold text-gray-900 mb-1">Job title</h2>
              <p className="text-sm text-gray-500 mb-4">
                What role are you looking for? (e.g. Registered Nurse, Software Developer, Social Worker)
              </p>
              <input
                type="text"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="Enter your desired job title"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>
          </div>
        )}

        {/* Step 1 - Location */}
        {step === 1 && (
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-1">Preferred locations</h2>
            <p className="text-sm text-gray-500 mb-4">
              Select provinces to expand cities, or choose a special option.
            </p>

            {/* Special options */}
            <div className="flex gap-2 mb-4">
              {SPECIAL_LOCATIONS.map((loc) => (
                <button
                  key={loc}
                  type="button"
                  onClick={() => toggleLocation(loc)}
                  className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                    selectedLocations.includes(loc)
                      ? "bg-gray-900 text-white border-gray-900"
                      : "bg-white text-gray-600 border-gray-300 hover:border-gray-400"
                  }`}
                >
                  {loc}
                </button>
              ))}
            </div>

            <div className="border-t border-gray-100 pt-4 space-y-2">
              {Object.entries(PROVINCES).map(([province, cities]) => (
                <div key={province}>
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedProvince(
                        expandedProvince === province ? null : province
                      )
                    }
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-50 text-sm font-medium text-gray-700 transition-colors"
                  >
                    <span>{province}</span>
                    <span className="text-gray-400">
                      {expandedProvince === province ? "▲" : "▼"}
                    </span>
                  </button>

                  {expandedProvince === province && (
                    <div className="flex flex-wrap gap-2 px-3 pt-2 pb-3">
                      {cities.map((city) => (
                        <button
                          key={city}
                          type="button"
                          onClick={() => toggleLocation(city)}
                          className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                            selectedLocations.includes(city)
                              ? "bg-gray-900 text-white border-gray-900"
                              : "bg-white text-gray-600 border-gray-300 hover:border-gray-400"
                          }`}
                        >
                          {city}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {selectedLocations.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-500 mb-2">Selected:</p>
                <div className="flex flex-wrap gap-2">
                  {selectedLocations.map((loc) => (
                    <span
                      key={loc}
                      className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium"
                    >
                      {loc} ×
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 2 - Job Type */}
        {step === 2 && (
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-1">Job type</h2>
            <p className="text-sm text-gray-500 mb-4">What kind of position are you after?</p>
            <div className="flex flex-wrap gap-2">
              {JOB_TYPES.map((jt) => (
                <button
                  key={jt.value}
                  type="button"
                  onClick={() => toggleJobType(jt.value)}
                  className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                    jobTypes.includes(jt.value)
                      ? "bg-gray-900 text-white border-gray-900"
                      : "bg-white text-gray-600 border-gray-300 hover:border-gray-400"
                  }`}
                >
                  {jt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {error && <p className="text-sm text-red-500 mt-4">{error}</p>}

        {/* Navigation */}
        <div className="flex gap-3 mt-8">
          {step > 0 && (
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              ← Back
            </button>
          )}
          {step < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={nextStep}
              className="flex-1 bg-gray-900 text-white py-3 rounded-xl text-sm font-medium hover:bg-gray-700 transition-colors"
            >
              Next →
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 bg-gray-900 text-white py-3 rounded-xl text-sm font-medium hover:bg-gray-700 disabled:opacity-50 transition-colors"
            >
              {loading ? "Saving..." : "Continue to dashboard →"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}