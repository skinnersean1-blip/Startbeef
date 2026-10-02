import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ANTE_MIN } from "@/lib/stripe";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { amount } = await req.json();
  const dollars = Number(amount);

  if (!dollars || dollars < ANTE_MIN) {
    return NextResponse.json({ error: `Minimum withdrawal is $${ANTE_MIN}` }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { bankBalance: true },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (user.bankBalance < dollars) {
    return NextResponse.json({ error: "Insufficient balance" }, { status: 400 });
  }

  // Deduct balance and record pending withdrawal
  await prisma.$transaction([
    prisma.user.update({
      where: { id: session.user.id },
      data: { bankBalance: { decrement: dollars } },
    }),
    prisma.transaction.create({
      data: {
        userId: session.user.id,
        type: "WITHDRAWAL",
        amount: dollars,
        status: "PENDING",
      },
    }),
  ]);

  // Notify admin via webhook if configured
  if (process.env.ADMIN_NOTIFY_URL) {
    fetch(process.env.ADMIN_NOTIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: `💸 New withdrawal request: $${dollars} from user ${session.user.id}. Check /admin to process.`,
      }),
    }).catch(() => {});
  }

  return NextResponse.json({ success: true, message: "Withdrawal requested. Funds will arrive within 2–3 business days." });
}
