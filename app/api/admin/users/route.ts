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
  const search = searchParams.get("q") || "";
  const page = parseInt(searchParams.get("page") || "1");
  const take = 20;

  const where = search
    ? {
        OR: [
          { email: { contains: search } },
          { handle: { contains: search } },
          { username: { contains: search } },
          { anonHandle: { contains: search } },
        ],
      }
    : {};

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take,
      skip: (page - 1) * take,
      select: {
        id: true,
        email: true,
        handle: true,
        username: true,
        anonHandle: true,
        isAnonymous: true,
        bankBalance: true,
        wins: true,
        losses: true,
        totalEarnings: true,
        isVerified: true,
        createdAt: true,
        _count: { select: { challengesCreated: true, challengesAccepted: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);

  return NextResponse.json({ users, total, page, pages: Math.ceil(total / take) });
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session?.user?.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id, action, amount, note } = await req.json();
  if (!id || !["verify", "unverify", "credit"].includes(action)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (action === "credit") {
    const creditAmount = parseFloat(amount);
    if (!creditAmount || creditAmount <= 0 || creditAmount > 10000) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }
    await prisma.$transaction([
      prisma.user.update({
        where: { id },
        data: { bankBalance: { increment: creditAmount } },
      }),
      prisma.transaction.create({
        data: {
          userId: id,
          type: "REFUND",
          amount: creditAmount,
          status: "COMPLETED",
          paymentProvider: "admin",
          paymentId: note || "admin-credit",
        },
      }),
    ]);
    return NextResponse.json({ success: true });
  }

  await prisma.user.update({
    where: { id },
    data: { isVerified: action === "verify" },
  });

  return NextResponse.json({ success: true });
}
