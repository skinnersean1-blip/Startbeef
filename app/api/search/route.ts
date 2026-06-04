import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();

  if (!q || q.length < 2) {
    return NextResponse.json({ beefs: [], threads: [], users: [] });
  }

  const [beefs, threads, users] = await Promise.all([
    prisma.beef.findMany({
      where: { claim: { contains: q } },
      take: 12,
      orderBy: { createdAt: "desc" },
      include: {
        challenger: { select: { handle: true, username: true, isAnonymous: true, anonHandle: true } },
      },
    }),
    prisma.forumThread.findMany({
      where: { OR: [{ title: { contains: q } }, { body: { contains: q } }] },
      take: 12,
      orderBy: { createdAt: "desc" },
      include: {
        author: { select: { handle: true, username: true, isAnonymous: true, anonHandle: true } },
        _count: { select: { comments: true } },
      },
    }),
    prisma.user.findMany({
      where: {
        OR: [
          { handle: { contains: q } },
          { username: { contains: q } },
          { anonHandle: { contains: q } },
        ],
      },
      take: 8,
      select: { id: true, handle: true, username: true, isAnonymous: true, anonHandle: true, wins: true, losses: true },
    }),
  ]);

  return NextResponse.json({ beefs, threads, users });
}
