import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const dynamic = "force-dynamic";

const VALID = ["POLITICS", "CULTURE", "SPORTS", "TECH", "CALLOUTS"];

const schema = z.object({
  interests: z.array(z.string()).max(5),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { interests } = schema.parse(body);
  const filtered = interests.filter((i) => VALID.includes(i));

  await prisma.user.update({
    where: { id: session.user.id },
    data: { interests: JSON.stringify(filtered) },
  });

  return NextResponse.json({ ok: true });
}
