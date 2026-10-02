import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function isAdmin(email: string | null | undefined) {
  return email && email === process.env.ADMIN_EMAIL;
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session?.user?.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const statusFilter = searchParams.get("status") || "ALL";
  const page = parseInt(searchParams.get("page") || "1");
  const take = 20;

  const where = statusFilter !== "ALL" ? { status: statusFilter } : {};

  const [beefs, total] = await Promise.all([
    prisma.beef.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take,
      skip: (page - 1) * take,
      include: {
        challenger: { select: { handle: true, username: true, anonHandle: true, isAnonymous: true } },
        responder:  { select: { handle: true, username: true, anonHandle: true, isAnonymous: true } },
      },
    }),
    prisma.beef.count({ where }),
  ]);

  return NextResponse.json({ beefs, total, page, pages: Math.ceil(total / take) });
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session?.user?.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id, action } = await req.json();
  if (!id || action !== "cancel") {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const beef = await prisma.beef.findUnique({
    where: { id },
    include: {
      challenger: { select: { id: true } },
      responder:  { select: { id: true } },
    },
  });

  if (!beef) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (beef.status === "COMPLETED") {
    return NextResponse.json({ error: "Cannot cancel a completed beef" }, { status: 400 });
  }

  const ante = beef.ante;

  // Refund antes and cancel
  await prisma.$transaction(async (tx) => {
    await tx.beef.update({ where: { id }, data: { status: "COMPLETED", judgeDecision: "CANCELLED BY ADMIN" } });

    // Refund challenger
    await tx.user.update({ where: { id: beef.challengerId }, data: { bankBalance: { increment: ante } } });
    await tx.transaction.create({
      data: { userId: beef.challengerId, type: "REFUND", amount: ante, status: "COMPLETED", relatedBeefId: id },
    });

    // Refund responder if they joined
    if (beef.responderId) {
      await tx.user.update({ where: { id: beef.responderId }, data: { bankBalance: { increment: ante } } });
      await tx.transaction.create({
        data: { userId: beef.responderId, type: "REFUND", amount: ante, status: "COMPLETED", relatedBeefId: id },
      });
    }
  });

  return NextResponse.json({ success: true });
}
