import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import speakeasy from "speakeasy";
import QRCode from "qrcode";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { username: true, email: true, twoFactorEnabled: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.twoFactorEnabled) {
      return NextResponse.json(
        { error: "2FA is already enabled" },
        { status: 400 }
      );
    }

    // Generate secret with proper encoding and algorithm
    const secret = speakeasy.generateSecret({
      name: `Beef:${user.username}`,
      issuer: "Beef",
      length: 20, // Standard length for TOTP (Google Authenticator uses 20)
      encoding: "base32",
      algorithm: "sha1", // Google Authenticator prefers SHA1
    });

    // Generate QR code with error correction
    if (!secret.otpauth_url) {
      return NextResponse.json(
        { error: "Failed to generate OTP URL" },
        { status: 500 }
      );
    }

    // Generate QR code with medium error correction for better scanning
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url, {
      errorCorrectionLevel: "M",
      type: "image/png",
      width: 300,
      margin: 2,
    });

    // Store secret temporarily (not enabled yet)
    await prisma.user.update({
      where: { email: session.user.email },
      data: { twoFactorSecret: secret.base32 },
    });

    return NextResponse.json({
      secret: secret.base32,
      qrCode: qrCodeUrl,
    });
  } catch (error) {
    console.error("[2FA_SETUP]", error);
    return NextResponse.json(
      { error: "Failed to setup 2FA" },
      { status: 500 }
    );
  }
}
