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
    <div className="min-h-screen bg-shoe-bg flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <p className="label-shoe mb-1">CHILDREN&apos;S SHOE EXCHANGE</p>
          <Link href={shoePath()}>
            <h1 className="text-5xl font-bold text-shoe-cream tracking-tight hover:text-shoe-accent transition-colors">SHOE-SHOE</h1>
          </Link>
          <p className="label-shoe mt-2">CREATE AN ACCOUNT</p>
        </div>

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
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="input-shoe w-full"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label className="label-shoe block mb-2">CONFIRM PASSWORD</label>
              <input
                type="password"
                required
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className="input-shoe w-full"
                placeholder="••••••••"
              />
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
    </div>
  );
}
