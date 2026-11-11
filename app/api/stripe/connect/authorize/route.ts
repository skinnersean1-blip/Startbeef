import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Create Stripe Connect Account and redirect to onboarding using Account Links
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL("/auth/signin", req.url));
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        email: true,
        stripeConnectAccountId: true,
      },
    });

    if (!user) {
      return NextResponse.redirect(
        new URL("/bank?connect_error=User not found", req.url)
      );
    }

    let accountId = user.stripeConnectAccountId;

    // Create Stripe Connect Account if doesn't exist
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: "express",
        email: user.email || undefined,
        metadata: {
          userId: session.user.id,
        },
      });
      accountId = account.id;

      // Save account ID
      await prisma.user.update({
        where: { id: session.user.id },
        data: { stripeConnectAccountId: accountId },
      });
    }

    // Create Account Link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${process.env.NEXTAUTH_URL}/api/stripe/connect/authorize`,
      return_url: `${process.env.NEXTAUTH_URL}/api/stripe/connect/callback`,
      type: "account_onboarding",
    });

    return NextResponse.redirect(accountLink.url);
  } catch (err) {
    console.error("Stripe Connect authorize error:", err);
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
