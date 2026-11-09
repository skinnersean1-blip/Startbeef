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
      stripeCustomerId: true,
      stripeExternalAccountId: true,
      email: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (!user.stripeCustomerId || !user.stripeExternalAccountId) {
    return NextResponse.json({
      error: "No bank account on file. Please add a bank account first."
    }, { status: 400 });
  }

  if (user.bankBalance < dollars) {
    return NextResponse.json({ error: "Insufficient balance" }, { status: 400 });
  }

  try {
    // Create Stripe payout directly from platform account to user's bank
    const payout = await stripe.payouts.create({
      amount: Math.round(dollars * 100), // Convert to cents
      currency: "usd",
      destination: user.stripeExternalAccountId!,
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
          paymentId: payout.id,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: "Withdrawal initiated! Funds will arrive in 2–3 business days."
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
