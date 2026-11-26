import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Get current user's invitation codes
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const invitations = await prisma.invitation.findMany({
      where: { inviterId: session.user.id },
      include: {
        invitee: {
          select: {
            username: true,
            handle: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      invitations: invitations.map((inv) => ({
        id: inv.id,
        code: inv.code,
        status: inv.status,
        createdAt: inv.createdAt,
        expiresAt: inv.expiresAt,
        usedAt: inv.usedAt,
        invitee: inv.invitee
          ? {
              username: inv.invitee.username,
              handle: inv.invitee.handle,
              joinedAt: inv.invitee.createdAt,
            }
          : null,
      })),
    });
  } catch (error) {
    console.error("Error fetching invitations:", error);
    return NextResponse.json(
      { error: "Failed to fetch invitations" },
      { status: 500 }
    );
  }
}
