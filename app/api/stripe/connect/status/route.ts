import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Check if user has connected Stripe account
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      stripeConnectAccountId: true,
      stripeConnectOnboarded: true,
    },
  });

  return NextResponse.json({
    connected: !!user?.stripeConnectAccountId && user.stripeConnectOnboarded,
    accountId: user?.stripeConnectAccountId || null,
  });
}
