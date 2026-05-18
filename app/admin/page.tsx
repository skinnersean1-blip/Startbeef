"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Withdrawal = {
  id: string;
  userId: string;
  amount: number;
  status: string;
  createdAt: string;
  user: {
    email: string | null;
    handle: string | null;
    username: string;
    anonHandle: string | null;
    isAnonymous: boolean;
    bankBalance: number;
  } | null;
};

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchWithdrawals = async () => {
    const res = await fetch("/api/admin/withdrawals");
    if (res.status === 403) { router.push("/"); return; }
    const data = await res.json();
    setWithdrawals(data.withdrawals ?? []);
    setLoading(false);
  };

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/auth/signin"); return; }
    if (status === "authenticated") fetchWithdrawals();
  }, [status]);

  const handle = async (id: string, newStatus: "COMPLETED" | "FAILED") => {
    setUpdating(id);
    setMessage(null);
    const res = await fetch("/api/admin/withdrawals", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: newStatus }),
    });
    setUpdating(null);
    if (res.ok) {
      setMessage({ type: "success", text: newStatus === "COMPLETED" ? "Marked as paid out." : "Marked failed — balance refunded." });
      fetchWithdrawals();
    } else {
      const d = await res.json();
      setMessage({ type: "error", text: d.error || "Something went wrong" });
    }
  };

  const pending   = withdrawals.filter((w) => w.status === "PENDING");
  const processed = withdrawals.filter((w) => w.status !== "PENDING");

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><p className="text-beef-text-muted">Loading...</p></div>;
  }

  return (
    <div className="min-h-screen">
      <header className="container-beef py-6">
        <div className="flex items-center justify-between">
          <Link href="/">
            <div className="cursor-pointer">
              <p className="section-label mb-1">ADMIN</p>
              <h1 className="text-4xl font-bold tracking-tighter">BEEF</h1>
            </div>
          </Link>
          <p className="text-xs text-beef-text-muted">{session?.user?.email}</p>
        </div>
      </header>

      <div className="container-beef pb-20">
        <div className="max-w-3xl mx-auto">

          {message && (
            <div className={`mb-6 px-4 py-3 rounded-lg border text-sm ${
              message.type === "success"
                ? "bg-beef-gold/10 border-beef-gold text-beef-gold"
                : "bg-red-900/20 border-red-500 text-red-400"
            }`}>
              {message.text}
            </div>
          )}

          {/* Pending withdrawals */}
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <p className="section-label">PENDING WITHDRAWALS</p>
              {pending.length > 0 && (
                <span className="text-xs font-bold bg-beef-orange/20 text-beef-orange px-2 py-0.5 rounded-full">
                  {pending.length} outstanding
                </span>
              )}
            </div>

            {pending.length === 0 ? (
              <div className="card-beef text-center py-10">
                <p className="text-beef-text-muted text-sm">No pending withdrawals.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pending.map((w) => (
                  <div key={w.id} className="card-beef border-beef-orange/30">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-bold text-xl text-beef-gold">${w.amount.toFixed(2)}</p>
                        <p className="text-sm text-beef-text-muted mt-1">
                          {w.user?.isAnonymous
                            ? w.user.anonHandle
                            : `@${w.user?.handle || w.user?.username}`}
                          {" · "}
                          <span className="text-beef-text">{w.user?.email}</span>
                        </p>
                        <p className="text-xs text-beef-text-muted mt-1">
                          Bank balance after payout: ${((w.user?.bankBalance ?? 0)).toFixed(2)}
                        </p>
                        <p className="text-xs text-beef-text-muted mt-1">
                          Requested {new Date(w.createdAt).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                      <div className="flex flex-col gap-2 flex-shrink-0">
                        <button
                          onClick={() => handle(w.id, "COMPLETED")}
                          disabled={updating === w.id}
                          className="btn-primary text-sm px-4 py-2 disabled:opacity-50"
                        >
                          {updating === w.id ? "..." : "Mark Paid"}
                        </button>
                        <button
                          onClick={() => handle(w.id, "FAILED")}
                          disabled={updating === w.id}
                          className="px-4 py-2 text-sm border border-red-500/50 text-red-400 rounded-lg hover:border-red-500 transition-colors disabled:opacity-50"
                        >
                          Refund
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Processed */}
          {processed.length > 0 && (
            <div>
              <p className="section-label mb-4">PROCESSED</p>
              <div className="space-y-2">
                {processed.map((w) => (
                  <div key={w.id} className="card-beef flex items-center justify-between opacity-60">
                    <div>
                      <p className="text-sm font-bold">${w.amount.toFixed(2)} · {w.user?.email}</p>
                      <p className="text-xs text-beef-text-muted">{new Date(w.createdAt).toLocaleDateString()}</p>
                    </div>
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                      w.status === "COMPLETED" ? "bg-beef-gold/10 text-beef-gold" : "bg-red-900/20 text-red-400"
                    }`}>
                      {w.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
