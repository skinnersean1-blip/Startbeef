import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { Resend } from "resend";

export const dynamic = "force-dynamic";

// Simple test endpoint to verify Resend is working
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !isAdmin(session.user.email)) {
    return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 });
  }

  try {
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({ error: "RESEND_API_KEY not configured" }, { status: 500 });
    }

    const resend = new Resend(process.env.RESEND_API_KEY);
    const from = process.env.EMAIL_FROM || "Beef <onboarding@resend.dev>";

    // Send test email to admin
    const result = await resend.emails.send({
      from,
      to: session.user.email!,
      subject: "🥩 Test Email from StartBeef",
      html: `
        <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #D4A574; font-size: 32px; margin-bottom: 20px;">TEST EMAIL</h1>
          <p style="font-size: 16px; line-height: 1.6; color: #333;">
            This is a test email from StartBeef to verify that Resend is configured correctly.
          </p>
          <p style="font-size: 16px; line-height: 1.6; color: #333;">
            If you're reading this, email sending is working! 🎉
          </p>
          <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;" />
          <p style="font-size: 12px; color: #888;">
            Sent from StartBeef at ${new Date().toLocaleString()}
          </p>
        </div>
      `,
    });

    console.log("Test email sent successfully:", result);

    return NextResponse.json({
      success: true,
      message: `Test email sent to ${session.user.email}`,
      result,
    });
  } catch (error) {
    console.error("Test email error:", error);
    return NextResponse.json(
      {
        error: "Failed to send test email",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
