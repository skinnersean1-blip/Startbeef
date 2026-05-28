"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { shoePath } from "@/lib/shoepath";

function ResetForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirm) {
      setError("Passwords don't match");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Something went wrong");
      setLoading(false);
      return;
    }

    setDone(true);
    setTimeout(() => router.push("/auth/signin"), 2500);
  };

  if (!token) {
    return (
      <div className="border border-shoe-border bg-shoe-panel p-8 text-center">
        <p className="text-red-400 text-sm">Invalid reset link.</p>
        <Link href="/auth/forgot-password" className="block mt-4">
          <button className="btn-shoe-ghost w-full">REQUEST A NEW LINK</button>
        </Link>
      </div>
    );
  }

  return (
    <div className="border border-shoe-border bg-shoe-panel p-8">
      {done ? (
        <div className="text-center space-y-4">
          <p className="text-shoe-tier-new font-bold tracking-widest">PASSWORD UPDATED</p>
          <p className="text-shoe-cream-dim text-sm">Redirecting you to sign in...</p>
        </div>
      ) : (
        <>
          <h2 className="text-xl font-bold text-shoe-cream tracking-tight mb-6">NEW PASSWORD</h2>

          {error && (
            <div className="border border-red-500 text-red-400 px-4 py-3 mb-6 text-sm">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label-shoe block mb-2">NEW PASSWORD</label>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-shoe w-full"
                placeholder="••••••••"
              />
            </div>
            <div>
              <label className="label-shoe block mb-2">CONFIRM PASSWORD</label>
              <input
                type="password"
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="input-shoe w-full"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn-shoe-primary w-full disabled:opacity-50"
            >
              {loading ? "UPDATING..." : "UPDATE PASSWORD"}
            </button>
          </form>
        </>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
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
        </div>
        <Suspense fallback={<div className="border border-shoe-border bg-shoe-panel h-48 animate-pulse" />}>
          <ResetForm />
        </Suspense>
      </div>
    </div>
  );
}
