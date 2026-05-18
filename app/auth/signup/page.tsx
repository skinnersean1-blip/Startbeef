"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";

type Path = "FIGHTER" | "GHOST" | null;

export default function SignUpPage() {
  const router = useRouter();
  const [path, setPath] = useState<Path>(null);
  const [formData, setFormData] = useState({
    email: "",
    username: "",
    handle: "",
    password: "",
    confirmPassword: "",
    dateOfBirth: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (k: keyof typeof formData, v: string) =>
    setFormData((prev) => ({ ...prev, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    setLoading(true);

    const body: Record<string, unknown> = {
      email:       formData.email,
      password:    formData.password,
      dateOfBirth: formData.dateOfBirth,
      isAnonymous: path === "GHOST",
    };
    if (path === "FIGHTER") {
      body.username = formData.username;
      body.handle   = formData.handle;
    }

    const res = await fetch("/api/auth/register", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(body),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Something went wrong");
      setLoading(false);
      return;
    }

    const signInResult = await signIn("credentials", {
      identifier: formData.email,
      password:   formData.password,
      redirect:   false,
    });

    if (signInResult?.error) {
      setError("Account created but sign in failed. Please try signing in.");
      setLoading(false);
      return;
    }

    router.push("/");
    router.refresh();
  };

  // ── Path selection ──────────────────────────────────────────────────────
  if (!path) {
    return (
      <div className="min-h-screen flex items-center justify-center py-12 px-4">
        <div className="max-w-2xl w-full">
          <div className="text-center mb-10">
            <h1 className="text-5xl font-bold mb-2">BEEF</h1>
            <p className="section-label">CHOOSE YOUR IDENTITY</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <button
              onClick={() => setPath("FIGHTER")}
              className="card-beef border-2 border-beef-border hover:border-beef-gold text-left transition-all duration-200 group p-8"
            >
              <p className="text-4xl mb-3">⚔</p>
              <p className="text-2xl font-bold mb-3 group-hover:text-beef-gold transition-colors">FIGHTER</p>
              <p className="text-beef-text-muted text-sm leading-relaxed mb-5">
                Your name on the line. Your record on display. Win publicly — or lose publicly.
              </p>
              <ul className="space-y-1.5 text-xs text-beef-text-muted">
                <li>✓ Public @handle</li>
                <li>✓ W/L record visible to all</li>
                <li>✓ Build a reputation</li>
                <li>✓ Can go anonymous per-beef</li>
              </ul>
            </button>

            <button
              onClick={() => setPath("GHOST")}
              className="card-beef border-2 border-beef-border hover:border-beef-orange text-left transition-all duration-200 group p-8"
            >
              <p className="text-4xl mb-3">👻</p>
              <p className="text-2xl font-bold mb-3 group-hover:text-beef-orange transition-colors">GHOST</p>
              <p className="text-beef-text-muted text-sm leading-relaxed mb-5">
                No identity. No history. Pure argument. A system-assigned codename is all anyone sees.
              </p>
              <ul className="space-y-1.5 text-xs text-beef-text-muted">
                <li>✓ System-assigned codename</li>
                <li>✓ No public profile</li>
                <li>✓ Win on merit alone</li>
                <li>✓ Stats visible only to you</li>
              </ul>
            </button>
          </div>

          <div className="mt-8 text-center">
            <p className="text-beef-text-muted text-sm">
              Already have an account?{" "}
              <Link href="/auth/signin" className="text-beef-gold hover:text-beef-gold-light transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Registration form ───────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold mb-2">BEEF</h1>
          <p className="section-label">
            {path === "FIGHTER" ? "⚔ FIGHTER REGISTRATION" : "👻 GHOST REGISTRATION"}
          </p>
        </div>

        <div className="card-beef">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">
              {path === "FIGHTER" ? "Create your public identity" : "Enter the arena anonymously"}
            </h2>
            <button
              onClick={() => setPath(null)}
              className="text-xs text-beef-text-muted hover:text-beef-gold transition-colors"
            >
              ← Change
            </button>
          </div>

          {error && (
            <div className="bg-red-900/20 border border-red-500 text-red-500 px-4 py-3 rounded-lg mb-6 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">

            {path === "FIGHTER" && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">Username</label>
                  <input
                    type="text"
                    required
                    value={formData.username}
                    onChange={(e) => set("username", e.target.value)}
                    className="w-full px-4 py-3 bg-beef-bg-light border border-beef-border rounded-lg focus:outline-none focus:border-beef-gold transition-colors"
                    placeholder="username"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Handle <span className="text-beef-text-muted text-xs">(Your @handle)</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-3 text-beef-gold">@</span>
                    <input
                      type="text"
                      required
                      value={formData.handle}
                      onChange={(e) => set("handle", e.target.value)}
                      className="w-full pl-8 pr-4 py-3 bg-beef-bg-light border border-beef-border rounded-lg focus:outline-none focus:border-beef-gold transition-colors"
                      placeholder="yourhandle"
                    />
                  </div>
                </div>
              </>
            )}

            {path === "GHOST" && (
              <div className="bg-beef-bg-light border border-beef-border/50 rounded-lg px-4 py-3 text-sm text-beef-text-muted">
                A unique codename will be assigned — e.g.{" "}
                <span className="text-beef-gold font-bold">IRON WOLF #4471</span>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2">
                Email{" "}
                <span className="text-beef-text-muted text-xs">(private — for account recovery only)</span>
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => set("email", e.target.value)}
                className="w-full px-4 py-3 bg-beef-bg-light border border-beef-border rounded-lg focus:outline-none focus:border-beef-gold transition-colors"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Date of Birth{" "}
                <span className="text-beef-text-muted text-xs">(must be 18+)</span>
              </label>
              <input
                type="date"
                required
                value={formData.dateOfBirth}
                onChange={(e) => set("dateOfBirth", e.target.value)}
                max={new Date(Date.now() - 18 * 365.25 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]}
                className="w-full px-4 py-3 bg-beef-bg-light border border-beef-border rounded-lg focus:outline-none focus:border-beef-gold transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Password</label>
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => set("password", e.target.value)}
                className="w-full px-4 py-3 bg-beef-bg-light border border-beef-border rounded-lg focus:outline-none focus:border-beef-gold transition-colors"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Confirm Password</label>
              <input
                type="password"
                required
                value={formData.confirmPassword}
                onChange={(e) => set("confirmPassword", e.target.value)}
                className="w-full px-4 py-3 bg-beef-bg-light border border-beef-border rounded-lg focus:outline-none focus:border-beef-gold transition-colors"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading
                ? "Creating Account..."
                : path === "FIGHTER"
                ? "Enter the Arena"
                : "Go Ghost"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-beef-text-muted text-sm">
              Already have an account?{" "}
              <Link href="/auth/signin" className="text-beef-gold hover:text-beef-gold-light transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
