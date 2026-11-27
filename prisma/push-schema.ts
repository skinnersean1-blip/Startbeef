#!/usr/bin/env tsx
import { createClient } from "@libsql/client";
import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { readFileSync } from "fs";
import { join } from "path";

async function pushSchema() {
  const url = process.env.DATABASE_URL ?? "file:./prisma/dev.db";
  const authToken = process.env.TURSO_AUTH_TOKEN;

  console.log("📦 Pushing Prisma schema to database...");
  console.log(`📍 Database: ${url}`);

  // Read the latest migration SQL
  const migrationFile = join(__dirname, "migrations", "20261125234250_add_invitation_system", "migration.sql");

  try {
    const sql = readFileSync(migrationFile, "utf-8");
    console.log("📄 Found migration file");

    // Execute migration SQL directly
    const client = createClient({ url, ...(authToken ? { authToken } : {}) });

    // Split SQL into statements and execute each
    const statements = sql.split(";").filter((s) => s.trim());

    for (const statement of statements) {
      if (statement.trim()) {
        console.log(`  ✓ Executing: ${statement.trim().substring(0, 50)}...`);
        await client.execute(statement);
      }
    }

    console.log("✅ Schema pushed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

pushSchema();
