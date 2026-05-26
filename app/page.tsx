export const dynamic = "force-dynamic";

import Link from "next/link";
import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { AuthHeader } from "@/components/AuthHeader";
import { HeroCTA } from "@/components/HeroCTA";
import { BrowseBar } from "@/components/BrowseBar";

async function getStats() {
  const [openCount, livePotResult, spectatorResult, completedCount, startedCount] =
    await Promise.all([
      prisma.beef.count({ where: { status: "OPEN" } }),
      prisma.beef.aggregate({ where: { status: "LIVE" }, _sum: { totalPot: true } }),
      prisma.beef.aggregate({ _sum: { viewCount: true } }),
      prisma.beef.count({ where: { status: "COMPLETED" } }),
      prisma.beef.count({ where: { status: { in: ["LIVE", "JUDGING", "COMPLETED"] } } }),
    ]);

  const judgedRate =
    startedCount > 0 ? Math.round((completedCount / startedCount) * 100) : 100;

  return {
    livePot: livePotResult._sum.totalPot ?? 0,
    openCount,
    spectators: spectatorResult._sum.viewCount ?? 0,
    judgedRate,
  };
}

async function getFeed(category: string, sort: string) {
  const statusFilter =
    sort === "ending"
      ? { status: "LIVE" }
      : sort === "new"
      ? { status: "OPEN" }
      : { status: { in: ["OPEN", "LIVE"] } };

  const categoryFilter =
    category !== "ALL" ? { categories: { contains: category } } : {};

  const orderBy =
    sort === "hot"     ? { totalPot: "desc" as const } :
    sort === "ending"  ? { endsAt: "asc" as const } :
    sort === "new"     ? { createdAt: "desc" as const } :
                         { updatedAt: "desc" as const };

  return prisma.beef.findMany({
    where: { ...statusFilter, ...categoryFilter },
    orderBy,
    take: 20,
    include: {
      challenger: { select: { handle: true, username: true, isAnonymous: true, anonHandle: true, wins: true, losses: true } },
      responder:  { select: { handle: true, username: true, isAnonymous: true, anonHandle: true } },
      _count:     { select: { messages: true } },
    },
  });
}

function timeLeft(endsAt: Date) {
  const ms = endsAt.getTime() - Date.now();
  if (ms <= 0) return "EXPIRED";
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return h > 0 ? `${h}h ${m}m left` : `${m}m left`;
}

function timeAgo(date: Date) {
  const s = Math.floor((Date.now() - date.getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string; sort?: string }>;
}) {
  const { cat, sort } = await searchParams;
  const category = cat || "ALL";
  const sortKey  = sort || "hot";

  const [stats, feed] = await Promise.all([
    getStats(),
    getFeed(category, sortKey),
  ]);

  return (
    <div className="min-h-screen" style={{ background: "radial-gradient(ellipse 160% 120% at 85% 95%, rgba(212,165,116,0.38) 0%, rgba(196,140,60,0.18) 35%, rgba(196,140,60,0.06) 65%, transparent 100%)" }}>
      {/* Header */}
      <header className="container-beef py-6 sm:py-8">
        {/* Mobile: stacked layout */}
        <div className="flex items-center justify-between gap-4 mb-4 sm:mb-0">
          <div className="flex-shrink-0">
            <p className="section-label mb-1 text-[10px] sm:text-xs">TALK SHIT, MAKE MONEY</p>
            <h1 className="text-5xl sm:text-7xl lg:text-8xl font-bold tracking-tighter leading-none text-beef-text">
              BEEF
            </h1>
          </div>
          <div className="flex-shrink-0">
            <AuthHeader />
          </div>
        </div>

        {/* Hero copy + CTA — hidden on smallest screens, shown below logo on sm+ */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mt-2 sm:mt-4">
          <div className="max-w-xl">
            <h2 className="text-lg sm:text-2xl font-bold leading-tight mb-1">
              OPINION MARKET
            </h2>
            <p className="text-beef-text-muted text-xs sm:text-sm leading-relaxed">
              Speak your mind. Fight your corner. Get paid — or watch it all go down.
            </p>
          </div>
          <div className="flex-shrink-0">
            <HeroCTA />
          </div>
        </div>
      </header>

      {/* Browse / Sort bar */}
      <Suspense>
        <BrowseBar />
      </Suspense>

      {/* Stats strip */}
      <section className="container-beef py-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="card-beef py-5">
            <p className="section-label mb-2">TONIGHT&apos;S LIVE POT</p>
            <p className="text-3xl font-bold text-beef-gold">
              ${stats.livePot.toLocaleString()}
            </p>
          </div>
          <div className="card-beef py-5">
            <p className="section-label mb-2">OPEN CHALLENGES</p>
            <p className="text-3xl font-bold">{stats.openCount}</p>
          </div>
          <div className="card-beef py-5">
            <p className="section-label mb-2">SIDELINE SPECTATORS</p>
            <p className="text-3xl font-bold">{stats.spectators.toLocaleString()}</p>
          </div>
          <div className="card-beef py-5">
            <p className="section-label mb-2">JUDGED IN 24H</p>
            <p className="text-3xl font-bold">{stats.judgedRate}%</p>
          </div>
        </div>
      </section>

      {/* Feed */}
      <section id="feed" className="container-beef py-6 pb-24">
        {feed.length === 0 ? (
          <div className="card-beef text-center py-20">
            <p className="text-3xl font-bold mb-4">RINGSIDE IS EMPTY.</p>
            <p className="text-beef-text-muted mb-8">Someone has to go first.</p>
            <Link href="/beef/new">
              <button className="btn-primary">START A BEEF</button>
            </Link>
          </div>
        ) : (() => {
          const live = feed.filter((b) => b.status === "LIVE");
          const open = feed.filter((b) => b.status !== "LIVE");

          const BeefTile = ({ beef }: { beef: typeof feed[0] }) => {
            const categories: string[] = JSON.parse(beef.categories || "[]");
            const isLive = beef.status === "LIVE";
            const challengerName = (beef as any).challengerIsAnon || beef.challenger.isAnonymous
              ? (beef.challenger.anonHandle ?? "GHOST")
              : `@${beef.challenger.handle || beef.challenger.username}`;
            const responderName = beef.responder
              ? ((beef as any).responderIsAnon || beef.responder.isAnonymous
                  ? (beef.responder.anonHandle ?? "GHOST")
                  : `@${beef.responder.handle || beef.responder.username}`)
              : null;

            return (
              <Link href={`/beef/${beef.id}`}>
                <div className={`flex flex-col h-full rounded-xl border p-5 cursor-pointer transition-all duration-150 hover:border-beef-gold/60 hover:-translate-y-0.5 ${
                  isLive
                    ? "bg-beef-bg-card border-beef-orange/40 shadow-[0_0_20px_rgba(201,122,56,0.08)]"
                    : "bg-beef-bg-card border-beef-border"
                }`}>

                  {/* Top: status + categories */}
                  <div className="flex items-center gap-2 mb-3 flex-wrap min-h-[20px]">
                    {isLive && (
                      <span className="text-xs font-bold text-beef-orange tracking-widest">● LIVE</span>
                    )}
                    {categories.slice(0, 2).map((cat) => (
                      <span key={cat} className="text-xs text-beef-gold bg-beef-gold/10 px-2 py-0.5 font-bold tracking-widest">
                        [{cat}]
                      </span>
                    ))}
                  </div>

                  {/* Claim — grows to fill space */}
                  <p className="text-base font-bold leading-snug mb-4 flex-1">
                    &ldquo;{beef.claim.length > 120 ? beef.claim.slice(0, 120) + "…" : beef.claim}&rdquo;
                  </p>

                  {/* Divider */}
                  <div className="border-t border-beef-border/50 pt-3 mt-auto">
                    {/* Pot */}
                    <div className="flex items-end justify-between mb-2">
                      <div>
                        <p className="text-xs text-beef-text-muted tracking-widest mb-0.5">POT</p>
                        <p className="text-2xl font-bold text-beef-gold">${beef.totalPot}</p>
                      </div>
                      <div className="text-right">
                        {isLive && beef.endsAt && (
                          <p className="text-xs text-beef-orange font-bold">{timeLeft(beef.endsAt)}</p>
                        )}
                        {!isLive && (
                          <p className="text-xs text-beef-text-muted">{timeAgo(beef.createdAt)}</p>
                        )}
                        {beef._count.messages > 0 && (
                          <p className="text-xs text-beef-text-muted mt-0.5">
                            {beef._count.messages} msg{beef._count.messages !== 1 ? "s" : ""}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Participants */}
                    <div className="flex items-center gap-1.5 text-xs text-beef-text-muted truncate">
                      <span className="text-beef-gold font-bold truncate">{challengerName}</span>
                      {responderName && (
                        <>
                          <span className="font-bold shrink-0">vs</span>
                          <span className="truncate">{responderName}</span>
                        </>
                      )}
                      {!beef.responder && (
                        <span className="shrink-0 px-2 py-0.5 border border-dashed border-beef-border">
                          OPEN SEAT
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            );
          };

          return (
            <div className="space-y-8">
              {live.length > 0 && (
                <div>
                  <div className="flex items-center gap-4 mb-4">
                    <p className="section-label text-beef-orange">● LIVE BEEFS</p>
                    <div className="flex-1 border-t border-beef-orange/20" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {live.map((beef) => <BeefTile key={beef.id} beef={beef} />)}
                  </div>
                </div>
              )}
              {open.length > 0 && (
                <div>
                  <div className="flex items-center gap-4 mb-4">
                    <p className="section-label">OPEN CHALLENGES</p>
                    <div className="flex-1 border-t border-beef-border/40" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {open.map((beef) => <BeefTile key={beef.id} beef={beef} />)}
                  </div>
                </div>
              )}
            </div>
          );
        })()}
      </section>

      <footer className="container-beef py-10 border-t border-beef-border">
        <div className="flex justify-between items-center">
          <p className="text-beef-text-muted text-xs tracking-widest">
            © 2026 BEEF. TALK SHIT, MAKE MONEY.
          </p>
          <div className="flex gap-6 text-xs">
            <Link
              href="/about"
              className="text-beef-text-muted hover:text-beef-gold transition-colors tracking-widest"
            >
              ABOUT
            </Link>
            <Link
              href="/rules"
              className="text-beef-text-muted hover:text-beef-gold transition-colors tracking-widest"
            >
              RULES
            </Link>
            <Link
              href="/terms"
              className="text-beef-text-muted hover:text-beef-gold transition-colors tracking-widest"
            >
              TERMS
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
