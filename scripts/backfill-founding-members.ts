import { prisma } from "../lib/prisma";
import crypto from "crypto";

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

async function backfillFoundingMembers() {
  console.log("🚀 Starting Founding Members backfill...\n");

  // Find all real users (not test users)
  const realUsers = await prisma.user.findMany({
    where: {
      AND: [
        { email: { not: { endsWith: "@test.com" } } },
        { email: { not: null } },
      ],
    },
    select: {
      id: true,
      email: true,
      username: true,
      handle: true,
      membershipPaid: true,
    },
  });

  console.log(`Found ${realUsers.length} real users to grandfather in.\n`);

  const emails: string[] = [];

  for (const user of realUsers) {
    console.log(`Processing: ${user.email}`);

    // 1. Mark as founding member (membership paid)
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

    console.log(`  ✅ Granted founding member status`);
    console.log(`  ✅ Generated 3 invite codes: ${codes.join(", ")}`);

    if (user.email) {
      emails.push(user.email);
    }

    console.log();
  }

  console.log("📧 Users to email:");
  emails.forEach((email) => console.log(`  - ${email}`));

  console.log(`\n✅ Backfill complete! ${realUsers.length} founding members created.`);
  console.log(`📧 Send notification emails to ${emails.length} users.`);

  await prisma.$disconnect();
}

backfillFoundingMembers()
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });
