import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || session.user.email !== process.env.ADMIN_EMAIL) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const users = await prisma.user.findMany({
    select: { id: true, interests: true },
    where: { NOT: { interests: "[]" } },
  });

  // Tally each interest across all users
  const tally: Record<string, { count: number; userIds: string[] }> = {};

  for (const user of users) {
    let interests: string[] = [];
    try { interests = JSON.parse(user.interests); } catch { continue; }
    for (const interest of interests) {
      if (!tally[interest]) tally[interest] = { count: 0, userIds: [] };
      tally[interest].count += 1;
      tally[interest].userIds.push(user.id);
    }
  }

  const sorted = Object.entries(tally)
    .map(([name, { count }]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  const totalWithInterests = users.length;
  const totalUsers = await prisma.user.count();

  return NextResponse.json({ interests: sorted, totalWithInterests, totalUsers });
}
