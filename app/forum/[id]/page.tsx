"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";

type Author = {
  id: string;
  handle: string | null;
  username: string;
  isAnonymous: boolean;
  anonHandle: string | null;
};

type Comment = {
  id: string;
  content: string;
  parentId: string | null;
  createdAt: string;
  author: Author;
};

type Thread = {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  author: Author;
  comments: Comment[];
};

function timeAgo(dateStr: string) {
  const s = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function authorName(author: Author) {
  if (author.isAnonymous) return author.anonHandle ?? "GHOST";
  return `@${author.handle || author.username}`;
}

function CommentCard({
  comment,
  sessionUserId,
  threadId,
  onStartBeef,
  onReply,
}: {
  comment: Comment;
  sessionUserId?: string;
  threadId: string;
  onStartBeef: (author: Author, commentId: string) => void;
  onReply: (commentId: string) => void;
}) {
  const isOwn = sessionUserId === comment.author.id;

  return (
    <div className="group">
      <div className="flex gap-3">
        <div className="w-0.5 bg-beef-border/40 rounded-full shrink-0 mt-1 self-stretch" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="text-beef-gold text-xs font-bold">{authorName(comment.author)}</span>
            <span className="text-beef-text-muted text-xs">{timeAgo(comment.createdAt)}</span>
          </div>
          <p className="text-sm leading-relaxed mb-2">{comment.content}</p>
          <div className="flex items-center gap-3">
            {sessionUserId && (
              <button
                onClick={() => onReply(comment.id)}
                className="text-xs text-beef-text-muted hover:text-beef-gold transition-colors"
              >
                reply
              </button>
            )}
            {sessionUserId && !isOwn && (
              <button
                onClick={() => onStartBeef(comment.author, comment.id)}
                className="text-xs font-bold tracking-widest text-beef-orange hover:text-beef-gold transition-colors border border-beef-orange/30 hover:border-beef-gold/40 px-2 py-0.5"
              >
                ⚡ START BEEF
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ForumThreadPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: session } = useSession();

  const [thread, setThread] = useState<Thread | null>(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState("");

  const fetchThread = useCallback(async () => {
    try {
      const res = await fetch(`/api/forum/thread/${id}`);
      const data = await res.json();
      if (res.ok) setThread(data.thread);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchThread();
  }, [fetchThread]);

  const handleComment = async () => {
    if (!comment.trim()) return;
    setPosting(true);
    setError("");
    try {
      const res = await fetch(`/api/forum/thread/${id}/comment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: comment.trim(), parentId: replyTo }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Something went wrong"); return; }
      setThread((prev) => prev ? { ...prev, comments: [...prev.comments, data.comment] } : prev);
      setComment("");
      setReplyTo(null);
    } catch {
      setError("Something went wrong");
    } finally {
      setPosting(false);
    }
  };

  const handleStartBeef = (author: Author, commentId: string) => {
    const handle = author.isAnonymous ? null : (author.handle || author.username);
    const params = new URLSearchParams({ targetId: author.id, commentId });
    if (handle) params.set("targetHandle", handle);
    router.push(`/beef/new?${params.toString()}`);
  };

  const handleReply = (commentId: string) => {
    setReplyTo(commentId === replyTo ? null : commentId);
  };

  const replyTarget = replyTo ? thread?.comments.find((c) => c.id === replyTo) : null;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-beef-gold text-sm tracking-widest animate-pulse">LOADING...</div>
      </div>
    );
  }

  if (!thread) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-2xl font-bold mb-4">THREAD NOT FOUND</p>
          <Link href="/" className="text-beef-gold hover:underline text-sm">← Back to home</Link>
        </div>
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
          {session?.user && (
            <p className="text-muted text-sm">@{session.user.handle || session.user.username}</p>
          )}
        </div>
      </header>

      <div className="container-beef pb-24">
        <div className="max-w-2xl mx-auto">

          {/* Back */}
          <Link href="/" className="text-beef-text-muted text-xs hover:text-beef-gold transition-colors tracking-widest mb-6 inline-block">
            ← THE FLOOR
          </Link>

          {/* Thread OP */}
          <div className="card-beef border-beef-gold/30 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-beef-gold text-xs font-bold">{authorName(thread.author)}</span>
              <span className="text-beef-text-muted text-xs">{timeAgo(thread.createdAt)}</span>
            </div>
            <h1 className="text-2xl font-bold mb-3">{thread.title}</h1>
            <p className="text-beef-text-muted text-sm leading-relaxed whitespace-pre-wrap">{thread.body}</p>
            {session?.user && session.user.id !== thread.author.id && (
              <div className="mt-4 pt-3 border-t border-beef-border/40">
                <button
                  onClick={() => handleStartBeef(thread.author, "")}
                  className="text-xs font-bold tracking-widest text-beef-orange hover:text-beef-gold transition-colors border border-beef-orange/30 hover:border-beef-gold/40 px-3 py-1.5"
                >
                  ⚡ CHALLENGE THIS TAKE — START BEEF
                </button>
              </div>
            )}
          </div>

          {/* Comments */}
          {thread.comments.length > 0 && (
            <div className="mb-6">
              <p className="section-label mb-4">{thread.comments.length} REPL{thread.comments.length === 1 ? "Y" : "IES"}</p>
              <div className="flex flex-col gap-4">
                {thread.comments.map((c) => (
                  <CommentCard
                    key={c.id}
                    comment={c}
                    sessionUserId={session?.user?.id}
                    threadId={id}
                    onStartBeef={handleStartBeef}
                    onReply={handleReply}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Reply form */}
          {session?.user ? (
            <div className="card-beef">
              <p className="section-label mb-3">
                {replyTarget
                  ? `REPLYING TO ${authorName(replyTarget.author)}`
                  : "ADD A REPLY"}
              </p>
              {replyTarget && (
                <div className="text-xs text-beef-text-muted bg-beef-bg-light border border-beef-border rounded px-3 py-2 mb-3 line-clamp-2">
                  &ldquo;{replyTarget.content}&rdquo;
                  <button
                    onClick={() => setReplyTo(null)}
                    className="ml-2 text-beef-text-muted hover:text-beef-gold"
                  >
                    ×
                  </button>
                </div>
              )}
              {error && <p className="text-xs text-red-400 mb-2">{error}</p>}
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value.slice(0, 2000))}
                placeholder="Say something..."
                rows={3}
                className="w-full px-3 py-2 bg-beef-bg-light border border-beef-border rounded focus:outline-none focus:border-beef-gold text-sm resize-none mb-3"
              />
              <button
                onClick={handleComment}
                disabled={posting || comment.trim().length === 0}
                className="w-full btn-primary py-2.5 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {posting ? "POSTING..." : "POST REPLY"}
              </button>
            </div>
          ) : (
            <div className="card-beef text-center py-6">
              <p className="text-beef-text-muted text-sm mb-3">Sign in to join the conversation</p>
              <Link href="/auth/signin" className="btn-primary text-sm px-6 py-2">SIGN IN</Link>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
