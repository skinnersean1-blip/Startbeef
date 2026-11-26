"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BackButton } from "@/components/BackButton";

type Beef = {
  id: string;
  claim: string;
  status: string;
  totalPot: number;
  createdAt: string;
  endsAt: string | null;
  challenger: { handle: string | null; username: string };
  responder: { handle: string | null; username: string } | null;
};

type ForumThread = {
  id: string;
  title: string;
  createdAt: string;
  _count: { comments: number };
};

type Stats = {
  wins: number;
  losses: number;
  totalEarnings: number;
  bankBalance: number;
};

type Invitation = {
  id: string;
  code: string;
  status: string;
  createdAt: string;
  expiresAt: string;
  usedAt: string | null;
  invitee: {
    username: string;
    handle: string | null;
    joinedAt: string;
  } | null;
};

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"beefs" | "forum" | "wallet" | "invitations">("beefs");
  const [openBeefs, setOpenBeefs] = useState<Beef[]>([]);
  const [liveBeefs, setLiveBeefs] = useState<Beef[]>([]);
  const [completedBeefs, setCompletedBeefs] = useState<Beef[]>([]);
  const [forumThreads, setForumThreads] = useState<ForumThread[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [stats, setStats] = useState<Stats>({ wins: 0, losses: 0, totalEarnings: 0, bankBalance: 0 });
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
      return;
    }

    if (status === "authenticated") {
      loadDashboardData();
    }
  }, [status, router]);

  const loadDashboardData = async () => {
    try {
      const [beefsRes, forumRes, statsRes, invitationsRes] = await Promise.all([
        fetch("/api/user/my-beefs"),
        fetch("/api/user/my-forum-posts"),
        fetch("/api/user/stats"),
        fetch("/api/invitations/list"),
      ]);

      if (beefsRes.ok) {
        const data = await beefsRes.json();
        setOpenBeefs(data.open || []);
        setLiveBeefs(data.live || []);
        setCompletedBeefs(data.completed || []);
      }

      if (forumRes.ok) {
        const data = await forumRes.json();
        setForumThreads(data.threads || []);
      }

      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data);
      }

      if (invitationsRes.ok) {
        const data = await invitationsRes.json();
        setInvitations(data.invitations || []);
      }
    } catch (err) {
      console.error("Failed to load dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-beef-text-muted">Loading dashboard...</div>
      </div>
    );
  }

  const totalBeefs = stats.wins + stats.losses;
  const winRate = totalBeefs > 0 ? Math.round((stats.wins / totalBeefs) * 100) : 0;

  return (
    <div className="min-h-screen">
      <header className="container-beef py-6 border-b border-beef-border">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-2xl font-black tracking-tighter">
            BEEF
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/settings">
              <button className="text-xs font-bold text-beef-text-muted hover:text-beef-gold px-4 py-2 rounded-full border border-beef-border hover:border-beef-gold transition-colors">
                ⚙️ Settings
              </button>
            </Link>
          </div>
        </div>
      </header>

      <div className="container-beef py-12">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6"><BackButton /></div>

          <div className="mb-8">
            <h1 className="text-4xl font-black tracking-tight mb-2">DASHBOARD</h1>
            <p className="text-beef-text-muted">
              Welcome back, @{session?.user?.handle || session?.user?.username}
            </p>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="card-beef text-center">
              <p className="section-label mb-2">RECORD</p>
              <p className="text-2xl font-bold">
                {stats.wins}W - {stats.losses}L
              </p>
              {winRate > 0 && (
                <p className="text-xs text-beef-text-muted mt-1">{winRate}% Win Rate</p>
              )}
            </div>

            <Link href="/bank">
              <div className="card-beef text-center hover:border-beef-gold transition-colors cursor-pointer">
                <p className="section-label mb-2">BANK BALANCE</p>
                <p className="text-2xl font-bold text-beef-gold">
                  ${stats.bankBalance.toFixed(2)}
                </p>
                <p className="text-xs text-beef-text-muted mt-1">Click to manage</p>
              </div>
            </Link>

            <div className="card-beef text-center">
              <p className="section-label mb-2">TOTAL EARNINGS</p>
              <p className="text-2xl font-bold text-beef-gold">
                ${stats.totalEarnings.toFixed(2)}
              </p>
            </div>

            <div className="card-beef text-center">
              <p className="section-label mb-2">ACTIVE BEEFS</p>
              <p className="text-2xl font-bold text-beef-orange">
                {openBeefs.length + liveBeefs.length}
              </p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6 border-b border-beef-border pb-2">
            <button
              onClick={() => setActiveTab("beefs")}
              className={`px-4 py-2 rounded-t-lg font-bold text-sm transition-colors ${
                activeTab === "beefs"
                  ? "bg-beef-bg-card border-t border-x border-beef-gold text-beef-gold"
                  : "text-beef-text-muted hover:text-beef-text"
              }`}
            >
              MY BEEFS ({openBeefs.length + liveBeefs.length + completedBeefs.length})
            </button>
            <button
              onClick={() => setActiveTab("forum")}
              className={`px-4 py-2 rounded-t-lg font-bold text-sm transition-colors ${
                activeTab === "forum"
                  ? "bg-beef-bg-card border-t border-x border-beef-gold text-beef-gold"
                  : "text-beef-text-muted hover:text-beef-text"
              }`}
            >
              FORUM POSTS ({forumThreads.length})
            </button>
            <button
              onClick={() => setActiveTab("invitations")}
              className={`px-4 py-2 rounded-t-lg font-bold text-sm transition-colors ${
                activeTab === "invitations"
                  ? "bg-beef-bg-card border-t border-x border-beef-gold text-beef-gold"
                  : "text-beef-text-muted hover:text-beef-text"
              }`}
            >
              INVITATIONS ({invitations.length})
            </button>
            <button
              onClick={() => setActiveTab("wallet")}
              className={`px-4 py-2 rounded-t-lg font-bold text-sm transition-colors ${
                activeTab === "wallet"
                  ? "bg-beef-bg-card border-t border-x border-beef-gold text-beef-gold"
                  : "text-beef-text-muted hover:text-beef-text"
              }`}
            >
              WALLET
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === "beefs" && (
            <div className="space-y-8">
              {/* Live Beefs */}
              {liveBeefs.length > 0 && (
                <div>
                  <h3 className="text-xl font-bold mb-4 text-beef-orange">● LIVE BEEFS</h3>
                  <div className="grid gap-4">
                    {liveBeefs.map((beef) => (
                      <Link key={beef.id} href={`/beef/${beef.id}`}>
                        <div className="card-beef hover:border-beef-orange transition-colors cursor-pointer">
                          <div className="flex items-start justify-between mb-2">
                            <p className="font-bold text-sm flex-1">&ldquo;{beef.claim}&rdquo;</p>
                            <span className="text-xs text-beef-orange font-bold ml-4">LIVE</span>
                          </div>
                          <div className="flex items-center justify-between text-xs text-beef-text-muted">
                            <span>${beef.totalPot} pot</span>
                            {beef.endsAt && <span>Ends {new Date(beef.endsAt).toLocaleString()}</span>}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Open Beefs */}
              {openBeefs.length > 0 && (
                <div>
                  <h3 className="text-xl font-bold mb-4">OPEN CHALLENGES</h3>
                  <div className="grid gap-4">
                    {openBeefs.map((beef) => (
                      <Link key={beef.id} href={`/beef/${beef.id}`}>
                        <div className="card-beef hover:border-beef-gold transition-colors cursor-pointer">
                          <p className="font-bold text-sm mb-2">&ldquo;{beef.claim}&rdquo;</p>
                          <div className="flex items-center justify-between text-xs text-beef-text-muted">
                            <span>${beef.totalPot} pot</span>
                            <span>Waiting for opponent...</span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Completed Beefs */}
              {completedBeefs.length > 0 && (
                <div>
                  <h3 className="text-xl font-bold mb-4 text-beef-text-muted">BEEF HISTORY</h3>
                  <div className="grid gap-4 opacity-75">
                    {completedBeefs.slice(0, 5).map((beef) => (
                      <Link key={beef.id} href={`/beef/${beef.id}`}>
                        <div className="card-beef hover:border-beef-gold transition-colors cursor-pointer">
                          <p className="font-bold text-sm mb-2">&ldquo;{beef.claim}&rdquo;</p>
                          <div className="flex items-center justify-between text-xs text-beef-text-muted">
                            <span>${beef.totalPot} pot</span>
                            <span>Completed</span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                  {completedBeefs.length > 5 && (
                    <Link href="/settled">
                      <button className="w-full mt-4 text-xs text-beef-text-muted hover:text-beef-gold transition-colors">
                        View all {completedBeefs.length} completed beefs →
                      </button>
                    </Link>
                  )}
                </div>
              )}

              {openBeefs.length === 0 && liveBeefs.length === 0 && completedBeefs.length === 0 && (
                <div className="card-beef text-center py-20">
                  <p className="text-2xl font-bold mb-4">No beefs yet</p>
                  <p className="text-beef-text-muted mb-8">Start your first beef and put your opinions to the test</p>
                  <Link href="/beef/new">
                    <button className="btn-primary">START A BEEF</button>
                  </Link>
                </div>
              )}
            </div>
          )}

          {activeTab === "forum" && (
            <div>
              <h3 className="text-xl font-bold mb-4">MY FORUM POSTS</h3>
              {forumThreads.length > 0 ? (
                <div className="grid gap-4">
                  {forumThreads.map((thread) => (
                    <Link key={thread.id} href={`/forum/${thread.id}`}>
                      <div className="card-beef hover:border-beef-gold transition-colors cursor-pointer">
                        <p className="font-bold text-sm mb-2">{thread.title}</p>
                        <div className="flex items-center justify-between text-xs text-beef-text-muted">
                          <span>{thread._count.comments} replies</span>
                          <span>{new Date(thread.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="card-beef text-center py-20">
                  <p className="text-2xl font-bold mb-4">No forum posts yet</p>
                  <p className="text-beef-text-muted">Share your thoughts on the message board</p>
                </div>
              )}
            </div>
          )}

          {activeTab === "invitations" && (
            <div>
              <div className="card-beef mb-6">
                <h3 className="text-xl font-bold mb-4">YOUR INVITATION CODES</h3>
                <p className="text-beef-text-muted mb-6">
                  Share these exclusive codes with friends who would thrive in serious debate. Each code can be used once.
                </p>
                <div className="grid gap-4">
                  {invitations.map((inv) => (
                    <div
                      key={inv.id}
                      className={`border rounded-lg p-4 transition-colors ${
                        inv.status === "ACCEPTED"
                          ? "border-beef-border bg-beef-bg"
                          : inv.status === "EXPIRED"
                          ? "border-beef-border/50 bg-beef-bg/50 opacity-60"
                          : "border-beef-gold bg-beef-bg-card"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="font-mono text-lg font-bold text-beef-gold">
                          {inv.code}
                        </div>
                        <div className="flex items-center gap-2">
                          {inv.status === "PENDING" && (
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(
                                  `${window.location.origin}/auth/signup?invite=${inv.code}`
                                );
                                setCopiedCode(inv.code);
                                setTimeout(() => setCopiedCode(null), 2000);
                              }}
                              className="btn-secondary text-xs px-3 py-1"
                            >
                              {copiedCode === inv.code ? "✓ COPIED!" : "📋 COPY LINK"}
                            </button>
                          )}
                          <span
                            className={`px-3 py-1 rounded text-xs font-bold ${
                              inv.status === "ACCEPTED"
                                ? "bg-green-900/30 text-green-400"
                                : inv.status === "EXPIRED"
                                ? "bg-gray-900/30 text-gray-400"
                                : "bg-beef-gold/20 text-beef-gold"
                            }`}
                          >
                            {inv.status}
                          </span>
                        </div>
                      </div>
                      {inv.invitee && (
                        <div className="text-sm text-beef-text-muted">
                          Used by <span className="font-bold text-beef-text">
                            {inv.invitee.handle || inv.invitee.username}
                          </span> on {new Date(inv.invitee.joinedAt).toLocaleDateString()}
                        </div>
                      )}
                      {inv.status === "PENDING" && (
                        <div className="text-xs text-beef-text-muted mt-2">
                          Expires {new Date(inv.expiresAt).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {invitations.filter((i) => i.status === "PENDING").length === 0 && (
                <div className="card-beef text-center py-12 bg-beef-bg-card border-beef-gold">
                  <p className="text-xl font-bold mb-2">🎉 All Invites Used!</p>
                  <p className="text-beef-text-muted">
                    You've used all your invitation codes. Great work spreading the word!
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === "wallet" && (
            <div>
              <div className="card-beef mb-6">
                <div className="text-center py-8">
                  <p className="section-label mb-2">CURRENT BALANCE</p>
                  <p className="text-5xl font-bold text-beef-gold mb-6">
                    ${stats.bankBalance.toFixed(2)}
                  </p>
                  <div className="flex gap-4 justify-center">
                    <Link href="/bank">
                      <button className="btn-primary px-8">
                        💰 ADD FUNDS
                      </button>
                    </Link>
                    <Link href="/bank">
                      <button className="btn-secondary px-8">
                        📤 WITHDRAW
                      </button>
                    </Link>
                  </div>
                </div>
              </div>

              <div className="card-beef">
                <h3 className="text-xl font-bold mb-4">EARNINGS SUMMARY</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-3 border-b border-beef-border">
                    <span className="text-beef-text-muted">Total Earnings</span>
                    <span className="font-bold text-beef-gold">${stats.totalEarnings.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between py-3 border-b border-beef-border">
                    <span className="text-beef-text-muted">Wins</span>
                    <span className="font-bold">{stats.wins}</span>
                  </div>
                  <div className="flex items-center justify-between py-3 border-b border-beef-border">
                    <span className="text-beef-text-muted">Losses</span>
                    <span className="font-bold">{stats.losses}</span>
                  </div>
                  <div className="flex items-center justify-between py-3">
                    <span className="text-beef-text-muted">Win Rate</span>
                    <span className="font-bold text-beef-gold">{winRate}%</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
