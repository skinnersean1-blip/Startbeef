"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

interface Message {
  id: string;
  content: string;
  createdAt: string;
  user: { id: string; handle: string | null; username: string; anonHandle: string | null; isAnonymous: boolean };
}

interface Offer {
  id: string;
  fromId: string;
  type: string;
  amount: number;
  status: string;
  expiresAt: string;
}

interface Props {
  beefId: string;
  messages: Message[];
  initialOffers: Offer[];
  endsAt: string | null;
  status: string;
  isParticipant: boolean;
  currentUserId: string | null;
  challengerId: string;
  challengerHandle: string;
  challengerIsAnon: boolean;
  responderId: string | null;
  responderHandle: string | null;
  responderIsAnon: boolean;
  judgeId: string | null;
  judgeName: string | null;
  judgeDecision: string | null;
  winnerId: string | null;
}

const JUDGE_COLORS: Record<string, string> = {
  claude:     "text-beef-gold",
  chatgpt:    "text-green-400",
  grok:       "text-blue-400",
  deepseek:   "text-cyan-400",
  kimi:       "text-purple-400",
  perplexity: "text-orange-400",
  default:    "text-muted",
};

function OfferExpiry({ expiresAt }: { expiresAt: string }) {
  const [ms, setMs] = useState(Math.max(0, new Date(expiresAt).getTime() - Date.now()));
  useEffect(() => {
    const id = setInterval(() => setMs(Math.max(0, new Date(expiresAt).getTime() - Date.now())), 1000);
    return () => clearInterval(id);
  }, [expiresAt]);
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return (
    <p className="text-xs text-beef-text-muted font-mono shrink-0">
      {ms > 0 ? `${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")} left` : "EXPIRED"}
    </p>
  );
}

function useCountdown(endsAt: string | null) {
  const [remaining, setRemaining] = useState<number | null>(null);
  useEffect(() => {
    if (!endsAt) return;
    const end = new Date(endsAt).getTime();
    const tick = () => setRemaining(Math.max(0, end - Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endsAt]);
  return remaining;
}

function formatCountdown(ms: number) {
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

export function BeefThread({
  beefId,
  messages: initial,
  initialOffers,
  endsAt,
  status,
  isParticipant,
  currentUserId,
  challengerId,
  challengerHandle,
  challengerIsAnon,
  responderId,
  responderHandle,
  responderIsAnon,
  judgeId,
  judgeName,
  judgeDecision,
  winnerId,
}: Props) {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>(initial);
  const [offers, setOffers] = useState<Offer[]>(initialOffers);
  const [draft, setDraft] = useState("");
  const [posting, setPosting] = useState(false);
  const [judging, setJudging] = useState(false);
  const [judgeError, setJudgeError] = useState("");
  const [postError, setPostError] = useState("");
  const [offerMode, setOfferMode] = useState<null | "RAISE" | "CLOSE">(null);
  const [offerAmount, setOfferAmount] = useState("");
  const [offerLoading, setOfferLoading] = useState(false);
  const [offerError, setOfferError] = useState("");
  const [respondingTo, setRespondingTo] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const remaining = useCountdown(endsAt);

  const isLive = status === "LIVE";
  const isJudging = status === "JUDGING";
  const isCompleted = status === "COMPLETED";
  const expired = remaining !== null && remaining === 0;
  const canJudge = isParticipant && isLive && expired && !judging;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Poll for verdict while JUDGING
  useEffect(() => {
    if (!isJudging) return;
    const id = setInterval(() => router.refresh(), 3000);
    return () => clearInterval(id);
  }, [isJudging, router]);

  const handlePost = async () => {
    if (!draft.trim() || posting) return;
    setPosting(true);
    setPostError("");

    const res = await fetch(`/api/beef/${beefId}/message`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: draft }),
    });

    const data = await res.json();
    if (!res.ok) {
      setPostError(data.error || "Something went wrong");
      setPosting(false);
      return;
    }
    setMessages((prev) => [...prev, data.message]);
    setDraft("");
    setPosting(false);
  };

  const handleJudge = async () => {
    setJudging(true);
    setJudgeError("");

    const res = await fetch(`/api/beef/${beefId}/judge`, { method: "POST" });
    const data = await res.json();

    if (!res.ok) {
      setJudgeError(data.error || "Something went wrong");
      setJudging(false);
      return;
    }

    // Refresh to get updated server component data
    router.refresh();
  };

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handlePost();
    }
  };

  const pendingOffer = offers.find(
    (o) => o.status === "PENDING" && new Date(o.expiresAt) > new Date()
  ) ?? null;
  const canMakeOffer = isParticipant && isLive && !expired && !pendingOffer;

  const handleMakeOffer = async () => {
    if (!offerMode || offerLoading) return;
    setOfferLoading(true);
    setOfferError("");
    const amount = offerMode === "CLOSE" && offerAmount === "" ? 0 : parseFloat(offerAmount || "0");
    const res = await fetch(`/api/beef/${beefId}/offer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: offerMode, amount }),
    });
    const data = await res.json();
    setOfferLoading(false);
    if (!res.ok) { setOfferError(data.error || "Something went wrong"); return; }
    setOffers((prev) => [data.offer, ...prev]);
    setOfferMode(null);
    setOfferAmount("");
  };

  const handleRespondToOffer = async (offerId: string, action: "ACCEPT" | "REJECT") => {
    setRespondingTo(offerId);
    const res = await fetch(`/api/beef/${beefId}/offer/${offerId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    const data = await res.json();
    setRespondingTo(null);
    if (!res.ok) { setOfferError(data.error || "Something went wrong"); return; }
    setOffers((prev) => prev.map((o) => o.id === offerId ? { ...o, status: action === "ACCEPT" ? "ACCEPTED" : "REJECTED" } : o));
    if (action === "ACCEPT") router.refresh();
  };

  const getSide = (userId: string) =>
    userId === challengerId ? "CHALLENGER" : "RESPONDER";

  const getMsgHandle = (msg: Message) => {
    if (msg.user.id === challengerId && (challengerIsAnon || msg.user.isAnonymous))
      return msg.user.anonHandle ?? "GHOST";
    if (msg.user.id === responderId && (responderIsAnon || msg.user.isAnonymous))
      return msg.user.anonHandle ?? "GHOST";
    return msg.user.handle || msg.user.username;
  };

  const winnerHandle =
    winnerId === challengerId ? challengerHandle :
    winnerId === responderId  ? (responderHandle ?? "opponent") : null;

  const judgeColor = JUDGE_COLORS[judgeId ?? ""] ?? JUDGE_COLORS.default;

  return (
    <div>
      {/* Countdown */}
      {isLive && endsAt && (
        <div className={`card-beef text-center mb-6 ${expired ? "border-beef-orange" : "border-beef-gold/30"}`}>
          <p className="section-label mb-2">{expired ? "CLOCK HIT ZERO" : "TIME REMAINING"}</p>
          <p className={`text-5xl font-bold font-mono ${expired ? "text-beef-orange" : "text-beef-gold"}`}>
            {remaining !== null ? formatCountdown(remaining) : "--:--:--"}
          </p>
          {!expired && <p className="text-muted text-xs mt-2">Get the last word before the clock hits zero</p>}
        </div>
      )}

      {/* Judging in progress */}
      {isJudging && (
        <div className="card-beef border-beef-gold text-center mb-6">
          <p className="section-label mb-3">JUDGMENT IN PROGRESS</p>
          <p className="text-2xl font-bold animate-pulse">THE JUDGE IS DELIBERATING...</p>
          <p className="text-muted text-sm mt-3">A randomly selected AI is reading the full thread.</p>
        </div>
      )}

      {/* Verdict */}
      {isCompleted && judgeDecision && (
        <div className="card-beef border-beef-gold mb-6">
          {winnerHandle && (
            <div className="mb-4">
              <p className="section-label mb-1">WINNER</p>
              <p className="text-3xl font-bold text-beef-gold">@{winnerHandle}</p>
            </div>
          )}

          <div className={winnerHandle ? "pt-4 border-t border-beef-border" : ""}>
            <p className="section-label mb-2">VERDICT</p>
            <p className="text-beef-text leading-relaxed">{judgeDecision}</p>
          </div>

          <p className={`text-xs text-muted mt-4 pt-3 border-t border-beef-border/50`}>
            This judgment was rendered by{" "}
            <span className={judgeColor}>{judgeName ?? "an AI judge"}</span>
          </p>
        </div>
      )}

      {/* Request judgment button */}
      {canJudge && (
        <div className="card-beef border-beef-orange mb-6 text-center">
          <p className="section-label mb-3">TIME IS UP</p>
          <p className="text-muted text-sm mb-6">
            The thread is closed. A randomly selected AI judge will read the full debate and pick a winner.
            You won&apos;t know which one until the verdict is in.
          </p>
          {judgeError && (
            <div className="bg-red-900/20 border border-red-500 text-red-500 px-4 py-3 rounded-lg mb-4 text-sm">
              {judgeError}
            </div>
          )}
          <button
            onClick={handleJudge}
            disabled={judging}
            className="btn-primary text-lg px-10 py-4 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {judging ? "SUMMONING THE JUDGE..." : "REQUEST JUDGMENT"}
          </button>
        </div>
      )}

      {/* Active offer card */}
      {pendingOffer && isParticipant && (
        <div className={`card-beef mb-6 border-2 ${pendingOffer.type === "RAISE" ? "border-beef-gold" : "border-beef-orange"}`}>
          <div className="flex items-start justify-between gap-4 mb-3">
            <div>
              <p className="section-label mb-1">
                {pendingOffer.type === "RAISE" ? "⚡ RAISE ON THE TABLE" : "🏳️ TAP-OUT PROPOSED"}
              </p>
              {pendingOffer.type === "RAISE" && (
                <p className="text-beef-text text-sm">
                  Both fighters add <span className="text-beef-gold font-bold">${pendingOffer.amount}</span> — pot grows to{" "}
                  <span className="text-beef-gold font-bold">${pendingOffer.amount * 2}</span> more.
                </p>
              )}
              {pendingOffer.type === "CLOSE" && pendingOffer.amount > 0 && (
                <p className="text-beef-text text-sm">
                  Opponent offers a <span className="text-beef-orange font-bold">${pendingOffer.amount} sweetener</span> to call the judge now.
                </p>
              )}
              {pendingOffer.type === "CLOSE" && pendingOffer.amount === 0 && (
                <p className="text-beef-text text-sm">Opponent wants to call the judge now — no sweetener.</p>
              )}
            </div>
            <OfferExpiry expiresAt={pendingOffer.expiresAt} />
          </div>

          {offerError && (
            <p className="text-red-400 text-xs mb-3">{offerError}</p>
          )}

          {pendingOffer.fromId === currentUserId ? (
            <p className="text-beef-text-muted text-xs tracking-widest">WAITING FOR OPPONENT TO RESPOND...</p>
          ) : (
            <div className="flex gap-3">
              <button
                onClick={() => handleRespondToOffer(pendingOffer.id, "ACCEPT")}
                disabled={respondingTo === pendingOffer.id}
                className="btn-primary text-sm px-6 py-2 disabled:opacity-50"
              >
                {respondingTo === pendingOffer.id ? "..." : "ACCEPT"}
              </button>
              <button
                onClick={() => handleRespondToOffer(pendingOffer.id, "REJECT")}
                disabled={respondingTo === pendingOffer.id}
                className="btn-secondary text-sm px-6 py-2 disabled:opacity-50"
              >
                REJECT
              </button>
            </div>
          )}
        </div>
      )}

      {/* Offer action buttons */}
      {canMakeOffer && !offerMode && (
        <div className="flex gap-3 mb-6">
          <button
            onClick={() => { setOfferMode("RAISE"); setOfferAmount(""); setOfferError(""); }}
            className="flex-1 border border-beef-gold/40 hover:border-beef-gold text-beef-gold text-xs font-bold tracking-widest py-3 rounded-lg transition-colors"
          >
            ⚡ RAISE THE STAKES
          </button>
          <button
            onClick={() => { setOfferMode("CLOSE"); setOfferAmount(""); setOfferError(""); }}
            className="flex-1 border border-beef-orange/40 hover:border-beef-orange text-beef-orange text-xs font-bold tracking-widest py-3 rounded-lg transition-colors"
          >
            🏳️ TAP-OUT
          </button>
        </div>
      )}

      {/* Offer form */}
      {offerMode && (
        <div className={`card-beef mb-6 border ${offerMode === "RAISE" ? "border-beef-gold/50" : "border-beef-orange/50"}`}>
          <p className="section-label mb-3">
            {offerMode === "RAISE" ? "⚡ RAISE THE STAKES" : "🏳️ TAP-OUT"}
          </p>
          {offerMode === "RAISE" && (
            <p className="text-beef-text-muted text-xs mb-4">
              Both of you put in this amount. Pot grows by double. Debate continues.
            </p>
          )}
          {offerMode === "CLOSE" && (
            <p className="text-beef-text-muted text-xs mb-4">
              Propose a tap-out. Add an optional sweetener paid directly to your opponent to get them to agree — or leave it at $0 for a clean call.
            </p>
          )}

          <div className="relative mb-3">
            <span className="absolute left-4 top-3 text-beef-gold font-bold">$</span>
            <input
              type="number"
              min={offerMode === "RAISE" ? "5" : "0"}
              step="5"
              value={offerAmount}
              onChange={(e) => setOfferAmount(e.target.value)}
              placeholder={offerMode === "RAISE" ? "50" : "0"}
              className="w-full pl-8 pr-4 py-3 bg-beef-bg-light border border-beef-border rounded-lg focus:outline-none focus:border-beef-gold transition-colors"
            />
          </div>

          {offerError && <p className="text-red-400 text-xs mb-3">{offerError}</p>}

          <div className="flex gap-3">
            <button
              onClick={handleMakeOffer}
              disabled={offerLoading || (offerMode === "RAISE" && (!offerAmount || parseFloat(offerAmount) < 5))}
              className="btn-primary text-sm px-6 py-2 disabled:opacity-40"
            >
              {offerLoading ? "SENDING..." : "SEND OFFER"}
            </button>
            <button
              onClick={() => { setOfferMode(null); setOfferError(""); }}
              className="btn-secondary text-sm px-6 py-2"
            >
              CANCEL
            </button>
          </div>
        </div>
      )}

      {/* Thread */}
      <div className="mb-6">
        <p className="section-label mb-4">THE THREAD</p>

        {messages.length === 0 ? (
          <div className="card-beef text-center py-12">
            <p className="text-muted">
              {isParticipant ? "No messages yet. Make your opening move." : "No messages posted yet."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((msg) => {
              const isCurrentUser = msg.user.id === currentUserId;
              const isChallenge = msg.user.id === challengerId;
              const isWinner = msg.user.id === winnerId;
              return (
                <div
                  key={msg.id}
                  className={`card-beef border-l-4 ${
                    isChallenge ? "border-l-beef-gold" : "border-l-beef-orange"
                  } ${isWinner && isCompleted ? "bg-beef-bg-light" : ""}`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`text-xs font-bold tracking-widest ${isChallenge ? "text-beef-gold" : "text-beef-orange"}`}>
                      {getSide(msg.user.id)}
                    </span>
                    <span className="text-muted text-sm">{getMsgHandle(msg)}</span>
                    {isCurrentUser && (
                      <span className="text-xs text-muted bg-beef-bg-light px-2 py-0.5 rounded-full">YOU</span>
                    )}
                    {isWinner && isCompleted && (
                      <span className="text-xs font-bold text-beef-gold bg-beef-gold/20 px-2 py-0.5 rounded-full ml-auto">WINNER</span>
                    )}
                    <span className={`text-muted text-xs ${isWinner && isCompleted ? "" : "ml-auto"}`}>
                      {new Date(msg.createdAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <p className="text-beef-text leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Post box */}
      {isParticipant && isLive && !expired && (
        <div className="card-beef border-beef-gold/30">
          <p className="section-label mb-3">YOUR MOVE</p>
          {postError && (
            <div className="bg-red-900/20 border border-red-500 text-red-500 px-4 py-3 rounded-lg mb-4 text-sm">
              {postError}
            </div>
          )}
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value.slice(0, 2000))}
            onKeyDown={handleKey}
            rows={4}
            className="w-full px-4 py-3 bg-beef-bg-light border border-beef-border rounded-lg focus:outline-none focus:border-beef-gold transition-colors resize-none"
            placeholder="State your case. Drop receipts. Get the last word."
            autoFocus
          />
          <div className="flex items-center justify-between mt-3">
            <p className="text-muted text-xs">{draft.length}/2000 · ⌘↵ to post</p>
            <button
              onClick={handlePost}
              disabled={posting || !draft.trim()}
              className="btn-primary text-sm px-6 py-3 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {posting ? "POSTING..." : "POST"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
