"use client";

import { useState, useEffect, useRef } from "react";

interface Message {
  id: string;
  content: string;
  createdAt: string;
  user: { id: string; handle: string | null; username: string };
}

interface Props {
  beefId: string;
  messages: Message[];
  endsAt: string | null;
  status: string;
  isParticipant: boolean;
  currentUserId: string | null;
  challengerId: string;
  challengerHandle: string;
  responderId: string | null;
  responderHandle: string | null;
  judgeDecision: string | null;
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
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function BeefThread({
  beefId,
  messages: initial,
  endsAt,
  status,
  isParticipant,
  currentUserId,
  challengerId,
  challengerHandle,
  responderId,
  responderHandle,
  judgeDecision,
}: Props) {
  const [messages, setMessages] = useState<Message[]>(initial);
  const [draft, setDraft] = useState("");
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const remaining = useCountdown(endsAt);
  const isLive = status === "LIVE";
  const expired = remaining !== null && remaining === 0;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handlePost = async () => {
    if (!draft.trim() || posting) return;
    setPosting(true);
    setError("");

    const res = await fetch(`/api/beef/${beefId}/message`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: draft }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Something went wrong");
      setPosting(false);
      return;
    }

    setMessages((prev) => [...prev, data.message]);
    setDraft("");
    setPosting(false);
  };

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handlePost();
    }
  };

  const getHandle = (userId: string) =>
    userId === challengerId ? challengerHandle : (responderHandle ?? "opponent");

  const getSide = (userId: string) =>
    userId === challengerId ? "CHALLENGER" : "RESPONDER";

  return (
    <div>
      {/* Countdown */}
      {isLive && endsAt && (
        <div className={`card-beef text-center mb-6 ${expired ? "border-beef-orange" : "border-beef-gold/30"}`}>
          <p className="section-label mb-2">{expired ? "TIME IS UP" : "TIME REMAINING"}</p>
          <p className={`text-5xl font-bold font-mono ${expired ? "text-beef-orange" : "text-beef-gold"}`}>
            {remaining !== null ? formatCountdown(remaining) : "--:--:--"}
          </p>
          {!expired && <p className="text-muted text-xs mt-2">Get the last word before the clock hits zero</p>}
        </div>
      )}

      {/* Judge decision */}
      {judgeDecision && (
        <div className="card-beef border-beef-gold mb-6">
          <p className="section-label mb-3">AI VERDICT</p>
          <p className="text-muted leading-relaxed">{judgeDecision}</p>
        </div>
      )}

      {/* Thread */}
      <div className="mb-6">
        <p className="section-label mb-4">THE THREAD</p>

        {messages.length === 0 ? (
          <div className="card-beef text-center py-12">
            <p className="text-muted">No messages yet. {isParticipant ? "Make your opening move." : ""}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((msg) => {
              const isCurrentUser = msg.user.id === currentUserId;
              const isChallenge = msg.user.id === challengerId;
              return (
                <div
                  key={msg.id}
                  className={`card-beef border-l-4 ${isChallenge ? "border-l-beef-gold" : "border-l-beef-orange"}`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`text-xs font-bold tracking-widest ${isChallenge ? "text-beef-gold" : "text-beef-orange"}`}>
                      {getSide(msg.user.id)}
                    </span>
                    <span className="text-muted text-sm">@{msg.user.handle || msg.user.username}</span>
                    {isCurrentUser && (
                      <span className="text-xs text-beef-text-muted bg-beef-bg-light px-2 py-0.5 rounded-full">YOU</span>
                    )}
                    <span className="text-muted text-xs ml-auto">
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
          {error && (
            <div className="bg-red-900/20 border border-red-500 text-red-500 px-4 py-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value.slice(0, 2000))}
            onKeyDown={handleKey}
            rows={4}
            className="w-full px-4 py-3 bg-beef-bg-light border border-beef-border rounded-lg focus:outline-none focus:border-beef-gold transition-colors resize-none"
            placeholder="State your case. Drop receipts. Get the last word."
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

      {isParticipant && isLive && expired && (
        <div className="card-beef text-center border-beef-orange">
          <p className="section-label mb-2">CLOCK HIT ZERO</p>
          <p className="text-muted text-sm">The thread is closed. AI is reading the full debate to pick a winner.</p>
        </div>
      )}
    </div>
  );
}
