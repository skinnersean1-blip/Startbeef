"use client";

import { useRouter } from "next/navigation";

export function BackButton({ fallback = "/" }: { fallback?: string }) {
  const router = useRouter();

  function handleBack() {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push(fallback);
    }
  }

  return (
    <button
      onClick={handleBack}
      className="flex items-center gap-2 text-beef-text-muted hover:text-beef-gold transition-colors text-sm tracking-widest font-sans"
    >
      ← BACK
    </button>
  );
}
