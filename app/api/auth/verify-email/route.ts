import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendVerificationEmail } from "@/lib/email";
import crypto from "crypto";

export const dynamic = "force-dynamic";

// POST /api/auth/verify-email — verify token or resend
export async function POST(req: NextRequest) {
  const { token, email } = await req.json();

  // Resend flow
  if (email && !token) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || user.isVerified) return NextResponse.json({ ok: true });

    const newToken = crypto.randomBytes(32).toString("hex");
    const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerifyToken: newToken, emailVerifyExpiry: expiry },
    });
    sendVerificationEmail(email, newToken).catch(console.error);
    return NextResponse.json({ ok: true });
  }

  // Verify flow
  if (!token) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const user = await prisma.user.findFirst({
    where: { emailVerifyToken: token, emailVerifyExpiry: { gt: new Date() } },
  });

  if (!user) return NextResponse.json({ error: "This link is invalid or has expired" }, { status: 400 });

  await prisma.user.update({
    where: { id: user.id },
    data: { isVerified: true, emailVerifyToken: null, emailVerifyExpiry: null },
  });

  return NextResponse.json({ ok: true });
}
