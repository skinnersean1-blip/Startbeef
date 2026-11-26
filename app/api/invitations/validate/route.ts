import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Validate an invitation code (no auth required - for signup page)
export async function POST(req: NextRequest) {
  try {
    const { code } = await req.json();

    if (!code) {
      return NextResponse.json(
        { error: "Invitation code is required", valid: false },
        { status: 400 }
      );
    }

    const invitation = await prisma.invitation.findUnique({
      where: { code: code.toUpperCase().trim() },
      include: {
        inviter: {
          select: {
            username: true,
            handle: true,
          },
        },
      },
    });

    if (!invitation) {
      return NextResponse.json(
        { error: "Invalid invitation code", valid: false },
        { status: 404 }
      );
    }

    // Check if already used
    if (invitation.status === "ACCEPTED") {
      return NextResponse.json(
        { error: "This invitation code has already been used", valid: false },
        { status: 400 }
      );
    }

    // Check if expired
    if (new Date() > new Date(invitation.expiresAt)) {
      // Mark as expired
      await prisma.invitation.update({
        where: { id: invitation.id },
        data: { status: "EXPIRED" },
      });

      return NextResponse.json(
        { error: "This invitation code has expired", valid: false },
        { status: 400 }
      );
    }

    return NextResponse.json({
      valid: true,
      invitedBy: invitation.inviter.handle || invitation.inviter.username,
    });
  } catch (error) {
    console.error("Invitation validation error:", error);
    return NextResponse.json(
      { error: "Failed to validate invitation code", valid: false },
      { status: 500 }
    );
  }
}
