"use client";

import { useEffect, useState } from "react";

interface Bet {
  userId: string;
  userHandle: string;
  predictedWinnerId: string;
  stake: number;
  createdAt: string;
}

interface Props {
  beefId: string;
  challengerId: string;
  challengerHandle: string;
  responderId: string;
  responderHandle: string;
}

export function PeanutGallery({
  beefId,
  challengerId,
  challengerHandle,
  responderId,
  responderHandle,
}: Props) {
  const [bets, setBets] = useState<Bet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBets() {
      try {
        const res = await fetch(`/api/beef/${beefId}/sidecard/list`);
        if (res.ok) {
          const data = await res.json();
          setBets(data.bets || []);
        }
      } catch (error) {
        console.error("Failed to fetch bets:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchBets();
    // Refresh every 10 seconds
    const interval = setInterval(fetchBets, 10000);
    return () => clearInterval(interval);
  }, [beefId]);

  const challengerBets = bets.filter(b => b.predictedWinnerId === challengerId);
  const responderBets = bets.filter(b => b.predictedWinnerId === responderId);

  if (loading) {
    return (
      <div className="card-beef">
        <p className="section-label mb-3">PEANUT GALLERY</p>
        <p className="text-muted text-sm">Loading bets...</p>
      </div>
    );
  }

  if (bets.length === 0) {
    return (
      <div className="card-beef">
        <p className="section-label mb-3">PEANUT GALLERY</p>
        <p className="text-muted text-sm">No side bets placed yet</p>
      </div>
    );
  }

  return (
    <div className="card-beef">
      <p className="section-label mb-4">PEANUT GALLERY</p>
      <p className="text-muted text-xs mb-4">{bets.length} bet{bets.length !== 1 ? 's' : ''} placed</p>

      {/* Challenger bets */}
      {challengerBets.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1 h-4 bg-red-500 rounded"></div>
            <p className="text-xs font-bold text-red-400">BETTING ON @{challengerHandle}</p>
          </div>
          <div className="space-y-1.5 pl-3">
            {challengerBets.map((bet, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <span className="text-beef-text-muted">@{bet.userHandle}</span>
                <span className="text-beef-gold font-mono">${bet.stake.toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="mt-2 pt-2 border-t border-beef-border/30">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted">Total:</span>
              <span className="text-red-400 font-bold font-mono">
                ${challengerBets.reduce((sum, b) => sum + b.stake, 0).toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Responder bets */}
      {responderBets.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1 h-4 bg-yellow-500 rounded"></div>
            <p className="text-xs font-bold text-yellow-400">BETTING ON @{responderHandle}</p>
          </div>
          <div className="space-y-1.5 pl-3">
            {responderBets.map((bet, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <span className="text-beef-text-muted">@{bet.userHandle}</span>
                <span className="text-beef-gold font-mono">${bet.stake.toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="mt-2 pt-2 border-t border-beef-border/30">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted">Total:</span>
              <span className="text-yellow-400 font-bold font-mono">
                ${responderBets.reduce((sum, b) => sum + b.stake, 0).toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
