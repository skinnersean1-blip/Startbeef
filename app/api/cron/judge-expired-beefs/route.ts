import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { executeJudgment } from "@/lib/executeJudgment";

export const dynamic = "force-dynamic";

// This endpoint should be called by a cron job every 5 minutes
// Vercel Cron: https://vercel.com/docs/cron-jobs
export async function GET(req: NextRequest) {
  // Verify this is coming from Vercel Cron (check auth header)
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

    console.log(`Found ${expiredBeefs.length} expired beefs to judge`);

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

        console.log(`✅ Judged beef ${beef.id}`);
      } catch (error) {
        console.error(`❌ Failed to judge beef ${beef.id}:`, error);

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
    console.error("Cron job error:", error);
    return NextResponse.json(
      {
        error: "Failed to process expired beefs",
        details: error instanceof Error ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
