import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Handle return from Stripe Connect Account Links onboarding
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL("/auth/signin", req.url));
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { stripeConnectAccountId: true },
    });

    if (!user?.stripeConnectAccountId) {
      return NextResponse.redirect(
        new URL("/bank?connect_error=No connected account found", req.url)
      );
    }

    // Check if account is fully onboarded
    const account = await stripe.accounts.retrieve(user.stripeConnectAccountId);

    // Check if charges are enabled (means onboarding is complete)
    if (account.charges_enabled && account.payouts_enabled) {
      // Mark as onboarded
      await prisma.user.update({
        where: { id: session.user.id },
        data: { stripeConnectOnboarded: true },
      });

      return NextResponse.redirect(
        new URL("/bank?connect_success=true", req.url)
      );
    } else {
      // Onboarding not complete - redirect back to onboarding
      return NextResponse.redirect(
        new URL("/bank?connect_error=Please complete Stripe onboarding", req.url)
      );
    }
  } catch (err) {
    console.error("Stripe Connect callback error:", err);
    return NextResponse.redirect(
      new URL(
        `/bank?connect_error=${encodeURIComponent(
          err instanceof Error ? err.message : "Connection failed"
        )}`,
        req.url
      )
    );
  }
}
