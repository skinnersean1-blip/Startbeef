"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

function VerifyContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") || "";
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) { setStatus("error"); setError("No verification token found."); return; }

    fetch("/api/auth/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) { setStatus("ok"); setTimeout(() => router.push("/"), 2500); }
        else { setStatus("error"); setError(d.error || "Verification failed."); }
      })
      .catch(() => { setStatus("error"); setError("Something went wrong."); });
  }, [token]);

  return (
    <div className="card-beef text-center py-10 max-w-md w-full">
      {status === "loading" && <p className="text-beef-text-muted animate-pulse text-sm tracking-widest">VERIFYING...</p>}
      {status === "ok" && (
        <>
          <p className="text-3xl font-bold mb-3">YOU&apos;RE VERIFIED</p>
          <p className="text-beef-text-muted text-sm">Welcome to the arena. Redirecting...</p>
        </>
      )}
      {status === "error" && (
        <>
          <p className="text-xl font-bold mb-3 text-beef-orange">VERIFICATION FAILED</p>
          <p className="text-beef-text-muted text-sm mb-6">{error}</p>
          <Link href="/auth/signin" className="text-beef-gold hover:text-beef-gold-light text-sm transition-colors">
            Back to sign in
          </Link>
        </>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4">
      <div className="flex flex-col items-center gap-6 w-full">
        <div className="text-center">
          <h1 className="text-5xl font-bold mb-2">BEEF</h1>
          <p className="section-label">EMAIL VERIFICATION</p>
        </div>
        <Suspense fallback={<div className="card-beef text-center py-10 max-w-md w-full animate-pulse" />}>
          <VerifyContent />
        </Suspense>
      </div>
    </div>
  );
}
