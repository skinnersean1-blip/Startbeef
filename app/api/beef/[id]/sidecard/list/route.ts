import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: beefId } = await params;

    const sidecards = await prisma.sidecard.findMany({
      where: { beefId },
      select: {
        userId: true,
        predictedWinnerId: true,
        stake: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const bets = sidecards.map((sc) => ({
      userId: sc.userId,
      predictedWinnerId: sc.predictedWinnerId,
      stake: sc.stake,
      createdAt: sc.createdAt.toISOString(),
    }));

    return NextResponse.json({ bets });
  } catch (error) {
    console.error("Sidecard list error:", error);
    return NextResponse.json(
      { error: "Failed to fetch bets" },
      { status: 500 }
    );
  }
}
