import { NextRequest, NextResponse } from "next/server";
import { shoeDb } from "@/lib/shoe-prisma";
import { hash } from "bcryptjs";
import { createHash } from "crypto";
import { z } from "zod";

export const dynamic = "force-dynamic";

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function POST(req: NextRequest) {
  try {
    const { token, password } = z.object({
      token: z.string().min(1),
      password: z.string().min(8, "Password must be at least 8 characters"),
    }).parse(await req.json());

    const tokenHash = hashToken(token);

    const record = await shoeDb.passwordResetToken.findFirst({
      where: { tokenHash, used: false },
    });

    if (!record || record.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "Reset link is invalid or has expired." },
        { status: 400 }
      );
    }

    const passwordHash = await hash(password, 12);

    await shoeDb.$transaction([
      shoeDb.user.update({ where: { id: record.userId }, data: { passwordHash } }),
      shoeDb.passwordResetToken.update({ where: { id: record.id }, data: { used: true } }),
    ]);

    return NextResponse.json({ message: "Password updated successfully." });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    console.error("Reset password error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
