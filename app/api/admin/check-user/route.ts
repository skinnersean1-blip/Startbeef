import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Check if user exists
export async function GET(req: NextRequest) {
  try {
    const email = "sean@startbeef.com";

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        username: true,
        handle: true,
        passwordHash: true,
      },
    });

    if (!user) {
      return NextResponse.json({
        exists: false,
        message: "User not found with email: sean@startbeef.com",
      });
    }

    return NextResponse.json({
      exists: true,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        handle: user.handle,
        hasPassword: !!user.passwordHash,
      },
    });
  } catch (err) {
    console.error("Check user error:", err);
    return NextResponse.json(
      {
        error: "Database error",
        details: err instanceof Error ? err.message : undefined,
      },
      { status: 500 }
    );
  }
}
