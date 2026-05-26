export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { AuthHeader } from "@/components/AuthHeader";
import { AcceptBeefButton } from "@/components/AcceptBeefButton";
import { BeefThread } from "@/components/BeefThread";
import { BackButton } from "@/components/BackButton";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  OPEN: { label: "OPEN — AWAITING CHALLENGER", color: "text-beef-gold" },
  LIVE: { label: "LIVE", color: "text-beef-orange" },
  JUDGING: { label: "JUDGING IN PROGRESS", color: "text-muted" },
  COMPLETED: { label: "COMPLETED", color: "text-muted" },
};

export default async function BeefPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  const beef = await prisma.beef.findUnique({
    where: { id },
    include: {
      challenger: { select: { id: true, username: true, handle: true, anonHandle: true, isAnonymous: true, wins: true, losses: true } },
      responder:  { select: { id: true, username: true, handle: true, anonHandle: true, isAnonymous: true, wins: true, losses: true } },
      messages: {
        include: { user: { select: { id: true, handle: true, username: true, anonHandle: true, isAnonymous: true } } },
        orderBy: { createdAt: "asc" },
      },
      offers: {
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  });

  if (!beef) notFound();

  const categories: string[] = JSON.parse(beef.categories || "[]");
  const status = STATUS_LABELS[beef.status] ?? { label: beef.status, color: "text-muted" };

  const displayName = (
    user: { handle: string | null; username: string; isAnonymous: boolean; anonHandle: string | null },
    isAnonBeef: boolean
  ) => (user.isAnonymous || isAnonBeef) ? (user.anonHandle ?? "GHOST") : (user.handle || user.username);

  const challengerDisplay = displayName(beef.challenger, beef.challengerIsAnon);
  const responderDisplay  = beef.responder ? displayName(beef.responder, beef.responderIsAnon) : null;
  const challengerIsAnon  = beef.challenger.isAnonymous || beef.challengerIsAnon;
  const responderIsAnon   = beef.responder ? (beef.responder.isAnonymous || beef.responderIsAnon) : false;

  const isChallenger = session?.user?.id === beef.challengerId;
  const isResponder  = session?.user?.id === beef.responderId;
  const isParticipant = isChallenger || isResponder;
  const canAccept = !isChallenger && !beef.responderId && beef.status === "OPEN" && !!session?.user;

  return (
    <div className="min-h-screen">
      <header className="container-beef py-6">
        <div className="flex items-center justify-between">
          <Link href="/">
            <div className="cursor-pointer">
              <p className="section-label mb-2">OPINION MARKET</p>
              <h1 className="text-4xl font-bold tracking-tighter">BEEF</h1>
            </div>
          </Link>
          <AuthHeader />
        </div>
      </header>

      <div className="container-beef pb-20">
        <div className="max-w-3xl mx-auto">

          <div className="mb-6">
            <BackButton />
          </div>

          {/* Status + Date */}
          <div className="flex items-center justify-between mb-6">
            <p className={`text-sm font-bold tracking-widest ${status.color}`}>
              ● {status.label}
            </p>
            <p className="text-muted text-sm">
              {new Date(beef.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </p>
          </div>

          {/* Categories */}
          {categories.length > 0 && (
            <div className="flex gap-2 mb-6">
              {categories.map((cat) => (
                <span key={cat} className="text-xs font-bold tracking-widest text-beef-gold bg-beef-gold/10 px-3 py-1 rounded-full border border-beef-gold/30">
                  {cat}
                </span>
              ))}
            </div>
          )}

          {/* The Claim */}
          <div className="card-beef border-2 border-beef-gold mb-8">
            <p className="section-label mb-4">THE CLAIM</p>
            <p className="text-xl sm:text-3xl font-bold leading-snug">&ldquo;{beef.claim}&rdquo;</p>
          </div>

          {/* Participants */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div className="card-beef text-center">
              <p className="section-label mb-3">CHALLENGER</p>
              {challengerIsAnon ? (
                <p className="text-xl font-bold text-beef-text-muted">{challengerDisplay}</p>
              ) : (
                <Link href={`/@${beef.challenger.handle || beef.challenger.username}`}>
                  <p className="text-xl font-bold hover:text-beef-gold transition-colors">
                    @{challengerDisplay}
                  </p>
                </Link>
              )}
              <p className="text-muted text-sm mt-1">{beef.challenger.wins}W — {beef.challenger.losses}L</p>
            </div>

            <div className={`card-beef text-center ${!beef.responder ? "border-dashed" : ""}`}>
              <p className="section-label mb-3">RESPONDER</p>
              {beef.responder ? (
                <>
                  {responderIsAnon ? (
                    <p className="text-xl font-bold text-beef-text-muted">{responderDisplay}</p>
                  ) : (
                    <Link href={`/@${beef.responder.handle || beef.responder.username}`}>
                      <p className="text-xl font-bold hover:text-beef-gold transition-colors">
                        @{responderDisplay}
                      </p>
                    </Link>
                  )}
                  <p className="text-muted text-sm mt-1">{beef.responder.wins}W — {beef.responder.losses}L</p>
                </>
              ) : (
                <p className="text-muted text-lg">OPEN SEAT</p>
              )}
            </div>
          </div>

          {/* Stakes */}
          <div className="grid grid-cols-2 sm:grid-cols-2 gap-4 mb-8">
            <div className="card-beef text-center">
              <p className="section-label mb-2">ANTE</p>
              <p className="text-3xl font-bold">${beef.ante}</p>
            </div>
            <div className="card-beef text-center">
              <p className="section-label mb-2">TOTAL POT</p>
              <p className="text-3xl font-bold text-beef-gold">${beef.totalPot}</p>
            </div>
          </div>

          {/* Accept CTA */}
          {canAccept && (
            <div className="card-beef border-beef-gold bg-beef-bg-light mb-8">
              <p className="section-label mb-3">ACCEPT THE CHALLENGE</p>
              <p className="text-muted text-sm mb-6">
                Match the ${beef.ante} ante. Clock starts immediately. 24 hours. Free-flowing thread.
                AI judges the full debate when time expires.
              </p>
              <AcceptBeefButton beefId={beef.id} ante={beef.ante} />
            </div>
          )}

          {/* Guest accept CTA */}
          {!session?.user && beef.status === "OPEN" && (
            <div className="card-beef border-dashed border-beef-gold/50 mb-8 text-center">
              <p className="section-label mb-3">WANT TO TAKE THIS?</p>
              <p className="text-muted text-sm mb-6">Sign in to match the ${beef.ante} ante and sit ringside.</p>
              <div className="flex gap-3 justify-center">
                <Link href="/auth/signin" className="btn-secondary text-sm px-6 py-3">SIGN IN</Link>
                <Link href="/auth/signup" className="btn-primary text-sm px-6 py-3">SIT RINGSIDE</Link>
              </div>
            </div>
          )}

          {/* Own beef notice */}
          {isChallenger && beef.status === "OPEN" && (
            <div className="card-beef bg-beef-bg-light border-beef-gold/30 mb-8 text-center">
              <p className="section-label mb-2">YOUR BEEF IS LIVE</p>
              <p className="text-muted text-sm mb-4">Waiting for someone to match your ${beef.ante}. Share the link to speed it up.</p>
              <Link href={`/beef/${beef.id}/edit`} className="btn-secondary text-xs px-5 py-2">
                EDIT CLAIM
              </Link>
            </div>
          )}

          {/* Thread */}
          {(beef.status === "LIVE" || beef.status === "JUDGING" || beef.status === "COMPLETED") && (
            <BeefThread
              beefId={beef.id}
              messages={beef.messages.map((m) => ({
                id: m.id,
                content: m.content,
                createdAt: m.createdAt.toISOString(),
                user: { id: m.user.id, handle: m.user.handle, username: m.user.username, anonHandle: m.user.anonHandle, isAnonymous: m.user.isAnonymous },
              }))}
              initialOffers={beef.offers.map((o) => ({
                id: o.id,
                fromId: o.fromId,
                type: o.type,
                amount: o.amount,
                status: o.status,
                expiresAt: o.expiresAt.toISOString(),
              }))}
              endsAt={beef.endsAt?.toISOString() ?? null}
              status={beef.status}
              isParticipant={isParticipant}
              currentUserId={session?.user?.id ?? null}
              challengerId={beef.challengerId}
              challengerHandle={challengerDisplay}
              challengerIsAnon={challengerIsAnon}
              responderId={beef.responderId ?? null}
              responderHandle={responderDisplay}
              responderIsAnon={responderIsAnon}
              judgeId={beef.judgeId ?? null}
              judgeName={beef.judgeName ?? null}
              judgeDecision={beef.judgeDecision ?? null}
              winnerId={beef.winnerId ?? null}
            />
          )}

          <div className="text-center mt-10">
            <Link href="/" className="text-muted text-sm hover:text-beef-gold transition-colors">
              ← BACK TO RINGSIDE
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
