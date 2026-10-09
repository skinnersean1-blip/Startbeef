import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import speakeasy from "speakeasy";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { token } = await req.json();

    if (!token || typeof token !== "string") {
      return NextResponse.json(
        { error: "Verification code required to disable 2FA" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { twoFactorSecret: true, twoFactorEnabled: true, backupCodes: true },
    });

    if (!user || !user.twoFactorEnabled) {
      return NextResponse.json(
        { error: "2FA is not enabled" },
        { status: 400 }
      );
    }

    // Verify token or check backup code
    let verified = false;

    if (user.twoFactorSecret) {
      verified = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: "base32",
        token: token.replace(/\s/g, ""),
        window: 2,
      });
    }

    // If not verified by TOTP, check backup codes
    if (!verified) {
      const backupCodes = JSON.parse(user.backupCodes || "[]");
      if (backupCodes.includes(token)) {
        verified = true;
        // Remove used backup code
        const remainingCodes = backupCodes.filter((code: string) => code !== token);
        await prisma.user.update({
          where: { email: session.user.email },
          data: { backupCodes: JSON.stringify(remainingCodes) },
        });
      }
    }

    if (!verified) {
      return NextResponse.json(
        { error: "Invalid verification code" },
        { status: 400 }
      );
    }

    // Disable 2FA
    await prisma.user.update({
      where: { email: session.user.email },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
        backupCodes: "[]",
      },
    });

    return NextResponse.json({
      success: true,
      message: "2FA disabled successfully",
    });
  } catch (error) {
    console.error("[2FA_DISABLE]", error);
    return NextResponse.json(
      { error: "Failed to disable 2FA" },
      { status: 500 }
    );
  }
}
