import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { AuthHeader } from "@/components/AuthHeader";
import { AcceptBeefButton } from "@/components/AcceptBeefButton";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const DEBATE_TYPE_LABELS: Record<string, string> = {
  PERSUASION: "PERSUASION",
  OBJECTIVE_CLAIM: "OBJECTIVE CLAIM",
  TASTE_BATTLE: "TASTE BATTLE",
};

const JUDGE_TYPE_LABELS: Record<string, string> = {
  PANEL_OF_3_MODELS: "PANEL OF 3 MODELS",
  COMMUNITY: "COMMUNITY VOTE",
  EXPERT: "EXPERT REVIEW",
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  OPEN: { label: "OPEN — AWAITING CHALLENGER", color: "text-beef-gold" },
  MATCHED: { label: "MATCHED — STARTING SOON", color: "text-beef-orange" },
  LIVE: { label: "LIVE", color: "text-beef-orange" },
  JUDGING: { label: "JUDGING IN PROGRESS", color: "text-muted" },
  COMPLETED: { label: "COMPLETED", color: "text-muted" },
  APPEALED: { label: "UNDER APPEAL", color: "text-muted" },
};

export default async function BeefPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  const beef = await prisma.beef.findUnique({
    where: { id },
    include: {
      challenger: {
        select: { id: true, username: true, handle: true, wins: true, losses: true },
      },
      responder: {
        select: { id: true, username: true, handle: true, wins: true, losses: true },
      },
    },
  });

  if (!beef) notFound();

  const status = STATUS_LABELS[beef.status] ?? { label: beef.status, color: "text-muted" };
  const isChallenger = session?.user?.id === beef.challengerId;
  const canAccept = !isChallenger && !beef.responderId && beef.status === "OPEN" && !!session?.user;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="container-beef py-6">
        <div className="flex items-center justify-between">
          <Link href="/">
            <div className="cursor-pointer">
              <p className="section-label mb-2">PAID DISSENT PLATFORM</p>
              <h1 className="text-4xl font-bold tracking-tighter">BEEF</h1>
            </div>
          </Link>
          <AuthHeader />
        </div>
      </header>

      <div className="container-beef pb-20">
        <div className="max-w-3xl mx-auto">

          {/* Status Bar */}
          <div className="flex items-center justify-between mb-8">
            <p className={`text-sm font-bold tracking-widest ${status.color}`}>
              ● {status.label}
            </p>
            <p className="text-muted text-sm">
              {new Date(beef.createdAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </div>

          {/* Category + Tags */}
          <div className="flex gap-3 mb-6">
            <span className="text-xs font-bold tracking-widest text-beef-gold bg-beef-gold/10 px-3 py-1 rounded-full border border-beef-gold/30">
              {beef.category}
            </span>
            <span className="text-xs font-bold tracking-widest text-muted bg-beef-bg-light px-3 py-1 rounded-full border border-beef-border">
              {DEBATE_TYPE_LABELS[beef.debateType] ?? beef.debateType}
            </span>
          </div>

          {/* The Claim */}
          <div className="card-beef border-2 border-beef-gold mb-8">
            <p className="section-label mb-4">THE CLAIM</p>
            <p className="text-3xl font-bold leading-snug">"{beef.claim}"</p>
          </div>

          {/* Arena */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            {/* Challenger */}
            <div className="card-beef text-center">
              <p className="section-label mb-3">CHALLENGER</p>
              <Link href={`/@${beef.challenger.handle || beef.challenger.username}`}>
                <p className="text-xl font-bold hover:text-beef-gold transition-colors">
                  @{beef.challenger.handle || beef.challenger.username}
                </p>
              </Link>
              <p className="text-muted text-sm mt-1">
                {beef.challenger.wins}W — {beef.challenger.losses}L
              </p>
            </div>

            {/* Responder */}
            <div className={`card-beef text-center ${!beef.responder ? "border-dashed" : ""}`}>
              <p className="section-label mb-3">RESPONDER</p>
              {beef.responder ? (
                <>
                  <Link href={`/@${beef.responder.handle || beef.responder.username}`}>
                    <p className="text-xl font-bold hover:text-beef-gold transition-colors">
                      @{beef.responder.handle || beef.responder.username}
                    </p>
                  </Link>
                  <p className="text-muted text-sm mt-1">
                    {beef.responder.wins}W — {beef.responder.losses}L
                  </p>
                </>
              ) : (
                <p className="text-muted text-lg">OPEN SEAT</p>
              )}
            </div>
          </div>

          {/* Stakes */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="card-beef text-center">
              <p className="section-label mb-2">ANTE</p>
              <p className="text-3xl font-bold">${beef.ante}</p>
            </div>
            <div className="card-beef text-center">
              <p className="section-label mb-2">TOTAL POT</p>
              <p className="text-3xl font-bold text-beef-gold">${beef.totalPot}</p>
            </div>
            <div className="card-beef text-center">
              <p className="section-label mb-2">JUDGE</p>
              <p className="text-sm font-bold">{JUDGE_TYPE_LABELS[beef.judgeType ?? ""] ?? beef.judgeType}</p>
            </div>
          </div>

          {/* Accept CTA */}
          {canAccept && (
            <div className="card-beef border-beef-gold bg-beef-bg-light mb-8">
              <p className="section-label mb-3">ACCEPT THE CHALLENGE</p>
              <p className="text-muted text-sm mb-6">
                Match the ${beef.ante} ante to enter the arena. Once you accept, the 24-hour
                debate clock starts and the ${beef.ante * 2} pot locks.
              </p>
              <AcceptBeefButton beefId={beef.id} ante={beef.ante} />
            </div>
          )}

          {/* Guest CTA */}
          {!session?.user && beef.status === "OPEN" && (
            <div className="card-beef border-dashed border-beef-gold/50 mb-8 text-center">
              <p className="section-label mb-3">WANT TO TAKE THIS?</p>
              <p className="text-muted text-sm mb-6">Sign in to accept the challenge and put your money where your mouth is.</p>
              <div className="flex gap-3 justify-center">
                <Link href="/auth/signin" className="btn-secondary text-sm px-6 py-3">SIGN IN</Link>
                <Link href="/auth/signup" className="btn-primary text-sm px-6 py-3">JOIN THE ARENA</Link>
              </div>
            </div>
          )}

          {/* Own beef notice */}
          {isChallenger && beef.status === "OPEN" && (
            <div className="card-beef bg-beef-bg-light border-beef-gold/30 mb-8 text-center">
              <p className="section-label mb-2">YOUR BEEF IS LIVE</p>
              <p className="text-muted text-sm">
                Waiting for a challenger to match your ${beef.ante} ante. Share the link to speed things up.
              </p>
            </div>
          )}

          {/* Back */}
          <div className="text-center">
            <Link href="/" className="text-muted text-sm hover:text-beef-gold transition-colors">
              ← BACK TO ARENA
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
