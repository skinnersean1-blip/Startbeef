import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import speakeasy from "speakeasy";

export async function POST(req: NextRequest) {
  try {
    const { email, token } = await req.json();

    if (!email || !token) {
      return NextResponse.json(
        { error: "Email and token required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        twoFactorSecret: true,
        twoFactorEnabled: true,
        backupCodes: true,
      },
    });

    if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
      return NextResponse.json(
        { error: "2FA not enabled for this user" },
        { status: 400 }
      );
    }

    // Verify TOTP token
    let verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: "base32",
      token: token.replace(/\s/g, ""),
      window: 2,
    });

    // If not verified by TOTP, check backup codes
    if (!verified) {
      const backupCodes = JSON.parse(user.backupCodes || "[]");
      if (backupCodes.includes(token)) {
        verified = true;
        // Remove used backup code
        const remainingCodes = backupCodes.filter((code: string) => code !== token);
        await prisma.user.update({
          where: { email },
          data: { backupCodes: JSON.stringify(remainingCodes) },
        });
      }
    }

    if (!verified) {
      return NextResponse.json(
        { error: "Invalid verification code" },
        { status: 401 }
      );
    }

    return NextResponse.json({ verified: true });
  } catch (error) {
    console.error("[2FA_VERIFY]", error);
    return NextResponse.json(
      { error: "Verification failed" },
      { status: 500 }
    );
  }
}
