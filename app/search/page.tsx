"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

function timeAgo(dateStr: string) {
  const s = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function authorName(u: { handle: string | null; username: string; isAnonymous: boolean; anonHandle: string | null }) {
  if (u.isAnonymous) return u.anonHandle ?? "GHOST";
  return `@${u.handle || u.username}`;
}

function SearchResults() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const q = searchParams.get("q") || "";

  const [input, setInput] = useState(q);
  const [results, setResults] = useState<{ beefs: any[]; threads: any[]; users: any[] } | null>(null);
  const [loading, setLoading] = useState(false);

  const search = useCallback(async (query: string) => {
    if (query.trim().length < 2) { setResults(null); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setResults(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (q) search(q);
  }, [q, search]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim().length < 2) return;
    router.push(`/search?q=${encodeURIComponent(input.trim())}`);
  };

  const total = results ? results.beefs.length + results.threads.length + results.users.length : 0;

  return (
    <div className="min-h-screen">
      <header className="container-beef py-6 sm:py-8">
        <div className="flex items-center justify-between gap-4">
          <Link href="/">
            <h1 className="text-5xl sm:text-7xl font-bold tracking-tighter leading-none cursor-pointer">BEEF</h1>
          </Link>
          <Link href="/" className="text-beef-text-muted text-xs tracking-widest hover:text-beef-gold transition-colors">← BACK</Link>
        </div>
      </header>

      <div className="container-beef pb-24">
        {/* Search bar */}
        <form onSubmit={handleSubmit} className="mb-10">
          <div className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Search beefs, posts, people..."
              autoFocus
              className="flex-1 px-5 py-4 bg-beef-bg-card border border-beef-border rounded-xl focus:outline-none focus:border-beef-gold transition-colors text-lg"
            />
            <button type="submit" className="btn-primary px-8">SEARCH</button>
          </div>
          {q && results && !loading && (
            <p className="text-beef-text-muted text-xs mt-3 tracking-widest">
              {total} result{total !== 1 ? "s" : ""} for &ldquo;{q}&rdquo;
            </p>
          )}
        </form>

        {loading && (
          <div className="text-beef-text-muted text-sm tracking-widest animate-pulse text-center py-20">SEARCHING...</div>
        )}

        {results && !loading && total === 0 && (
          <div className="text-center py-20">
            <p className="text-2xl font-bold mb-3">NO RESULTS.</p>
            <p className="text-beef-text-muted text-sm">Try different keywords.</p>
          </div>
        )}

        {results && !loading && total > 0 && (
          <div className="space-y-12">
            {/* Beefs */}
            {results.beefs.length > 0 && (
              <div>
                <div className="flex items-center gap-4 mb-5">
                  <p className="section-label">BEEFS</p>
                  <div className="flex-1 border-t border-beef-border/40" />
                  <span className="text-xs text-beef-text-muted">{results.beefs.length}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {results.beefs.map((beef: any) => (
                    <Link key={beef.id} href={`/beef/${beef.id}`}>
                      <div className={`flex flex-col h-full rounded-xl border p-5 cursor-pointer transition-all duration-150 hover:border-beef-gold/60 hover:-translate-y-0.5 bg-beef-bg-card ${beef.status === "LIVE" ? "border-beef-orange/40" : "border-beef-border"}`}>
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          {beef.status === "LIVE" && <span className="text-xs font-bold text-beef-orange tracking-widest">● LIVE</span>}
                          <span className="text-xs text-beef-text-muted tracking-widest">{beef.status}</span>
                        </div>
                        <p className="text-sm font-bold leading-snug mb-3 flex-1">
                          &ldquo;{beef.claim.length > 100 ? beef.claim.slice(0, 100) + "…" : beef.claim}&rdquo;
                        </p>
                        <div className="flex items-center justify-between text-xs text-beef-text-muted border-t border-beef-border/50 pt-2 mt-auto">
                          <span className="text-beef-gold font-bold">{authorName(beef.challenger)}</span>
                          <span className="text-beef-gold font-bold">${beef.totalPot}</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Posts */}
            {results.threads.length > 0 && (
              <div>
                <div className="flex items-center gap-4 mb-5">
                  <p className="section-label">POSTS</p>
                  <div className="flex-1 border-t border-beef-border/40" />
                  <span className="text-xs text-beef-text-muted">{results.threads.length}</span>
                </div>
                <div className="flex flex-col gap-3" style={{ fontFamily: "Courier New, Courier, monospace" }}>
                  {results.threads.map((thread: any) => (
                    <Link key={thread.id} href={`/forum/${thread.id}`}>
                      <div className="card-beef hover:border-beef-gold/40 transition-all duration-150 cursor-pointer rounded-none">
                        <p className="font-bold text-sm mb-1">{thread.title}</p>
                        <p className="text-beef-text-muted text-xs mb-3 line-clamp-2">{thread.body}</p>
                        <div className="flex items-center justify-between text-xs text-beef-text-muted">
                          <span className="text-beef-gold font-bold">{authorName(thread.author)}</span>
                          <div className="flex gap-3">
                            {thread._count.comments > 0 && <span>{thread._count.comments} replies</span>}
                            <span>{timeAgo(thread.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* People */}
            {results.users.length > 0 && (
              <div>
                <div className="flex items-center gap-4 mb-5">
                  <p className="section-label">PEOPLE</p>
                  <div className="flex-1 border-t border-beef-border/40" />
                  <span className="text-xs text-beef-text-muted">{results.users.length}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {results.users.map((user: any) => (
                    <Link key={user.id} href={`/@${user.handle || user.username}`}>
                      <div className="card-beef hover:border-beef-gold/40 transition-all cursor-pointer text-center py-6">
                        <p className="text-beef-gold font-bold text-sm mb-1">{authorName(user)}</p>
                        <p className="text-beef-text-muted text-xs">{user.wins}W — {user.losses}L</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return <Suspense><SearchResults /></Suspense>;
}
