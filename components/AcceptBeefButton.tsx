"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AcceptBeefButton({ beefId, ante }: { beefId: string; ante: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAccept = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/beef/${beefId}/accept`, {
        method: "POST",
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

  return (
    <div>
      {error && (
        <div className="bg-red-900/20 border border-red-500 text-red-500 px-4 py-3 rounded-lg mb-4 text-sm">
          {error}
        </div>
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
