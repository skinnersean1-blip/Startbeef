import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// In-memory store for typing indicators (userId -> { beefId, timestamp })
// This resets on server restart but that's fine for this feature
const typingIndicators = new Map<string, { beefId: string; timestamp: number }>();

// Clean up old typing indicators (older than 5 seconds)
function cleanupOldIndicators() {
  const now = Date.now();
  for (const [userId, data] of typingIndicators.entries()) {
    if (now - data.timestamp > 5000) {
      typingIndicators.delete(userId);
    }
  }
}

// POST - Mark user as typing
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: beefId } = await params;

  // Verify user is part of this beef
  const beef = await prisma.beef.findUnique({
    where: { id: beefId },
    select: { challengerId: true, responderId: true, status: true },
  });

  if (!beef) {
    return NextResponse.json({ error: "Beef not found" }, { status: 404 });
  }

  if (beef.status !== "LIVE") {
    return NextResponse.json({ error: "Beef is not live" }, { status: 400 });
  }

  if (beef.challengerId !== session.user.id && beef.responderId !== session.user.id) {
    return NextResponse.json({ error: "You are not part of this beef" }, { status: 403 });
  }

  // Mark user as typing
  typingIndicators.set(session.user.id, { beefId, timestamp: Date.now() });
  cleanupOldIndicators();

  return NextResponse.json({ success: true });
}

// GET - Check if opponent is typing
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: beefId } = await params;

  // Get beef to find opponent
  const beef = await prisma.beef.findUnique({
    where: { id: beefId },
    select: {
      challengerId: true,
      responderId: true,
      status: true,
      challenger: {
        select: {
          handle: true,
          username: true,
          anonHandle: true,
          isAnonymous: true,
        }
      },
      responder: {
        select: {
          handle: true,
          username: true,
          anonHandle: true,
          isAnonymous: true,
        }
      },
      challengerIsAnon: true,
      responderIsAnon: true,
    },
  });

  if (!beef) {
    return NextResponse.json({ error: "Beef not found" }, { status: 404 });
  }

  if (beef.challengerId !== session.user.id && beef.responderId !== session.user.id) {
    return NextResponse.json({ error: "You are not part of this beef" }, { status: 403 });
  }

  // Determine opponent
  const isChallenger = beef.challengerId === session.user.id;
  const opponentId = isChallenger ? beef.responderId : beef.challengerId;

  if (!opponentId) {
    return NextResponse.json({ isTyping: false });
  }

  cleanupOldIndicators();

  // Check if opponent is typing
  const opponentTyping = typingIndicators.get(opponentId);
  const isTyping = opponentTyping?.beefId === beefId &&
                   (Date.now() - opponentTyping.timestamp) < 3000; // 3 second window

  // Get opponent name
  let opponentName = "Opponent";
  if (isTyping) {
    const opponent = isChallenger ? beef.responder : beef.challenger;
    const isOpponentAnon = isChallenger ? beef.responderIsAnon : beef.challengerIsAnon;

    if (opponent) {
      opponentName = (isOpponentAnon || opponent.isAnonymous)
        ? (opponent.anonHandle ?? "GHOST")
        : (opponent.handle || opponent.username);
    }
  }

  return NextResponse.json({
    isTyping,
    opponentName: isTyping ? opponentName : undefined
  });
}
