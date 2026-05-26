"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import BlobCursor from "@/app/components/BlobCursor";
import { motion } from "motion/react";

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

const CIRC = 2 * Math.PI * 24;
const CARD_W = 560;
const CARD_SPACING = 580;

const JOB_CARDS = [
  {
    id: 0,
    title: "Registered Nurse",
    company: "Alberta Health Services",
    location: "Calgary, AB",
    score: 82,
    matching: ["Patient care", "Clinical documentation", "Team collaboration", "IV administration", "Medication management"],
    missing: ["ICU experience", "ACLS certification"],
    summary: "Strong clinical foundation with solid patient care and documentation skills. Missing critical care specialization but well-suited for general medical-surgical units.",
  },
  {
    id: 1,
    title: "Financial Analyst",
    company: "TD Bank",
    location: "Toronto, ON · Hybrid",
    score: 75,
    matching: ["Financial modeling", "Excel", "Report writing", "Data analysis"],
    missing: ["Bloomberg Terminal", "CFA designation", "SQL"],
    summary: "Solid quantitative and financial modeling skills. Lacks specialized tools like Bloomberg and formal CFA credentials — prioritize these for a stronger application.",
  },
  {
    id: 2,
    title: "Marketing Coordinator",
    company: "Hootsuite",
    location: "Vancouver, BC · Hybrid",
    score: 88,
    matching: ["Social media management", "Content creation", "Copywriting", "Google Analytics", "Campaign coordination"],
    missing: ["Paid media (SEM/PPC)", "HubSpot"],
    summary: "Excellent match for this coordination role. Strong content and analytics skills align well with Hootsuite's brand team. Minor gaps in paid media tooling.",
  },
  {
    id: 3,
    title: "Full Stack Developer",
    company: "Shopify",
    location: "Toronto, ON · Remote",
    score: 91,
    matching: ["React", "TypeScript", "Node.js", "REST APIs", "Git/GitHub"],
    missing: ["Ruby on Rails", "GraphQL"],
    summary: "Excellent technical fit. Strong full-stack skills align with Shopify's engineering culture. Minor backend gaps easily closed — highly recommended to apply.",
  },
  {
    id: 4,
    title: "Civil Engineer EIT",
    company: "WSP Canada",
    location: "Edmonton, AB",
    score: 78,
    matching: ["AutoCAD", "Structural analysis", "Technical documentation", "Site inspection"],
    missing: ["P.Eng license", "Revit", "Geotechnical experience"],
    summary: "Good foundational skills for an EIT role. AutoCAD proficiency is a strong asset. Focus on obtaining P.Eng and broadening your software toolkit to include Revit.",
  },
  {
    id: 5,
    title: "Data Analyst",
    company: "RBC",
    location: "Toronto, ON · Hybrid",
    score: 69,
    matching: ["Report writing", "Excel", "Documentation", "Data visualization"],
    missing: ["Python", "SQL", "Power BI", "Statistical modeling"],
    summary: "Strong communication and reporting skills but notable gap in technical tooling. Developing SQL and Python proficiency would significantly improve this match.",
  },
  {
    id: 6,
    title: "Administrative Coordinator",
    company: "Government of Ontario",
    location: "Toronto, ON",
    score: 86,
    matching: ["Scheduling & calendar management", "Document preparation", "Stakeholder communication", "Microsoft Office"],
    missing: ["HRIS systems", "ATIP procedures"],
    summary: "Strong administrative and communication skills make this a great match. Missing exposure to government-specific systems and ATIP procedures — both are easily trainable.",
  },
  {
    id: 7,
    title: "UX Designer",
    company: "Intuit",
    location: "Toronto, ON · Hybrid",
    score: 74,
    matching: ["Figma", "User research", "Wireframing", "Usability testing"],
    missing: ["Motion design", "Design systems", "WCAG accessibility"],
    summary: "Solid UX foundation with good research and prototyping skills. Accessibility knowledge and design systems experience are gaps to address before applying.",
  },
];

const N = JOB_CARDS.length;
const mod = (n: number, m: number) => ((n % m) + m) % m;

function circularOffset(i: number, active: number): number {
  const raw = mod(i - mod(active, N), N);
  return raw > N / 2 ? raw - N : raw;
}

function CoverflowCarousel() {
  const [active, setActive] = useState(3);
  const pointerStart = useRef<number | null>(null);
  const autoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearAuto = () => {
    if (autoInterval.current) { clearInterval(autoInterval.current); autoInterval.current = null; }
    if (autoTimer.current) { clearTimeout(autoTimer.current); autoTimer.current = null; }
  };

  const startAuto = () => {
    clearAuto();
    autoInterval.current = setInterval(() => setActive(a => a + 1), 3000);
  };

  const pauseAuto = () => {
    clearAuto();
    autoTimer.current = setTimeout(startAuto, 2000);
  };

  useEffect(() => {
    startAuto();
    return clearAuto;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const next = () => { setActive(a => a + 1); pauseAuto(); };
  const prev = () => { setActive(a => a - 1); pauseAuto(); };

  return (
    <section className="pb-24 overflow-hidden">
      <div
        className="relative mx-auto select-none cursor-grab active:cursor-grabbing"
        style={{ maxWidth: 768, height: 380 }}
        onPointerDown={e => { pointerStart.current = e.clientX; pauseAuto(); }}
        onPointerUp={e => {
          if (pointerStart.current === null) return;
          const delta = e.clientX - pointerStart.current;
          pointerStart.current = null;
          if (delta < -60) next();
          else if (delta > 60) prev();
          else pauseAuto();
        }}
      >
        {JOB_CARDS.map((card, i) => {
          const offset = circularOffset(i, active);
          const abs = Math.abs(offset);
          return (
            <motion.div
              key={card.id}
              className="absolute top-0"
              style={{ width: CARD_W, left: "50%", marginLeft: -CARD_W / 2 }}
              animate={{
                x: offset * CARD_SPACING,
                scale: abs === 0 ? 1 : abs === 1 ? 0.88 : 0.78,
                opacity: abs === 0 ? 1 : abs === 1 ? 0.65 : abs === 2 ? 0.35 : 0,
                zIndex: 10 - abs,
              }}
              transition={abs > 2 ? { duration: 0 } : { type: "spring", stiffness: 300, damping: 30 }}
              onClick={() => { if (offset !== 0) { setActive(a => a + offset); pauseAuto(); } }}
            >
              <div className="bg-white border border-gray-200 rounded-2xl shadow-xl p-6 pointer-events-none">
                {/* Header */}
                <div className="flex items-start justify-between gap-4 mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-1">{card.title}</h3>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <img src="/case.svg" alt="" className="w-4 h-4 opacity-40" />
                      <span>{card.company}</span>
                      <span>·</span>
                      <span>{card.location}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-center gap-1 shrink-0">
                    <div className="relative w-16 h-16">
                      <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
                        <circle cx="32" cy="32" r="24" fill="none" stroke="#f3f4f6" strokeWidth="5" />
                        <circle
                          cx="32" cy="32" r="24" fill="none"
                          stroke={`url(#grad-${card.id})`} strokeWidth="5"
                          strokeDasharray={CIRC}
                          strokeDashoffset={CIRC - (card.score / 100) * CIRC}
                          strokeLinecap="round"
                        />
                        <defs>
                          <linearGradient id={`grad-${card.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#F97316" />
                            <stop offset="100%" stopColor="#EC4899" />
                          </linearGradient>
                        </defs>
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-sm font-black text-gray-900">{card.score}%</span>
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
                      {card.matching.map(s => (
                        <span key={s} className="px-3 py-1 rounded-full text-xs font-medium border border-green-300 text-green-700 bg-green-50">{s}</span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-red-500 uppercase tracking-wide mb-2">Missing Skills</p>
                    <div className="flex flex-wrap gap-1.5">
                      {card.missing.map(s => (
                        <span key={s} className="px-3 py-1 rounded-full text-xs font-medium border border-red-300 text-red-600 bg-red-50">{s}</span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* AI Summary */}
                <div className="rounded-xl p-4" style={{ background: "linear-gradient(135deg, #FFF7ED, #FDF2F8)" }}>
                  <p className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: "#F97316" }}>AI Summary</p>
                  <p className="text-sm text-gray-700">{card.summary}</p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

    </section>
  );
}

export default function LandingPage() {
  const [hoveredFeature, setHoveredFeature] = useState<string | null>(null);

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
      <section className="relative overflow-hidden pt-24 pb-20">
        {/* Blob cursor — behind all content, clips at hero boundary */}
        <div className="absolute inset-0 pointer-events-none">
          <BlobCursor
            blobType="circle"
            fillColor="#F97316"
            trailCount={3}
            sizes={[60, 125, 75]}
            innerSizes={[20, 35, 25]}
            innerColor="rgba(255,255,255,0.8)"
            opacities={[0.3, 0.2, 0.25]}
            shadowColor="rgba(249,115,22,0.3)"
            shadowBlur={5}
            shadowOffsetX={0}
            shadowOffsetY={0}
            filterStdDeviation={30}
            useFilter={true}
            fastDuration={0.1}
            slowDuration={0.5}
            zIndex={0}
          />
        </div>

        {/* Hero content on top */}
        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-6 border"
            style={{ borderColor: "#F97316", color: "#F97316", backgroundColor: "#FFF7ED" }}
          >
            <span>✦</span> AI-Powered Job Matching
          </div>

          <h1 className="text-6xl font-black text-gray-900 tracking-tight mb-6 leading-tight">
            Find Jobs That{" "}
            <span style={{ backgroundImage: "linear-gradient(135deg, #F97316, #EC4899)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Actually Fit You
            </span>
          </h1>

          <p className="text-xl text-gray-500 mb-10 max-w-2xl mx-auto leading-relaxed">
            JobFit analyzes your resume and scores every job opportunity — so you know exactly where to focus your energy and what to improve.
          </p>

          <div className="flex items-center justify-center gap-4">
            <Link
              href="/login"
              className="px-8 py-3.5 rounded-full text-base font-bold text-white shadow-lg"
              style={{
                background: "linear-gradient(135deg, #F97316, #EC4899)",
                transition: "transform 200ms ease, box-shadow 200ms ease",
              }}
              onMouseEnter={e => {
                const el = e.currentTarget;
                el.style.transform = "scale(1.05)";
                el.style.boxShadow = "0 0 28px rgba(249,115,22,0.5), 0 8px 20px rgba(236,72,153,0.3)";
              }}
              onMouseLeave={e => {
                const el = e.currentTarget;
                el.style.transform = "";
                el.style.boxShadow = "";
              }}
            >
              Get started free →
            </Link>
            <a
              href="#features"
              className="px-8 py-3.5 rounded-full text-base font-semibold"
              style={{
                color: "#374151",
                border: "1px solid #d1d5db",
                transition: "background-color 200ms ease, border-color 200ms ease, color 200ms ease",
              }}
              onMouseEnter={e => {
                const el = e.currentTarget;
                el.style.backgroundColor = "#FFF7ED";
                el.style.borderColor = "#F97316";
                el.style.color = "#F97316";
              }}
              onMouseLeave={e => {
                const el = e.currentTarget;
                el.style.backgroundColor = "";
                el.style.borderColor = "";
                el.style.color = "";
              }}
            >
              See how it works
            </a>
          </div>
        </div>
      </section>

      <CoverflowCarousel />

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
            {features.map((feature) => {
              const isHovered = hoveredFeature === feature.title;
              const isDimmed = hoveredFeature !== null && !isHovered;
              return (
                <div
                  key={feature.title}
                  className="bg-white rounded-2xl p-6"
                  style={{
                    border: "1px solid",
                    borderColor: isHovered ? "#fed7aa" : "#e5e7eb",
                    boxShadow: isHovered
                      ? "0 20px 40px -8px rgba(0,0,0,0.12), 0 8px 16px -4px rgba(0,0,0,0.06)"
                      : "none",
                    transform: isHovered ? "scale(1.04)" : "scale(1)",
                    opacity: isDimmed ? 0.65 : 1,
                    transition: "transform 250ms ease, box-shadow 250ms ease, opacity 250ms ease, border-color 250ms ease",
                  }}
                  onMouseEnter={() => setHoveredFeature(feature.title)}
                  onMouseLeave={() => setHoveredFeature(null)}
                >
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
              );
            })}
          </div>
        </div>
      </section>

      {/* Final CTA section */}
      <section className="relative overflow-hidden py-24">
        <div className="absolute inset-0 pointer-events-none">
          <BlobCursor
            blobType="circle"
            fillColor="#F97316"
            trailCount={3}
            sizes={[60, 125, 75]}
            innerSizes={[20, 35, 25]}
            innerColor="rgba(255,255,255,0.8)"
            opacities={[0.3, 0.2, 0.25]}
            shadowColor="rgba(249,115,22,0.3)"
            shadowBlur={5}
            shadowOffsetX={0}
            shadowOffsetY={0}
            filterStdDeviation={30}
            useFilter={true}
            fastDuration={0.1}
            slowDuration={0.5}
            zIndex={0}
          />
        </div>
        <div className="relative z-10 max-w-2xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-black text-gray-900 tracking-tight mb-4">
            Ready to find your fit?
          </h2>
          <p className="text-gray-500 text-lg mb-8">
            Join students who are using AI to work smarter in their job search.
          </p>
          <Link
              href="/login"
              className="px-8 py-3.5 rounded-full text-base font-bold text-white shadow-lg"
              style={{
                background: "linear-gradient(135deg, #F97316, #EC4899)",
                transition: "transform 200ms ease, box-shadow 200ms ease",
              }}
              onMouseEnter={e => {
                const el = e.currentTarget;
                el.style.transform = "scale(1.05)";
                el.style.boxShadow = "0 0 28px rgba(249,115,22,0.5), 0 8px 20px rgba(236,72,153,0.3)";
              }}
              onMouseLeave={e => {
                const el = e.currentTarget;
                el.style.transform = "";
                el.style.boxShadow = "";
              }}
            >
              Get started free →
            </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8 px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          {/* Left: Logo */}
          <div className="flex items-center gap-0">
            <img src="/logo_solo.png" alt="JobFit" className="h-8 w-auto" />
            <span className="text-lg font-medium text-gray-600" style={{ fontFamily: "var(--font-poppins)" }}>
              JobFit
            </span>
          </div>

          {/* Right: Social links + credit */}
          <div className="flex items-center gap-4">
            <Link href="https://github.com/fawazm30" target="_blank" rel="noopener noreferrer">
              <img src="/github-icon.svg" alt="GitHub" className="h-6 w-6 opacity-60 hover:opacity-100 transition-opacity" />
            </Link>
            <Link href="https://www.linkedin.com/in/fawaz-mansoor" target="_blank" rel="noopener noreferrer">
              <img src="/linkedin-icon.svg" alt="LinkedIn" className="h-6 w-6 opacity-60 hover:opacity-100 transition-opacity" />
            </Link>
            <p className="text-xs text-gray-400">Built by Fawaz Mansoor · {new Date().getFullYear()}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
