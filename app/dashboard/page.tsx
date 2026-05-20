"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import Link from "next/link";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (session?.user?.email) {
      fetch("/api/me")
        .then((r) => r.json())
        .then((data) => {
          setSkills(data.skills || []);
          setLoading(false);
        });
    }
  }, [session]);

  async function addSkill() {
    if (!newSkill.trim()) return;
    const res = await fetch("/api/skills", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ skill: newSkill.trim() }),
    });
    const data = await res.json();
    setSkills(data.skills);
    setNewSkill("");
  }

  async function removeSkill(skill: string) {
    const res = await fetch("/api/skills", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ skill }),
    });
    const data = await res.json();
    setSkills(data.skills);
  }

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
        <h1 className="text-lg font-semibold text-gray-900">JobFit</h1>
        <div className="flex items-center gap-4">
            <Link href="/jobs" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
            Jobs
            </Link>
            <Link href="/applications" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
            Applications
            </Link>
            <span className="text-sm text-gray-500">{session?.user?.name}</span>
            <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
            >
            Log out
            </button>
        </div>
    </nav>

      <div className="max-w-3xl mx-auto px-4 py-10">
        <h2 className="text-2xl font-semibold text-gray-900 mb-1">
          Welcome back, {session?.user?.name?.split(" ")[0]}!
        </h2>
        <p className="text-gray-500 mb-10">Here's what we know about you so far.</p>

        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-1">Your skills</h3>
          <p className="text-sm text-gray-500 mb-4">
            Detected from your resume. Add or remove as needed.
          </p>

          <div className="flex flex-wrap gap-2 mb-6">
            {skills.length === 0 ? (
              <p className="text-sm text-gray-400">
                No skills detected yet.{" "}
                <a href="/resume" className="text-gray-900 underline">Upload your resume</a> to get started.
              </p>
            ) : (
              skills.map((skill) => (
                <span
                  key={skill}
                  className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-sm font-medium"
                >
                  {skill}
                  <button
                    onClick={() => removeSkill(skill)}
                    className="text-gray-400 hover:text-red-500 transition-colors ml-1 text-xs"
                  >
                    x
                  </button>
                </span>
              ))
            )}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addSkill()}
              placeholder="Add a skill..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
            <button
              onClick={addSkill}
              className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors"
            >
              Add
            </button>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6 mt-4">
          <h3 className="text-base font-semibold text-gray-900 mb-1">Resume</h3>
          <p className="text-sm text-gray-500 mb-4">Upload or replace your resume.</p>
          <a
            href="/resume"
            className="inline-block px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Manage resume
          </a>
        </div>
      </div>
    </div>
  );
}