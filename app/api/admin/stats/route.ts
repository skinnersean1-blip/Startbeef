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

  const [
    totalUsers,
    totalBeefs,
    openBeefs,
    liveBeefs,
    completedBeefs,
    feeResult,
    potResult,
    recentUsers,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.beef.count(),
    prisma.beef.count({ where: { status: "OPEN" } }),
    prisma.beef.count({ where: { status: "LIVE" } }),
    prisma.beef.count({ where: { status: "COMPLETED" } }),
    prisma.transaction.aggregate({
      where: { type: "PAYOUT", status: "COMPLETED" },
      _sum: { amount: true },
    }),
    prisma.beef.aggregate({ _sum: { totalPot: true } }),
    prisma.user.count({
      where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
    }),
  ]);

  // Platform revenue = total pot volume * fee rate (1.5%)
  const totalVolume = potResult._sum.totalPot ?? 0;
  const totalPayouts = feeResult._sum.amount ?? 0;
  const platformRevenue = parseFloat((totalVolume * 0.015).toFixed(2));

  return NextResponse.json({
    totalUsers,
    totalBeefs,
    openBeefs,
    liveBeefs,
    completedBeefs,
    totalVolume,
    platformRevenue,
    newUsersThisWeek: recentUsers,
  });
}
