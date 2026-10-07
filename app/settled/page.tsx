export const dynamic = "force-dynamic";

import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { AuthHeader } from "@/components/AuthHeader";
import { BrowseBar } from "@/components/BrowseBar";

async function getSettledBeefs(category: string) {
  const categoryFilter =
    category !== "ALL" ? { categories: { contains: category } } : {};

  try {
    return await prisma.beef.findMany({
      where: { status: "COMPLETED", ...categoryFilter },
      orderBy: { updatedAt: "desc" },
      take: 50,
      include: {
        challenger: {
          select: {
            id: true,
            handle: true,
            username: true,
            isAnonymous: true,
            anonHandle: true,
            wins: true,
            losses: true
          }
        },
        responder: {
          select: {
            id: true,
            handle: true,
            username: true,
            isAnonymous: true,
            anonHandle: true
          }
        },
        _count: { select: { messages: true } },
      },
    });
  } catch {
    return [];
  }
}

function timeAgo(date: Date) {
  const s = Math.floor((Date.now() - date.getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function displayName(
  user: { handle: string | null; username: string; isAnonymous: boolean; anonHandle: string | null } | null,
  isAnonBeef = false
) {
  if (!user) return "Unknown";
  return user.isAnonymous || isAnonBeef
    ? (user.anonHandle ?? "GHOST")
    : `@${user.handle || user.username}`;
}

function fmt(n: number) {
  return `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default async function SettledPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const params = await searchParams;
  const category = params.category || "ALL";
  const beefs = await getSettledBeefs(category);

  return (
    <div className="min-h-screen bg-beef-bg text-beef-text">
      <header className="container-beef py-4 border-b border-beef-border">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-2xl font-black tracking-tighter">
            BEEF
          </Link>
          <AuthHeader />
        </div>
      </header>

      <section className="container-beef py-8">
        <div className="mb-6">
          <h1 className="text-4xl font-black tracking-tight mb-2">SETTLED BEEFS</h1>
          <p className="text-beef-text-muted">Browse past debates and see who won</p>
        </div>

        <BrowseBar activeCategory={category} />

        {beefs.length === 0 ? (
          <div className="card-beef text-center py-20 mt-6">
            <p className="text-3xl font-bold mb-4">NO SETTLED BEEFS YET.</p>
            <p className="text-beef-text-muted mb-8">
              {category === "ALL"
                ? "Be the first to settle a beef."
                : "No settled beefs in this category yet."}
            </p>
            <Link href="/beef/new">
              <button className="btn-primary">START A BEEF</button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
            {beefs.map((beef) => {
              const challengerName = displayName(beef.challenger, beef.challengerIsAnon);
              const responderName = beef.responder ? displayName(beef.responder, beef.responderIsAnon) : null;

              // Determine winner name from winnerId
              let winnerName = null;
              if (beef.winnerId === beef.challenger.id) {
                winnerName = challengerName;
              } else if (beef.winnerId && beef.responder && beef.winnerId === beef.responder.id) {
                winnerName = responderName;
              }
              const categories = (() => {
                try {
                  return JSON.parse(beef.categories || "[]");
                } catch {
                  return [];
                }
              })();

              return (
                <Link key={beef.id} href={`/beef/${beef.id}`}>
                  <div className="card-beef p-5 cursor-pointer hover:border-beef-gold transition-all h-full">
                    {/* Categories */}
                    {categories.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {categories.map((cat: string) => (
                          <span
                            key={cat}
                            className="text-[10px] font-bold tracking-wider px-2 py-1 rounded-full bg-beef-bg-card text-beef-text-muted border border-beef-border"
                          >
                            {cat}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Claim */}
                    <p className="text-sm font-bold mb-3 leading-tight line-clamp-2">
                      &ldquo;{beef.claim}&rdquo;
                    </p>

                    {/* Participants */}
                    <div className="flex items-center gap-2 text-xs mb-3">
                      <span className="font-bold">{challengerName}</span>
                      {responderName && (
                        <>
                          <span className="text-beef-text-muted">vs</span>
                          <span className="font-bold">{responderName}</span>
                        </>
                      )}
                    </div>

                    {/* Winner Badge */}
                    {winnerName && (
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-xs font-bold text-beef-gold">
                          🏆 {winnerName} won
                        </span>
                      </div>
                    )}

                    {/* Judge Decision */}
                    {beef.judgeDecision && (
                      <p className="text-xs text-beef-text-muted mb-3 line-clamp-2">
                        {beef.judgeDecision}
                      </p>
                    )}

                    {/* Stats */}
                    <div className="flex items-center gap-4 text-xs text-beef-text-muted pt-3 border-t border-beef-border">
                      <span className="font-bold text-beef-orange">{fmt(beef.totalPot)}</span>
                      <span>{beef._count.messages} messages</span>
                      <span className="ml-auto">{timeAgo(beef.updatedAt)}</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
