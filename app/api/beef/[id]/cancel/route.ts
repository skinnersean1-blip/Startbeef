import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const beef = await prisma.beef.findUnique({
      where: { id },
    });

    if (!beef) {
      return NextResponse.json({ error: "Beef not found" }, { status: 404 });
    }

    // Only challenger can cancel, and only if status is OPEN
    if (beef.challengerId !== session.user.id) {
      return NextResponse.json(
        { error: "Only the challenger can cancel" },
        { status: 403 }
      );
    }

    if (beef.status !== "OPEN") {
      return NextResponse.json(
        { error: "Can only cancel OPEN beefs" },
        { status: 400 }
      );
    }

    // Delete the beef (this will refund the ante in a real implementation)
    await prisma.beef.delete({
      where: { id },
    });

    // TODO: Process refund via payment provider

    return NextResponse.json({
      success: true,
      message: "Beef cancelled and ante refunded",
    });
  } catch (error) {
    console.error("Cancel beef error:", error);
    return NextResponse.json(
      { error: "Failed to cancel beef" },
      { status: 500 }
    );
  }
}
