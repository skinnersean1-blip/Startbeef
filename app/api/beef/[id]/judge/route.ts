import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { executeJudgment } from "@/lib/executeJudgment";

export const dynamic = "force-dynamic";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const beef = await prisma.beef.findUnique({ where: { id } });

  if (!beef) return NextResponse.json({ error: "Beef not found" }, { status: 404 });

  if (beef.status === "COMPLETED") {
    return NextResponse.json({ error: "Already judged" }, { status: 409 });
  }

  if (beef.status !== "LIVE") {
    return NextResponse.json({ error: "Beef is not live" }, { status: 409 });
  }

  if (beef.endsAt && new Date() < beef.endsAt) {
    return NextResponse.json({ error: "The clock is still running" }, { status: 409 });
  }

  // Only participants can trigger judgment
  const isParticipant =
    session.user.id === beef.challengerId || session.user.id === beef.responderId;
  if (!isParticipant) {
    return NextResponse.json({ error: "Only participants can trigger judgment" }, { status: 403 });
  }

  // Mark as JUDGING to prevent double-triggering
  await prisma.beef.update({ where: { id }, data: { status: "JUDGING" } });

  try {
    await executeJudgment(id);
  } catch (err) {
    console.error("Judge error:", err);
    return NextResponse.json({ error: "The judge could not be reached. Try again." }, { status: 503 });
  }

  return NextResponse.json({ ok: true });
}
