import Link from "next/link";
import { AuthHeader } from "@/components/AuthHeader";
import { HeroCTA } from "@/components/HeroCTA";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function getStats() {
  const [openCount, liveCount] = await Promise.all([
    prisma.beef.count({ where: { status: "OPEN" } }),
    prisma.beef.count({ where: { status: "LIVE" } }),
  ]);
  const livePot = await prisma.beef.aggregate({
    where: { status: "LIVE" },
    _sum: { totalPot: true },
  });
  return { openCount, liveCount, livePot: livePot._sum.totalPot ?? 0 };
}

async function getOpenBeefs() {
  return prisma.beef.findMany({
    where: { status: "OPEN" },
    orderBy: { createdAt: "desc" },
    take: 12,
    include: {
      challenger: { select: { handle: true, username: true, wins: true, losses: true } },
    },
  });
}

async function getLiveBeefs() {
  return prisma.beef.findMany({
    where: { status: "LIVE" },
    orderBy: { startedAt: "desc" },
    take: 6,
    include: {
      challenger: { select: { handle: true, username: true } },
      responder:  { select: { handle: true, username: true } },
    },
  });
}

function timeAgo(date: Date) {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

function timeLeft(endsAt: Date) {
  const ms = endsAt.getTime() - Date.now();
  if (ms <= 0) return "EXPIRED";
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return `${h}h ${m}m left`;
}

export default async function Home() {
  const [stats, openBeefs, liveBeefs] = await Promise.all([
    getStats(),
    getOpenBeefs(),
    getLiveBeefs(),
  ]);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="container-beef py-6">
        <div className="flex items-center justify-between">
          <Link href="/">
            <div className="cursor-pointer">
              <p className="section-label mb-2">PAID DISSENT PLATFORM</p>
              <h1 className="text-6xl font-bold tracking-tighter">BEEF</h1>
            </div>
          </Link>
          <AuthHeader />
        </div>
      </header>

      {/* Hero */}
      <section className="container-beef py-16">
        <div className="max-w-4xl">
          <h2 className="text-5xl font-bold mb-6 leading-tight">
            PUT MONEY WHERE YOUR MOUTH IS.
          </h2>
          <p className="text-xl text-muted max-w-2xl mb-10">
            Post a claim. Set an ante. Someone matches it. 24-hour free-for-all thread.
            AI reads the whole thing and picks a winner.
          </p>
          <HeroCTA />
        </div>
      </section>

      {/* Live Stats */}
      <section className="container-beef py-8">
        <div className="grid grid-cols-3 gap-6">
          <div className="card-beef">
            <p className="section-label mb-2">LIVE POT</p>
            <p className="text-4xl font-bold text-beef-gold">${stats.livePot.toLocaleString()}</p>
          </div>
          <div className="card-beef">
            <p className="section-label mb-2">OPEN CHALLENGES</p>
            <p className="text-4xl font-bold">{stats.openCount}</p>
          </div>
          <div className="card-beef">
            <p className="section-label mb-2">LIVE NOW</p>
            <p className="text-4xl font-bold text-beef-orange">{stats.liveCount}</p>
          </div>
        </div>
      </section>

      {/* Live Beefs */}
      {liveBeefs.length > 0 && (
        <section className="container-beef py-10">
          <p className="section-label mb-6">● LIVE NOW</p>
          <div className="space-y-4">
            {liveBeefs.map((beef) => {
              const categories: string[] = JSON.parse(beef.categories || "[]");
              return (
                <Link key={beef.id} href={`/beef/${beef.id}`}>
                  <div className="card-beef border-beef-orange/50 hover:border-beef-orange transition-all duration-200 cursor-pointer">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-xs font-bold text-beef-orange tracking-widest">LIVE</span>
                          {categories.map((cat) => (
                            <span key={cat} className="text-xs text-beef-gold bg-beef-gold/10 px-2 py-0.5 rounded-full">
                              {cat}
                            </span>
                          ))}
                        </div>
                        <p className="text-lg font-bold mb-3 leading-snug">&ldquo;{beef.claim}&rdquo;</p>
                        <div className="flex items-center gap-3 text-sm text-muted">
                          <span>@{beef.challenger.handle || beef.challenger.username}</span>
                          <span className="text-beef-gold font-bold">vs</span>
                          <span>@{beef.responder?.handle || beef.responder?.username}</span>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-2xl font-bold text-beef-gold">${beef.totalPot}</p>
                        <p className="text-xs text-muted mt-1">pot</p>
                        {beef.endsAt && (
                          <p className="text-xs text-beef-orange mt-2 font-bold">{timeLeft(beef.endsAt)}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Open Challenges */}
      <section className="container-beef py-10">
        <div className="flex items-center justify-between mb-6">
          <p className="section-label">OPEN CHALLENGES</p>
          {openBeefs.length === 0 && (
            <p className="text-muted text-sm">None yet — be the first</p>
          )}
        </div>

        {openBeefs.length === 0 ? (
          <div className="card-beef text-center py-16">
            <p className="text-3xl font-bold mb-4">THE ARENA IS EMPTY.</p>
            <p className="text-muted mb-8">Someone has to go first.</p>
            <Link href="/beef/new">
              <button className="btn-primary">START A BEEF</button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {openBeefs.map((beef) => {
              const categories: string[] = JSON.parse(beef.categories || "[]");
              return (
                <Link key={beef.id} href={`/beef/${beef.id}`}>
                  <div className="card-beef hover:border-beef-gold/60 transition-all duration-200 cursor-pointer h-full">
                    <div className="flex flex-col h-full">
                      <div className="flex items-center gap-2 mb-3">
                        {categories.map((cat) => (
                          <span key={cat} className="text-xs text-beef-gold bg-beef-gold/10 px-2 py-0.5 rounded-full font-bold tracking-widest">
                            {cat}
                          </span>
                        ))}
                        {categories.length === 0 && (
                          <span className="text-xs text-muted">UNCATEGORIZED</span>
                        )}
                      </div>

                      <p className="text-lg font-bold leading-snug mb-4 flex-1">
                        &ldquo;{beef.claim.length > 120 ? beef.claim.slice(0, 120) + "…" : beef.claim}&rdquo;
                      </p>

                      <div className="flex items-center justify-between mt-auto pt-4 border-t border-beef-border">
                        <div>
                          <p className="text-sm text-muted">
                            @{beef.challenger.handle || beef.challenger.username}
                          </p>
                          <p className="text-xs text-muted">{beef.challenger.wins}W — {beef.challenger.losses}L</p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-beef-gold">${beef.ante}</p>
                          <p className="text-xs text-muted">{timeAgo(beef.createdAt)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* How it works */}
      <section className="container-beef py-16">
        <div className="card-beef max-w-2xl">
          <p className="section-label mb-6">HOW IT WORKS</p>
          <div className="space-y-4">
            {[
              ["01", "POST A CLAIM", "Write what you believe. Set your ante ($10–$100)."],
              ["02", "SOMEONE ACCEPTS", "They match your ante. Clock starts. Pot locked."],
              ["03", "FREE-FOR-ALL THREAD", "24 hours. No rounds. Pure chaos. Get the last word."],
              ["04", "AI JUDGES", "When time expires, a random LLM reads the full thread and picks who made the most convincing case."],
            ].map(([n, title, desc]) => (
              <div key={n} className="flex gap-4">
                <span className="text-beef-gold font-bold text-sm w-6 flex-shrink-0 mt-0.5">{n}</span>
                <div>
                  <p className="font-bold">{title}</p>
                  <p className="text-muted text-sm">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="container-beef py-12 border-t border-beef-border mt-10">
        <div className="flex justify-between items-center">
          <p className="text-muted text-sm">© 2026 Beef. Put money where your mouth is.</p>
          <div className="flex gap-6 text-sm">
            <Link href="/about" className="text-muted hover:text-beef-gold transition-colors">About</Link>
            <Link href="/rules" className="text-muted hover:text-beef-gold transition-colors">Rules</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
