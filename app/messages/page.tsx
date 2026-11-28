"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";

interface Conversation {
  id: string;
  otherUser: {
    id: string;
    username: string;
    handle: string | null;
    anonHandle: string | null;
    isAnonymous: boolean;
  } | null;
  lastMessage: {
    content: string;
    createdAt: string;
    senderId: string;
  } | null;
  unreadCount: number;
  lastMessageAt: string;
}

export default function MessagesPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user) {
      fetchConversations();

      // Poll for new messages every 5 seconds
      const interval = setInterval(fetchConversations, 5000);
      return () => clearInterval(interval);
    }
  }, [session]);

  const fetchConversations = async () => {
    try {
      const res = await fetch("/api/messages");
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations);
      }
    } catch (err) {
      console.error("Failed to fetch conversations:", err);
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-beef-gold text-sm tracking-widest animate-pulse">LOADING...</div>
      </div>
    );
  }

  if (!session?.user) return null;

  const getDisplayName = (user: Conversation["otherUser"]) => {
    if (!user) return "Unknown User";
    if (user.isAnonymous) return user.anonHandle || "GHOST";
    return user.handle || user.username;
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;

    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <div className="min-h-screen">
      <header className="container-beef py-6">
        <div className="flex items-center justify-between">
          <Link href="/">
            <div className="cursor-pointer">
              <p className="section-label mb-2">BACK TO BEEF</p>
              <h1 className="text-4xl font-bold tracking-tighter">MESSAGES</h1>
            </div>
          </Link>
        </div>
      </header>

      <div className="container-beef pb-20 max-w-2xl">
        {conversations.length === 0 ? (
          <div className="card-beef text-center py-20">
            <p className="text-2xl font-bold mb-3">NO MESSAGES YET</p>
            <p className="text-muted text-sm">
              Your private conversations will appear here
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {conversations.map((conv) => (
              <Link key={conv.id} href={`/messages/${conv.id}`}>
                <div
                  className={`card-beef hover:border-beef-gold/40 transition-all cursor-pointer ${
                    conv.unreadCount > 0 ? "bg-beef-bg-light border-beef-gold/20" : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-bold text-beef-text truncate">
                          {getDisplayName(conv.otherUser)}
                        </p>
                        {conv.unreadCount > 0 && (
                          <span className="bg-beef-gold text-beef-bg text-xs font-bold px-2 py-0.5 rounded-full shrink-0">
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                      {conv.lastMessage && (
                        <p className="text-sm text-muted truncate">
                          {conv.lastMessage.senderId === session.user.id ? "You: " : ""}
                          {conv.lastMessage.content}
                        </p>
                      )}
                    </div>
                    <p className="text-xs text-muted shrink-0">
                      {formatTime(conv.lastMessageAt)}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
