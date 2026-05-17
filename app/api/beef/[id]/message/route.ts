import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
  const { content } = await req.json();

  if (!content || typeof content !== "string" || content.trim().length === 0) {
    return NextResponse.json({ error: "Message cannot be empty" }, { status: 400 });
  }

  if (content.trim().length > 2000) {
    return NextResponse.json({ error: "Message too long (max 2000 chars)" }, { status: 400 });
  }

  const beef = await prisma.beef.findUnique({ where: { id } });
  if (!beef) return NextResponse.json({ error: "Beef not found" }, { status: 404 });

  if (beef.status !== "LIVE") {
    return NextResponse.json({ error: "This beef is not live yet" }, { status: 409 });
  }

  const isParticipant = beef.challengerId === session.user.id || beef.responderId === session.user.id;
  if (!isParticipant) {
    return NextResponse.json({ error: "Only participants can post" }, { status: 403 });
  }

  if (beef.endsAt && new Date() > beef.endsAt) {
    return NextResponse.json({ error: "Time is up — this beef has closed" }, { status: 409 });
  }

  const message = await prisma.message.create({
    data: { beefId: id, userId: session.user.id, content: content.trim() },
    include: {
      user: { select: { handle: true, username: true } },
    },
  });

  return NextResponse.json({ message }, { status: 201 });
}
