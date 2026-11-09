import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

// TEMPORARY ADMIN PASSWORD RESET - DELETE AFTER USE
export async function POST(req: NextRequest) {
  try {
    const { email, newPassword } = await req.json();

    // Only allow for admin email
    if (email !== "sean@startbeef.com") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update passwordHash using Prisma
    await prisma.user.update({
      where: { email },
      data: { passwordHash: hashedPassword }
    });

    return NextResponse.json({
      success: true,
      message: "Password updated! You can now sign in with StartBeef2026!"
    });
  } catch (err) {
    console.error("Password reset error:", err);
    return NextResponse.json(
      { error: "Failed to reset password", details: err instanceof Error ? err.message : undefined },
      { status: 500 }
    );
  }
}
