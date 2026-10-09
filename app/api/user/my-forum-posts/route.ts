import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const threads = await prisma.forumThread.findMany({
      where: { authorId: session.user.id },
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { comments: true } },
      },
    });

    return NextResponse.json({ threads });
  } catch (error) {
    console.error("[MY_FORUM_POSTS]", error);
    return NextResponse.json({ error: "Failed to load forum posts" }, { status: 500 });
  }
}
