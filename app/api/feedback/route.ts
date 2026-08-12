import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const dynamic = "force-dynamic";

const schema = z.object({
  category: z.enum(["bug", "feature", "idea", "general"]),
  content:  z.string().min(10).max(2000),
  email:    z.string().email().optional().or(z.literal("")),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const body = await req.json();

  let parsed;
  try {
    parsed = schema.parse(body);
  } catch {
    return NextResponse.json({ error: "Invalid submission" }, { status: 400 });
  }

  try {
    await prisma.feedback.create({
      data: {
        category: parsed.category,
        content:  parsed.content,
        email:    parsed.email || null,
        userId:   session?.user?.id ?? null,
      },
    });
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err: any) {
    console.error("POST /api/feedback error:", err);
    return NextResponse.json({ error: err?.message ?? "Failed to submit" }, { status: 500 });
  }
}
