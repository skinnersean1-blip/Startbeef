"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const CATEGORIES = [
  { key: "POLITICS",  emoji: "🏛️", label: "POLITICS",  description: "Elections, policy, government, geopolitics, public officials" },
  { key: "CULTURE",   emoji: "🎭", label: "CULTURE",   description: "Music, film, media, celebrities, social trends, religion" },
  { key: "SPORTS",    emoji: "🥊", label: "SPORTS",    description: "Teams, athletes, leagues, tournaments, coaches, events" },
  { key: "TECH",      emoji: "⚡", label: "TECH",      description: "AI, startups, software, science, engineering, the internet" },
  { key: "CALLOUTS",  emoji: "🎯", label: "CALLOUTS",  description: "Direct personal challenges — calling someone out by name" },
];

export default function InterestsPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);
  const [custom, setCustom] = useState<string[]>([]);
  const [customInput, setCustomInput] = useState("");
  const [saving, setSaving] = useState(false);

  const toggle = (key: string) =>
    setSelected((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );

  const addCustom = () => {
    const val = customInput.trim().toUpperCase();
    if (!val || val.length < 2 || val.length > 40) return;
    if (custom.includes(val) || CATEGORIES.some((c) => c.key === val)) return;
    setCustom((prev) => [...prev, val]);
    setCustomInput("");
  };

  const removeCustom = (val: string) =>
    setCustom((prev) => prev.filter((v) => v !== val));

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") { e.preventDefault(); addCustom(); }
  };

  const allSelected = [...selected, ...custom];

  const handleSave = async () => {
    setSaving(true);
    await fetch("/api/auth/interests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ interests: allSelected }),
    });
    router.push("/");
    router.refresh();
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4">
      <div className="max-w-2xl w-full">

        <div className="text-center mb-10">
          <Link href="/">
            <h1 className="text-5xl font-bold mb-3 cursor-pointer">BEEF</h1>
          </Link>
          <p className="section-label mb-3">ONE LAST THING</p>
          <h2 className="text-3xl font-bold mb-2">PICK YOUR TOPICS</h2>
          <p className="text-beef-text-muted text-sm">
            What do you actually want to fight about? Select all that apply.
          </p>
        </div>

        {/* Preset categories */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          {CATEGORIES.map((cat) => {
            const isSelected = selected.includes(cat.key);
            return (
              <button
                key={cat.key}
                onClick={() => toggle(cat.key)}
                className={`card-beef text-left transition-all duration-150 border-2 p-5 ${
                  isSelected
                    ? "border-beef-gold bg-beef-gold/10"
                    : "border-beef-border hover:border-beef-gold/50"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{cat.emoji}</span>
                    <p className={`font-bold tracking-widest text-sm ${isSelected ? "text-beef-gold" : "text-beef-text"}`}>
                      {cat.label}
                    </p>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 transition-all ${
                    isSelected ? "bg-beef-gold border-beef-gold" : "border-beef-border"
                  }`} />
                </div>
                <p className="text-beef-text-muted text-xs leading-relaxed pl-9">
                  {cat.description}
                </p>
              </button>
            );
          })}
        </div>

        {/* Custom topic input */}
        <div className="card-beef border-beef-border/50 mb-8">
          <p className="section-label mb-3">✏️ ADD YOUR OWN</p>
          <p className="text-beef-text-muted text-xs mb-3">
            Got a niche? Type it in — climate policy, hip-hop beef, crypto, whatever you'd actually argue about.
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value.slice(0, 40))}
              onKeyDown={handleKey}
              placeholder="e.g. Climate Policy, Hip-Hop..."
              className="flex-1 px-4 py-2.5 bg-beef-bg-light border border-beef-border rounded-lg focus:outline-none focus:border-beef-gold transition-colors text-sm"
            />
            <button
              onClick={addCustom}
              disabled={customInput.trim().length < 2}
              className="btn-primary px-4 py-2.5 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
            >
              ADD
            </button>
          </div>

          {/* Custom tags */}
          {custom.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {custom.map((tag) => (
                <span
                  key={tag}
                  className="flex items-center gap-1.5 text-xs font-bold tracking-widest text-beef-gold bg-beef-gold/10 border border-beef-gold/40 px-3 py-1 rounded-full"
                >
                  {tag}
                  <button
                    onClick={() => removeCustom(tag)}
                    className="hover:text-beef-orange transition-colors leading-none"
                    aria-label={`Remove ${tag}`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={handleSave}
            disabled={saving || allSelected.length === 0}
            className="w-full btn-primary py-4 text-lg disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {saving ? "SAVING..." : `LET'S GO${allSelected.length > 0 ? ` (${allSelected.length} SELECTED)` : ""}`}
          </button>
          <button
            onClick={() => { router.push("/"); router.refresh(); }}
            className="w-full text-beef-text-muted text-sm hover:text-beef-gold transition-colors py-2"
          >
            Skip for now
          </button>
        </div>

      </div>
    </div>
  );
}
