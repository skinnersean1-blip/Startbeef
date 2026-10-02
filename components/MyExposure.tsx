"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

interface Bet {
  userId: string;
  predictedWinnerId: string;
  stake: number;
}

interface Props {
  beefId: string;
  challengerId: string;
  challengerHandle: string;
  responderId: string;
  responderHandle: string;
}

export function MyExposure({
  beefId,
  challengerId,
  challengerHandle,
  responderId,
  responderHandle,
}: Props) {
  const { data: session } = useSession();
  const [bets, setBets] = useState<Bet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBets() {
      if (!session?.user?.id) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`/api/beef/${beefId}/sidecard/list`);
        if (res.ok) {
          const data = await res.json();
          const myBets = (data.bets || []).filter(
            (b: Bet) => b.userId === session.user.id
          );
          setBets(myBets);
        }
      } catch (error) {
        console.error("Failed to fetch bets:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchBets();
    const interval = setInterval(fetchBets, 10000);
    return () => clearInterval(interval);
  }, [beefId, session?.user?.id]);

  if (!session?.user || loading) return null;
  if (bets.length === 0) return null;

  const challengerBets = bets.filter(b => b.predictedWinnerId === challengerId);
  const responderBets = bets.filter(b => b.predictedWinnerId === responderId);

  const challengerTotal = challengerBets.reduce((sum, b) => sum + b.stake, 0);
  const responderTotal = responderBets.reduce((sum, b) => sum + b.stake, 0);
  const totalExposure = challengerTotal + responderTotal;

  return (
    <div className="fixed top-24 right-6 z-10 w-72">
      <div className="card-beef bg-beef-bg/95 backdrop-blur border-beef-gold/50">
        <p className="section-label mb-3">MY EXPOSURE</p>
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-beef-text-muted">Total at risk:</span>
            <span className="text-beef-gold font-bold font-mono">${totalExposure.toFixed(2)}</span>
          </div>

          {challengerTotal > 0 && (
            <div className="pt-2 border-t border-beef-border/40">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-1 h-3 bg-red-500 rounded"></div>
                <span className="text-xs font-bold text-red-400">@{challengerHandle}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-beef-text-muted">{challengerBets.length} bet{challengerBets.length !== 1 ? 's' : ''}</span>
                <span className="text-red-400 font-mono">${challengerTotal.toFixed(2)}</span>
              </div>
            </div>
          )}

          {responderTotal > 0 && (
            <div className={`pt-2 ${challengerTotal > 0 ? 'border-t border-beef-border/40' : ''}`}>
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-1 h-3 bg-yellow-500 rounded"></div>
                <span className="text-xs font-bold text-yellow-400">@{responderHandle}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-beef-text-muted">{responderBets.length} bet{responderBets.length !== 1 ? 's' : ''}</span>
                <span className="text-yellow-400 font-mono">${responderTotal.toFixed(2)}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
