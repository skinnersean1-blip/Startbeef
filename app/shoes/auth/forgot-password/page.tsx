"use client";

import { useState } from "react";
import Link from "next/link";
import { shoePath } from "@/lib/shoepath";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Something went wrong");
      setLoading(false);
      return;
    }

    setSubmitted(true);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-shoe-bg flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <p className="label-shoe mb-1">Buy, Swap, Sell</p>
          <Link href={shoePath()}>
            <h1 className="text-5xl font-bold text-shoe-cream tracking-tight hover:text-shoe-accent transition-colors">
              SHOE-SHOE
            </h1>
          </Link>
          <p className="label-shoe mt-2">RESET YOUR PASSWORD</p>
        </div>

        <div className="border border-shoe-border bg-shoe-panel p-8">
          {submitted ? (
            <div className="text-center space-y-4">
              <p className="text-shoe-cream text-sm leading-relaxed">
                If that email is registered, a reset link is on its way. Check your inbox — it expires in 1 hour.
              </p>
              <Link href="/auth/signin" className="btn-shoe-ghost w-full block mt-6">
                ← BACK TO SIGN IN
              </Link>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-bold text-shoe-cream tracking-tight mb-6">FORGOT PASSWORD</h2>

              {error && (
                <div className="border border-red-500 text-red-400 px-4 py-3 mb-6 text-sm">{error}</div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="label-shoe block mb-2">EMAIL ADDRESS</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-shoe w-full"
                    placeholder="your@email.com"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-shoe-primary w-full disabled:opacity-50"
                >
                  {loading ? "SENDING..." : "SEND RESET LINK"}
                </button>
              </form>

              <div className="mt-6 text-center">
                <Link href="/auth/signin" className="text-shoe-cream-dim text-sm hover:text-shoe-cream transition-colors">
                  ← Back to sign in
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
