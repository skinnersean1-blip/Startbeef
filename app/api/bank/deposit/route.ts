import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { stripe, ANTE_MIN } from "@/lib/stripe";

export const dynamic = "force-dynamic";

// Calculate total charge including membership fee buffer and Stripe fees
// User pays: deposit + 1.5% membership fee + Stripe fees
// User receives: deposit + 1.5% (the 1.5% covers future membership fees)
function calculateTotalWithFees(desiredAmount: number) {
  const MEMBERSHIP_FEE_RATE = 0.015; // 1.5% membership admin fee
  const STRIPE_PERCENTAGE = 0.029; // 2.9%
  const STRIPE_FIXED = 0.30; // $0.30

  // Add membership fee buffer to desired amount
  const membershipFee = Math.round(desiredAmount * MEMBERSHIP_FEE_RATE * 100) / 100;
  const amountWithBuffer = desiredAmount + membershipFee;

  // Calculate Stripe fees on top of that
  // Formula: totalCharge = (amount + STRIPE_FIXED) / (1 - STRIPE_PERCENTAGE)
  const totalCharge = (amountWithBuffer + STRIPE_FIXED) / (1 - STRIPE_PERCENTAGE);
  const stripeFee = totalCharge - amountWithBuffer;

  return {
    desiredAmount,
    membershipFee,
    amountWithBuffer, // This is what gets credited to user balance
    stripeFee: Math.round(stripeFee * 100) / 100,
    totalCharge: Math.round(totalCharge * 100) / 100
  };
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { amount } = await req.json();
  const dollars = Number(amount);

  if (!dollars || dollars < ANTE_MIN || dollars > 10000) {
    return NextResponse.json({ error: "Amount must be between $5 and $10,000" }, { status: 400 });
  }

  const origin = req.headers.get("origin") ?? "https://www.startbeef.com";

  // Calculate total including membership fee and Stripe fees
  const { desiredAmount, membershipFee, amountWithBuffer, stripeFee, totalCharge } = calculateTotalWithFees(dollars);

  try {
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "Beef Bank Deposit",
              description: `Deposit: $${desiredAmount.toFixed(2)} + Membership Fee: $${membershipFee.toFixed(2)} + Processing: $${stripeFee.toFixed(2)} = Your Balance: $${amountWithBuffer.toFixed(2)}`,
            },
            unit_amount: Math.round(totalCharge * 100),
          },
          quantity: 1,
        },
      ],
      metadata: {
        userId: session.user.id,
        type: "DEPOSIT",
        amount: amountWithBuffer.toString(), // Credit user the amount WITH membership fee buffer
        membershipFee: membershipFee.toString(),
        desiredAmount: desiredAmount.toString(),
      },
      success_url: `${origin}/bank?deposit=success`,
      cancel_url: `${origin}/bank?deposit=cancelled`,
    });

    if (!checkoutSession.url) {
      return NextResponse.json({ error: "Stripe did not return a checkout URL" }, { status: 500 });
    }

    return NextResponse.json({ url: checkoutSession.url });
  } catch (err) {
    console.error("Stripe checkout error:", err);
    return NextResponse.json({ error: "Could not create checkout session" }, { status: 500 });
  }
}
