import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Check if user exists - ADMIN ONLY
export async function GET(req: NextRequest) {
  // SECURITY: Admin auth required
  const session = await getServerSession(authOptions);
  if (!isAdmin(session?.user?.email)) {
    return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 });
  }

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
