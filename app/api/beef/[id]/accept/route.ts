import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendBeefAcceptedEmail, sendBeefAcceptanceConfirmationEmail } from "@/lib/email";
import { notifyBeefAccepted } from "@/lib/push";
import { stripe } from "@/lib/stripe";

const MEMBERSHIP_FEE_RATE = 0.015; // 1.5%

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const responderIsAnon = Boolean(body.responderIsAnon);
  const beef = await prisma.beef.findUnique({
    where: { id },
    include: { challenger: { select: { email: true, handle: true, username: true, anonHandle: true } } },
  });

  if (!beef) return NextResponse.json({ error: "Beef not found" }, { status: 404 });
  if (beef.status !== "OPEN") return NextResponse.json({ error: "This beef is no longer open" }, { status: 409 });
  if (beef.challengerId === session.user.id) return NextResponse.json({ error: "You can't accept your own beef" }, { status: 400 });
  if (beef.responderId) return NextResponse.json({ error: "This beef already has a responder" }, { status: 409 });


  // TEST MODE: Balance check disabled
  // const responder = await prisma.user.findUnique({
  //   where: { id: session.user.id },
  //   select: { bankBalance: true },
  // });
  // if (!responder || responder.bankBalance < beef.ante) {
  //   return NextResponse.json(
  //     { error: `You need $${beef.ante} in your Bank to accept this beef.` },
  //     { status: 400 }
  //   );
  // }

  const now = new Date();
  const endsAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  // Calculate membership fee (1.5% from EACH user when beef goes live)
  const membershipFee = parseFloat((beef.ante * MEMBERSHIP_FEE_RATE).toFixed(2));
  const totalDeduction = beef.ante + membershipFee;

  // Update beef and deduct balance from BOTH users (ante + membership fee each)
  const [updated] = await prisma.$transaction([
    prisma.beef.update({
      where: { id },
      data: {
        responderId: session.user.id,
        responderIsAnon,
        status: "LIVE",
        totalPot: beef.ante * 2,
        startedAt: now,
        endsAt,
      },
      select: { id: true, status: true, endsAt: true },
    }),
    // Deduct from responder
    prisma.user.update({
      where: { id: session.user.id },
      data: { bankBalance: { decrement: totalDeduction } },
    }),
    // Deduct from challenger too (beef just went LIVE)
    prisma.user.update({
      where: { id: beef.challengerId },
      data: { bankBalance: { decrement: totalDeduction } },
    }),
  ]);

  // Create transaction records for BOTH users
  await prisma.$transaction([
    // Responder ante
    prisma.transaction.create({
      data: {
        userId: session.user.id,
        type: "ANTE",
        amount: beef.ante,
        status: "COMPLETED",
        relatedBeefId: id,
      },
    }),
    // Responder membership fee
    prisma.transaction.create({
      data: {
        userId: session.user.id,
        type: "MEMBERSHIP_FEE",
        amount: membershipFee,
        status: "COMPLETED",
        relatedBeefId: id,
      },
    }),
    // Challenger ante (now that beef is LIVE)
    prisma.transaction.create({
      data: {
        userId: beef.challengerId,
        type: "ANTE",
        amount: beef.ante,
        status: "COMPLETED",
        relatedBeefId: id,
      },
    }),
    // Challenger membership fee
    prisma.transaction.create({
      data: {
        userId: beef.challengerId,
        type: "MEMBERSHIP_FEE",
        amount: membershipFee,
        status: "COMPLETED",
        relatedBeefId: id,
      },
    }),
  ]);

  // Transfer BOTH membership fees to operations account (if configured)
  const totalMembershipFees = membershipFee * 2; // Both users pay
  if (process.env.BEEF_OPERATIONS_ACCOUNT_ID && totalMembershipFees > 0) {
    try {
      await stripe.transfers.create({
        amount: Math.round(totalMembershipFees * 100), // Convert to cents
        currency: "usd",
        destination: process.env.BEEF_OPERATIONS_ACCOUNT_ID,
        description: `Membership fees - Beef ${id} - $${beef.ante} ante (both users)`,
        metadata: {
          beefId: id,
          challengerId: beef.challengerId,
          responderId: session.user.id,
          type: "membership_fee",
          ante: beef.ante.toString(),
          feePerUser: membershipFee.toString(),
        },
      });
      console.log(`Transferred $${totalMembershipFees} total membership fees to operations account`);
    } catch (err) {
      console.error("Failed to transfer membership fees:", err);
      // Don't fail the beef accept if transfer fails - fees are already deducted
    }
  }

  // Notify challenger their beef was accepted — fire and forget
  if (beef.challenger.email) {
    const responder = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { handle: true, username: true, anonHandle: true, isAnonymous: true },
    });
    const responderName = (responderIsAnon || responder?.isAnonymous)
      ? (responder?.anonHandle ?? "GHOST")
      : `@${responder?.handle || responder?.username}`;
    sendBeefAcceptedEmail(beef.challenger.email, id, beef.claim, responderName).catch(() => {});
  }

  return NextResponse.json({ beef: updated });
}
