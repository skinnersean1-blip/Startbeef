import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET - List all conversations for current user
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get all conversations where user is a participant
    const conversations = await prisma.conversation.findMany({
      orderBy: { lastMessageAt: "desc" },
    });

    // Filter to conversations where current user is a participant
    const userConversations = conversations.filter((conv) => {
      const participantIds = JSON.parse(conv.participantIds);
      return participantIds.includes(session.user.id);
    });

    // Enrich with participant data and last message
    const enriched = await Promise.all(
      userConversations.map(async (conv) => {
        const participantIds = JSON.parse(conv.participantIds);
        const otherUserId = participantIds.find((id: string) => id !== session.user.id);

        // Get other user data
        const otherUser = await prisma.user.findUnique({
          where: { id: otherUserId },
          select: {
            id: true,
            username: true,
            handle: true,
            anonHandle: true,
            isAnonymous: true,
          },
        });

        // Get last message
        const lastMessage = await prisma.directMessage.findFirst({
          where: { conversationId: conv.id },
          orderBy: { createdAt: "desc" },
        });

        // Count unread messages
        const unreadCount = await prisma.directMessage.count({
          where: {
            conversationId: conv.id,
            senderId: { not: session.user.id },
            isRead: false,
          },
        });

        return {
          id: conv.id,
          otherUser,
          lastMessage: lastMessage
            ? {
                content: lastMessage.content,
                createdAt: lastMessage.createdAt,
                senderId: lastMessage.senderId,
              }
            : null,
          unreadCount,
          lastMessageAt: conv.lastMessageAt,
        };
      })
    );

    return NextResponse.json({ conversations: enriched });
  } catch (error) {
    console.error("Get conversations error:", error);
    return NextResponse.json(
      { error: "Failed to fetch conversations" },
      { status: 500 }
    );
  }
}
