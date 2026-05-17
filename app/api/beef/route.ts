import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { categorizeClaim } from "@/lib/categorize";
import { z } from "zod";

export const dynamic = "force-dynamic";

const createBeefSchema = z.object({
  claim: z.string().min(10, "Claim must be at least 10 characters").max(500, "Claim must be under 500 characters"),
  ante: z.number().refine((v) => [10, 25, 50, 100].includes(v), "Invalid ante amount"),
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
    const { claim, ante } = createBeefSchema.parse(body);

    const categories = await categorizeClaim(claim);

    const beef = await prisma.beef.create({
      data: {
        claim,
        categories: JSON.stringify(categories),
        ante,
        totalPot: ante,
        status: "OPEN",
        challengerId: session.user.id,
      },
      select: {
        id: true,
        claim: true,
        categories: true,
        ante: true,
        status: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ beef }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    console.error("Create beef error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
