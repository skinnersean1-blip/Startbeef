"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { shoePath } from "@/lib/shoepath";

export default function ShoeSignUpPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    username: "",
    handle: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: formData.email,
        username: formData.username,
        handle: formData.handle,
        password: formData.password,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Something went wrong");
      setLoading(false);
      return;
    }

    const signInResult = await signIn("credentials", {
      identifier: formData.email,
      password: formData.password,
      redirect: false,
    });

    if (signInResult?.error) {
      setError("Account created! Please sign in.");
      setLoading(false);
      return;
    }

    router.push(shoePath());
    router.refresh();
  };

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
          <p className="label-shoe text-center mb-8">CREATE AN ACCOUNT</p>

        <div className="border border-shoe-border bg-shoe-panel p-8">
          <h2 className="text-xl font-bold text-shoe-cream tracking-tight mb-6">JOIN SHOE-SHOE</h2>

          {error && (
            <div className="border border-red-500 text-red-400 px-4 py-3 mb-6 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label-shoe block mb-2">EMAIL</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="input-shoe w-full"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label className="label-shoe block mb-2">USERNAME</label>
              <input
                type="text"
                required
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="input-shoe w-full"
                placeholder="username"
              />
            </div>

            <div>
              <label className="label-shoe block mb-2">HANDLE</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-shoe-accent font-bold">@</span>
                <input
                  type="text"
                  required
                  value={formData.handle}
                  onChange={(e) => setFormData({ ...formData, handle: e.target.value })}
                  className="input-shoe w-full pl-7"
                  placeholder="yourhandle"
                />
              </div>
            </div>

            <div>
              <label className="label-shoe block mb-2">PASSWORD</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
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
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
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
              {loading ? "CREATING ACCOUNT..." : "CREATE ACCOUNT"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-shoe-cream-dim text-sm">
              Already have an account?{" "}
              <Link href="/auth/signin" className="text-shoe-accent hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
        </div>
      </main>
    </div>
  );
}
