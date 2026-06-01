import { NextRequest, NextResponse } from "next/server";
import { shoeDb } from "@/lib/shoe-prisma";
import { Resend } from "resend";
import { randomBytes, createHash } from "crypto";
import { z } from "zod";

export const dynamic = "force-dynamic";

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function POST(req: NextRequest) {
  try {
    const { email } = z.object({ email: z.string().email() }).parse(await req.json());

    const user = await shoeDb.user.findFirst({ where: { email } });

    // Always respond the same way to prevent email enumeration
    if (!user) {
      return NextResponse.json({ message: "If that email exists, a reset link is on its way." });
    }

    const token = randomBytes(32).toString("hex");
    const tokenHash = hashToken(token);
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

    await shoeDb.passwordResetToken.create({
      data: { userId: user.id, tokenHash, expiresAt },
    });

    const baseUrl = process.env.NEXTAUTH_URL ?? "https://www.shoe-shoe.com";
    const resetUrl = `${baseUrl}/auth/reset-password?token=${token}`;

    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: "Shoe-Shoe <noreply@shoe-shoe.com>",
      to: email,
      subject: "Reset your Shoe-Shoe password",
      html: `
        <div style="font-family:monospace;max-width:480px;margin:0 auto;padding:32px;background:#0a0a0a;color:#e8e0d0;">
          <h1 style="font-size:28px;font-weight:bold;letter-spacing:-1px;margin-bottom:8px;">SHOE-SHOE</h1>
          <p style="font-size:11px;letter-spacing:2px;color:#6b6356;margin-bottom:32px;">CHILDREN'S SHOE EXCHANGE</p>
          <p style="margin-bottom:24px;">You requested a password reset. Click the link below — it expires in 1 hour.</p>
          <a href="${resetUrl}" style="display:inline-block;border:1px solid #c8a882;color:#c8a882;padding:12px 24px;text-decoration:none;font-size:12px;letter-spacing:2px;font-weight:bold;">
            RESET PASSWORD →
          </a>
          <p style="margin-top:32px;font-size:11px;color:#6b6356;">If you didn't request this, you can safely ignore it.</p>
        </div>
      `,
    });

    return NextResponse.json({ message: "If that email exists, a reset link is on its way." });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }
    console.error("Forgot password error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
