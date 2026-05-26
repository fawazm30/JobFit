"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";

const gradientText = {
  backgroundImage: "linear-gradient(135deg, #F97316, #EC4899)",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
};

const navLinks = [
  { href: "/applications", label: "Applications" },
  { href: "/resume", label: "Resumes" },
  { href: "/jobs", label: "Find Jobs" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/profile", label: "Profile" },
];

export default function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const hideOn = ["/login", "/onboarding"];
  const hideExact = ["/"];

  if (
    hideOn.some((p) => pathname?.startsWith(p)) ||
    hideExact.some((p) => pathname === p)
   ) return null;

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between h-16 fixed top-0 left-0 right-0 z-40">
      <Link href="/dashboard">
        <img src="/jobfit_logo.png" alt="JobFit" className="h-16 w-auto" />
      </Link>
      <div className="flex items-center gap-6">
        {navLinks.map(({ href, label }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className="text-sm font-medium transition-colors"
              style={isActive ? gradientText : { color: "#6b7280" }}
            >
              {label}
            </Link>
          );
        })}
        {session && (
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
          >
            Log out
          </button>
        )}
      </div>
    </nav>
  );
}