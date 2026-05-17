import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const beef = await prisma.beef.findUnique({ where: { id } });

  if (!beef) return NextResponse.json({ error: "Beef not found" }, { status: 404 });
  if (beef.status !== "OPEN") return NextResponse.json({ error: "This beef is no longer open" }, { status: 409 });
  if (beef.challengerId === session.user.id) return NextResponse.json({ error: "You can't accept your own beef" }, { status: 400 });
  if (beef.responderId) return NextResponse.json({ error: "This beef already has a responder" }, { status: 409 });

  const now = new Date();
  const endsAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const updated = await prisma.beef.update({
    where: { id },
    data: {
      responderId: session.user.id,
      status: "LIVE",
      totalPot: beef.ante * 2,
      startedAt: now,
      endsAt,
    },
    select: { id: true, status: true, endsAt: true },
  });

  return NextResponse.json({ beef: updated });
}
