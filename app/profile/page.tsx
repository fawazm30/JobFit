"use client";

import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [hasPassword, setHasPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState("");
  const [profileError, setProfileError] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetch("/api/profile")
        .then((r) => r.json())
        .then((data) => {
          setName(data.name || "");
          setEmail(data.email || "");
          setHasPassword(data.hasPassword || false);
          setLoading(false);
        });
    }
  }, [session]);

  async function saveProfile() {
    setSavingProfile(true);
    setProfileError("");
    setProfileSuccess("");
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email }),
    });
    if (res.ok) {
      setProfileSuccess("Profile updated successfully!");
      setTimeout(() => setProfileSuccess(""), 3000);
    } else {
      const data = await res.json();
      setProfileError(data.error || "Something went wrong.");
    }
    setSavingProfile(false);
  }

  async function changePassword() {
    setPasswordError("");
    setPasswordSuccess("");
    if (newPassword !== confirmPassword) {
      return setPasswordError("New passwords don't match.");
    }
    if (newPassword.length < 6) {
      return setPasswordError("Password must be at least 6 characters.");
    }
    setSavingPassword(true);
    const res = await fetch("/api/profile/password", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    if (res.ok) {
      setPasswordSuccess("Password changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setPasswordSuccess(""), 3000);
    } else {
      const data = await res.json();
      setPasswordError(data.error || "Something went wrong.");
    }
    setSavingPassword(false);
  }

  async function deleteAccount() {
    setDeleting(true);
    const res = await fetch("/api/profile", { method: "DELETE" });
    if (res.ok) {
      await signOut({ callbackUrl: "/login" });
    }
    setDeleting(false);
  }

  if (status === "loading" || loading) {
    return (
        <div className="min-h-screen bg-gray-50 animate-pulse pt-16">
        <div className="max-w-4xl mx-auto px-4 py-10">
            <div className="h-10 w-64 bg-gray-200 rounded-full mb-8" />
            <div className="bg-white rounded-2xl h-96 mb-6 border border-gray-100" />
            <div className="grid grid-cols-2 gap-6 mb-6">
            <div className="bg-white rounded-2xl h-48 border border-gray-100" />
            <div className="bg-white rounded-2xl h-48 border border-gray-100" />
            </div>
            <div className="bg-white rounded-2xl h-40 border border-gray-100" />
        </div>
        </div>
    );
    }

  // Get initials for avatar
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="min-h-screen bg-gray-50 pt-16">

      <div className="max-w-2xl mx-auto px-4 py-10">
        {/* Header */}
        <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-8">Profile</h1>

        {/* Avatar + name */}
        <div className="flex items-center gap-4 mb-8">
            {session?.user?.image ? (
            <img
                src={session.user.image}
                alt={name}
                className="w-16 h-16 rounded-full object-cover"
            />
            ) : (
            <div
                className="w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold"
                style={{ background: "linear-gradient(135deg, #F97316, #EC4899)" }}
            >
                {initials || "?"}
            </div>
            )}
            <div>
            <p className="text-lg font-bold text-gray-900">{name}</p>
            <p className="text-sm text-gray-400">{email}</p>
            </div>
        </div>

        {/* Profile info */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6">
          <h2 className="text-base font-bold text-gray-900 mb-4">Personal Information</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>
            {profileError && <p className="text-sm text-red-500">{profileError}</p>}
            {profileSuccess && <p className="text-sm text-green-600">{profileSuccess}</p>}
            <button
              onClick={saveProfile}
              disabled={savingProfile}
              className="px-5 py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-50 transition-colors"
              style={{ background: "linear-gradient(135deg, #F97316, #EC4899)" }}
            >
              {savingProfile ? "Saving..." : "Save changes"}
            </button>
          </div>
        </div>

        {/* Password section */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6">
          <h2 className="text-base font-bold text-gray-900 mb-1">Password</h2>
          {hasPassword ? (
            <>
              <p className="text-sm text-gray-400 mb-4">Change your account password.</p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Current password</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">New password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Confirm new password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                </div>
                {passwordError && <p className="text-sm text-red-500">{passwordError}</p>}
                {passwordSuccess && <p className="text-sm text-green-600">{passwordSuccess}</p>}
                <button
                  onClick={changePassword}
                  disabled={savingPassword}
                  className="px-5 py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-50 transition-colors"
                  style={{ background: "linear-gradient(135deg, #F97316, #EC4899)" }}
                >
                  {savingPassword ? "Changing..." : "Change password"}
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-3 mt-2">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Signed in with Google</p>
                <a
                  href="https://myaccount.google.com/security"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-500 hover:underline"
                >
                  Manage your Google account password →
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Danger zone */}
        <div className="bg-white border border-red-200 rounded-2xl p-6">
          <h2 className="text-base font-bold text-red-600 mb-1">Danger Zone</h2>
          <p className="text-sm text-gray-400 mb-4">
            Permanently delete your account and all associated data. This action cannot be undone.
          </p>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="px-5 py-2.5 rounded-xl text-sm font-medium text-white bg-red-500 hover:bg-red-600 transition-colors"
          >
            Delete account
          </button>
        </div>
      </div>

      {/* Delete confirmation modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-6 shadow-xl max-w-sm w-full">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Delete account?</h3>
            <p className="text-sm text-gray-500 mb-6">
              This will permanently delete your account, all your saved jobs, applications, resume versions, and data. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={deleteAccount}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white bg-red-500 hover:bg-red-600 disabled:opacity-50 transition-colors"
              >
                {deleting ? "Deleting..." : "Yes, delete my account"}
              </button>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}