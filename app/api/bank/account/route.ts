import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

export const dynamic = "force-dynamic";

// Bank account management endpoint - Nov 9, 2026

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { routingNumber, accountNumber, accountHolderName } = await req.json();

  if (!routingNumber || !accountNumber || !accountHolderName) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Basic validation
  if (routingNumber.length !== 9 || !/^\d+$/.test(routingNumber)) {
    return NextResponse.json({ error: "Invalid routing number (must be 9 digits)" }, { status: 400 });
  }

  if (accountNumber.length < 4 || accountNumber.length > 17 || !/^\d+$/.test(accountNumber)) {
    return NextResponse.json({ error: "Invalid account number" }, { status: 400 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        email: true,
        username: true,
        stripeCustomerId: true,
        stripeExternalAccountId: true
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let customerId = user.stripeCustomerId;

    // Create Stripe customer if doesn't exist
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email || undefined,
        name: accountHolderName,
        metadata: {
          userId: session.user.id,
          username: user.username,
        },
      });
      customerId = customer.id;
    }

    // Remove old bank account if exists
    if (user.stripeExternalAccountId) {
      try {
        await stripe.customers.deleteSource(
          customerId,
          user.stripeExternalAccountId
        );
      } catch (err) {
        console.error("Failed to delete old bank account:", err);
        // Continue anyway - old account might already be deleted
      }
    }

    // Add new bank account as external account
    const bankAccount = await stripe.customers.createSource(customerId, {
      source: {
        object: "bank_account",
        country: "US",
        currency: "usd",
        routing_number: routingNumber,
        account_number: accountNumber,
        account_holder_name: accountHolderName,
        account_holder_type: "individual",
      } as any,
    });

    const last4 = (bankAccount as any).last4;

    // Save to database
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        stripeCustomerId: customerId,
        stripeExternalAccountId: bankAccount.id,
        bankAccountLast4: last4,
      },
    });

    return NextResponse.json({
      success: true,
      last4,
      message: "Bank account saved successfully",
    });
  } catch (err) {
    console.error("Bank account save error:", err);
    return NextResponse.json(
      {
        error: "Failed to save bank account",
        details: err instanceof Error ? err.message : undefined,
      },
      { status: 500 }
    );
  }
}

// Get current bank account info
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { bankAccountLast4: true },
  });

  if (!user?.bankAccountLast4) {
    return NextResponse.json({ hasBankAccount: false });
  }

  return NextResponse.json({
    hasBankAccount: true,
    last4: user.bankAccountLast4,
  });
}
