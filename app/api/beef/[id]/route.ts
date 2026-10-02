import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { categorizeClaim } from "@/lib/categorize";
import { z } from "zod";

export const dynamic = "force-dynamic";

const schema = z.object({
  claim: z.string().min(10, "Claim must be at least 10 characters").max(500, "Claim must be under 500 characters"),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const beef = await prisma.beef.findUnique({ where: { id } });
  if (!beef) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ beef });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const beef = await prisma.beef.findUnique({ where: { id } });

  if (!beef) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (beef.challengerId !== session.user.id) {
    return NextResponse.json({ error: "Only the challenger can edit this beef" }, { status: 403 });
  }
  if (beef.status !== "OPEN") {
    return NextResponse.json({ error: "You can only edit a beef that hasn't been accepted yet" }, { status: 409 });
  }

  const body = await req.json();
  const { claim } = schema.parse(body);

  const categories = await categorizeClaim(claim);

  const updated = await prisma.beef.update({
    where: { id },
    data: { claim, categories: JSON.stringify(categories) },
  });

  return NextResponse.json({ beef: updated });
}
