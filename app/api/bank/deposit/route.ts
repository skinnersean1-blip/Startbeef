import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { stripe, ANTE_MIN } from "@/lib/stripe";

export const dynamic = "force-dynamic";

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
              description: `Add $${dollars} to your Beef Bank`,
            },
            unit_amount: Math.round(dollars * 100),
          },
          quantity: 1,
        },
      ],
      metadata: {
        userId: session.user.id,
        type: "DEPOSIT",
        amount: dollars.toString(),
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
