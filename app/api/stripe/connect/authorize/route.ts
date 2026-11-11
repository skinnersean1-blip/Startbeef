import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Redirect user to Stripe Connect OAuth
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL("/auth/signin", req.url));
  }

  const clientId = process.env.STRIPE_CONNECT_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json(
      { error: "Stripe Connect not configured" },
      { status: 500 }
    );
  }

  const redirectUri = `${process.env.NEXTAUTH_URL}/api/stripe/connect/callback`;

  // State parameter to prevent CSRF - store user ID
  const state = Buffer.from(
    JSON.stringify({ userId: session.user.id })
  ).toString("base64");

  const stripeAuthUrl = new URL("https://connect.stripe.com/express/oauth/authorize");
  stripeAuthUrl.searchParams.set("client_id", clientId);
  stripeAuthUrl.searchParams.set("state", state);
  stripeAuthUrl.searchParams.set("redirect_uri", redirectUri);
  stripeAuthUrl.searchParams.set("response_type", "code");
  stripeAuthUrl.searchParams.set("scope", "read_write");

  return NextResponse.redirect(stripeAuthUrl.toString());
}
