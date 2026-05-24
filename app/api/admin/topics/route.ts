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

  const beefs = await prisma.beef.findMany({
    select: { categories: true, totalPot: true, status: true },
  });

  const topicMap: Record<string, { count: number; volume: number; completed: number }> = {};

  for (const beef of beefs) {
    let cats: string[] = [];
    try { cats = JSON.parse(beef.categories || "[]"); } catch { cats = []; }

    for (const cat of cats) {
      if (!topicMap[cat]) topicMap[cat] = { count: 0, volume: 0, completed: 0 };
      topicMap[cat].count++;
      topicMap[cat].volume += beef.totalPot;
      if (beef.status === "COMPLETED") topicMap[cat].completed++;
    }
  }

  const topics = Object.entries(topicMap)
    .map(([name, data]) => ({ name, ...data, volume: parseFloat(data.volume.toFixed(2)) }))
    .sort((a, b) => b.count - a.count);

  return NextResponse.json({ topics });
}
