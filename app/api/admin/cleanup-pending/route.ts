import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Delete old pending withdrawals that were never real Stripe payouts
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await prisma.transaction.deleteMany({
      where: {
        userId: session.user.id,
        type: "WITHDRAWAL",
        status: "PENDING",
      },
    });

    return NextResponse.json({
      success: true,
      deleted: result.count,
      message: `Deleted ${result.count} pending withdrawal(s)`,
    });
  } catch (err) {
    console.error("Cleanup error:", err);
    return NextResponse.json(
      {
        error: "Failed to cleanup",
        details: err instanceof Error ? err.message : undefined,
      },
      { status: 500 }
    );
  }
}
