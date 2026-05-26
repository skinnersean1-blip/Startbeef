"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const CATEGORIES = [
  {
    key: "POLITICS",
    emoji: "🏛️",
    label: "POLITICS",
    description: "Elections, policy, government, geopolitics, public officials",
  },
  {
    key: "CULTURE",
    emoji: "🎭",
    label: "CULTURE",
    description: "Music, film, media, celebrities, social trends, religion",
  },
  {
    key: "SPORTS",
    emoji: "🥊",
    label: "SPORTS",
    description: "Teams, athletes, leagues, tournaments, coaches, events",
  },
  {
    key: "TECH",
    emoji: "⚡",
    label: "TECH",
    description: "AI, startups, software, science, engineering, the internet",
  },
  {
    key: "CALLOUTS",
    emoji: "🎯",
    label: "CALLOUTS",
    description: "Direct personal challenges — calling someone out by name",
  },
];

export default function InterestsPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const toggle = (key: string) =>
    setSelected((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );

  const handleSave = async () => {
    setSaving(true);
    await fetch("/api/auth/interests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ interests: selected }),
    });
    router.push("/");
    router.refresh();
  };

  const handleSkip = () => {
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
          <h2 className="text-3xl font-bold mb-2">PICK YOUR ARENAS</h2>
          <p className="text-beef-text-muted text-sm">
            What do you actually want to fight about? Select all that apply.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
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

        <div className="flex flex-col gap-3">
          <button
            onClick={handleSave}
            disabled={saving || selected.length === 0}
            className="w-full btn-primary py-4 text-lg disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {saving ? "SAVING..." : `LET'S GO${selected.length > 0 ? ` (${selected.length} SELECTED)` : ""}`}
          </button>
          <button
            onClick={handleSkip}
            className="w-full text-beef-text-muted text-sm hover:text-beef-gold transition-colors py-2"
          >
            Skip for now
          </button>
        </div>

      </div>
    </div>
  );
}
