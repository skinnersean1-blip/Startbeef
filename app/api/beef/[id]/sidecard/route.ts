import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const dynamic = "force-dynamic";

const sidecardSchema = z.object({
  predictedWinnerId: z.string(),
  stake: z.number().min(1, "Minimum bet is $1"),
});

const BEEF_COMMISSION_RATE = 0.01; // 1% commission

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Sign in to place a bet" }, { status: 401 });
    }

    const { id: beefId } = await params;
    const body = await req.json();
    const { predictedWinnerId, stake } = sidecardSchema.parse(body);

    // Verify beef exists and is LIVE
    const beef = await prisma.beef.findUnique({
      where: { id: beefId },
      select: {
        id: true,
        status: true,
        challengerId: true,
        responderId: true,
        totalPot: true,
        sideVolume: true,
      },
    });

    if (!beef) {
      return NextResponse.json({ error: "Beef not found" }, { status: 404 });
    }

    if (beef.status !== "LIVE") {
      return NextResponse.json(
        { error: "Can only bet on LIVE beefs" },
        { status: 400 }
      );
    }

    // Verify predictedWinnerId is either challenger or responder
    if (predictedWinnerId !== beef.challengerId && predictedWinnerId !== beef.responderId) {
      return NextResponse.json(
        { error: "Must predict challenger or responder" },
        { status: 400 }
      );
    }

    // Check if user already has a bet on this beef
    const existingBet = await prisma.sidecard.findFirst({
      where: {
        beefId,
        userId: session.user.id,
      },
    });

    if (existingBet) {
      return NextResponse.json(
        { error: "You already have a bet on this beef" },
        { status: 400 }
      );
    }

    // Calculate commission (1%)
    const commission = stake * BEEF_COMMISSION_RATE;
    const netStake = stake - commission;

    // Create sidecard and transaction records
    const [sidecard, transaction, commissionTx] = await prisma.$transaction([
      // Create the sidecard
      prisma.sidecard.create({
        data: {
          userId: session.user.id,
          beefId,
          predictedWinnerId,
          stake: netStake, // Store net stake (after commission)
        },
      }),

      // Record user's bet transaction
      prisma.transaction.create({
        data: {
          userId: session.user.id,
          type: "SIDECARD",
          amount: stake,
          status: "COMPLETED",
          relatedBeefId: beefId,
        },
      }),

      // Record Beef's commission
      prisma.transaction.create({
        data: {
          userId: "PLATFORM", // Special ID for platform fees
          type: "COMMISSION",
          amount: commission,
          status: "COMPLETED",
          relatedBeefId: beefId,
        },
      }),
    ]);

    // Update beef's sideVolume
    await prisma.beef.update({
      where: { id: beefId },
      data: {
        sideVolume: { increment: netStake },
      },
    });

    return NextResponse.json({
      success: true,
      sidecard: {
        id: sidecard.id,
        stake: netStake,
        commission,
        totalPaid: stake,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      );
    }

    console.error("Sidecard error:", error);
    return NextResponse.json(
      { error: "Failed to place bet" },
      { status: 500 }
    );
  }
}

// GET endpoint to fetch market stats
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: beefId } = await params;

    const beef = await prisma.beef.findUnique({
      where: { id: beefId },
      select: {
        id: true,
        challengerId: true,
        responderId: true,
        sideVolume: true,
        sidecards: {
          select: {
            stake: true,
            predictedWinnerId: true,
          },
        },
      },
    });

    if (!beef) {
      return NextResponse.json({ error: "Beef not found" }, { status: 404 });
    }

    // Calculate market stats
    const challengerBets = beef.sidecards.filter(
      (s) => s.predictedWinnerId === beef.challengerId
    );
    const responderBets = beef.sidecards.filter(
      (s) => s.predictedWinnerId === beef.responderId
    );

    const challengerPool = challengerBets.reduce((sum, s) => sum + s.stake, 0);
    const responderPool = responderBets.reduce((sum, s) => sum + s.stake, 0);
    const totalPool = challengerPool + responderPool;

    const challengerOdds = totalPool > 0 ? (challengerPool / totalPool) * 100 : 50;
    const responderOdds = totalPool > 0 ? (responderPool / totalPool) * 100 : 50;

    return NextResponse.json({
      totalPool,
      challengerPool,
      responderPool,
      challengerOdds: Math.round(challengerOdds),
      responderOdds: Math.round(responderOdds),
      challengerBetCount: challengerBets.length,
      responderBetCount: responderBets.length,
    });
  } catch (error) {
    console.error("Market stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch market stats" },
      { status: 500 }
    );
  }
}
