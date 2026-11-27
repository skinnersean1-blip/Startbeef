import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { sendGrandfatheredUserEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

// Generate unique invite code
function generateInviteCode(): string {
  const characters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // No confusing chars
  let code = "BEEF-";
  for (let i = 0; i < 8; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length));
    if (i === 3) code += "-"; // Format: BEEF-XXXX-XXXX
  }
  return code;
}

// Backfill grandfathered users (original 7) - ADMIN ONLY
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !isAdmin(session.user.email)) {
    return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 });
  }

  try {
    // Find all real users (not test users)
    const realUsers = await prisma.user.findMany({
      where: {
        AND: [
          { email: { not: { endsWith: "@test.com" } } },
          { email: { not: null } },
          { membershipPaid: false }, // Only backfill users who haven't been processed
        ],
      },
      select: {
        id: true,
        email: true,
        username: true,
        handle: true,
      },
    });

    const results = [];
    const emails: string[] = [];

    for (const user of realUsers) {
      // 1. Grant free membership (no special title/designation)
      await prisma.user.update({
        where: { id: user.id },
        data: { membershipPaid: true },
      });

      // 2. Generate 3 invitation codes
      const codes: string[] = [];
      for (let i = 0; i < 3; i++) {
        let code = generateInviteCode();

        // Ensure uniqueness
        let exists = await prisma.invitation.findUnique({ where: { code } });
        while (exists) {
          code = generateInviteCode();
          exists = await prisma.invitation.findUnique({ where: { code } });
        }

        // Create invitation
        await prisma.invitation.create({
          data: {
            code,
            inviterId: user.id,
            expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
            status: "PENDING",
          },
        });

        codes.push(code);
      }

      results.push({
        email: user.email,
        username: user.username,
        codes,
      });

      if (user.email) {
        emails.push(user.email);

        // Send grandfathered user notification email (skip if Resend not configured)
        if (process.env.RESEND_API_KEY) {
          const displayName = user.handle || user.username;
          try {
            await sendGrandfatheredUserEmail(user.email, displayName, codes);
          } catch (emailError) {
            console.error(`Failed to send email to ${user.email}:`, emailError);
            // Continue processing other users even if email fails
          }
        } else {
          console.log(`Skipping email to ${user.email} - RESEND_API_KEY not configured`);
        }
      }
    }

    return NextResponse.json({
      success: true,
      processed: realUsers.length,
      results,
      emailsSent: emails,
      message: `Grandfathered ${realUsers.length} existing users and sent ${emails.length} notification emails.`,
    });
  } catch (error) {
    console.error("Backfill error:", error);
    return NextResponse.json(
      {
        error: "Failed to backfill grandfathered users",
        details: error instanceof Error ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
