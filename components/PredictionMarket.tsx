"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";

interface MarketStats {
  totalPool: number;
  challengerPool: number;
  responderPool: number;
  challengerOdds: number;
  responderOdds: number;
  challengerBetCount: number;
  responderBetCount: number;
}

interface PredictionMarketProps {
  beefId: string;
  challengerId: string;
  challengerHandle: string;
  responderId: string;
  responderHandle: string;
  status: string;
}

export function PredictionMarket({
  beefId,
  challengerId,
  challengerHandle,
  responderId,
  responderHandle,
  status,
}: PredictionMarketProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [stats, setStats] = useState<MarketStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [betAmount, setBetAmount] = useState("10");
  const [selectedSide, setSelectedSide] = useState<"challenger" | "responder" | null>(null);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState("");

  const COMMISSION_RATE = 0.01; // 1%

  useEffect(() => {
    fetchStats();
  }, [beefId]);

  const fetchStats = async () => {
    try {
      const res = await fetch(`/api/beef/${beefId}/sidecard`);
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    } finally {
      setLoading(false);
    }
  };

  const placeBet = async (predictedWinnerId: string) => {
    if (!session?.user) {
      setError("Sign in to place a bet");
      return;
    }

    const stake = parseFloat(betAmount);
    if (isNaN(stake) || stake < 1) {
      setError("Minimum bet is $1");
      return;
    }

    setPlacing(true);
    setError("");

    try {
      const res = await fetch(`/api/beef/${beefId}/sidecard`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ predictedWinnerId, stake }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to place bet");
        setPlacing(false);
        return;
      }

      // Success - refresh stats and close
      await fetchStats();
      setSelectedSide(null);
      router.refresh();
    } catch (err) {
      setError("Something went wrong");
      setPlacing(false);
    }
  };

  if (status !== "LIVE") {
    return null; // Only show for LIVE beefs
  }

  if (loading) {
    return (
      <div className="card-beef animate-pulse">
        <div className="h-32 bg-beef-bg-light rounded"></div>
      </div>
    );
  }

  const commission = parseFloat(betAmount) * COMMISSION_RATE;
  const netStake = parseFloat(betAmount) - commission;

  return (
    <div className="card-beef border-beef-gold/30 mb-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="section-label mb-1">PREDICTION MARKET</p>
          <p className="text-xs text-muted">1% fee • Winner side splits loser pool</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted">TOTAL POOL</p>
          <p className="text-2xl font-bold text-beef-gold">${stats?.totalPool.toFixed(2) || "0.00"}</p>
        </div>
      </div>

      {/* Market Odds */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="card-beef bg-beef-bg-light border-beef-gold/20 text-center">
          <p className="text-xs text-muted mb-2">@{challengerHandle}</p>
          <p className="text-4xl font-bold text-beef-gold mb-1">{stats?.challengerOdds}%</p>
          <p className="text-xs text-muted">${stats?.challengerPool.toFixed(2)} • {stats?.challengerBetCount} bets</p>
        </div>

        <div className="card-beef bg-beef-bg-light border-beef-gold/20 text-center">
          <p className="text-xs text-muted mb-2">@{responderHandle}</p>
          <p className="text-4xl font-bold text-beef-gold mb-1">{stats?.responderOdds}%</p>
          <p className="text-xs text-muted">${stats?.responderPool.toFixed(2)} • {stats?.responderBetCount} bets</p>
        </div>
      </div>

      {/* Bet Placement */}
      {!session?.user ? (
        <div className="text-center py-6 border-t border-beef-border">
          <p className="text-muted text-sm mb-4">Sign in to place a bet</p>
          <div className="flex gap-3 justify-center">
            <Link href="/auth/signin" className="btn-secondary text-sm px-6 py-2">
              SIGN IN
            </Link>
          </div>
        </div>
      ) : selectedSide === null ? (
        <div className="border-t border-beef-border pt-6">
          <p className="text-sm font-bold mb-4 text-center">PLACE YOUR BET</p>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setSelectedSide("challenger")}
              className="btn-secondary text-sm py-3"
            >
              BET ON @{challengerHandle}
            </button>
            <button
              onClick={() => setSelectedSide("responder")}
              className="btn-secondary text-sm py-3"
            >
              BET ON @{responderHandle}
            </button>
          </div>
        </div>
      ) : (
        <div className="border-t border-beef-border pt-6">
          <p className="text-sm font-bold mb-4">
            BETTING ON @{selectedSide === "challenger" ? challengerHandle : responderHandle}
          </p>

          {error && (
            <div className="bg-red-900/20 border border-red-500 text-red-500 px-4 py-2 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Amount ($)</label>
            <input
              type="number"
              min="1"
              step="1"
              value={betAmount}
              onChange={(e) => setBetAmount(e.target.value)}
              className="w-full px-4 py-3 bg-beef-bg-light border border-beef-border rounded-lg focus:outline-none focus:border-beef-gold transition-colors"
              placeholder="10"
            />
          </div>

          <div className="bg-beef-bg-light border border-beef-border rounded-lg p-4 mb-4 text-sm">
            <div className="flex justify-between mb-2">
              <span className="text-muted">Bet amount:</span>
              <span className="font-bold">${betAmount}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-muted">Beef fee (1%):</span>
              <span className="font-bold text-beef-orange">-${commission.toFixed(2)}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-beef-border">
              <span className="font-bold">To pool:</span>
              <span className="font-bold text-beef-gold">${netStake.toFixed(2)}</span>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() =>
                placeBet(selectedSide === "challenger" ? challengerId : responderId)
              }
              disabled={placing}
              className="flex-1 btn-primary disabled:opacity-50"
            >
              {placing ? "Placing Bet..." : `PLACE $${betAmount} BET`}
            </button>
            <button
              onClick={() => {
                setSelectedSide(null);
                setError("");
              }}
              disabled={placing}
              className="px-6 py-3 border border-beef-border rounded-full hover:border-beef-gold hover:text-beef-gold transition-colors disabled:opacity-50"
            >
              CANCEL
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
