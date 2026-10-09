import webpush from "web-push";
import { prisma } from "./prisma";

// Configure web-push with VAPID keys
// Generate keys with: npx web-push generate-vapid-keys
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    "mailto:support@startbeef.com",
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

export type NotificationType =
  | "CHALLENGE_ACCEPTED"
  | "BEEF_ENDING_SOON"
  | "JUDGMENT_COMPLETE"
  | "NEW_MESSAGE";

export interface PushNotificationData {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: {
    url?: string;
    beefId?: string;
  };
}

export async function sendPushNotification(
  userId: string,
  type: NotificationType,
  notification: PushNotificationData
) {
  try {
    // Get user and their preferences
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        notificationPrefs: true,
        pushSubscriptions: true,
      },
    });

    if (!user || user.pushSubscriptions.length === 0) {
      console.log(`[PUSH] No subscriptions found for user ${userId}`);
      return;
    }

    // Check if user wants this type of notification
    const prefs = JSON.parse(user.notificationPrefs || "{}");
    const prefKey = type === "CHALLENGE_ACCEPTED" ? "challengeAccepted" :
                    type === "NEW_MESSAGE" ? "newMessage" :
                    type === "JUDGMENT_COMPLETE" ? "judgmentComplete" :
                    type === "BEEF_ENDING_SOON" ? "beefEndingSoon" : null;

    if (prefKey && prefs[prefKey] === false) {
      console.log(`[PUSH] User ${userId} has disabled ${type} notifications`);
      return;
    }

    const subscriptions = user.pushSubscriptions;

    // Store notification in database
    await prisma.notification.create({
      data: {
        userId,
        type,
        title: notification.title,
        body: notification.body,
        beefId: notification.data?.beefId,
        sent: true,
      },
    });

    // Send to all user's devices
    const payload = JSON.stringify({
      title: notification.title,
      body: notification.body,
      icon: notification.icon || "/icon-192x192.png",
      badge: notification.badge || "/badge-72x72.png",
      data: notification.data,
    });

    const results = await Promise.allSettled(
      subscriptions.map((sub) =>
        webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          },
          payload
        )
      )
    );

    // Clean up invalid subscriptions (410 Gone responses)
    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      if (result.status === "rejected" && result.reason?.statusCode === 410) {
        await prisma.pushSubscription.delete({
          where: { id: subscriptions[i].id },
        });
        console.log(`[PUSH] Removed invalid subscription for user ${userId}`);
      }
    }

    console.log(`[PUSH] Sent ${type} notification to user ${userId}`);
  } catch (error) {
    console.error("[PUSH] Error sending notification:", error);
  }
}

// Notification builders for common beef events
export async function notifyBeefAccepted(beefId: string, challengerId: string) {
  const beef = await prisma.beef.findUnique({
    where: { id: beefId },
    include: { responder: true },
  });

  if (!beef?.responder) return;

  await sendPushNotification(challengerId, "CHALLENGE_ACCEPTED", {
    title: "🔥 Challenge Accepted!",
    body: `@${beef.responder.handle || beef.responder.username} accepted your beef!`,
    data: {
      url: `/beef/${beefId}`,
      beefId,
    },
  });
}

export async function notifyBeefEndingSoon(beefId: string) {
  const beef = await prisma.beef.findUnique({
    where: { id: beefId },
    include: { challenger: true, responder: true },
  });

  if (!beef || beef.status !== "LIVE") return;

  const participants = [beef.challenger, beef.responder].filter(Boolean);

  for (const user of participants) {
    if (!user) continue;
    await sendPushNotification(user.id, "BEEF_ENDING_SOON", {
      title: "⏰ Beef Ending Soon!",
      body: `Your beef is ending in 1 hour. Make your final arguments!`,
      data: {
        url: `/beef/${beefId}`,
        beefId,
      },
    });
  }
}

export async function notifyJudgmentComplete(beefId: string) {
  const beef = await prisma.beef.findUnique({
    where: { id: beefId },
    include: {
      challenger: true,
      responder: true,
    },
  });

  if (!beef) return;

  const participants = [beef.challenger, beef.responder].filter(Boolean);

  for (const user of participants) {
    if (!user) continue;
    const isWinner = beef.winnerId === user.id;

    await sendPushNotification(user.id, "JUDGMENT_COMPLETE", {
      title: isWinner ? "🏆 You Won!" : "⚖️ Judgment Complete",
      body: isWinner
        ? `You won the beef! Check out the judge's decision.`
        : `The beef has been judged. See the results.`,
      data: {
        url: `/beef/${beefId}`,
        beefId,
      },
    });
  }
}

export async function notifyNewMessage(beefId: string, messageAuthorId: string) {
  const beef = await prisma.beef.findUnique({
    where: { id: beefId },
    include: {
      challenger: true,
      responder: true,
    },
  });

  if (!beef) return;

  // Notify the other participant
  const otherUserId =
    beef.challengerId === messageAuthorId
      ? beef.responderId
      : beef.challengerId;

  if (!otherUserId) return;

  const messageAuthor = await prisma.user.findUnique({
    where: { id: messageAuthorId },
  });

  if (!messageAuthor) return;

  await sendPushNotification(otherUserId, "NEW_MESSAGE", {
    title: "💬 New Message",
    body: `@${messageAuthor.handle || messageAuthor.username} replied to your beef`,
    data: {
      url: `/beef/${beefId}`,
      beefId,
    },
  });
}
