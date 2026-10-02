"use client";

import { useState } from "react";
import Link from "next/link";

const CATEGORIES = [
  { value: "bug",     label: "BUG REPORT",      desc: "Something's broken" },
  { value: "feature", label: "FEATURE REQUEST",  desc: "Something we should build" },
  { value: "idea",    label: "IDEA",             desc: "Something to think about" },
  { value: "general", label: "GENERAL",          desc: "Anything else" },
];

export default function VerdictPage() {
  const [category, setCategory] = useState("general");
  const [content, setContent] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (content.trim().length < 10) { setError("Tell us a bit more — minimum 10 characters."); return; }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, content: content.trim(), email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Something went wrong"); return; }
      setDone(true);
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen">
      <header className="container-beef py-6">
        <div className="flex items-center justify-between">
          <Link href="/">
            <div className="cursor-pointer">
              <p className="text-beef-text-muted text-[10px] tracking-widest mb-1">OPINION MARKET</p>
              <h1 className="text-4xl font-bold tracking-tighter">BEEF</h1>
            </div>
          </Link>
          <Link href="/" className="text-beef-text-muted text-xs tracking-widest hover:text-beef-gold transition-colors">
            ← BACK
          </Link>
        </div>
      </header>

      <div className="container-beef pb-24">
        <div className="max-w-xl mx-auto">

          <div className="mb-10">
            <p className="text-beef-gold text-xs tracking-widest mb-3">COMMUNITY FEEDBACK</p>
            <h2 className="text-4xl font-bold tracking-tighter mb-3">THE VERDICT</h2>
            <p className="text-beef-text-muted text-sm leading-relaxed">
              You&apos;ve seen the platform. Now tell us what&apos;s broken, what&apos;s missing, and what we should build next. Every submission is read. Nothing is ignored.
            </p>
          </div>

          {done ? (
            <div className="card-beef py-12 text-center">
              <p className="text-3xl font-bold mb-3">RECEIVED.</p>
              <p className="text-beef-text-muted text-sm mb-8">
                Your verdict is in. We&apos;ll take it seriously.
              </p>
              <div className="flex justify-center gap-4">
                <button
                  onClick={() => { setDone(false); setContent(""); setEmail(""); setCategory("general"); }}
                  className="text-xs font-bold tracking-widest text-beef-gold hover:text-beef-gold/80 border border-beef-gold/40 px-4 py-2 transition-colors"
                >
                  SUBMIT ANOTHER
                </button>
                <Link href="/">
                  <button className="btn-primary text-xs px-4 py-2">BACK TO HOME</button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="card-beef">
              <p className="section-label mb-3">CATEGORY</p>
              <div className="grid grid-cols-2 gap-2 mb-6">
                {CATEGORIES.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => setCategory(c.value)}
                    className={`text-left px-3 py-3 border transition-colors ${
                      category === c.value
                        ? "border-beef-gold bg-beef-gold/5 text-beef-gold"
                        : "border-beef-border text-beef-text-muted hover:border-beef-gold/40"
                    }`}
                  >
                    <p className="text-xs font-bold tracking-widest mb-0.5">{c.label}</p>
                    <p className="text-xs opacity-60">{c.desc}</p>
                  </button>
                ))}
              </div>

              <p className="section-label mb-2">YOUR VERDICT</p>
              {error && <p className="text-xs text-red-400 mb-2">{error}</p>}
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value.slice(0, 2000))}
                placeholder="Say what needs saying..."
                rows={6}
                className="w-full px-3 py-3 bg-beef-bg-light border border-beef-border focus:outline-none focus:border-beef-gold text-sm resize-none mb-1"
              />
              <p className="text-xs text-beef-text-muted text-right mb-5">{content.length}/2000</p>

              <p className="section-label mb-2">EMAIL <span className="text-beef-text-muted font-normal normal-case tracking-normal text-xs ml-1">(optional — if you want a reply)</span></p>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-3 py-2 bg-beef-bg-light border border-beef-border focus:outline-none focus:border-beef-gold text-sm mb-6"
              />

              <button
                onClick={handleSubmit}
                disabled={submitting || content.trim().length < 10}
                className="w-full btn-primary py-3 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {submitting ? "SUBMITTING..." : "SUBMIT YOUR VERDICT"}
              </button>
            </div>
          )}

        </div>
      </div>

      <footer className="container-beef py-10 border-t border-beef-border">
        <div className="flex justify-between items-center">
          <p className="text-beef-text-muted text-xs tracking-widest">© 2026 BEEF. TALK SHIT, MAKE MONEY.</p>
          <div className="flex gap-6 text-xs">
            <Link href="/about" className="text-beef-text-muted hover:text-beef-gold transition-colors tracking-widest">ABOUT</Link>
            <Link href="/rules" className="text-beef-text-muted hover:text-beef-gold transition-colors tracking-widest">RULES</Link>
            <Link href="/verdict" className="text-beef-text-muted hover:text-beef-gold transition-colors tracking-widest">THE VERDICT</Link>
            <Link href="/terms" className="text-beef-text-muted hover:text-beef-gold transition-colors tracking-widest">TERMS</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
