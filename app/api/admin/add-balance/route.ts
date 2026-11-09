import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Add test balance for admin testing
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { amount } = await req.json();

  if (!amount || amount <= 0) {
    return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
  }

  try {
    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        bankBalance: { increment: amount },
      },
      select: { bankBalance: true },
    });

    return NextResponse.json({
      success: true,
      newBalance: user.bankBalance,
      message: `Added $${amount} to your balance`,
    });
  } catch (err) {
    console.error("Add balance error:", err);
    return NextResponse.json(
      {
        error: "Failed to add balance",
        details: err instanceof Error ? err.message : undefined,
      },
      { status: 500 }
    );
  }
}
