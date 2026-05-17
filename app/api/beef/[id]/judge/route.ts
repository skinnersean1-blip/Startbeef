import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { judgeBeef, type JudgeMessage } from "@/lib/judges";

export const dynamic = "force-dynamic";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const beef = await prisma.beef.findUnique({
    where: { id },
    include: {
      challenger: { select: { handle: true, username: true } },
      responder:  { select: { handle: true, username: true } },
      messages: {
        include: { user: { select: { handle: true, username: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!beef) return NextResponse.json({ error: "Beef not found" }, { status: 404 });

  if (beef.status === "COMPLETED") {
    return NextResponse.json({ error: "Already judged" }, { status: 409 });
  }

  if (beef.status !== "LIVE") {
    return NextResponse.json({ error: "Beef is not live" }, { status: 409 });
  }

  if (beef.endsAt && new Date() < beef.endsAt) {
    return NextResponse.json({ error: "The clock is still running" }, { status: 409 });
  }

  // Only participants can trigger judgment
  const isParticipant =
    session.user.id === beef.challengerId || session.user.id === beef.responderId;
  if (!isParticipant) {
    return NextResponse.json({ error: "Only participants can trigger judgment" }, { status: 403 });
  }

  // Mark as JUDGING to prevent double-triggering
  await prisma.beef.update({ where: { id }, data: { status: "JUDGING" } });

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
    // Roll back to LIVE if judge fails so they can retry
    await prisma.beef.update({ where: { id }, data: { status: "LIVE" } });
    console.error("Judge error:", err);
    return NextResponse.json({ error: "The judge could not be reached. Try again." }, { status: 503 });
  }

  const winnerId =
    result.winner === "CHALLENGER" ? beef.challengerId : beef.responderId;
  const loserId =
    result.winner === "CHALLENGER" ? beef.responderId : beef.challengerId;

  await Promise.all([
    prisma.beef.update({
      where: { id },
      data: {
        status: "COMPLETED",
        winnerId: winnerId ?? null,
        judgeId: result.judgeId,
        judgeName: result.judgeName,
        judgeDecision: result.decision,
      },
    }),
    winnerId && prisma.user.update({ where: { id: winnerId }, data: { wins: { increment: 1 } } }),
    loserId  && prisma.user.update({ where: { id: loserId  }, data: { losses: { increment: 1 } } }),
  ]);

  return NextResponse.json({
    winner: result.winner,
    judgeId: result.judgeId,
    judgeName: result.judgeName,
    decision: result.decision,
  });
}
