import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// POST - Start a conversation with a user (or return existing one)
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { otherUserId } = await req.json();

    if (!otherUserId || otherUserId === session.user.id) {
      return NextResponse.json(
        { error: "Invalid user ID" },
        { status: 400 }
      );
    }

    // Check if other user exists
    const otherUser = await prisma.user.findUnique({
      where: { id: otherUserId },
      select: { id: true },
    });

    if (!otherUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if conversation already exists
    const conversations = await prisma.conversation.findMany();
    const existingConv = conversations.find((conv) => {
      const participantIds = JSON.parse(conv.participantIds);
      return (
        participantIds.includes(session.user.id) &&
        participantIds.includes(otherUserId) &&
        participantIds.length === 2
      );
    });

    if (existingConv) {
      return NextResponse.json({
        conversationId: existingConv.id,
        existed: true,
      });
    }

    // Create new conversation
    const participantIds = JSON.stringify([session.user.id, otherUserId]);
    const conversation = await prisma.conversation.create({
      data: {
        participantIds,
      },
    });

    return NextResponse.json({
      conversationId: conversation.id,
      existed: false,
    });
  } catch (error) {
    console.error("Start conversation error:", error);
    return NextResponse.json(
      { error: "Failed to start conversation" },
      { status: 500 }
    );
  }
}
