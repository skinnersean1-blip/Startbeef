"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function SearchBar() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim().length < 2) return;
    router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    setQuery("");
    setOpen(false);
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") { setOpen(false); setQuery(""); }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="p-2 text-beef-text-muted hover:text-beef-gold transition-colors"
        aria-label="Search"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKey}
        placeholder="Search..."
        autoFocus
        className="w-48 sm:w-64 px-3 py-2 bg-beef-bg-card border border-beef-gold/60 rounded-lg focus:outline-none focus:border-beef-gold transition-colors text-sm"
      />
      <button type="submit" className="text-xs font-bold tracking-widest text-beef-gold hover:text-beef-gold/80 transition-colors px-2 py-2">
        GO
      </button>
      <button
        type="button"
        onClick={() => { setOpen(false); setQuery(""); }}
        className="text-beef-text-muted hover:text-beef-gold transition-colors text-lg leading-none"
      >
        ×
      </button>
    </form>
  );
}
