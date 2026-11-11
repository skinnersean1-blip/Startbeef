import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Handle Stripe Connect OAuth callback
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  // Handle OAuth errors
  if (error) {
    const redirectUrl = new URL("/bank", req.url);
    redirectUrl.searchParams.set("connect_error", errorDescription || error);
    return NextResponse.redirect(redirectUrl);
  }

  if (!code || !state) {
    return NextResponse.redirect(
      new URL("/bank?connect_error=Missing code or state", req.url)
    );
  }

  try {
    // Verify state and get user ID
    const stateData = JSON.parse(Buffer.from(state, "base64").toString());
    const userId = stateData.userId;

    if (!userId) {
      return NextResponse.redirect(
        new URL("/bank?connect_error=Invalid state", req.url)
      );
    }

    // Exchange authorization code for access token
    const response = await stripe.oauth.token({
      grant_type: "authorization_code",
      code,
    });

    const connectedAccountId = response.stripe_user_id;

    // Save connected account ID to user
    await prisma.user.update({
      where: { id: userId },
      data: {
        stripeConnectAccountId: connectedAccountId,
        stripeConnectOnboarded: true,
      },
    });

    // Redirect back to bank page with success
    return NextResponse.redirect(
      new URL("/bank?connect_success=true", req.url)
    );
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
