import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { stripe, ANTE_MIN } from "@/lib/stripe";

export const dynamic = "force-dynamic";

// Calculate total charge to cover Stripe fees (2.9% + $0.30)
// so that user receives exactly the desired amount
function calculateTotalWithFees(desiredAmount: number) {
  const STRIPE_PERCENTAGE = 0.029; // 2.9%
  const STRIPE_FIXED = 0.30; // $0.30

  // Formula: totalCharge = (desiredAmount + STRIPE_FIXED) / (1 - STRIPE_PERCENTAGE)
  const totalCharge = (desiredAmount + STRIPE_FIXED) / (1 - STRIPE_PERCENTAGE);
  const fee = totalCharge - desiredAmount;

  return {
    desiredAmount,
    fee: Math.round(fee * 100) / 100,
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

  // Calculate total including Stripe fees
  const { desiredAmount, fee, totalCharge } = calculateTotalWithFees(dollars);

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
              description: `Add $${desiredAmount.toFixed(2)} to your Beef Bank (includes $${fee.toFixed(2)} processing fee)`,
            },
            unit_amount: Math.round(totalCharge * 100),
          },
          quantity: 1,
        },
      ],
      metadata: {
        userId: session.user.id,
        type: "DEPOSIT",
        amount: desiredAmount.toString(), // Credit user the desired amount, not the total charge
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
