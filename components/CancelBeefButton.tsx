"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function CancelBeefButton({ beefId }: { beefId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);

  const handleCancel = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/beef/${beefId}/cancel`, {
        method: "POST",
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to cancel");
        setLoading(false);
        return;
      }

      // Success - redirect to home
      router.push("/?cancelled=true");
      router.refresh();
    } catch (err) {
      setError("Something went wrong");
      setLoading(false);
    }
  };

  if (!showConfirm) {
    return (
      <button
        onClick={() => setShowConfirm(true)}
        className="px-6 py-2 border border-red-500 text-red-500 rounded-full hover:bg-red-500 hover:text-white transition-colors text-sm"
      >
        CANCEL BEEF
      </button>
    );
  }

  return (
    <div className="card-beef border-red-500 bg-red-900/10">
      <p className="font-bold mb-4">Cancel this beef and get your ante back?</p>

      {error && (
        <div className="bg-red-900/20 border border-red-500 text-red-500 px-4 py-2 rounded-lg mb-4 text-sm">
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={handleCancel}
          disabled={loading}
          className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold px-6 py-3 rounded-full transition-colors disabled:opacity-50"
        >
          {loading ? "Cancelling..." : "Yes, Cancel"}
        </button>
        <button
          onClick={() => setShowConfirm(false)}
          disabled={loading}
          className="flex-1 border border-beef-border text-beef-text hover:border-beef-gold hover:text-beef-gold px-6 py-3 rounded-full transition-colors disabled:opacity-50"
        >
          Keep It Live
        </button>
      </div>
    </div>
  );
}
