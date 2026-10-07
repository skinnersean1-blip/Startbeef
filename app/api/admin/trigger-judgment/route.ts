import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { executeJudgment } from "@/lib/executeJudgment";

export const dynamic = "force-dynamic";

export async function POST(_req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session?.user?.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    // Find all LIVE beefs that have expired
    const expiredBeefs = await prisma.beef.findMany({
      where: {
        status: "LIVE",
        endsAt: {
          lte: new Date(), // ended before or at now
        },
      },
      select: {
        id: true,
        claim: true,
        endsAt: true,
      },
    });

    console.log(`[ADMIN] Found ${expiredBeefs.length} expired beefs to judge`);

    const results = [];
    for (const beef of expiredBeefs) {
      try {
        // Mark as JUDGING first to prevent race conditions
        await prisma.beef.update({
          where: { id: beef.id },
          data: { status: "JUDGING" },
        });

        // Execute judgment
        await executeJudgment(beef.id);

        results.push({
          beefId: beef.id,
          status: "success",
          claim: beef.claim.substring(0, 50) + "...",
        });

        console.log(`[ADMIN] ✅ Judged beef ${beef.id}`);
      } catch (error) {
        console.error(`[ADMIN] ❌ Failed to judge beef ${beef.id}:`, error);

        // Revert to LIVE on error so it can be retried
        await prisma.beef.update({
          where: { id: beef.id },
          data: { status: "LIVE" },
        });

        results.push({
          beefId: beef.id,
          status: "error",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return NextResponse.json({
      success: true,
      judged: results.filter((r) => r.status === "success").length,
      failed: results.filter((r) => r.status === "error").length,
      results,
    });
  } catch (error) {
    console.error("[ADMIN] Judgment trigger error:", error);
    return NextResponse.json(
      {
        error: "Failed to process expired beefs",
        details: error instanceof Error ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
