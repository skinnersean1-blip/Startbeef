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

    const [openBeefs, liveBeefs, completedBeefs] = await Promise.all([
      prisma.beef.findMany({
        where: {
          status: "OPEN",
          OR: [
            { challengerId: session.user.id },
            { responderId: session.user.id },
          ],
        },
        orderBy: { createdAt: "desc" },
        include: {
          challenger: { select: { handle: true, username: true } },
          responder: { select: { handle: true, username: true } },
        },
      }),
      prisma.beef.findMany({
        where: {
          status: "LIVE",
          OR: [
            { challengerId: session.user.id },
            { responderId: session.user.id },
          ],
        },
        orderBy: { endsAt: "asc" },
        include: {
          challenger: { select: { handle: true, username: true } },
          responder: { select: { handle: true, username: true } },
        },
      }),
      prisma.beef.findMany({
        where: {
          status: "COMPLETED",
          OR: [
            { challengerId: session.user.id },
            { responderId: session.user.id },
          ],
        },
        orderBy: { updatedAt: "desc" },
        take: 10,
        include: {
          challenger: { select: { handle: true, username: true } },
          responder: { select: { handle: true, username: true } },
        },
      }),
    ]);

    return NextResponse.json({
      open: openBeefs,
      live: liveBeefs,
      completed: completedBeefs,
    });
  } catch (error) {
    console.error("[MY_BEEFS]", error);
    return NextResponse.json({ error: "Failed to load beefs" }, { status: 500 });
  }
}
