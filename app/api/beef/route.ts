import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const dynamic = "force-dynamic";

const createBeefSchema = z.object({
  claim: z.string().min(10, "Claim must be at least 10 characters").max(500, "Claim must be under 500 characters"),
  category: z.enum(["POLITICS", "CULTURE", "SPORTS", "TECH", "CALLOUTS"]),
  debateType: z.enum(["PERSUASION", "OBJECTIVE_CLAIM", "TASTE_BATTLE"]),
  ante: z.number().refine((v) => [10, 25, 50, 100].includes(v), "Invalid ante amount"),
  judgeType: z.enum(["PANEL_OF_3_MODELS", "COMMUNITY", "EXPERT"]),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { claim, category, debateType, ante, judgeType } = createBeefSchema.parse(body);

    const beef = await prisma.beef.create({
      data: {
        claim,
        category,
        debateType,
        ante,
        totalPot: ante,
        judgeType,
        status: "OPEN",
        challengerId: session.user.id,
      },
      select: {
        id: true,
        claim: true,
        category: true,
        debateType: true,
        ante: true,
        judgeType: true,
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
