import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const dynamic = "force-dynamic";

const schema = z.object({
  type:   z.enum(["RAISE", "CLOSE"]),
  amount: z.number().min(0).max(10000),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: beefId } = await params;

  const beef = await prisma.beef.findUnique({
    where: { id: beefId },
    include: { offers: true },
  });

  if (!beef) return NextResponse.json({ error: "Beef not found" }, { status: 404 });
  if (beef.status !== "LIVE") return NextResponse.json({ error: "Beef is not live" }, { status: 409 });
  if (beef.endsAt && new Date() >= beef.endsAt) {
    return NextResponse.json({ error: "Time has expired" }, { status: 409 });
  }

  const isParticipant = session.user.id === beef.challengerId || session.user.id === beef.responderId;
  if (!isParticipant) return NextResponse.json({ error: "Only participants can make offers" }, { status: 403 });

  // Block if there's already a pending, non-expired offer
  const hasActive = beef.offers.some(
    (o) => o.status === "PENDING" && new Date(o.expiresAt) > new Date()
  );
  if (hasActive) {
    return NextResponse.json({ error: "There is already a pending offer. Wait for it to resolve." }, { status: 409 });
  }

  const body = await req.json();
  const { type, amount } = schema.parse(body);

  if (type === "RAISE" && amount < 5) {
    return NextResponse.json({ error: "Minimum raise is $5" }, { status: 400 });
  }

  if (type === "RAISE") {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { bankBalance: true },
    });
    if (!user || user.bankBalance < amount) {
      return NextResponse.json({ error: `Insufficient balance. You need $${amount} to raise.` }, { status: 400 });
    }
  }

  if (type === "CLOSE" && amount > 0) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { bankBalance: true },
    });
    if (!user || user.bankBalance < amount) {
      return NextResponse.json({ error: `Insufficient balance for sweetener of $${amount}.` }, { status: 400 });
    }
  }

  const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

  const offer = await prisma.beefOffer.create({
    data: {
      beefId,
      fromId: session.user.id,
      type,
      amount,
      status: "PENDING",
      expiresAt,
    },
  });

  return NextResponse.json({ offer }, { status: 201 });
}
