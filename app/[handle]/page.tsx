export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { AuthHeader } from "@/components/AuthHeader";
import { BackButton } from "@/components/BackButton";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle: rawHandle } = await params;
  const handle = rawHandle.startsWith("@") ? rawHandle.slice(1) : rawHandle;

  const user = await prisma.user.findFirst({
    where: {
      OR: [{ handle }, { username: handle }],
    },
    include: {
      challengesCreated: {
        orderBy: { createdAt: "desc" },
        take: 20,
        include: {
          responder: { select: { handle: true, username: true } },
        },
      },
      challengesAccepted: {
        orderBy: { createdAt: "desc" },
        take: 20,
        include: {
          challenger: { select: { handle: true, username: true } },
        },
      },
    },
  });

  if (!user) notFound();

  const session = await getServerSession(authOptions);
  const isOwnProfile = session?.user?.id === user.id;

  const displayHandle = user.handle || user.username;
  const totalBeefs = user.wins + user.losses;
  const winRate = totalBeefs > 0 ? Math.round((user.wins / totalBeefs) * 100) : null;

  const allBeefs = [
    ...user.challengesCreated.map((b) => ({ ...b, role: "CHALLENGER" as const })),
    ...user.challengesAccepted.map((b) => ({ ...b, role: "RESPONDER" as const })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const STATUS_COLOR: Record<string, string> = {
    OPEN: "text-beef-gold",
    LIVE: "text-beef-orange",
    JUDGING: "text-beef-text-muted",
    COMPLETED: "text-beef-text-muted",
  };

  return (
    <div className="min-h-screen">
      <header className="container-beef py-6">
        <div className="flex items-center justify-between">
          <Link href="/">
            <div className="cursor-pointer">
              <p className="section-label mb-1">PAID DISSENT PLATFORM</p>
              <h1 className="text-4xl font-bold tracking-tighter">BEEF</h1>
            </div>
          </Link>
          <AuthHeader />
        </div>
      </header>

      <div className="container-beef pb-20">
        <div className="max-w-3xl mx-auto">

          <div className="mb-6"><BackButton /></div>

          {/* Profile header */}
          <div className="card-beef mb-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="section-label mb-2">FIGHTER</p>
                <h2 className="text-4xl font-bold mb-1">@{displayHandle}</h2>
                {user.bio && <p className="text-beef-text-muted mt-2">{user.bio}</p>}
              </div>
              {isOwnProfile && (
                <span className="text-xs text-beef-text-muted bg-beef-bg-light px-3 py-1 rounded-full border border-beef-border">
                  YOUR PROFILE
                </span>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="card-beef text-center">
              <p className="section-label mb-2">RECORD</p>
              <p className="text-3xl font-bold">
                <span className="text-beef-gold">{user.wins}W</span>
                <span className="text-beef-text-muted mx-1">—</span>
                <span className="text-beef-orange">{user.losses}L</span>
              </p>
            </div>
            <div className="card-beef text-center">
              <p className="section-label mb-2">WIN RATE</p>
              <p className="text-3xl font-bold">
                {winRate !== null ? `${winRate}%` : "—"}
              </p>
            </div>
            <div className="card-beef text-center">
              <p className="section-label mb-2">TOTAL BEEFS</p>
              <p className="text-3xl font-bold">{totalBeefs}</p>
            </div>
          </div>

          {/* Beef history */}
          <div>
            <p className="section-label mb-4">BEEF HISTORY</p>

            {allBeefs.length === 0 ? (
              <div className="card-beef text-center py-12">
                <p className="text-beef-text-muted">No beefs yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {allBeefs.map((beef) => {
                  const opponent =
                    beef.role === "CHALLENGER"
                      ? beef.responder
                      : (beef as { challenger?: { handle: string | null; username: string } }).challenger;
                  const isWinner = beef.winnerId === user.id;
                  const isLoser = beef.status === "COMPLETED" && beef.winnerId && beef.winnerId !== user.id;

                  return (
                    <Link key={`${beef.role}-${beef.id}`} href={`/beef/${beef.id}`}>
                      <div className="card-beef hover:border-beef-gold/50 transition-all duration-150 cursor-pointer">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <span className={`text-xs font-bold tracking-widest ${STATUS_COLOR[beef.status] ?? "text-beef-text-muted"}`}>
                                ● {beef.status}
                              </span>
                              <span className="text-xs text-beef-text-muted">as {beef.role}</span>
                              {isWinner && (
                                <span className="text-xs font-bold text-beef-gold bg-beef-gold/10 px-2 py-0.5 rounded-full ml-auto">WIN</span>
                              )}
                              {isLoser && (
                                <span className="text-xs font-bold text-beef-orange bg-beef-orange/10 px-2 py-0.5 rounded-full ml-auto">LOSS</span>
                              )}
                            </div>
                            <p className="font-bold leading-snug mb-2">
                              &ldquo;{beef.claim.length > 100 ? beef.claim.slice(0, 100) + "…" : beef.claim}&rdquo;
                            </p>
                            {opponent && (
                              <p className="text-xs text-beef-text-muted">
                                vs @{opponent.handle || opponent.username}
                              </p>
                            )}
                            {!opponent && beef.status === "OPEN" && (
                              <p className="text-xs text-beef-text-muted">Awaiting opponent</p>
                            )}
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-xl font-bold text-beef-gold">${beef.totalPot}</p>
                            <p className="text-xs text-beef-text-muted mt-1">pot</p>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          <div className="text-center mt-10">
            <Link href="/" className="text-beef-text-muted text-sm hover:text-beef-gold transition-colors">
              ← BACK TO RINGSIDE
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
