import { PrismaClient } from "@/lib/generated/shoe-client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const globalForShoe = globalThis as unknown as { shoeDb: PrismaClient | undefined };

function createShoeClient(): PrismaClient {
  // Falls back to DATABASE_URL so a single-DB deployment still works
  const url =
    process.env.SHOE_DATABASE_URL ??
    process.env.DATABASE_URL ??
    "file:./prisma/shoe.db";
  const authToken =
    process.env.SHOE_TURSO_AUTH_TOKEN ?? process.env.TURSO_AUTH_TOKEN;
  const adapter = new PrismaLibSql({ url, ...(authToken ? { authToken } : {}) });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new PrismaClient({ adapter } as any);
}

function getShoeClient(): PrismaClient {
  if (!globalForShoe.shoeDb) {
    globalForShoe.shoeDb = createShoeClient();
  }
  return globalForShoe.shoeDb;
}

export const shoeDb = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    return Reflect.get(getShoeClient(), prop);
  },
});
