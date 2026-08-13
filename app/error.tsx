"use client";

import Link from "next/link";

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4">
      <div className="flex flex-col items-center gap-6 text-center w-full max-w-md">
        <div>
          <p className="text-beef-text-muted text-xs tracking-widest mb-2">OPINION MARKET</p>
          <Link href="/">
            <h1 className="text-5xl font-bold tracking-tighter mb-6 hover:text-beef-gold transition-colors">BEEF</h1>
          </Link>
        </div>
        <div className="card-beef w-full py-10">
          <p className="text-xl font-bold mb-3 text-beef-orange">SOMETHING WENT WRONG</p>
          <p className="text-beef-text-muted text-sm mb-6">A server error occurred. Try again or head back to the arena.</p>
          <div className="flex gap-3 justify-center">
            <button onClick={reset} className="btn-secondary px-6 py-3">
              TRY AGAIN
            </button>
            <Link href="/" className="btn-primary px-6 py-3">
              BACK TO BEEF
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
