"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

type ThreadAuthor = {
  handle: string | null;
  username: string;
  isAnonymous: boolean;
  anonHandle: string | null;
};

type Thread = {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  author: ThreadAuthor;
  _count: { comments: number };
};

function timeAgo(dateStr: string) {
  const s = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function authorName(author: ThreadAuthor) {
  if (author.isAnonymous) return author.anonHandle ?? "GHOST";
  return `@${author.handle || author.username}`;
}

export function ForumPanel() {
  const { data: session } = useSession();
  const router = useRouter();

  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newBody, setNewBody] = useState("");
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState("");

  const fetchThreads = useCallback(async () => {
    try {
      const res = await fetch("/api/forum");
      const data = await res.json();
      setThreads(data.threads ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchThreads();
  }, [fetchThreads]);

  const handlePost = async () => {
    if (!newTitle.trim() || !newBody.trim()) return;
    setPosting(true);
    setError("");
    try {
      const res = await fetch("/api/forum", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle.trim(), body: newBody.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Something went wrong"); return; }
      setThreads((prev) => [data.thread, ...prev]);
      setNewTitle("");
      setNewBody("");
      setShowNew(false);
      router.refresh();
    } catch {
      setError("Something went wrong");
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Panel header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <p className="section-label">THE FLOOR</p>
          <div className="flex-1 border-t border-beef-border/40 w-8" />
        </div>
        {session?.user ? (
          <button
            onClick={() => setShowNew((v) => !v)}
            className="text-xs font-bold tracking-widest text-beef-gold hover:text-beef-gold/80 transition-colors border border-beef-gold/40 px-3 py-1"
          >
            {showNew ? "CANCEL" : "+ POST"}
          </button>
        ) : (
          <Link
            href="/auth/signin"
            className="text-xs font-bold tracking-widest text-beef-text-muted hover:text-beef-gold transition-colors"
          >
            SIGN IN TO POST
          </Link>
        )}
      </div>

      {/* New thread form */}
      {showNew && (
        <div className="card-beef border-beef-gold/40">
          <p className="section-label mb-3">NEW THREAD</p>
          {error && (
            <p className="text-xs text-red-400 mb-2">{error}</p>
          )}
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value.slice(0, 200))}
            placeholder="Thread title..."
            className="w-full px-3 py-2 bg-beef-bg-light border border-beef-border rounded focus:outline-none focus:border-beef-gold text-sm mb-2"
          />
          <textarea
            value={newBody}
            onChange={(e) => setNewBody(e.target.value.slice(0, 5000))}
            placeholder="Say something..."
            rows={3}
            className="w-full px-3 py-2 bg-beef-bg-light border border-beef-border rounded focus:outline-none focus:border-beef-gold text-sm resize-none mb-3"
          />
          <button
            onClick={handlePost}
            disabled={posting || newTitle.trim().length < 4 || newBody.trim().length < 1}
            className="w-full btn-primary py-2.5 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {posting ? "POSTING..." : "POST THREAD"}
          </button>
        </div>
      )}

      {/* Thread list */}
      {loading ? (
        <div className="text-beef-text-muted text-xs text-center py-8 tracking-widest animate-pulse">
          LOADING...
        </div>
      ) : threads.length === 0 ? (
        <div className="card-beef text-center py-10">
          <p className="text-beef-text-muted text-sm mb-2">No threads yet.</p>
          <p className="text-beef-text-muted text-xs">Be the first to say something.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {threads.map((thread) => (
            <Link key={thread.id} href={`/forum/${thread.id}`}>
              <div className="card-beef hover:border-beef-gold/40 transition-all duration-150 cursor-pointer group">
                <p className="font-bold text-sm leading-snug mb-1.5 group-hover:text-beef-gold transition-colors line-clamp-2">
                  {thread.title}
                </p>
                <p className="text-beef-text-muted text-xs leading-relaxed mb-3 line-clamp-2">
                  {thread.body}
                </p>
                <div className="flex items-center justify-between text-xs text-beef-text-muted">
                  <span className="text-beef-gold font-bold">{authorName(thread.author)}</span>
                  <div className="flex items-center gap-3">
                    {thread._count.comments > 0 && (
                      <span>{thread._count.comments} reply{thread._count.comments !== 1 ? "s" : ""}</span>
                    )}
                    <span>{timeAgo(thread.createdAt)}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
