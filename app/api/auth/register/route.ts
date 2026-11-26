import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { generateCodename } from "@/lib/codename";
import { sendVerificationEmail } from "@/lib/email";
import { z } from "zod";
import crypto from "crypto";

export const dynamic = "force-dynamic";

const baseSchema = z.object({
  email:       z.string().email("Invalid email address"),
  password:    z.string().min(8, "Password must be at least 8 characters"),
  dateOfBirth: z.string().refine((d) => {
    const dob = new Date(d);
    const age = (Date.now() - dob.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
    return age >= 18;
  }, "You must be 18 or older to join"),
  isAnonymous:      z.boolean().default(false),
  username:         z.string().optional(),
  handle:           z.string().optional(),
  turnstileToken:   z.string().optional(),
  invitationCode:   z.string().optional(), // Required for new signups (grandfathered users don't have one)
  paymentIntentId:  z.string().optional(), // Stripe payment for $0.01 membership fee
});

// Generate unique invite code
function generateInviteCode(): string {
  const characters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "BEEF-";
  for (let i = 0; i < 8; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length));
    if (i === 3) code += "-";
  }
  return code;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = baseSchema.parse(body);

    // Verify Turnstile token if secret is configured
    if (process.env.TURNSTILE_SECRET_KEY) {
      const token = data.turnstileToken;
      if (!token) return NextResponse.json({ error: "Bot check failed. Please try again." }, { status: 400 });
      const tsRes = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret: process.env.TURNSTILE_SECRET_KEY, response: token }),
      });
      const tsData = await tsRes.json();
      if (!tsData.success) return NextResponse.json({ error: "Bot check failed. Please try again." }, { status: 400 });
    }

    // INVITATION REQUIRED: Validate invitation code (all new users must have one)
    if (!data.invitationCode) {
      return NextResponse.json(
        { error: "Invitation code is required. StartBeef is currently invite-only." },
        { status: 400 }
      );
    }

    const invitation = await prisma.invitation.findUnique({
      where: { code: data.invitationCode.toUpperCase().trim() },
    });

    if (!invitation || invitation.status === "ACCEPTED") {
      return NextResponse.json(
        { error: "Invalid or already-used invitation code" },
        { status: 400 }
      );
    }

    if (new Date() > new Date(invitation.expiresAt)) {
      await prisma.invitation.update({
        where: { id: invitation.id },
        data: { status: "EXPIRED" },
      });
      return NextResponse.json(
        { error: "This invitation code has expired" },
        { status: 400 }
      );
    }

    // TODO: Verify payment intent for $0.01 membership fee
    // For now, we'll skip payment verification and add it in the next iteration

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

    const username = data.isAnonymous
      ? `ghost_${Date.now()}_${Math.floor(Math.random() * 9999)}`
      : data.username!;

    const emailVerifyToken = crypto.randomBytes(32).toString("hex");
    const emailVerifyExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Create user with invitation tracking and membership
    const user = await prisma.user.create({
      data: {
        email:             data.email,
        username,
        handle:            data.isAnonymous ? null : data.handle,
        passwordHash,
        isAnonymous:       data.isAnonymous,
        anonHandle,
        dateOfBirth:       new Date(data.dateOfBirth),
        bankBalance:       0,
        emailVerifyToken,
        emailVerifyExpiry,
        // Invitation system
        membershipPaid:    true, // Paid $0.01 membership fee
        invitedBy:         invitation.inviterId,
      },
      select: { id: true, email: true, username: true, handle: true, isAnonymous: true, anonHandle: true },
    });

    // Mark invitation as accepted and link to new user
    await prisma.invitation.update({
      where: { id: invitation.id },
      data: {
        status: "ACCEPTED",
        inviteeId: user.id,
        usedAt: new Date(),
      },
    });

    // Generate 3 new invitation codes for the new user
    const newCodes: string[] = [];
    for (let i = 0; i < 3; i++) {
      let code = generateInviteCode();
      let exists = await prisma.invitation.findUnique({ where: { code } });
      while (exists) {
        code = generateInviteCode();
        exists = await prisma.invitation.findUnique({ where: { code } });
      }

      await prisma.invitation.create({
        data: {
          code,
          inviterId: user.id,
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
          status: "PENDING",
        },
      });

      newCodes.push(code);
    }

    // Send verification email — fire and forget
    if (data.email) {
      sendVerificationEmail(data.email, emailVerifyToken).catch(console.error);
    }

    return NextResponse.json({
      message: "User created successfully",
      user,
      invitationCodes: newCodes, // Return codes so we can show them immediately
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    console.error("Registration error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
