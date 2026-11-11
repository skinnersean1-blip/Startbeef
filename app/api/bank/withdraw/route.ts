import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe, ANTE_MIN } from "@/lib/stripe";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { amount } = await req.json();
  const dollars = Number(amount);

  if (!dollars || dollars < ANTE_MIN) {
    return NextResponse.json({ error: `Minimum withdrawal is $${ANTE_MIN}` }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      bankBalance: true,
      stripeConnectAccountId: true,
      stripeConnectOnboarded: true,
      email: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (!user.stripeConnectAccountId || !user.stripeConnectOnboarded) {
    return NextResponse.json({
      error: "Please connect your Stripe account first to enable withdrawals."
    }, { status: 400 });
  }

  if (user.bankBalance < dollars) {
    return NextResponse.json({ error: "Insufficient balance" }, { status: 400 });
  }

  try {
    // Create Stripe transfer to connected account
    const transfer = await stripe.transfers.create({
      amount: Math.round(dollars * 100), // Convert to cents
      currency: "usd",
      destination: user.stripeConnectAccountId!,
      description: `Withdrawal for ${user.email || session.user.id}`,
      metadata: {
        userId: session.user.id,
        email: user.email || "",
      },
    });

    // Deduct balance and record completed withdrawal
    await prisma.$transaction([
      prisma.user.update({
        where: { id: session.user.id },
        data: { bankBalance: { decrement: dollars } },
      }),
      prisma.transaction.create({
        data: {
          userId: session.user.id,
          type: "WITHDRAWAL",
          amount: dollars,
          status: "COMPLETED",
          paymentProvider: "stripe",
          paymentId: transfer.id,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: "Withdrawal completed! Funds transferred to your Stripe account. You can withdraw to your bank from your Stripe dashboard."
    });
  } catch (err) {
    console.error("Withdrawal processing error:", err);
    return NextResponse.json(
      {
        error: "Failed to process withdrawal",
        details: err instanceof Error ? err.message : undefined,
      },
      { status: 500 }
    );
  }
}
