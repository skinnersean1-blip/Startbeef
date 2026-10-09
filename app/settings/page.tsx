"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { BackButton } from "@/components/BackButton";
import { TwoFactorSettings } from "@/components/TwoFactorSettings";

type NotificationPrefs = {
  challengeAccepted: boolean;
  newMessage: boolean;
  judgmentComplete: boolean;
  beefEndingSoon: boolean;
};

export default function SettingsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [prefs, setPrefs] = useState<NotificationPrefs>({
    challengeAccepted: true,
    newMessage: true,
    judgmentComplete: true,
    beefEndingSoon: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
      return;
    }

    if (status === "authenticated") {
      loadPreferences();
    }
  }, [status, router]);

  const loadPreferences = async () => {
    try {
      const res = await fetch("/api/user/notification-preferences");
      if (res.ok) {
        const data = await res.json();
        setPrefs(data.preferences);
      }
    } catch (err) {
      console.error("Failed to load preferences:", err);
    } finally {
      setLoading(false);
    }
  };

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

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/user/notification-preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prefs),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to save preferences");
        setSaving(false);
        return;
      }

      setSuccess("Preferences saved successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-beef-text-muted">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="container-beef py-6 border-b border-beef-border">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-2xl font-black tracking-tighter">
            BEEF
          </Link>
          <Link href="/dashboard">
            <button className="text-xs text-beef-text-muted hover:text-beef-gold transition-colors">
              Back to Dashboard
            </button>
          </Link>
        </div>
      </header>

      <div className="container-beef py-12">
        <div className="max-w-2xl mx-auto">
          <div className="mb-6"><BackButton /></div>

          <div className="mb-8">
            <h1 className="text-4xl font-black tracking-tight mb-2">SETTINGS</h1>
            <p className="text-beef-text-muted">Manage your account preferences</p>
          </div>

          {/* Notification Preferences Section */}
          <div className="card-beef mb-6">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-2xl">🔔</span>
              <div>
                <h2 className="text-xl font-bold">Notification Preferences</h2>
                <p className="text-sm text-beef-text-muted">Choose which beef updates you want to receive</p>
              </div>
            </div>

            {error && (
              <div className="bg-red-900/20 border border-red-500 text-red-500 px-4 py-3 rounded-lg mb-6 text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-900/20 border border-green-500 text-green-500 px-4 py-3 rounded-lg mb-6 text-sm">
                {success}
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
            <div className="space-y-3 mb-6">
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

            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "Saving..." : "Save Preferences"}
            </button>
          </div>

          {/* Two-Factor Authentication Section */}
          <TwoFactorSettings />
        </div>
      </div>
    </div>
  );
}
