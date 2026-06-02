import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const cursor = searchParams.get("cursor");

  const threads = await prisma.forumThread.findMany({
    take: 20,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    orderBy: { createdAt: "desc" },
    include: {
      author: { select: { handle: true, username: true, isAnonymous: true, anonHandle: true } },
      _count: { select: { comments: true } },
    },
  });

  const nextCursor = threads.length === 20 ? threads[threads.length - 1].id : null;
  return NextResponse.json({ threads, nextCursor });
}

const createSchema = z.object({
  title: z.string().min(4).max(200),
  body: z.string().min(1).max(5000),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { title, body: threadBody } = createSchema.parse(body);

  const thread = await prisma.forumThread.create({
    data: { title, body: threadBody, authorId: session.user.id },
    include: {
      author: { select: { handle: true, username: true, isAnonymous: true, anonHandle: true } },
      _count: { select: { comments: true } },
    },
  });

  return NextResponse.json({ thread }, { status: 201 });
}
