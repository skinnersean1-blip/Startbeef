"use client";

import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { shoePath } from "@/lib/shoepath";

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || shoePath();

  const [formData, setFormData] = useState({ identifier: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      identifier: formData.identifier,
      password: formData.password,
      redirect: false,
    });

    if (result?.error) {
      setError("Invalid email / handle or password");
      setLoading(false);
      return;
    }

    router.push(callbackUrl);
    router.refresh();
  };

  return (
    <div className="border border-shoe-border bg-shoe-panel p-8">
      <h2 className="text-xl font-bold text-shoe-cream tracking-tight mb-6">SIGN IN</h2>

      {error && (
        <div className="border border-red-500 text-red-400 px-4 py-3 mb-6 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label-shoe block mb-2">EMAIL OR HANDLE</label>
          <input
            type="text"
            required
            value={formData.identifier}
            onChange={(e) => setFormData({ ...formData, identifier: e.target.value })}
            className="input-shoe w-full"
            placeholder="email or @handle"
          />
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

        <button
          type="submit"
          disabled={loading}
          className="btn-shoe-primary w-full disabled:opacity-50"
        >
          {loading ? "SIGNING IN..." : "SIGN IN"}
        </button>
      </form>

      <div className="mt-6 text-center space-y-3">
        <p className="text-shoe-cream-dim text-sm">
          No account?{" "}
          <Link href="/auth/signup" className="text-shoe-accent hover:underline">
            Create one
          </Link>
        </p>
        <Link href="/auth/forgot-password" className="block text-shoe-cream-dim text-sm hover:text-shoe-cream transition-colors">
          Forgot password?
        </Link>
        <Link href={shoePath()} className="block text-shoe-cream-dim text-xs tracking-widest hover:text-shoe-cream transition-colors">
          BROWSE WITHOUT SIGNING IN →
        </Link>
      </div>
    </div>
  );
}

export default function ShoeSignInPage() {
  return (
    <div className="min-h-screen bg-shoe-bg">

      <header className="bg-shoe-bg-deep border-b border-shoe-border overflow-hidden">
        <div className="container-shoe pt-5 pb-1 flex items-center justify-between gap-6">
          <p className="label-shoe">Buy, Swap, Sell</p>
          <Link href="/auth/signup" className="text-shoe-cream-dim text-xs tracking-widest hover:text-shoe-accent transition-colors">
            CREATE ACCOUNT →
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
          <p className="label-shoe text-center mb-8">WELCOME BACK</p>
          <Suspense fallback={<div className="border border-shoe-border bg-shoe-panel h-64 animate-pulse" />}>
            <SignInForm />
          </Suspense>
        </div>
      </main>
    </div>
  );
}
