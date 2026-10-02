import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { executeJudgment } from "@/lib/executeJudgment";
import { z } from "zod";

export const dynamic = "force-dynamic";

const schema = z.object({ action: z.enum(["ACCEPT", "REJECT"]) });

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; offerId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: beefId, offerId } = await params;

  const [beef, offer] = await Promise.all([
    prisma.beef.findUnique({ where: { id: beefId } }),
    prisma.beefOffer.findUnique({ where: { id: offerId } }),
  ]);

  if (!beef || !offer || offer.beefId !== beefId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (offer.status !== "PENDING") {
    return NextResponse.json({ error: "Offer is no longer pending" }, { status: 409 });
  }
  if (new Date() >= new Date(offer.expiresAt)) {
    await prisma.beefOffer.update({ where: { id: offerId }, data: { status: "EXPIRED" } });
    return NextResponse.json({ error: "Offer has expired" }, { status: 409 });
  }

  const isParticipant = session.user.id === beef.challengerId || session.user.id === beef.responderId;
  if (!isParticipant) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Only the opponent (not the offeror) can accept/reject
  if (session.user.id === offer.fromId) {
    return NextResponse.json({ error: "You cannot respond to your own offer" }, { status: 403 });
  }

  const body = await req.json();
  const { action } = schema.parse(body);

  if (action === "REJECT") {
    await prisma.beefOffer.update({ where: { id: offerId }, data: { status: "REJECTED" } });
    return NextResponse.json({ ok: true });
  }

  // --- ACCEPT ---

  if (offer.type === "RAISE") {
    const opponentId = session.user.id;
    const offerorId  = offer.fromId;
    const extra      = offer.amount;

    // Verify both parties have enough balance
    const [offeror, opponent] = await Promise.all([
      prisma.user.findUnique({ where: { id: offerorId }, select: { bankBalance: true } }),
      prisma.user.findUnique({ where: { id: opponentId }, select: { bankBalance: true } }),
    ]);

    if (!offeror || offeror.bankBalance < extra) {
      return NextResponse.json({ error: "Offeror no longer has sufficient balance" }, { status: 400 });
    }
    if (!opponent || opponent.bankBalance < extra) {
      return NextResponse.json({ error: "You don't have sufficient balance to match this raise" }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.beefOffer.update({ where: { id: offerId }, data: { status: "ACCEPTED" } });
      await tx.beef.update({
        where: { id: beefId },
        data: { totalPot: { increment: extra * 2 } },
      });
      await tx.user.update({ where: { id: offerorId },  data: { bankBalance: { decrement: extra } } });
      await tx.user.update({ where: { id: opponentId }, data: { bankBalance: { decrement: extra } } });
      await tx.transaction.createMany({
        data: [
          { userId: offerorId,  type: "ANTE", amount: extra, status: "COMPLETED", relatedBeefId: beefId },
          { userId: opponentId, type: "ANTE", amount: extra, status: "COMPLETED", relatedBeefId: beefId },
        ],
      });
    });

    return NextResponse.json({ ok: true, type: "RAISE" });
  }

  if (offer.type === "CLOSE") {
    const offerorId  = offer.fromId;
    const opponentId = session.user.id;
    const sweetener  = offer.amount;

    if (sweetener > 0) {
      const offeror = await prisma.user.findUnique({
        where: { id: offerorId },
        select: { bankBalance: true },
      });
      if (!offeror || offeror.bankBalance < sweetener) {
        return NextResponse.json({ error: "Offeror no longer has sufficient balance for the sweetener" }, { status: 400 });
      }

      await prisma.$transaction(async (tx) => {
        await tx.beefOffer.update({ where: { id: offerId }, data: { status: "ACCEPTED" } });
        await tx.user.update({ where: { id: offerorId },  data: { bankBalance: { decrement: sweetener } } });
        await tx.user.update({ where: { id: opponentId }, data: { bankBalance: { increment: sweetener } } });
        await tx.transaction.createMany({
          data: [
            { userId: offerorId,  type: "ANTE",   amount: sweetener, status: "COMPLETED", relatedBeefId: beefId },
            { userId: opponentId, type: "REFUND",  amount: sweetener, status: "COMPLETED", relatedBeefId: beefId },
          ],
        });
        await tx.beef.update({ where: { id: beefId }, data: { status: "JUDGING" } });
      });
    } else {
      await prisma.$transaction(async (tx) => {
        await tx.beefOffer.update({ where: { id: offerId }, data: { status: "ACCEPTED" } });
        await tx.beef.update({ where: { id: beefId }, data: { status: "JUDGING" } });
      });
    }

    // Trigger judgment fire-and-forget — BeefThread polls for JUDGING → COMPLETED
    executeJudgment(beefId).catch(async (err) => {
      console.error("Judgment failed after early close:", err);
      await prisma.beef.update({ where: { id: beefId }, data: { status: "LIVE" } }).catch(() => {});
    });

    return NextResponse.json({ ok: true, type: "CLOSE" });
  }

  return NextResponse.json({ error: "Unknown offer type" }, { status: 400 });
}
