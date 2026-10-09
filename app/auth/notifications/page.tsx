"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

type NotificationPrefs = {
  challengeAccepted: boolean;
  newMessage: boolean;
  judgmentComplete: boolean;
  beefEndingSoon: boolean;
};

export default function NotificationPreferencesPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [prefs, setPrefs] = useState<NotificationPrefs>({
    challengeAccepted: true,
    newMessage: true,
    judgmentComplete: true,
    beefEndingSoon: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  const toggleAll = (enabled: boolean) => {
    setPrefs({
      challengeAccepted: enabled,
      newMessage: enabled,
      judgmentComplete: enabled,
      beefEndingSoon: enabled,
    });
  };

  const allEnabled = Object.values(prefs).every((v) => v);
  const noneEnabled = Object.values(prefs).every((v) => !v);

  const handleSubmit = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/user/notification-preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prefs),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to save preferences");
        setLoading(false);
        return;
      }

      router.push("/auth/interests");
    } catch (err) {
      setError("Something went wrong");
      setLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-beef-text-muted">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4">
      <div className="max-w-lg w-full">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold mb-2">BEEF</h1>
          <p className="section-label">🔔 MANAGE NOTIFICATIONS</p>
        </div>

        <div className="card-beef">
          <h2 className="text-2xl font-bold mb-2">Stay in the loop</h2>
          <p className="text-beef-text-muted text-sm mb-6">
            Choose which beef updates you want to receive. You can change these anytime in settings.
          </p>

          {error && (
            <div className="bg-red-900/20 border border-red-500 text-red-500 px-4 py-3 rounded-lg mb-6 text-sm">
              {error}
            </div>
          )}

          {/* Quick toggles */}
          <div className="flex gap-3 mb-6">
            <button
              onClick={() => toggleAll(true)}
              disabled={allEnabled}
              className={`flex-1 px-4 py-2 rounded-lg border transition-colors text-sm font-bold ${
                allEnabled
                  ? "border-beef-gold bg-beef-gold/10 text-beef-gold"
                  : "border-beef-border text-beef-text-muted hover:border-beef-gold/50"
              }`}
            >
              Enable All
            </button>
            <button
              onClick={() => toggleAll(false)}
              disabled={noneEnabled}
              className={`flex-1 px-4 py-2 rounded-lg border transition-colors text-sm font-bold ${
                noneEnabled
                  ? "border-beef-border bg-beef-bg-card text-beef-text-muted"
                  : "border-beef-border text-beef-text-muted hover:border-beef-border/80"
              }`}
            >
              Disable All
            </button>
          </div>

          {/* Individual preferences */}
          <div className="space-y-4 mb-6">
            <label className="flex items-start gap-4 p-4 border border-beef-border rounded-lg cursor-pointer hover:border-beef-gold/40 transition-colors group">
              <input
                type="checkbox"
                checked={prefs.challengeAccepted}
                onChange={(e) => setPrefs({ ...prefs, challengeAccepted: e.target.checked })}
                className="mt-1 w-5 h-5 accent-beef-gold cursor-pointer"
              />
              <div className="flex-1">
                <p className="font-bold text-sm mb-1 group-hover:text-beef-gold transition-colors">
                  🔥 Challenge Accepted
                </p>
                <p className="text-xs text-beef-text-muted leading-relaxed">
                  Get notified when someone accepts your beef challenge
                </p>
              </div>
            </label>

            <label className="flex items-start gap-4 p-4 border border-beef-border rounded-lg cursor-pointer hover:border-beef-gold/40 transition-colors group">
              <input
                type="checkbox"
                checked={prefs.newMessage}
                onChange={(e) => setPrefs({ ...prefs, newMessage: e.target.checked })}
                className="mt-1 w-5 h-5 accent-beef-gold cursor-pointer"
              />
              <div className="flex-1">
                <p className="font-bold text-sm mb-1 group-hover:text-beef-gold transition-colors">
                  💬 New Messages
                </p>
                <p className="text-xs text-beef-text-muted leading-relaxed">
                  Get notified when your opponent posts a reply
                </p>
              </div>
            </label>

            <label className="flex items-start gap-4 p-4 border border-beef-border rounded-lg cursor-pointer hover:border-beef-gold/40 transition-colors group">
              <input
                type="checkbox"
                checked={prefs.judgmentComplete}
                onChange={(e) => setPrefs({ ...prefs, judgmentComplete: e.target.checked })}
                className="mt-1 w-5 h-5 accent-beef-gold cursor-pointer"
              />
              <div className="flex-1">
                <p className="font-bold text-sm mb-1 group-hover:text-beef-gold transition-colors">
                  ⚖️ Judgment Complete
                </p>
                <p className="text-xs text-beef-text-muted leading-relaxed">
                  Get notified when the judge makes a decision on your beef
                </p>
              </div>
            </label>

            <label className="flex items-start gap-4 p-4 border border-beef-border rounded-lg cursor-pointer hover:border-beef-gold/40 transition-colors group">
              <input
                type="checkbox"
                checked={prefs.beefEndingSoon}
                onChange={(e) => setPrefs({ ...prefs, beefEndingSoon: e.target.checked })}
                className="mt-1 w-5 h-5 accent-beef-gold cursor-pointer"
              />
              <div className="flex-1">
                <p className="font-bold text-sm mb-1 group-hover:text-beef-gold transition-colors">
                  ⏰ Beef Ending Soon
                </p>
                <p className="text-xs text-beef-text-muted leading-relaxed">
                  Get notified 1 hour before your beef time expires
                </p>
              </div>
            </label>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => router.push("/auth/interests")}
              className="flex-1 px-6 py-3 border border-beef-border rounded-full hover:border-beef-gold hover:text-beef-gold transition-colors text-sm font-bold"
            >
              Skip
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Saving..." : "Continue"}
            </button>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-beef-text-muted text-xs">
            You can update these preferences anytime in your account settings
          </p>
        </div>
      </div>
    </div>
  );
}
