"use client";

import { useState } from "react";

export default function AdminResetPage() {
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const resetPassword = async () => {
    setLoading(true);
    setStatus("Resetting password...");

    try {
      const res = await fetch("/api/admin/reset-my-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "sean@startbeef.com",
          newPassword: "StartBeef2026!",
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setStatus("✅ Password reset! You can now sign in with StartBeef2026!");
      } else {
        const details = data.details ? ` (${data.details})` : "";
        setStatus(`❌ Error: ${data.error || "Something went wrong"}${details}`);
      }
    } catch (err) {
      setStatus(`❌ Error: ${err instanceof Error ? err.message : "Network error"}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-beef-bg flex items-center justify-center p-4">
      <div className="bg-beef-bg-card border border-beef-border rounded-lg p-8 max-w-md w-full text-center">
        <h1 className="text-3xl font-bold mb-4">Admin Password Reset</h1>
        <p className="text-beef-text-muted mb-6">
          Click the button below to reset your password to StartBeef2026!
        </p>

        <button
          onClick={resetPassword}
          disabled={loading}
          className="w-full btn-primary py-3 disabled:opacity-50 mb-4"
        >
          {loading ? "Resetting..." : "Reset My Password"}
        </button>

        {status && (
          <div className={`p-4 rounded-lg ${
            status.includes("✅")
              ? "bg-green-500/10 border border-green-500/20 text-green-500"
              : status.includes("❌")
              ? "bg-red-500/10 border border-red-500/20 text-red-500"
              : "bg-beef-gold/10 border border-beef-gold/20 text-beef-gold"
          }`}>
            {status}
          </div>
        )}

        {status.includes("✅") && (
          <a
            href="/auth/signin"
            className="mt-4 inline-block text-beef-gold hover:underline"
          >
            → Go to Sign In
          </a>
        )}
      </div>
    </div>
  );
}
