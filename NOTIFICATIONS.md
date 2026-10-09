# Push Notifications Setup

## Overview

The beef platform now supports push notifications for:
- ✅ **Challenge Accepted** - When someone accepts your beef
- ✅ **Beef Ending Soon** - 1 hour warning before beef expires
- ✅ **Judgment Complete** - When the judge makes a decision
- ✅ **New Message** - When your opponent replies

## Setup Instructions

### 1. Generate VAPID Keys

```bash
npm run generate-vapid-keys
```

This will output two environment variables.

### 2. Add to Environment

Add the generated keys to:
- `.env.local` (for local development)
- Vercel environment variables (for production)

```env
VAPID_PUBLIC_KEY="BK..."
VAPID_PRIVATE_KEY="..."
```

### 3. Update Database Schema

```bash
npx prisma db push
```

This creates the `PushSubscription` and `Notification` tables.

### 4. Add Notification Toggle to UI

The `<NotificationToggle />` component can be added anywhere authenticated users have access:

```tsx
import { NotificationToggle } from "@/components/NotificationToggle";

// In your component:
<NotificationToggle />
```

Good places to add it:
- Header next to the auth buttons
- User settings/profile page
- First-time user onboarding flow

## How It Works

### User Subscription Flow

1. User clicks "Enable Notifications" button
2. Browser requests notification permission
3. Service worker registers and creates push subscription
4. Subscription details saved to database
5. User receives notifications on all their devices

### Sending Notifications

Notifications are sent automatically when:

**Challenge Accepted**
- Triggered when a user accepts an open beef
- Notifies the challenger

**Beef Ending Soon**
- Triggered by cron job 1 hour before beef expires
- Notifies both participants

**Judgment Complete**
- Triggered when judge completes scoring
- Notifies both participants with different messages (winner vs loser)

**New Message**
- Triggered when a message is posted to a beef
- Notifies the other participant

### Manual Notification Example

```typescript
import { sendPushNotification } from "@/lib/push";

await sendPushNotification(userId, "CHALLENGE_ACCEPTED", {
  title: "🔥 Challenge Accepted!",
  body: "@username accepted your beef!",
  data: {
    url: `/beef/${beefId}`,
    beefId,
  },
});
```

## Integration Points

### When Beef is Accepted

In your beef acceptance handler:

```typescript
import { notifyBeefAccepted } from "@/lib/push";

// After beef is accepted...
await notifyBeefAccepted(beefId, challengerId);
```

### When Message is Posted

In your message creation handler:

```typescript
import { notifyNewMessage } from "@/lib/push";

// After message is created...
await notifyNewMessage(beefId, authorId);
```

### When Judgment is Complete

In your judgment handler:

```typescript
import { notifyJudgmentComplete } from "@/lib/push";

// After judgment is complete...
await notifyJudgmentComplete(beefId);
```

### Beef Ending Soon (Cron Job)

Create a cron endpoint at `/api/cron/notify-ending-beefs`:

```typescript
import { notifyBeefEndingSoon } from "@/lib/push";

// Find beefs ending in ~1 hour
const endingSoon = await prisma.beef.findMany({
  where: {
    status: "LIVE",
    endsAt: {
      gte: new Date(Date.now() + 3540000), // 59 minutes
      lte: new Date(Date.now() + 3660000), // 61 minutes
    },
  },
});

for (const beef of endingSoon) {
  await notifyBeefEndingSoon(beef.id);
}
```

## Testing

### Local Testing

1. Run dev server: `npm run dev`
2. Open in browser and sign in
3. Click "Enable Notifications"
4. Grant permission when prompted
5. Trigger a test notification from admin panel or API

### Browser Support

- ✅ Chrome/Edge (desktop & Android)
- ✅ Firefox (desktop & Android)
- ✅ Safari (macOS 16+, iOS 16.4+)
- ❌ Safari (older versions)
- ❌ iOS Safari (in-app browsers)

## Troubleshooting

**"Notifications not supported"**
- Check browser compatibility
- Ensure HTTPS (required for service workers)
- localhost is okay for development

**"Failed to subscribe"**
- Check VAPID keys are set correctly
- Verify service worker registered (`/sw.js` exists)
- Check browser console for errors

**"Notifications not arriving"**
- Verify subscription exists in database
- Check notification permission granted
- Review server logs for push errors
- 410 errors mean subscription expired (auto-cleaned)

## Privacy & Data

- Push subscriptions are device-specific
- Users can unsubscribe anytime
- Invalid subscriptions auto-removed
- Notification history stored in `Notification` table
- No sensitive beef content in notification payload
