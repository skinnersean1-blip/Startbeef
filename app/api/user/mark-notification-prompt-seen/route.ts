import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await prisma.user.update({
      where: { email: session.user.email },
      data: { hasSeenNotificationPrompt: true },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[MARK_NOTIFICATION_PROMPT_SEEN]", error);
    return NextResponse.json(
      { error: "Failed to mark prompt as seen" },
      { status: 500 }
    );
  }
}
