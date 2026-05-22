"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

function ResetForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);

  function generatePassword() {
    const chars = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%^&*";
    const arr = Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map((b) => chars[b % chars.length])
      .join("");
    setPassword(arr);
    setConfirm(arr);
    setShowPassword(true);
    navigator.clipboard.writeText(arr).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) { setError("Passwords don't match"); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters"); return; }

    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });

    setLoading(false);

    if (res.ok) {
      router.push("/auth/signin?reset=1");
    } else {
      const d = await res.json();
      setError(d.error || "Something went wrong");
    }
  }

  if (!token) {
    return (
      <div className="text-center py-4">
        <p className="text-xl font-bold mb-3">INVALID LINK</p>
        <p className="text-beef-text-muted text-sm mb-6">This reset link is missing or malformed.</p>
        <Link href="/auth/forgot-password" className="text-beef-gold hover:text-beef-gold-light text-sm transition-colors">
          Request a new one
        </Link>
      </div>
    );
  }

  return (
    <>
      <h2 className="text-xl font-bold mb-2">Choose a new password</h2>

      <button
        type="button"
        onClick={generatePassword}
        className="text-xs text-beef-gold hover:text-beef-gold-light tracking-widest transition-colors mb-6"
      >
        {copied ? "✓ COPIED TO CLIPBOARD" : "⚡ GENERATE STRONG PASSWORD"}
      </button>

      {error && (
        <div className="bg-red-900/20 border border-red-500 text-red-500 px-4 py-3 rounded-lg mb-4 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 bg-beef-bg-light border border-beef-border rounded-lg focus:outline-none focus:border-beef-gold transition-colors pr-16"
            placeholder="New password (8+ characters)"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-beef-text-muted hover:text-beef-gold transition-colors"
          >
            {showPassword ? "HIDE" : "SHOW"}
          </button>
        </div>
        <input
          type={showPassword ? "text" : "password"}
          required
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="w-full px-4 py-3 bg-beef-bg-light border border-beef-border rounded-lg focus:outline-none focus:border-beef-gold transition-colors"
          placeholder="Confirm new password"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Saving..." : "SET NEW PASSWORD"}
        </button>
      </form>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold mb-2">BEEF</h1>
          <p className="section-label">RESET PASSWORD</p>
        </div>
        <div className="card-beef">
          <Suspense fallback={<div className="animate-pulse h-48" />}>
            <ResetForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
