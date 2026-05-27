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
          <input
            type="password"
            required
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            className="input-shoe w-full"
            placeholder="••••••••"
          />
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
    <div className="min-h-screen bg-shoe-bg flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <p className="label-shoe mb-1">CHILDREN&apos;S SHOE EXCHANGE</p>
          <Link href={shoePath()}>
            <h1 className="text-5xl font-bold text-shoe-cream tracking-tight hover:text-shoe-accent transition-colors">SHOE-SHOE</h1>
          </Link>
          <p className="label-shoe mt-2">WELCOME BACK</p>
        </div>
        <Suspense fallback={<div className="border border-shoe-border bg-shoe-panel h-64 animate-pulse" />}>
          <SignInForm />
        </Suspense>
      </div>
    </div>
  );
}
