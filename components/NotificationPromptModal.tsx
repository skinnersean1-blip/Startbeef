"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

type NotificationPrefs = {
  challengeAccepted: boolean;
  newMessage: boolean;
  judgmentComplete: boolean;
  beefEndingSoon: boolean;
};

export function NotificationPromptModal() {
  const { data: session } = useSession();
  const router = useRouter();
  const [show, setShow] = useState(false);
  const [prefs, setPrefs] = useState<NotificationPrefs>({
    challengeAccepted: true,
    newMessage: true,
    judgmentComplete: true,
    beefEndingSoon: true,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!session?.user) return;

    // Check localStorage first (instant, no API call needed)
    const localKey = `notification-prompt-seen-${session.user.email}`;
    const seenInLocalStorage = localStorage.getItem(localKey) === "true";

    if (seenInLocalStorage) {
      return; // Don't show if already seen
    }

    // Check if user has seen the prompt in database
    fetch("/api/user/check-notification-prompt")
      .then((res) => res.json())
      .then((data) => {
        if (data.hasSeenPrompt) {
          // Mark in localStorage for future page loads
          localStorage.setItem(localKey, "true");
        } else {
          setShow(true);
        }
      })
      .catch(() => {
        // If API fails, don't show modal (fail gracefully)
        console.log("Could not check notification prompt status");
      });
  }, [session]);

  const toggleAll = (enabled: boolean) => {
    setPrefs({
      challengeAccepted: enabled,
      newMessage: enabled,
      judgmentComplete: enabled,
      beefEndingSoon: enabled,
    });
  };

  const handleSave = async () => {
    if (!session?.user?.email) return;
    setSaving(true);

    try {
      // Save preferences
      await fetch("/api/user/notification-preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prefs),
      });

      // Mark prompt as seen in database
      await fetch("/api/user/mark-notification-prompt-seen", {
        method: "POST",
      });

      // Always mark in localStorage (instant for next page load)
      const localKey = `notification-prompt-seen-${session.user.email}`;
      localStorage.setItem(localKey, "true");

      setShow(false);
      router.refresh();
    } catch (err) {
      console.error("Failed to save:", err);
      // Still mark as seen in localStorage to prevent re-showing
      if (session?.user?.email) {
        const localKey = `notification-prompt-seen-${session.user.email}`;
        localStorage.setItem(localKey, "true");
      }
      setShow(false);
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = async () => {
    if (!session?.user?.email) return;

    try {
      // Just mark as seen without changing preferences
      await fetch("/api/user/mark-notification-prompt-seen", {
        method: "POST",
      });

      // Mark in localStorage
      const localKey = `notification-prompt-seen-${session.user.email}`;
      localStorage.setItem(localKey, "true");

      setShow(false);
      router.refresh();
    } catch (err) {
      console.error("Failed to skip:", err);
      // Still mark in localStorage
      if (session?.user?.email) {
        const localKey = `notification-prompt-seen-${session.user.email}`;
        localStorage.setItem(localKey, "true");
      }
      setShow(false);
    }
  };

  if (!show) return null;

  const allEnabled = Object.values(prefs).every((v) => v);
  const noneEnabled = Object.values(prefs).every((v) => !v);

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-beef-bg-card border-2 border-beef-gold rounded-2xl max-w-lg w-full p-8 shadow-2xl">
        <div className="text-center mb-6">
          <span className="text-5xl mb-4 block">🔔</span>
          <h2 className="text-2xl font-bold mb-2">Stay Updated!</h2>
          <p className="text-beef-text-muted text-sm">
            Get notified about your beefs. Choose what matters to you.
          </p>
        </div>

        {/* Quick toggles */}
        <div className="flex gap-3 mb-4">
          <button
            onClick={() => toggleAll(true)}
            disabled={allEnabled}
            className={`flex-1 px-4 py-2 rounded-lg border transition-colors text-xs font-bold ${
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
            className={`flex-1 px-4 py-2 rounded-lg border transition-colors text-xs font-bold ${
              noneEnabled
                ? "border-beef-border bg-beef-bg-card text-beef-text-muted"
                : "border-beef-border text-beef-text-muted hover:border-beef-border/80"
            }`}
          >
            Disable All
          </button>
        </div>

        {/* Individual preferences */}
        <div className="space-y-2 mb-6">
          <label className="flex items-start gap-3 p-3 border border-beef-border rounded-lg cursor-pointer hover:border-beef-gold/40 transition-colors">
            <input
              type="checkbox"
              checked={prefs.challengeAccepted}
              onChange={(e) => setPrefs({ ...prefs, challengeAccepted: e.target.checked })}
              className="mt-0.5 w-4 h-4 accent-beef-gold cursor-pointer"
            />
            <div className="flex-1">
              <p className="font-bold text-xs mb-0.5">🔥 Challenge Accepted</p>
              <p className="text-[10px] text-beef-text-muted leading-relaxed">
                When someone accepts your beef
              </p>
            </div>
          </label>

          <label className="flex items-start gap-3 p-3 border border-beef-border rounded-lg cursor-pointer hover:border-beef-gold/40 transition-colors">
            <input
              type="checkbox"
              checked={prefs.newMessage}
              onChange={(e) => setPrefs({ ...prefs, newMessage: e.target.checked })}
              className="mt-0.5 w-4 h-4 accent-beef-gold cursor-pointer"
            />
            <div className="flex-1">
              <p className="font-bold text-xs mb-0.5">💬 New Messages</p>
              <p className="text-[10px] text-beef-text-muted leading-relaxed">
                When your opponent replies
              </p>
            </div>
          </label>

          <label className="flex items-start gap-3 p-3 border border-beef-border rounded-lg cursor-pointer hover:border-beef-gold/40 transition-colors">
            <input
              type="checkbox"
              checked={prefs.judgmentComplete}
              onChange={(e) => setPrefs({ ...prefs, judgmentComplete: e.target.checked })}
              className="mt-0.5 w-4 h-4 accent-beef-gold cursor-pointer"
            />
            <div className="flex-1">
              <p className="font-bold text-xs mb-0.5">⚖️ Judgment Complete</p>
              <p className="text-[10px] text-beef-text-muted leading-relaxed">
                When the judge makes a decision
              </p>
            </div>
          </label>

          <label className="flex items-start gap-3 p-3 border border-beef-border rounded-lg cursor-pointer hover:border-beef-gold/40 transition-colors">
            <input
              type="checkbox"
              checked={prefs.beefEndingSoon}
              onChange={(e) => setPrefs({ ...prefs, beefEndingSoon: e.target.checked })}
              className="mt-0.5 w-4 h-4 accent-beef-gold cursor-pointer"
            />
            <div className="flex-1">
              <p className="font-bold text-xs mb-0.5">⏰ Beef Ending Soon</p>
              <p className="text-[10px] text-beef-text-muted leading-relaxed">
                1 hour before time expires
              </p>
            </div>
          </label>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleSkip}
            className="flex-1 px-6 py-3 border border-beef-border rounded-full hover:border-beef-gold hover:text-beef-gold transition-colors text-sm font-bold"
          >
            Skip
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>

        <p className="text-center text-beef-text-muted text-[10px] mt-4">
          You can change these anytime in Settings
        </p>
      </div>
    </div>
  );
}
