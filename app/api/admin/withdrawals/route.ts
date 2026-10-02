import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function isAdmin(email: string | null | undefined) {
  return email && email === process.env.ADMIN_EMAIL;
}

export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session?.user?.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const withdrawals = await prisma.transaction.findMany({
    where: { type: "WITHDRAWAL" },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  // Enrich with user info
  const userIds = [...new Set(withdrawals.map((w) => w.userId))];
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, email: true, handle: true, username: true, anonHandle: true, isAnonymous: true, bankBalance: true },
  });
  const userMap = Object.fromEntries(users.map((u) => [u.id, u]));

  return NextResponse.json({
    withdrawals: withdrawals.map((w) => ({ ...w, user: userMap[w.userId] ?? null })),
  });
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session?.user?.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id, status } = await req.json();
  if (!id || !["COMPLETED", "FAILED"].includes(status)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  // If marking failed, refund the balance
  const tx = await prisma.transaction.findUnique({ where: { id } });
  if (!tx) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (status === "FAILED" && tx.status === "PENDING") {
    await prisma.$transaction([
      prisma.transaction.update({ where: { id }, data: { status: "FAILED" } }),
      prisma.user.update({ where: { id: tx.userId }, data: { bankBalance: { increment: tx.amount } } }),
    ]);
  } else {
    await prisma.transaction.update({ where: { id }, data: { status } });
  }

  return NextResponse.json({ success: true });
}
