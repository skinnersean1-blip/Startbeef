"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { BackButton } from "@/components/BackButton";

function TwoFactorForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");

  useEffect(() => {
    const emailParam = searchParams.get("email");
    if (!emailParam) {
      router.push("/auth/signin");
      return;
    }
    setEmail(emailParam);
  }, [searchParams, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) {
      setError("Please enter a 6-digit code");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Verify 2FA code
      const verifyRes = await fetch("/api/user/2fa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token: code }),
      });

      if (!verifyRes.ok) {
        const data = await verifyRes.json();
        setError(data.error || "Invalid code");
        setLoading(false);
        setCode("");
        return;
      }

      // If verified, complete sign-in
      // The password should be in session storage from the previous step
      const password = sessionStorage.getItem("pending-2fa-password");
      if (!password) {
        setError("Session expired. Please sign in again.");
        router.push("/auth/signin");
        return;
      }

      const signInResult = await signIn("credentials", {
        identifier: email,
        password: password,
        redirect: false,
      });

      // Clear the temporary password
      sessionStorage.removeItem("pending-2fa-password");

      if (signInResult?.error) {
        setError("Sign in failed. Please try again.");
        setLoading(false);
        return;
      }

      // Success!
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError("Something went wrong");
      setLoading(false);
    }
  };

  return (
    <div className="card-beef">
      <h2 className="text-xl font-bold mb-2 text-center">Enter Verification Code</h2>
      <p className="text-sm text-beef-text-muted mb-6 text-center">
        Enter the 6-digit code from your authenticator app
      </p>

      {error && (
        <div className="bg-red-900/20 border border-red-500 text-red-500 px-4 py-3 rounded-lg mb-6 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="000000"
            autoFocus
            className="w-full px-4 py-4 bg-beef-bg-light border border-beef-border rounded-lg focus:outline-none focus:border-beef-gold text-center text-3xl font-mono tracking-widest"
            maxLength={6}
          />
        </div>

        <button
          type="submit"
          disabled={loading || code.length !== 6}
          className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Verifying..." : "Verify"}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-beef-text-muted text-xs mb-2">
          Lost access to your authenticator?
        </p>
        <p className="text-beef-text-muted text-xs">
          Use a backup code instead
        </p>
      </div>

      <div className="mt-6 text-center pt-6 border-t border-beef-border">
        <Link href="/auth/signin" className="text-sm text-beef-text-muted hover:text-beef-gold transition-colors">
          ← Back to Sign In
        </Link>
      </div>
    </div>
  );
}

export default function TwoFactorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        <div className="mb-6"><BackButton /></div>

        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold mb-2">BEEF</h1>
          <p className="section-label">🔐 TWO-FACTOR AUTHENTICATION</p>
        </div>

        <Suspense fallback={<div className="card-beef animate-pulse h-64" />}>
          <TwoFactorForm />
        </Suspense>
      </div>
    </div>
  );
}
