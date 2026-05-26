"use client";

import Link from "next/link";

const features = [
  {
    icon: "/case.svg",
    title: "AI Match Scoring",
    description: "See exactly how well you match every job with a detailed score, matched skills, and missing skills breakdown — powered by Claude AI.",
  },
  {
    icon: "/file.svg",
    title: "Resume Versions",
    description: "Upload multiple resume versions and track which one gets you the most interviews. Switch your active resume anytime.",
  },
  {
    icon: "/contract.svg",
    title: "Cover Letter Generator",
    description: "Generate a tailored cover letter for any job in seconds using your resume and the job description. Edit and download as Word.",
  },
  {
    icon: "/Star.svg",
    title: "Resume Suggestions",
    description: "Get AI-powered suggestions to improve your resume based on the jobs you're applying to. Download an improved version instantly.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="px-6 py-4 flex items-center justify-between border-b border-gray-100">
        <div className="flex items-center gap-0">
          <img src="/logo_solo.png" alt="JobFit" className="h-10 w-auto" />
          <span className="text-lg font-medium text-gray-600" style={{ fontFamily: "var(--font-poppins)" }}>
            JobFit
          </span>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="text-sm text-gray-500 hover:text-gray-900 transition-colors font-medium"
          >
            Log in
          </Link>
          <Link
            href="/login"
            className="px-4 py-2 rounded-full text-sm font-medium text-white transition-colors"
            style={{ background: "linear-gradient(135deg, #F97316, #EC4899)" }}
          >
            Get started free
          </Link>
        </div>
      </nav>

      {/* Hero section */}
      <section className="max-w-4xl mx-auto px-4 pt-24 pb-20 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium mb-6 border"
          style={{ borderColor: "#F97316", color: "#F97316", backgroundColor: "#FFF7ED" }}
        >
          <span>✦</span> AI-Powered Job Matching
        </div>

        {/* Headline */}
        <h1 className="text-6xl font-black text-gray-900 tracking-tight mb-6 leading-tight">
          Find Jobs That{" "}
          <span
            style={{
              backgroundImage: "linear-gradient(135deg, #F97316, #EC4899)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Actually Fit You
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-xl text-gray-500 mb-10 max-w-2xl mx-auto leading-relaxed">
          JobFit analyzes your resume and scores every job opportunity — so you know exactly where to focus your energy and what to improve.
        </p>

        {/* CTA buttons */}
        <div className="flex items-center justify-center gap-4">
          <Link
            href="/login"
            className="px-8 py-3.5 rounded-full text-base font-bold text-white transition-colors shadow-lg"
            style={{ background: "linear-gradient(135deg, #F97316, #EC4899)" }}
          >
            Get started free →
          </Link>
          <a
            href="#features"
            className="px-8 py-3.5 rounded-full text-base font-medium text-gray-700 border border-gray-300 hover:bg-gray-50 transition-colors"
          >
            See how it works
          </a>
        </div>
      </section>

      {/* Preview card section */}
      <section className="max-w-3xl mx-auto px-4 pb-24">
        <div className="bg-white border border-gray-200 rounded-2xl shadow-xl p-6">
          {/* Card header */}
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-1">SAP iXp Intern — Technical Project Coordinator</h3>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <img src="/case.svg" alt="" className="w-4 h-4 opacity-40" />
                <span>SAP</span>
                <span>·</span>
                <span>Greater Vancouver, BC</span>
              </div>
            </div>
            {/* Circle score */}
            <div className="flex flex-col items-center gap-1 shrink-0">
              <div className="relative w-16 h-16">
                <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
                  <circle cx="32" cy="32" r="24" fill="none" stroke="#f3f4f6" strokeWidth="5" />
                  <circle
                    cx="32" cy="32" r="24" fill="none"
                    stroke="url(#landingGradient)" strokeWidth="5"
                    strokeDasharray={150.8}
                    strokeDashoffset={150.8 - (78 / 100) * 150.8}
                    strokeLinecap="round"
                  />
                  <defs>
                    <linearGradient id="landingGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#F97316" />
                      <stop offset="100%" stopColor="#EC4899" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-black text-gray-900">78%</span>
                </div>
              </div>
              <span className="text-xs text-gray-400">Match Score</span>
            </div>
          </div>

          {/* Skills */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-xs font-bold text-green-600 uppercase tracking-wide mb-2">Matching Skills</p>
              <div className="flex flex-wrap gap-1.5">
                {["Stakeholder communication", "Documentation", "Report writing", "Agile methodology", "Git/GitHub"].map((s) => (
                  <span key={s} className="px-3 py-1 rounded-full text-xs font-medium border border-green-300 text-green-700 bg-green-50">{s}</span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-bold text-red-500 uppercase tracking-wide mb-2">Missing Skills</p>
              <div className="flex flex-wrap gap-1.5">
                {["SAP software", "PMP certification", "MS Project"].map((s) => (
                  <span key={s} className="px-3 py-1 rounded-full text-xs font-medium border border-red-300 text-red-600 bg-red-50">{s}</span>
                ))}
              </div>
            </div>
          </div>

          {/* AI Summary */}
          <div className="rounded-xl p-4" style={{ background: "linear-gradient(135deg, #FFF7ED, #FDF2F8)" }}>
            <p className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: "#F97316" }}>AI Summary</p>
            <p className="text-sm text-gray-700">Strong match for a Technical Project Coordinator internship. Relevant project coordination experience through coursework and agile team projects. Missing SAP-specific knowledge but has transferable coordination and communication skills.</p>
          </div>
        </div>
      </section>

      {/* Features section */}
      <section id="features" className="bg-gray-50 py-24">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-black text-gray-900 tracking-tight mb-4">
              Everything you need to{" "}
              <span
                style={{
                  backgroundImage: "linear-gradient(135deg, #F97316, #EC4899)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                land the job
              </span>
            </h2>
            <p className="text-gray-500 text-lg">Built for students and new grads who are serious about their job search.</p>
          </div>

          <div className="grid grid-cols-2 gap-6">
            {features.map((feature) => (
              <div key={feature.title} className="bg-white border border-gray-200 rounded-2xl p-6 hover:border-orange-200 hover:shadow-md transition-all">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: "linear-gradient(135deg, #FFF7ED, #FDF2F8)" }}
                >
                  <img
                    src={feature.icon}
                    alt={feature.title}
                    className="w-5 h-5"
                    style={{ filter: "invert(48%) sepia(79%) saturate(2476%) hue-rotate(330deg) brightness(118%) contrast(119%)" }}
                  />
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA section */}
      <section className="py-24">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-black text-gray-900 tracking-tight mb-4">
            Ready to find your fit?
          </h2>
          <p className="text-gray-500 text-lg mb-8">
            Join students who are using AI to work smarter in their job search.
          </p>
          <Link
            href="/login"
            className="inline-block px-10 py-4 rounded-full text-base font-bold text-white shadow-lg transition-colors"
            style={{ background: "linear-gradient(135deg, #F97316, #EC4899)" }}
          >
            Get started free →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8 px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-0">
            <img src="/logo_solo.png" alt="JobFit" className="h-8 w-auto" />
            <span className="text-lg font-medium text-gray-600" style={{ fontFamily: "var(--font-poppins)" }}>
              JobFit
            </span>
          </div>
          <p className="text-xs text-gray-400">Built by Fawaz Mansoor · {new Date().getFullYear()}</p>
        </div>
      </footer>
    </div>
  );
}
