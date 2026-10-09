import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const prefs = await req.json();

    // Validate preferences
    const validKeys = ["challengeAccepted", "newMessage", "judgmentComplete", "beefEndingSoon"];
    for (const key of Object.keys(prefs)) {
      if (!validKeys.includes(key)) {
        return NextResponse.json({ error: "Invalid preference key" }, { status: 400 });
      }
      if (typeof prefs[key] !== "boolean") {
        return NextResponse.json({ error: "Preference values must be boolean" }, { status: 400 });
      }
    }

    await prisma.user.update({
      where: { email: session.user.email },
      data: { notificationPrefs: JSON.stringify(prefs) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[NOTIFICATION_PREFS]", error);
    return NextResponse.json(
      { error: "Failed to save preferences" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { notificationPrefs: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const prefs = JSON.parse(user.notificationPrefs || "{}");
    return NextResponse.json({ preferences: prefs });
  } catch (error) {
    console.error("[GET_NOTIFICATION_PREFS]", error);
    return NextResponse.json(
      { error: "Failed to get preferences" },
      { status: 500 }
    );
  }
}
