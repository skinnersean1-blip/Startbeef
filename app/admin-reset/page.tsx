"use client";

import { useState } from "react";

export default function AdminResetPage() {
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [balanceAmount, setBalanceAmount] = useState("10");

  const checkUser = async () => {
    try {
      const res = await fetch("/api/admin/check-user");
      const data = await res.json();
      setUserInfo(data);
    } catch (err) {
      setUserInfo({ error: "Failed to check user" });
    }
  };

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

  const cleanupPending = async () => {
    setStatus("Cleaning up pending withdrawals...");
    try {
      const res = await fetch("/api/admin/cleanup-pending", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setStatus(`✅ ${data.message}`);
      } else {
        setStatus(`❌ ${data.error}`);
      }
    } catch (err) {
      setStatus(`❌ Error: ${err instanceof Error ? err.message : "Network error"}`);
    }
  };

  const addBalance = async () => {
    setStatus(`Adding $${balanceAmount} to balance...`);
    try {
      const res = await fetch("/api/admin/add-balance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: parseFloat(balanceAmount) }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus(`✅ ${data.message}. New balance: $${data.newBalance.toFixed(2)}`);
      } else {
        setStatus(`❌ ${data.error}`);
      }
    } catch (err) {
      setStatus(`❌ Error: ${err instanceof Error ? err.message : "Network error"}`);
    }
  };

  return (
    <div className="min-h-screen bg-beef-bg flex items-center justify-center p-4">
      <div className="bg-beef-bg-card border border-beef-border rounded-lg p-8 max-w-md w-full text-center">
        <h1 className="text-3xl font-bold mb-4">Admin Tools</h1>
        <p className="text-beef-text-muted mb-6">
          Testing and debugging tools
        </p>

        <button
          onClick={checkUser}
          className="w-full bg-beef-gold/20 border border-beef-gold text-beef-gold py-3 rounded-lg hover:bg-beef-gold/30 transition-colors mb-2"
        >
          Check If User Exists
        </button>

        {userInfo && (
          <div className="mb-4 p-3 bg-beef-bg border border-beef-border rounded-lg text-sm text-left">
            <pre className="whitespace-pre-wrap">{JSON.stringify(userInfo, null, 2)}</pre>
          </div>
        )}

        <button
          onClick={resetPassword}
          disabled={loading}
          className="w-full btn-primary py-3 disabled:opacity-50 mb-4"
        >
          {loading ? "Resetting..." : "Reset My Password"}
        </button>

        <div className="border-t border-beef-border my-6 pt-6">
          <h2 className="text-xl font-bold mb-4">Balance Tools</h2>

          <button
            onClick={cleanupPending}
            className="w-full bg-red-500/20 border border-red-500 text-red-500 py-3 rounded-lg hover:bg-red-500/30 transition-colors mb-2"
          >
            Delete Pending Withdrawals
          </button>

          <div className="flex gap-2 mb-4">
            <input
              type="number"
              value={balanceAmount}
              onChange={(e) => setBalanceAmount(e.target.value)}
              className="flex-1 px-4 py-2 bg-beef-bg border border-beef-border rounded-lg focus:outline-none focus:border-beef-gold"
              placeholder="Amount"
            />
            <button
              onClick={addBalance}
              className="px-6 py-2 bg-beef-gold text-black font-bold rounded-lg hover:bg-beef-gold/90 transition-colors"
            >
              Add $
            </button>
          </div>
        </div>

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
