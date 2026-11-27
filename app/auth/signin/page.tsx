"use client";

import { Suspense, useState, type FormEvent } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { BackButton } from "@/components/BackButton";

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const resetSuccess = searchParams.get("reset") === "1";

  const [formData, setFormData] = useState({
    identifier: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // First, try signing in to check credentials
      const result = await signIn("credentials", {
        identifier: formData.identifier,
        password: formData.password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email/handle or password");
        setLoading(false);
        return;
      }

      // Check if user has 2FA enabled
      const statsRes = await fetch("/api/user/stats");
      if (statsRes.ok) {
        const stats = await statsRes.json();
        if (stats.twoFactorEnabled) {
          // Sign out temporarily and redirect to 2FA page
          // Store password temporarily for after 2FA verification
          sessionStorage.setItem("pending-2fa-password", formData.password);
          sessionStorage.setItem("pending-2fa-email", formData.identifier);

          // Redirect to 2FA verification
          router.push(`/auth/2fa?email=${encodeURIComponent(formData.identifier)}`);
          return;
        }
      }

      // No 2FA or check failed - proceed normally
      router.push(callbackUrl);
      router.refresh();
    } catch {
      setError("Something went wrong");
      setLoading(false);
    }
  };

  return (
    <div className="card-beef">
      <h2 className="text-2xl font-bold mb-6">Sign In</h2>

      {resetSuccess && (
        <div className="bg-green-900/20 border border-green-500 text-green-400 px-4 py-3 rounded-lg mb-6 text-sm">
          Password updated — sign in with your new password.
        </div>
      )}

      {error && (
        <div className="bg-red-900/20 border border-red-500 text-red-500 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="identifier" className="block text-sm font-medium mb-2">
            Email or Handle
          </label>
          <input
            id="identifier"
            type="text"
            required
            value={formData.identifier}
            onChange={(e) =>
              setFormData({ ...formData, identifier: e.target.value })
            }
            className="w-full px-4 py-3 bg-beef-bg-light border border-beef-border rounded-lg focus:outline-none focus:border-beef-gold transition-colors"
            placeholder="email or @handle"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-2">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              required
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              className="w-full px-4 py-3 pr-12 bg-beef-bg-light border border-beef-border rounded-lg focus:outline-none focus:border-beef-gold transition-colors"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-beef-text-muted hover:text-beef-gold transition-colors"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              )}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>
        <div className="text-center">
          <Link href="/auth/forgot-password" className="text-beef-text-muted hover:text-beef-gold text-xs transition-colors tracking-widest">
            FORGOT PASSWORD?
          </Link>
        </div>
      </form>

      <div className="mt-6 text-center">
        <p className="text-muted text-sm">
          Don&apos;t have an account?{" "}
          <Link
            href="/auth/signup"
            className="text-beef-gold hover:text-beef-gold-light transition-colors"
          >
            Create one
          </Link>
        </p>
      </div>

      <div className="mt-4 text-center">
        <Link
          href="/"
          className="text-muted text-sm hover:text-beef-gold transition-colors"
        >
          Continue as guest (watch only)
        </Link>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="mb-6"><BackButton /></div>
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold mb-2">BEEF</h1>
          <p className="section-label">WELCOME BACK</p>
        </div>

        <Suspense fallback={<div className="card-beef animate-pulse h-64" />}>
          <SignInForm />
        </Suspense>
      </div>
    </div>
  );
}
