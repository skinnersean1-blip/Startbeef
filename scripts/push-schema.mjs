import { createClient } from "@libsql/client";

const client = createClient({
  url: process.env.DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const statements = [
  `CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT,
    "handle" TEXT,
    "bio" TEXT,
    "isVerified" INTEGER NOT NULL DEFAULT 0,
    "region" TEXT,
    "walletAddress" TEXT,
    "wins" INTEGER NOT NULL DEFAULT 0,
    "losses" INTEGER NOT NULL DEFAULT 0,
    "totalEarnings" REAL NOT NULL DEFAULT 0,
    "isAnonymous" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "User_username_key" ON "User"("username")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "User_handle_key" ON "User"("handle")`,

  `CREATE TABLE IF NOT EXISTS "Beef" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "claim" TEXT NOT NULL,
    "categories" TEXT NOT NULL DEFAULT '[]',
    "challengerId" TEXT NOT NULL,
    "responderId" TEXT,
    "ante" REAL NOT NULL,
    "totalPot" REAL NOT NULL,
    "startedAt" DATETIME,
    "endsAt" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "winnerId" TEXT,
    "judgeId" TEXT,
    "judgeName" TEXT,
    "judgeDecision" TEXT,
    "appealStatus" TEXT,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "sideVolume" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("challengerId") REFERENCES "User"("id"),
    FOREIGN KEY ("responderId") REFERENCES "User"("id")
  )`,

  `CREATE TABLE IF NOT EXISTS "Message" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "beefId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("beefId") REFERENCES "Beef"("id") ON DELETE CASCADE,
    FOREIGN KEY ("userId") REFERENCES "User"("id")
  )`,

  `CREATE TABLE IF NOT EXISTS "Rating" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "beefId" TEXT NOT NULL,
    "raterId" TEXT NOT NULL,
    "ratedUserId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("beefId") REFERENCES "Beef"("id") ON DELETE CASCADE,
    FOREIGN KEY ("raterId") REFERENCES "User"("id")
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Rating_beefId_raterId_key" ON "Rating"("beefId", "raterId")`,

  `CREATE TABLE IF NOT EXISTS "Follow" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "followerId" TEXT NOT NULL,
    "followingId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("followerId") REFERENCES "User"("id") ON DELETE CASCADE,
    FOREIGN KEY ("followingId") REFERENCES "User"("id") ON DELETE CASCADE
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Follow_followerId_followingId_key" ON "Follow"("followerId", "followingId")`,

  `CREATE TABLE IF NOT EXISTS "ThreadImport" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "beefId" TEXT NOT NULL UNIQUE,
    "userId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "threadData" TEXT NOT NULL,
    "participants" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("beefId") REFERENCES "Beef"("id") ON DELETE CASCADE,
    FOREIGN KEY ("userId") REFERENCES "User"("id")
  )`,

  `CREATE TABLE IF NOT EXISTS "Transaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "status" TEXT NOT NULL,
    "relatedBeefId" TEXT,
    "relatedSidecardId" TEXT,
    "paymentProvider" TEXT,
    "paymentId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
];

console.log("Pushing schema to Turso...");
for (const sql of statements) {
  const name = sql.trim().split("\n")[0].slice(0, 60);
  try {
    await client.execute(sql);
    console.log("✓", name);
  } catch (e) {
    console.error("✗", name);
    console.error("  ", e.message);
  }
}
console.log("Done.");
