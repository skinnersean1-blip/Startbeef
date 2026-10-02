import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { hash } from "bcryptjs";

// Create Prisma client with Turso adapter
const url = process.env.DATABASE_URL ?? "file:./prisma/dev.db";
const authToken = process.env.TURSO_AUTH_TOKEN;
const adapter = new PrismaLibSql({ url, ...(authToken ? { authToken } : {}) });
const prisma = new PrismaClient({ adapter } as any);

async function main() {
  console.log("🌱 Seeding test data for Beef prediction market...\n");

  // Create 7 test users
  const password = await hash("password123", 12);

  const [alice, bob, charlie, dave, eve, frank, grace] = await Promise.all([
    prisma.user.upsert({
      where: { email: "alice@test.com" },
      update: {},
      create: {
        email: "alice@test.com",
        username: "alice_test",
        handle: "alice",
        passwordHash: password,
      },
    }),
    prisma.user.upsert({
      where: { email: "bob@test.com" },
      update: {},
      create: {
        email: "bob@test.com",
        username: "bob_test",
        handle: "bob",
        passwordHash: password,
      },
    }),
    prisma.user.upsert({
      where: { email: "charlie@test.com" },
      update: {},
      create: {
        email: "charlie@test.com",
        username: "charlie_test",
        handle: "charlie",
        passwordHash: password,
      },
    }),
    prisma.user.upsert({
      where: { email: "dave@test.com" },
      update: {},
      create: {
        email: "dave@test.com",
        username: "dave_test",
        handle: "dave",
        passwordHash: password,
      },
    }),
    prisma.user.upsert({
      where: { email: "eve@test.com" },
      update: {},
      create: {
        email: "eve@test.com",
        username: "eve_test",
        handle: "eve",
        passwordHash: password,
      },
    }),
    prisma.user.upsert({
      where: { email: "frank@test.com" },
      update: {},
      create: {
        email: "frank@test.com",
        username: "frank_test",
        handle: "frank",
        passwordHash: password,
      },
    }),
    prisma.user.upsert({
      where: { email: "grace@test.com" },
      update: {},
      create: {
        email: "grace@test.com",
        username: "grace_test",
        handle: "grace",
        passwordHash: password,
      },
    }),
  ]);

  console.log("✅ Created 7 test users:");
  console.log("   - alice@test.com / password123 (@alice)");
  console.log("   - bob@test.com / password123 (@bob)");
  console.log("   - charlie@test.com / password123 (@charlie)");
  console.log("   - dave@test.com / password123 (@dave)");
  console.log("   - eve@test.com / password123 (@eve)");
  console.log("   - frank@test.com / password123 (@frank)");
  console.log("   - grace@test.com / password123 (@grace)\n");

  // Create a LIVE beef (Alice challenges, Bob accepts)
  const ante = 25;
  const beef = await prisma.beef.create({
    data: {
      claim: "Pineapple absolutely belongs on pizza and anyone who disagrees is wrong",
      categories: JSON.stringify(["CULTURE", "CALLOUTS"]),
      challengerId: alice.id,
      responderId: bob.id,
      ante,
      totalPot: ante * 2,
      status: "LIVE",
      startedAt: new Date(),
      endsAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
    },
  });

  console.log("✅ Created LIVE beef:");
  console.log(`   - Claim: "${beef.claim}"`);
  console.log(`   - Challenger: @alice`);
  console.log(`   - Responder: @bob`);
  console.log(`   - Ante: $${ante} each`);
  console.log(`   - Total Pot: $${beef.totalPot}`);
  console.log(`   - Status: ${beef.status}`);
  console.log(`   - Beef ID: ${beef.id}\n`);

  // Add a couple of opening messages
  await prisma.message.createMany({
    data: [
      {
        beefId: beef.id,
        userId: alice.id,
        content: "I stand by this claim 100%. Pineapple adds the perfect sweet contrast to savory pizza. Fight me.",
      },
      {
        beefId: beef.id,
        userId: bob.id,
        content: "You're objectively wrong. Pineapple has no place on pizza. This is a hill I will die on.",
      },
    ],
  });

  console.log("✅ Added opening statements to the debate\n");

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🎯 TEST INSTRUCTIONS:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  console.log("1️⃣  Go to: https://www.startbeef.com/beef/" + beef.id);
  console.log("    (This is the LIVE beef)\n");

  console.log("2️⃣  Sign in as Charlie to test the prediction market:");
  console.log("    Email: charlie@test.com");
  console.log("    Password: password123\n");

  console.log("3️⃣  Scroll down to see the PREDICTION MARKET section\n");

  console.log("4️⃣  Place a bet:");
  console.log("    - Click 'BET ON @alice' or 'BET ON @bob'");
  console.log("    - Enter amount (try $10)");
  console.log("    - See the 1% fee breakdown");
  console.log("    - Click 'PLACE BET'\n");

  console.log("5️⃣  Watch the market odds update! 📊\n");

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  console.log("✨ Seed complete! Your test beef is ready.\n");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
