import webpush from "web-push";

console.log("\n🔑 Generating VAPID keys for push notifications...\n");

const vapidKeys = webpush.generateVAPIDKeys();

console.log("Add these to your .env file:\n");
console.log(`VAPID_PUBLIC_KEY="${vapidKeys.publicKey}"`);
console.log(`VAPID_PRIVATE_KEY="${vapidKeys.privateKey}"`);
console.log("\nAlso add to Vercel environment variables!");
console.log("\n✅ Done!\n");
