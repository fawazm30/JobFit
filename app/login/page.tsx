"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [tab, setTab] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (tab === "signup") {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); setLoading(false); return; }
    }

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("Invalid email or password");
      setLoading(false);
    } else {
      router.push(tab === "signup" ? "/onboarding" : "/dashboard");
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between h-16">
        <div className="flex items-center gap-0">
          <img src="/logo_solo.png" alt="JobFit" className="h-14 w-auto" />
          <span className="text-lg font-medium text-gray-600" style={{ fontFamily: "var(--font-poppins)" }}>
              JobFit
            </span>
        </div>
      </nav>

      {/* Centered content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 pb-12">
        {/* Logo icon */}
        <img src="/jobfit_logo.png" alt="JobFit" className="h-26 w-auto mb-6" />

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-lg w-full max-w-sm p-8">
          {/* Title */}
          <h1 className="text-2xl font-black text-gray-900 text-center mb-6 tracking-tight">
            {tab === "login" ? "LOGIN" : "SIGNUP"}
          </h1>

          {/* Google button */}
          <button
            onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
            className="w-full flex items-center justify-center gap-3 bg-gray-100 hover:bg-gray-200 transition-colors rounded-xl py-4 mb-4"
          >
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span className="text-sm font-medium text-gray-700">Continue with Google</span>
          </button>

          {/* OR divider */}
          <div className="flex items-center gap-3 mb-4">
            <hr className="flex-1 border-gray-300" />
            <span className="text-xs font-medium text-gray-500">OR</span>
            <hr className="flex-1 border-gray-300" />
          </div>

          {/* Email input */}
          <form onSubmit={handleSubmit} className="space-y-3">
            {tab === "signup" && (
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="w-full px-4 py-3 bg-gray-100 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-400 transition-colors placeholder-gray-400"
              />
            )}
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              required
              className="w-full px-4 py-3 bg-gray-100 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-400 transition-colors placeholder-gray-400"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
              className="w-full px-4 py-3 bg-gray-100 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-400 transition-colors placeholder-gray-400"
            />

            {error && <p className="text-sm text-red-500">{error}</p>}

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl text-sm font-bold text-white disabled:opacity-50 transition-colors tracking-wide"
              style={{ background: "linear-gradient(135deg, #F97316, #EC4899)" }}
            >
              {loading
                ? "Please wait..."
                : tab === "login"
                ? "LOGIN"
                : "CREATE ACCOUNT"}
            </button>
          </form>

          {/* Toggle login/signup */}
          <p className="text-center text-xs text-gray-400 mt-4">
            {tab === "login" ? (
              <>
                Don't have an account?{" "}
                <button
                  onClick={() => { setTab("signup"); setError(""); }}
                  className="text-orange-500 font-medium hover:underline"
                >
                  Sign up
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  onClick={() => { setTab("login"); setError(""); }}
                  className="text-orange-500 font-medium hover:underline"
                >
                  Log in
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}