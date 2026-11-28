"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";

interface Message {
  id: string;
  senderId: string;
  content: string;
  createdAt: string;
}

interface OtherUser {
  id: string;
  username: string;
  handle: string | null;
  anonHandle: string | null;
  isAnonymous: boolean;
}

export default function ConversationPage({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const router = useRouter();
  const { data: session } = useSession();
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [otherUser, setOtherUser] = useState<OtherUser | null>(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    params.then((p) => setConversationId(p.conversationId));
  }, [params]);

  useEffect(() => {
    if (!conversationId) return;
    fetchMessages();

    // Poll for new messages every 3 seconds
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [conversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchMessages = async () => {
    if (!conversationId) return;

    try {
      const res = await fetch(`/api/messages/${conversationId}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages);
        setOtherUser(data.otherUser);
      }
    } catch (err) {
      console.error("Failed to fetch messages:", err);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!draft.trim() || sending || !conversationId) return;

    setSending(true);
    try {
      const res = await fetch(`/api/messages/${conversationId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: draft }),
      });

      if (res.ok) {
        setDraft("");
        await fetchMessages();
      }
    } catch (err) {
      console.error("Failed to send message:", err);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-beef-gold text-sm tracking-widest animate-pulse">LOADING...</div>
      </div>
    );
  }

  const getDisplayName = () => {
    if (!otherUser) return "Unknown User";
    if (otherUser.isAnonymous) return otherUser.anonHandle || "GHOST";
    return otherUser.handle || otherUser.username;
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="container-beef py-4 border-b border-beef-border">
        <div className="flex items-center gap-4">
          <Link
            href="/messages"
            className="text-muted hover:text-beef-gold transition-colors text-sm tracking-widest"
          >
            ← BACK
          </Link>
          <div>
            <p className="section-label text-xs">CONVERSATION WITH</p>
            <p className="font-bold">{getDisplayName()}</p>
          </div>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 container-beef py-6 max-w-2xl">
        {messages.length === 0 ? (
          <div className="card-beef text-center py-12">
            <p className="text-muted">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          <div className="space-y-3 mb-6">
            {messages.map((msg) => {
              const isMine = msg.senderId === session?.user?.id;
              return (
                <div
                  key={msg.id}
                  className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[75%] px-4 py-3 rounded-lg ${
                      isMine
                        ? "bg-beef-gold/20 border border-beef-gold/30"
                        : "bg-beef-bg-light border border-beef-border"
                    }`}
                  >
                    <p className="text-beef-text whitespace-pre-wrap break-words">
                      {msg.content}
                    </p>
                    <p className="text-xs text-muted mt-1">
                      {new Date(msg.createdAt).toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-beef-border bg-beef-bg sticky bottom-0">
        <div className="container-beef py-4 max-w-2xl">
          <div className="flex gap-3">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value.slice(0, 2000))}
              onKeyDown={handleKeyDown}
              rows={2}
              className="flex-1 px-4 py-3 bg-beef-bg-light border border-beef-border rounded-lg focus:outline-none focus:border-beef-gold transition-colors resize-none"
              placeholder="Type a message... (Enter to send)"
            />
            <button
              onClick={sendMessage}
              disabled={sending || !draft.trim()}
              className="btn-primary px-6 disabled:opacity-40"
            >
              {sending ? "..." : "SEND"}
            </button>
          </div>
          <p className="text-xs text-muted mt-2">{draft.length}/2000</p>
        </div>
      </div>
    </div>
  );
}
