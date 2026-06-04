import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const dynamic = "force-dynamic";

const schema = z.object({
  content:   z.string().min(1).max(2000),
  parentId:  z.string().optional(),
  textColor: z.string().max(20).optional(),
  fontStyle: z.string().max(20).optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: threadId } = await params;
  const thread = await prisma.forumThread.findUnique({ where: { id: threadId } });
  if (!thread) return NextResponse.json({ error: "Thread not found" }, { status: 404 });

  const body = await req.json();
  const { content, parentId, textColor, fontStyle } = schema.parse(body);

  const comment = await prisma.forumComment.create({
    data: { threadId, authorId: session.user.id, content, parentId: parentId ?? null, textColor, fontStyle },
    include: {
      author: { select: { id: true, handle: true, username: true, isAnonymous: true, anonHandle: true } },
    },
  });

  return NextResponse.json({ comment }, { status: 201 });
}
