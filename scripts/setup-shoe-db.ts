import { createClient } from "@libsql/client";

const url = process.env.SHOE_DATABASE_URL!;
const authToken = process.env.SHOE_TURSO_AUTH_TOKEN!;

const client = createClient({ url, authToken });

const statements = [
  `CREATE TABLE IF NOT EXISTS "User" (
    "id"           TEXT NOT NULL PRIMARY KEY,
    "email"        TEXT,
    "username"     TEXT NOT NULL,
    "passwordHash" TEXT,
    "handle"       TEXT,
    "credits"      INTEGER NOT NULL DEFAULT 0,
    "createdAt"    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key"    ON "User"("email")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "User_username_key" ON "User"("username")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "User_handle_key"   ON "User"("handle")`,

  `CREATE TABLE IF NOT EXISTS "ShoePost" (
    "id"          TEXT NOT NULL PRIMARY KEY,
    "userId"      TEXT NOT NULL,
    "listingKind" TEXT NOT NULL,
    "listingType" TEXT NOT NULL,
    "title"       TEXT NOT NULL,
    "brand"       TEXT,
    "size"        TEXT NOT NULL,
    "condition"   TEXT NOT NULL,
    "description" TEXT,
    "askingPrice" REAL,
    "status"      TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt"   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("userId") REFERENCES "User"("id")
  )`,

  `CREATE TABLE IF NOT EXISTS "ShoeOffer" (
    "id"          TEXT NOT NULL PRIMARY KEY,
    "postId"      TEXT NOT NULL,
    "offerUserId" TEXT NOT NULL,
    "type"        TEXT NOT NULL,
    "offerPostId" TEXT,
    "offerPrice"  REAL,
    "message"     TEXT,
    "status"      TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt"   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("postId") REFERENCES "ShoePost"("id") ON DELETE CASCADE,
    FOREIGN KEY ("offerUserId") REFERENCES "User"("id")
  )`,

  // Prisma internal migration tracking table
  `CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
    "id"                  TEXT NOT NULL PRIMARY KEY,
    "checksum"            TEXT NOT NULL,
    "finished_at"         DATETIME,
    "migration_name"      TEXT NOT NULL,
    "logs"                TEXT,
    "rolled_back_at"      DATETIME,
    "started_at"          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "applied_steps_count" INTEGER NOT NULL DEFAULT 0
  )`,
];

async function main() {
  console.log("Connecting to:", url);
  for (const sql of statements) {
    const tableName = sql.match(/"(\w+)"/)?.[1] ?? "index";
    await client.execute(sql);
    console.log("✓", tableName);
  }
  console.log("\nShoe-Shoe DB ready!");
}

main().catch((e) => { console.error(e); process.exit(1); });
