"use client";

import { useRouter, useSearchParams } from "next/navigation";

const CATEGORIES = [
  { key: "ALL", label: "TRENDING" },
  { key: "POLITICS", label: "POLITICS" },
  { key: "CULTURE", label: "CULTURE" },
  { key: "SPORTS", label: "SPORTS" },
  { key: "TECH", label: "TECH" },
  { key: "CALLOUTS", label: "CALLOUTS" },
];

const HOT_TOPICS = [
  "Mid Term Elections",
  "Iran War",
  "Donald Trump",
  "Joe Biden",
  "Ukraine War",
  "Strait of Hormuz",
  "Foreign Policy",
  "Abortion",
  "SCOTUS",
];

const SORTS = [
  { key: "hot", label: "HOT POT" },
  { key: "active", label: "MOST ACTIVE" },
  { key: "ending", label: "ENDING SOON" },
  { key: "new", label: "NEW CHALLENGES" },
];

export function BrowseBar() {
  const router = useRouter();
  const params = useSearchParams();
  const category = params.get("cat") || "ALL";
  const sort = params.get("sort") || "hot";

  const update = (key: string, value: string) => {
    const p = new URLSearchParams(params.toString());
    p.set(key, value);
    router.push(`/?${p.toString()}`);
  };

  return (
    <div className="border-y border-beef-border py-4">
      <div className="container-beef space-y-3">

        {/* Categories + Sort */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="section-label">BROWSE</span>
            {CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                onClick={() => update("cat", cat.key)}
                className={`text-xs font-bold tracking-widest px-4 py-1.5 rounded-full border transition-all duration-150 ${
                  category === cat.key
                    ? "border-beef-gold bg-beef-gold/10 text-beef-gold"
                    : "border-beef-border text-beef-text-muted hover:border-beef-gold/50 hover:text-beef-text"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 flex-wrap ml-auto">
            <span className="section-label">SORT</span>
            {SORTS.map((s) => (
              <button
                key={s.key}
                onClick={() => update("sort", s.key)}
                className={`text-xs font-bold tracking-widest px-4 py-1.5 rounded-full border transition-all duration-150 ${
                  sort === s.key
                    ? "border-beef-gold bg-beef-gold/10 text-beef-gold"
                    : "border-beef-border text-beef-text-muted hover:border-beef-gold/50 hover:text-beef-text"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Hot topics */}
        <div className="flex items-center gap-3 flex-wrap">
          <span className="section-label">🔥 HOT</span>
          {HOT_TOPICS.map((topic) => (
            <button
              key={topic}
              onClick={() => update("cat", topic)}
              className={`text-xs font-bold px-3 py-1 rounded-full border transition-all duration-150 ${
                category === topic
                  ? "border-beef-orange bg-beef-orange/10 text-beef-orange"
                  : "border-beef-border/60 text-beef-text-muted hover:border-beef-orange/50 hover:text-beef-text"
              }`}
            >
              {topic}
            </button>
          ))}
        </div>

      </div>
    </div>
  );
}
