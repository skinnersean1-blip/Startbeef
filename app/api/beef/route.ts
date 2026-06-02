import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { categorizeClaim } from "@/lib/categorize";
import { ANTE_MIN, ANTE_MAX } from "@/lib/stripe";
import { sendAdminNewBeefEmail } from "@/lib/email";
import { z } from "zod";

export const dynamic = "force-dynamic";

const createBeefSchema = z.object({
  claim:             z.string().min(10, "Claim must be at least 10 characters").max(500, "Claim must be under 500 characters"),
  ante:              z.number().min(ANTE_MIN, `Minimum ante is $${ANTE_MIN}`).max(ANTE_MAX, `Maximum ante is $${ANTE_MAX}`),
  challengerIsAnon:  z.boolean().default(false),
  targetResponderId: z.string().optional(),
  sourceCommentId:   z.string().optional(),
});

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const sort = searchParams.get("sort") || "new";

  const where = category && category !== "ALL"
    ? { categories: { contains: category }, status: "OPEN" }
    : { status: "OPEN" };

  const orderBy =
    sort === "hot" ? { sideVolume: "desc" as const } :
    sort === "pot" ? { totalPot: "desc" as const } :
    { createdAt: "desc" as const };

  const beefs = await prisma.beef.findMany({
    where,
    orderBy,
    take: 20,
    include: {
      challenger: { select: { handle: true, username: true, wins: true, losses: true } },
    },
  });

  return NextResponse.json({ beefs });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { claim, ante, challengerIsAnon, targetResponderId, sourceCommentId } = createBeefSchema.parse(body);

    // Check challenger has enough in bank
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { bankBalance: true, anonHandle: true, isVerified: true },
    });
    if (!user?.isVerified) {
      return NextResponse.json(
        { error: "Please verify your email before posting a beef. Check your inbox." },
        { status: 403 }
      );
    }
    if (!user || user.bankBalance < ante) {
      return NextResponse.json(
        { error: `Insufficient bank balance. You need $${ante} to post this beef.` },
        { status: 400 }
      );
    }

    const categories = await categorizeClaim(claim);

    const [beef] = await prisma.$transaction([
      prisma.beef.create({
        data: {
          claim,
          categories: JSON.stringify(categories),
          ante,
          totalPot: ante,
          status: "OPEN",
          challengerId: session.user.id,
          challengerIsAnon,
          ...(targetResponderId ? { targetResponderId } : {}),
          ...(sourceCommentId ? { sourceCommentId } : {}),
        },
      }),
      // Lock the ante from the challenger's balance
      prisma.user.update({
        where: { id: session.user.id },
        data: { bankBalance: { decrement: ante } },
      }),
    ]);

    await prisma.transaction.create({
      data: {
        userId: session.user.id,
        type: "ANTE",
        amount: ante,
        status: "COMPLETED",
        relatedBeefId: beef.id,
      },
    });

    // Admin alert — fire and forget
    const challengerName = challengerIsAnon
      ? (user as any).anonHandle ?? "GHOST"
      : `@${session.user.handle || session.user.username}`;
    sendAdminNewBeefEmail(beef.id, claim, challengerName).catch(() => {});

    const beefWithSelect = await prisma.beef.findUnique({
      where: { id: beef.id },
      select: {
        id: true,
        claim: true,
        categories: true,
        ante: true,
        status: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ beef: beefWithSelect }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    console.error("Create beef error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
