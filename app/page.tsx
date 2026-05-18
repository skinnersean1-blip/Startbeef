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
      challenger: { select: { handle: true, username: true, wins: true, losses: true } },
      responder:  { select: { handle: true, username: true } },
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
    <div className="min-h-screen" style={{ background: "radial-gradient(ellipse 100% 80% at 80% 100%, rgba(196,140,60,0.22) 0%, rgba(196,140,60,0.08) 40%, transparent 70%)" }}>
      {/* Header */}
      <header className="container-beef py-8">
        <div className="flex items-center justify-between gap-8">
          {/* Logo */}
          <div className="flex-shrink-0">
            <p className="section-label mb-1">TALK SHIT, MAKE MONEY</p>
            <h1 className="text-8xl font-bold tracking-tighter leading-none text-beef-text">
              BEEF
            </h1>
          </div>

          {/* Hero copy */}
          <div className="flex-1 max-w-xl">
            <h2 className="text-2xl font-bold leading-tight mb-2">
              OPINION MARKET
            </h2>
            <p className="text-beef-text-muted text-sm leading-relaxed">
              Speak your mind. Fight your corner. Get paid — or watch it all go down.
            </p>
          </div>

          {/* CTAs + auth */}
          <div className="flex-shrink-0 flex flex-col items-end gap-4">
            <AuthHeader />
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
        <div className="grid grid-cols-4 gap-4">
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
            <p className="text-3xl font-bold mb-4">THE ARENA IS EMPTY.</p>
            <p className="text-beef-text-muted mb-8">Someone has to go first.</p>
            <Link href="/beef/new">
              <button className="btn-primary">START A BEEF</button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {feed.map((beef) => {
              const categories: string[] = JSON.parse(beef.categories || "[]");
              const isLive = beef.status === "LIVE";

              return (
                <Link key={beef.id} href={`/beef/${beef.id}`}>
                  <div
                    className={`card-beef hover:border-beef-gold/60 transition-all duration-150 cursor-pointer ${
                      isLive ? "border-beef-orange/40 hover:border-beef-orange" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-6">
                      <div className="flex-1 min-w-0">
                        {/* Status + categories */}
                        <div className="flex items-center gap-2 mb-3 flex-wrap">
                          {isLive && (
                            <span className="text-xs font-bold text-beef-orange tracking-widest">
                              ● LIVE
                            </span>
                          )}
                          {categories.map((cat) => (
                            <span
                              key={cat}
                              className="text-xs text-beef-gold bg-beef-gold/10 px-2 py-0.5 rounded-full font-bold tracking-widest"
                            >
                              {cat}
                            </span>
                          ))}
                        </div>

                        {/* Claim */}
                        <p className="text-lg font-bold leading-snug mb-3">
                          &ldquo;
                          {beef.claim.length > 140
                            ? beef.claim.slice(0, 140) + "…"
                            : beef.claim}
                          &rdquo;
                        </p>

                        {/* Participants */}
                        <div className="flex items-center gap-2 text-sm text-beef-text-muted">
                          <span className="text-beef-gold font-bold">
                            @{beef.challenger.handle || beef.challenger.username}
                          </span>
                          {beef.responder && (
                            <>
                              <span className="text-beef-border font-bold">vs</span>
                              <span>
                                @{beef.responder.handle || beef.responder.username}
                              </span>
                            </>
                          )}
                          {!beef.responder && (
                            <span className="text-xs px-2 py-0.5 rounded-full border border-dashed border-beef-border ml-1">
                              OPEN SEAT
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Right meta */}
                      <div className="text-right flex-shrink-0">
                        <p className="text-2xl font-bold text-beef-gold">
                          ${beef.totalPot}
                        </p>
                        <p className="text-xs text-beef-text-muted mt-0.5">pot</p>
                        {isLive && beef.endsAt && (
                          <p className="text-xs text-beef-orange font-bold mt-2">
                            {timeLeft(beef.endsAt)}
                          </p>
                        )}
                        {!isLive && (
                          <p className="text-xs text-beef-text-muted mt-2">
                            {timeAgo(beef.createdAt)}
                          </p>
                        )}
                        {beef._count.messages > 0 && (
                          <p className="text-xs text-beef-text-muted mt-1">
                            {beef._count.messages} msg
                            {beef._count.messages !== 1 ? "s" : ""}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
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
          </div>
        </div>
      </footer>
    </div>
  );
}
