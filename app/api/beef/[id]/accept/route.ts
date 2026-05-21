import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendBeefAcceptedEmail } from "@/lib/email";

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

  // Check responder has enough in bank
  const responder = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { bankBalance: true },
  });
  if (!responder || responder.bankBalance < beef.ante) {
    return NextResponse.json(
      { error: `You need $${beef.ante} in your Bank to accept this beef.` },
      { status: 400 }
    );
  }

  const now = new Date();
  const endsAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);

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
    prisma.user.update({
      where: { id: session.user.id },
      data: { bankBalance: { decrement: beef.ante } },
    }),
  ]);

  await prisma.transaction.create({
    data: {
      userId: session.user.id,
      type: "ANTE",
      amount: beef.ante,
      status: "COMPLETED",
      relatedBeefId: id,
    },
  });

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
