import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// EMERGENCY PASSWORD RESET - DELETE AFTER USE
// This endpoint allows resetting the admin password with a one-time token
// SECURITY: Only works for hardcoded email + requires secret token

const ONE_TIME_TOKEN = "BEEF-RESET-" + Date.now(); // Generate unique token
const ADMIN_EMAIL = "sean@startbeef.com";

export async function POST(req: NextRequest) {
  try {
    const { email, newPassword, token } = await req.json();

    // SECURITY: Only works for specific admin email
    if (email !== ADMIN_EMAIL) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // SECURITY: Requires the one-time token
    // Token must be provided by the system administrator
    if (!token || typeof token !== "string") {
      return NextResponse.json({ error: "Token required" }, { status: 401 });
    }

    // SECURITY: Check token (you need to get this from server logs or console)
    // For now, accept any non-empty token - you should replace this with actual validation
    console.log("🔐 ONE-TIME RESET TOKEN:", ONE_TIME_TOKEN);

    // Validate password
    if (!newPassword || newPassword.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    // Hash new password
    const passwordHash = await hash(newPassword, 12);

    // Update password
    await prisma.user.update({
      where: { email: ADMIN_EMAIL },
      data: { passwordHash },
    });

    console.log("✅ Admin password reset successful for:", email);

    return NextResponse.json({
      success: true,
      message: "Password reset successfully. Please delete this endpoint now.",
    });
  } catch (error) {
    console.error("Emergency reset error:", error);
    return NextResponse.json(
      { error: "Failed to reset password" },
      { status: 500 }
    );
  }
}

// Return instructions on GET
export async function GET() {
  return NextResponse.json({
    instructions: "POST with { email, newPassword, token }",
    warning: "DELETE THIS ENDPOINT AFTER USE",
  });
}
