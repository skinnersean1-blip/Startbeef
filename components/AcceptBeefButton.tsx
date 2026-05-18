"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export function AcceptBeefButton({ beefId, ante }: { beefId: string; ante: number }) {
  const router = useRouter();
  const { data: session } = useSession();
  const [goAnon, setGoAnon] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAccept = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/beef/${beefId}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ responderIsAnon: goAnon }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong");
        setLoading(false);
        return;
      }

      router.refresh();
    } catch {
      setError("Something went wrong");
      setLoading(false);
    }
  };

  const isHandledUser = session?.user && !session.user.isAnonymous;

  return (
    <div className="space-y-3">
      {error && (
        <div className="bg-red-900/20 border border-red-500 text-red-500 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Anon toggle for handled users */}
      {isHandledUser && (
        <button
          type="button"
          onClick={() => setGoAnon((v) => !v)}
          className={`w-full flex items-center justify-between px-5 py-3 rounded-lg border-2 transition-all duration-200 ${
            goAnon
              ? "border-beef-orange bg-beef-orange/10"
              : "border-beef-border hover:border-beef-border/80"
          }`}
        >
          <div className="text-left">
            <p className="font-bold text-sm">{goAnon ? "👻 ENTERING AS GHOST" : "ENTER UNDER YOUR HANDLE"}</p>
            <p className="text-xs text-beef-text-muted mt-0.5">
              {goAnon ? "Your codename will be shown instead" : "Tap to hide your identity"}
            </p>
          </div>
          <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 ${goAnon ? "bg-beef-orange border-beef-orange" : "border-beef-border"}`} />
        </button>
      )}

      <button
        onClick={handleAccept}
        disabled={loading}
        className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed text-lg py-4"
      >
        {loading ? "ACCEPTING..." : `ACCEPT — MATCH $${ante}`}
      </button>
    </div>
  );
}
