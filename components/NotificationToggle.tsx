"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

export function NotificationToggle() {
  const { data: session } = useSession();
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Check if push notifications are supported
    const supported = "Notification" in window && "serviceWorker" in navigator && "PushManager" in window;
    setIsSupported(supported);

    if (supported) {
      checkSubscription();
    }
  }, [session]);

  async function checkSubscription() {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
    } catch (error) {
      console.error("Error checking subscription:", error);
    }
  }

  async function subscribe() {
    if (!session?.user) {
      alert("Please sign in to enable notifications");
      return;
    }

    setIsLoading(true);

    try {
      // Register service worker
      const registration = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      // Request notification permission
      const permission = await Notification.requestPermission();

      if (permission !== "granted") {
        alert("Notification permission denied");
        setIsLoading(false);
        return;
      }

      // Get VAPID public key from API
      const vapidResponse = await fetch("/api/notifications/vapid");
      const { publicKey } = await vapidResponse.json();

      // Subscribe to push
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      // Send subscription to server
      const response = await fetch("/api/notifications/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: subscription.endpoint,
          keys: {
            p256dh: arrayBufferToBase64(subscription.getKey("p256dh")),
            auth: arrayBufferToBase64(subscription.getKey("auth")),
          },
        }),
      });

      if (!response.ok) throw new Error("Failed to subscribe");

      setIsSubscribed(true);
    } catch (error) {
      console.error("Error subscribing:", error);
      alert("Failed to enable notifications");
    } finally {
      setIsLoading(false);
    }
  }

  async function unsubscribe() {
    setIsLoading(true);

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await fetch("/api/notifications/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });

        await subscription.unsubscribe();
        setIsSubscribed(false);
      }
    } catch (error) {
      console.error("Error unsubscribing:", error);
      alert("Failed to disable notifications");
    } finally {
      setIsLoading(false);
    }
  }

  if (!isSupported || !session?.user) return null;

  return (
    <button
      onClick={isSubscribed ? unsubscribe : subscribe}
      disabled={isLoading}
      className={`text-xs font-bold tracking-widest px-3 py-1.5 rounded-full border transition-all ${
        isSubscribed
          ? "border-beef-gold bg-beef-gold/10 text-beef-gold"
          : "border-beef-border text-beef-text-muted hover:border-beef-gold/50"
      } disabled:opacity-40`}
    >
      {isLoading ? "..." : isSubscribed ? "🔔 NOTIFICATIONS ON" : "🔕 ENABLE NOTIFICATIONS"}
    </button>
  );
}

// Helper functions
function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function arrayBufferToBase64(buffer: ArrayBuffer | null) {
  if (!buffer) return "";
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}
