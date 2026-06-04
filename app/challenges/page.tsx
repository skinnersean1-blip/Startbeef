export const dynamic = "force-dynamic";

import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { AuthHeader } from "@/components/AuthHeader";

async function getOpenBeefs() {
  return prisma.beef.findMany({
    where: { status: "OPEN" },
    orderBy: { createdAt: "desc" },
    include: {
      challenger: { select: { handle: true, username: true, isAnonymous: true, anonHandle: true, wins: true, losses: true } },
      _count: { select: { messages: true } },
    },
  });
}

function timeAgo(date: Date) {
  const s = Math.floor((Date.now() - date.getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export default async function ChallengesPage() {
  const beefs = await getOpenBeefs();

  return (
    <div className="min-h-screen">
      <header className="container-beef py-6 sm:py-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <Link href="/">
              <h1 className="text-5xl sm:text-7xl font-bold tracking-tighter leading-none text-beef-text cursor-pointer">
                BEEF
              </h1>
            </Link>
          </div>
          <AuthHeader />
        </div>
      </header>

      <div className="container-beef pb-24">
        <div className="flex items-center gap-4 mb-8">
          <div>
            <Link href="/" className="text-beef-text-muted text-xs tracking-widest hover:text-beef-gold transition-colors">
              ← BACK
            </Link>
            <h2 className="text-3xl font-bold mt-2">OPEN CHALLENGES</h2>
            <p className="text-beef-text-muted text-sm mt-1">{beefs.length} challenge{beefs.length !== 1 ? "s" : ""} waiting for a response</p>
          </div>
          <div className="flex-1 border-t border-beef-border/40 ml-4" />
          <Link href="/beef/new">
            <button className="btn-primary text-sm">START A BEEF</button>
          </Link>
        </div>

        {beefs.length === 0 ? (
          <div className="card-beef text-center py-20">
            <p className="text-3xl font-bold mb-4">NO BEEFS YET.</p>
            <p className="text-beef-text-muted mb-8">Someone has to go first.</p>
            <Link href="/beef/new">
              <button className="btn-primary">START A BEEF</button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {beefs.map((beef) => {
              const categories: string[] = JSON.parse(beef.categories || "[]");
              const challengerName = beef.challengerIsAnon || beef.challenger.isAnonymous
                ? (beef.challenger.anonHandle ?? "GHOST")
                : `@${beef.challenger.handle || beef.challenger.username}`;

              return (
                <Link key={beef.id} href={`/beef/${beef.id}`}>
                  <div className="flex flex-col h-full rounded-xl border border-beef-border bg-beef-bg-card p-5 cursor-pointer transition-all duration-150 hover:border-beef-gold/60 hover:-translate-y-0.5">
                    <div className="flex items-center gap-2 mb-3 flex-wrap min-h-[20px]">
                      {categories.slice(0, 2).map((cat) => (
                        <span key={cat} className="text-xs text-beef-gold bg-beef-gold/10 px-2 py-0.5 font-bold tracking-widest">
                          [{cat}]
                        </span>
                      ))}
                    </div>

                    <p className="text-base font-bold leading-snug mb-4 flex-1">
                      &ldquo;{beef.claim.length > 120 ? beef.claim.slice(0, 120) + "…" : beef.claim}&rdquo;
                    </p>

                    <div className="border-t border-beef-border/50 pt-3 mt-auto">
                      <div className="flex items-end justify-between mb-2">
                        <div>
                          <p className="text-xs text-beef-text-muted tracking-widest mb-0.5">ANTE</p>
                          <p className="text-2xl font-bold text-beef-gold">${beef.ante}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-beef-text-muted">{timeAgo(beef.createdAt)}</p>
                          {beef._count.messages > 0 && (
                            <p className="text-xs text-beef-text-muted mt-0.5">
                              {beef._count.messages} msg{beef._count.messages !== 1 ? "s" : ""}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-beef-text-muted">
                        <span className="text-beef-gold font-bold truncate">{challengerName}</span>
                        <span className="shrink-0 px-2 py-0.5 border border-dashed border-beef-border">
                          OPEN SEAT
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
