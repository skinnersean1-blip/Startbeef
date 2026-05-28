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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
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
        <Link href="/auth/forgot-password" className="btn-shoe-ghost w-full block mt-4">
          REQUEST A NEW LINK
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
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-shoe w-full pr-16"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-shoe-cream-dim hover:text-shoe-accent transition-colors tracking-widest"
                >
                  {showPassword ? "HIDE" : "SHOW"}
                </button>
              </div>
            </div>
            <div>
              <label className="label-shoe block mb-2">CONFIRM PASSWORD</label>
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  required
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="input-shoe w-full pr-16"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-shoe-cream-dim hover:text-shoe-accent transition-colors tracking-widest"
                >
                  {showConfirm ? "HIDE" : "SHOW"}
                </button>
              </div>
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
    <div className="min-h-screen bg-shoe-bg">

      <header className="bg-shoe-bg-deep border-b border-shoe-border overflow-hidden">
        <div className="container-shoe pt-5 pb-1 flex items-center justify-between gap-6">
          <p className="label-shoe">Buy, Swap, Sell</p>
          <Link href="/auth/signin" className="text-shoe-cream-dim text-xs tracking-widest hover:text-shoe-accent transition-colors">
            ← SIGN IN
          </Link>
        </div>
        <Link href={shoePath()} className="block">
          <h1
            className="font-black text-shoe-cream leading-none whitespace-nowrap pb-1 hover:text-shoe-accent transition-colors select-none relative left-1/2 -translate-x-1/2 w-max"
            style={{ fontSize: "20vw", letterSpacing: "-0.02em" }}
          >
            SHOE SHOE
          </h1>
        </Link>
      </header>

      <main className="flex justify-center py-12 px-4">
        <div className="w-full max-w-md">
          <p className="label-shoe text-center mb-8">SET A NEW PASSWORD</p>
          <Suspense fallback={<div className="border border-shoe-border bg-shoe-panel h-48 animate-pulse" />}>
            <ResetForm />
          </Suspense>
        </div>
      </main>
    </div>
  );
}
