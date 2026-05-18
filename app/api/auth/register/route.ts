import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { generateCodename } from "@/lib/codename";
import { z } from "zod";

export const dynamic = "force-dynamic";

const baseSchema = z.object({
  email:       z.string().email("Invalid email address"),
  password:    z.string().min(8, "Password must be at least 8 characters"),
  dateOfBirth: z.string().refine((d) => {
    const dob = new Date(d);
    const age = (Date.now() - dob.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
    return age >= 18;
  }, "You must be 18 or older to join"),
  isAnonymous: z.boolean().default(false),
  username:    z.string().optional(),
  handle:      z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = baseSchema.parse(body);

    // Handled users require username + handle
    if (!data.isAnonymous) {
      if (!data.username || data.username.length < 3) {
        return NextResponse.json({ error: "Username must be at least 3 characters" }, { status: 400 });
      }
      if (!data.handle || data.handle.length < 3 || !/^[a-zA-Z0-9_]+$/.test(data.handle)) {
        return NextResponse.json({ error: "Handle must be at least 3 characters (letters, numbers, underscores only)" }, { status: 400 });
      }
    }

    // Uniqueness checks
    const orConditions: object[] = [{ email: data.email }];
    if (data.username) orConditions.push({ username: data.username });
    if (data.handle)   orConditions.push({ handle: data.handle });

    const existing = await prisma.user.findFirst({ where: { OR: orConditions } });
    if (existing) {
      if (existing.email === data.email)         return NextResponse.json({ error: "Email already registered" }, { status: 400 });
      if (existing.username === data.username)   return NextResponse.json({ error: "Username already taken" }, { status: 400 });
      if (existing.handle === data.handle)       return NextResponse.json({ error: "Handle already taken" }, { status: 400 });
    }

    // Generate unique codename for every user (anon users show it, handled users use it if they go anon per-beef)
    let anonHandle: string;
    let attempts = 0;
    do {
      anonHandle = generateCodename();
      const taken = await prisma.user.findUnique({ where: { anonHandle } });
      if (!taken) break;
    } while (++attempts < 10);

    const passwordHash = await hash(data.password, 12);

    // Anon users get a system username since it's required in schema
    const username = data.isAnonymous
      ? `ghost_${Date.now()}_${Math.floor(Math.random() * 9999)}`
      : data.username!;

    const user = await prisma.user.create({
      data: {
        email:       data.email,
        username,
        handle:      data.isAnonymous ? null : data.handle,
        passwordHash,
        isAnonymous: data.isAnonymous,
        anonHandle,
        dateOfBirth: new Date(data.dateOfBirth),
        bankBalance: 0,
      },
      select: { id: true, email: true, username: true, handle: true, isAnonymous: true, anonHandle: true },
    });

    return NextResponse.json({ message: "User created successfully", user }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    console.error("Registration error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
