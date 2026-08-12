import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const checks: Record<string, string> = {
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? "set" : "MISSING",
    NEXTAUTH_URL: process.env.NEXTAUTH_URL ? "set" : "MISSING",
    DATABASE_URL: process.env.DATABASE_URL ? "set" : "MISSING",
    TURSO_AUTH_TOKEN: process.env.TURSO_AUTH_TOKEN ? "set" : "MISSING",
  };

  let dbStatus = "untested";
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = "ok";
  } catch (err: any) {
    dbStatus = `error: ${err?.message ?? String(err)}`;
  }

  const allEnvSet = Object.values(checks).every((v) => v === "set");
  const ok = allEnvSet && dbStatus === "ok";

  return NextResponse.json({ ok, env: checks, db: dbStatus }, { status: ok ? 200 : 500 });
}
