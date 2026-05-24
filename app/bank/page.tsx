"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { BackButton } from "@/components/BackButton";

type Transaction = {
  id: string;
  type: string;
  amount: number;
  status: string;
  relatedBeefId: string | null;
  createdAt: string;
};

const TYPE_LABEL: Record<string, string> = {
  DEPOSIT: "Deposit",
  WITHDRAWAL: "Withdrawal",
  ANTE: "Ante Locked",
  PAYOUT: "Winnings",
  REFUND: "Refund",
};

const TYPE_COLOR: Record<string, string> = {
  DEPOSIT: "text-beef-gold",
  WITHDRAWAL: "text-beef-orange",
  ANTE: "text-beef-text-muted",
  PAYOUT: "text-beef-gold",
  REFUND: "text-beef-gold",
};

const TYPE_SIGN: Record<string, string> = {
  DEPOSIT: "+",
  WITHDRAWAL: "−",
  ANTE: "−",
  PAYOUT: "+",
  REFUND: "+",
};

function BankContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [balance, setBalance] = useState<number | null>(null);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [depositLoading, setDepositLoading] = useState(false);
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const depositStatus = searchParams.get("deposit");

  const fetchBalance = useCallback(async () => {
    const res = await fetch("/api/bank/balance");
    if (res.ok) {
      const data = await res.json();
      setBalance(data.balance);
      setTotalEarnings(data.totalEarnings);
      setTransactions(data.transactions);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
      return;
    }
    if (status === "authenticated") {
      fetchBalance();
    }
  }, [status, router, fetchBalance]);

  useEffect(() => {
    if (depositStatus === "success") {
      setMessage({ type: "success", text: "Deposit successful! Your balance will update shortly." });
    } else if (depositStatus === "cancelled") {
      setMessage({ type: "error", text: "Deposit cancelled." });
    }
  }, [depositStatus]);

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setDepositLoading(true);

    try {
      const res = await fetch("/api/bank/deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: parseFloat(depositAmount) }),
      });

      const data = await res.json();
      setDepositLoading(false);

      if (!res.ok) {
        setMessage({ type: "error", text: data.error || "Something went wrong" });
        return;
      }

      if (!data.url) {
        setMessage({ type: "error", text: "No checkout URL returned — check Stripe config" });
        return;
      }

      window.location.href = data.url;
    } catch {
      setDepositLoading(false);
      setMessage({ type: "error", text: "Could not reach the server. Try again." });
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setWithdrawLoading(true);

    const res = await fetch("/api/bank/withdraw", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: parseFloat(withdrawAmount) }),
    });

    const data = await res.json();
    setWithdrawLoading(false);

    if (!res.ok) {
      setMessage({ type: "error", text: data.error });
      return;
    }

    setMessage({ type: "success", text: data.message });
    setWithdrawAmount("");
    fetchBalance();
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-beef-text-muted">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="container-beef py-6">
        <div className="flex items-center justify-between">
          <Link href="/">
            <div className="cursor-pointer">
              <p className="section-label mb-1">OPINION MARKET</p>
              <h1 className="text-4xl font-bold tracking-tighter">BEEF</h1>
            </div>
          </Link>
          <Link
            href={`/@${session?.user?.handle || session?.user?.username}`}
            className="text-sm text-beef-text-muted hover:text-beef-gold transition-colors"
          >
            @{session?.user?.handle || session?.user?.username}
          </Link>
        </div>
      </header>

      <div className="container-beef pb-20">
        <div className="mb-6"><BackButton /></div>
        <div className="max-w-2xl mx-auto">

          <div className="mb-8">
            <p className="section-label mb-2">BEEF BANK</p>
            <h2 className="text-4xl sm:text-5xl font-bold tracking-tighter">
              {balance !== null ? (
                <span className="text-beef-gold">${balance.toFixed(2)}</span>
              ) : "—"}
            </h2>
            <p className="text-beef-text-muted text-sm mt-1">
              All-time earnings: ${totalEarnings.toFixed(2)}
            </p>
          </div>

          {message && (
            <div className={`mb-6 px-4 py-3 rounded-lg border text-sm ${
              message.type === "success"
                ? "bg-beef-gold/10 border-beef-gold text-beef-gold"
                : "bg-red-900/20 border-red-500 text-red-400"
            }`}>
              {message.text}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
            {/* Deposit */}
            <div className="card-beef">
              <p className="section-label mb-4">DEPOSIT FUNDS</p>
              <form onSubmit={handleDeposit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Amount (USD)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-3 text-beef-gold font-bold">$</span>
                    <input
                      type="number"
                      min="5"
                      max="10000"
                      step="1"
                      required
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      className="w-full pl-8 pr-4 py-3 bg-beef-bg-light border border-beef-border rounded-lg focus:outline-none focus:border-beef-gold transition-colors"
                      placeholder="50"
                    />
                  </div>
                  <p className="text-xs text-beef-text-muted mt-1">Min $5 · Max $10,000</p>
                </div>
                <button
                  type="submit"
                  disabled={depositLoading}
                  className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {depositLoading ? "Redirecting..." : "Deposit via Stripe"}
                </button>
              </form>
            </div>

            {/* Withdraw */}
            <div className="card-beef">
              <p className="section-label mb-4">WITHDRAW FUNDS</p>
              <form onSubmit={handleWithdraw} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Amount (USD)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-3 text-beef-gold font-bold">$</span>
                    <input
                      type="number"
                      min="5"
                      max={balance ?? undefined}
                      step="1"
                      required
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      className="w-full pl-8 pr-4 py-3 bg-beef-bg-light border border-beef-border rounded-lg focus:outline-none focus:border-beef-gold transition-colors"
                      placeholder="50"
                    />
                  </div>
                  <p className="text-xs text-beef-text-muted mt-1">
                    Available: ${(balance ?? 0).toFixed(2)} · 2–3 business days
                  </p>
                </div>
                <button
                  type="submit"
                  disabled={withdrawLoading || (balance ?? 0) <= 0}
                  className="w-full btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {withdrawLoading ? "Requesting..." : "Request Withdrawal"}
                </button>
              </form>
            </div>
          </div>

          {/* Transaction history */}
          <div>
            <p className="section-label mb-4">TRANSACTION HISTORY</p>
            {transactions.length === 0 ? (
              <div className="card-beef text-center py-10">
                <p className="text-beef-text-muted text-sm">No transactions yet. Deposit funds to start beefing.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {transactions.map((tx) => (
                  <div key={tx.id} className="card-beef flex items-center justify-between">
                    <div>
                      <p className="font-bold text-sm">{TYPE_LABEL[tx.type] ?? tx.type}</p>
                      <p className="text-xs text-beef-text-muted">
                        {new Date(tx.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                        {tx.status === "PENDING" && (
                          <span className="ml-2 text-beef-orange">· Pending</span>
                        )}
                      </p>
                      {tx.relatedBeefId && (
                        <Link
                          href={`/beef/${tx.relatedBeefId}`}
                          className="text-xs text-beef-gold hover:text-beef-gold-light transition-colors"
                        >
                          View Beef →
                        </Link>
                      )}
                    </div>
                    <p className={`text-lg font-bold ${TYPE_COLOR[tx.type] ?? "text-beef-text"}`}>
                      {TYPE_SIGN[tx.type] ?? ""}${tx.amount.toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="text-center mt-10">
            <Link href="/" className="text-beef-text-muted text-sm hover:text-beef-gold transition-colors">
              ← BACK TO RINGSIDE
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BankPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><p className="text-beef-text-muted">Loading...</p></div>}>
      <BankContent />
    </Suspense>
  );
}
