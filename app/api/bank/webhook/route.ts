import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";

export const dynamic = "force-dynamic";

// Stripe requires the raw body for signature verification
export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    if (session.metadata?.type === "DEPOSIT" && session.payment_status === "paid") {
      const userId = session.metadata.userId;
      const amount = parseFloat(session.metadata.amount);
      const paymentId = session.payment_intent as string;

      if (!userId || isNaN(amount)) {
        console.error("Invalid deposit metadata:", session.metadata);
        return NextResponse.json({ error: "Invalid metadata" }, { status: 400 });
      }

      // Idempotency — ignore duplicate webhook deliveries for the same payment
      const existing = await prisma.transaction.findFirst({
        where: { paymentId, type: "DEPOSIT" },
      });
      if (existing) {
        return NextResponse.json({ received: true, duplicate: true });
      }

      await prisma.$transaction([
        prisma.user.update({
          where: { id: userId },
          data: { bankBalance: { increment: amount } },
        }),
        prisma.transaction.create({
          data: {
            userId,
            type: "DEPOSIT",
            amount,
            status: "COMPLETED",
            paymentProvider: "stripe",
            paymentId,
          },
        }),
      ]);
    }
  }

  return NextResponse.json({ received: true });
}
