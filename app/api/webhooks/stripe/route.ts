import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Stripe webhook handler - processes payment events
export async function POST(req: NextRequest) {
  const body = await req.text();
  const headersList = await headers();
  const signature = headersList.get("stripe-signature");

  if (!signature) {
    console.error("No Stripe signature header");
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET not configured");
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 400 }
    );
  }

  console.log(`Received Stripe event: ${event.type}`);

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        console.log("Checkout session completed:", {
          sessionId: session.id,
          metadata: session.metadata,
          amountTotal: session.amount_total,
        });

        if (!session.metadata?.userId || !session.metadata?.amount) {
          console.error("Missing metadata in checkout session");
          return NextResponse.json({ error: "Missing metadata" }, { status: 400 });
        }

        const userId = session.metadata.userId;
        const amount = parseFloat(session.metadata.amount); // Amount with membership fee buffer
        const type = session.metadata.type || "DEPOSIT";
        const membershipFee = session.metadata.membershipFee
          ? parseFloat(session.metadata.membershipFee)
          : 0;

        // Update user's bank balance (includes membership fee buffer)
        const user = await prisma.user.update({
          where: { id: userId },
          data: {
            bankBalance: {
              increment: amount,
            },
          },
        });

        console.log(`Updated user ${userId} balance: +$${amount} (includes $${membershipFee} membership fee buffer) (new balance: $${user.bankBalance})`);

        // Create transaction record for deposit
        await prisma.transaction.create({
          data: {
            userId,
            type,
            amount,
            status: "COMPLETED",
            paymentProvider: "stripe",
            paymentId: session.id,
          },
        });

        console.log(`Created ${type} transaction record for user ${userId}`);

        break;
      }

      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log("Payment intent succeeded:", paymentIntent.id);
        // Handle if needed
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.error("Payment intent failed:", paymentIntent.id);
        // Handle failed payments if needed
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
