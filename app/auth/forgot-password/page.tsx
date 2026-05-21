"use client";

import { useState } from "react";
import Link from "next/link";
import { BackButton } from "@/components/BackButton";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    setLoading(false);
    if (res.ok) {
      setDone(true);
    } else {
      setError("Something went wrong. Try again.");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        <div className="mb-6"><BackButton fallback="/auth/signin" /></div>

        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold mb-2">BEEF</h1>
          <p className="section-label">FORGOT YOUR PASSWORD?</p>
        </div>

        <div className="card-beef">
          {done ? (
            <div className="text-center py-4">
              <p className="text-2xl font-bold mb-3">CHECK YOUR EMAIL</p>
              <p className="text-beef-text-muted text-sm mb-6">
                If an account exists for that address, we sent a reset link. It expires in 1 hour.
              </p>
              <Link href="/auth/signin" className="text-beef-gold hover:text-beef-gold-light text-sm transition-colors">
                Back to sign in
              </Link>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-bold mb-2">Reset your password</h2>
              <p className="text-beef-text-muted text-sm mb-6">
                Enter the email on your account and we&apos;ll send a reset link.
              </p>

              {error && (
                <div className="bg-red-900/20 border border-red-500 text-red-500 px-4 py-3 rounded-lg mb-4 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-beef-bg-light border border-beef-border rounded-lg focus:outline-none focus:border-beef-gold transition-colors"
                  placeholder="your@email.com"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Sending..." : "SEND RESET LINK"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
