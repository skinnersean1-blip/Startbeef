import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const thread = await prisma.forumThread.findUnique({
    where: { id },
    include: {
      author: { select: { id: true, handle: true, username: true, isAnonymous: true, anonHandle: true } },
      comments: {
        orderBy: { createdAt: "asc" },
        include: {
          author: { select: { id: true, handle: true, username: true, isAnonymous: true, anonHandle: true } },
        },
      },
    },
  });

  if (!thread) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ thread });
}
