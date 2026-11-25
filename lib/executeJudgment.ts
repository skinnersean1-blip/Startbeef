import { prisma } from "@/lib/prisma";
import { judgeBeef, type JudgeMessage } from "@/lib/judges";
import { BEEF_FEE_RATE } from "@/lib/stripe";
import { sendBeefJudgedEmail } from "@/lib/email";
import { notifyJudgmentComplete } from "@/lib/push";

export async function executeJudgment(beefId: string): Promise<void> {
  const beef = await prisma.beef.findUnique({
    where: { id: beefId },
    include: {
      challenger: { select: { handle: true, username: true, email: true } },
      responder:  { select: { handle: true, username: true, email: true } },
      messages: {
        include: { user: { select: { handle: true, username: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!beef) throw new Error("Beef not found");

  const messages: JudgeMessage[] = beef.messages.map((m) => ({
    side: m.userId === beef.challengerId ? "CHALLENGER" : "RESPONDER",
    handle: m.user.handle || m.user.username,
    content: m.content,
    createdAt: m.createdAt.toISOString(),
  }));

  let result;
  try {
    result = await judgeBeef(beef.claim, messages);
  } catch (err) {
    await prisma.beef.update({ where: { id: beefId }, data: { status: "LIVE" } });
    throw err;
  }

  const winnerId = result.winner === "CHALLENGER" ? beef.challengerId : beef.responderId;
  const loserId  = result.winner === "CHALLENGER" ? beef.responderId  : beef.challengerId;

  const pot = beef.totalPot;
  const beefFee     = parseFloat((pot * BEEF_FEE_RATE).toFixed(2));
  const winnerPayout = parseFloat((pot - beefFee).toFixed(2));

  await prisma.$transaction(async (tx) => {
    await tx.beef.update({
      where: { id: beefId },
      data: {
        status: "COMPLETED",
        winnerId: winnerId ?? null,
        judgeId: result.judgeId,
        judgeName: result.judgeName,
        judgeDecision: result.decision,
      },
    });

    if (winnerId) {
      await tx.user.update({
        where: { id: winnerId },
        data: {
          wins: { increment: 1 },
          bankBalance: { increment: winnerPayout },
          totalEarnings: { increment: winnerPayout },
        },
      });
      await tx.transaction.create({
        data: {
          userId: winnerId,
          type: "PAYOUT",
          amount: winnerPayout,
          status: "COMPLETED",
          relatedBeefId: beefId,
        },
      });
    }

    if (loserId) {
      await tx.user.update({ where: { id: loserId }, data: { losses: { increment: 1 } } });
    }

    // SECURITY FIX: Pay out sidecards to winning bettors
    const sidecards = await tx.sidecard.findMany({
      where: { beefId, isPaid: false },
      select: {
        id: true,
        userId: true,
        predictedWinnerId: true,
        stake: true,
      },
    });

    if (sidecards.length > 0 && winnerId) {
      const winningSidecards = sidecards.filter(s => s.predictedWinnerId === winnerId);
      const losingSidecards = sidecards.filter(s => s.predictedWinnerId === loserId);

      const totalWinningStake = winningSidecards.reduce((sum, s) => sum + s.stake, 0);
      const totalLosingStake = losingSidecards.reduce((sum, s) => sum + s.stake, 0);

      // Pay each winner their stake back + proportional share of losing pool
      for (const sidecard of winningSidecards) {
        const payout = totalLosingStake > 0
          ? sidecard.stake + (sidecard.stake / totalWinningStake) * totalLosingStake
          : sidecard.stake; // Refund original stake if no losing bets

        await tx.user.update({
          where: { id: sidecard.userId },
          data: { bankBalance: { increment: payout } },
        });

        await tx.sidecard.update({
          where: { id: sidecard.id },
          data: { payout, isPaid: true },
        });

        await tx.transaction.create({
          data: {
            userId: sidecard.userId,
            type: "SIDECARD_PAYOUT",
            amount: payout,
            status: "COMPLETED",
            relatedBeefId: beefId,
          },
        });
      }

      // Mark losing sidecards as paid (payout = 0)
      for (const sidecard of losingSidecards) {
        await tx.sidecard.update({
          where: { id: sidecard.id },
          data: { payout: 0, isPaid: true },
        });
      }
    }
  });

  const challengerWon = result.winner === "CHALLENGER";
  if (beef.challenger.email) {
    sendBeefJudgedEmail(beef.challenger.email, beefId, beef.claim, challengerWon, challengerWon ? winnerPayout : 0).catch(() => {});
  }
  if (beef.responder?.email) {
    sendBeefJudgedEmail(beef.responder.email, beefId, beef.claim, !challengerWon, !challengerWon ? winnerPayout : 0).catch(() => {});
  }

  // Send push notifications
  notifyJudgmentComplete(beefId).catch(() => {});
}
