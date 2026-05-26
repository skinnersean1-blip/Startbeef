"use client";

import { useState } from "react";
import Link from "next/link";
import { createShoePost } from "../actions";
import { shoePath } from "@/lib/shoepath";

const CONDITIONS = [
  { key: "NEW",        label: "New",        credits: 4, desc: "Unworn, tags on or near-perfect" },
  { key: "LIKE_NEW",   label: "Like New",   credits: 3, desc: "Worn briefly, minimal wear" },
  { key: "LOVED",      label: "Loved",      credits: 2, desc: "Visible wear, still great shape" },
  { key: "WELL_LOVED", label: "Well Loved", credits: 1, desc: "Heavy wear, functional but worn" },
];

const CONDITION_COLOR: Record<string, string> = {
  NEW:        "border-shoe-tier-new text-shoe-tier-new",
  LIKE_NEW:   "border-shoe-tier-likenew text-shoe-tier-likenew",
  LOVED:      "border-shoe-tier-loved text-shoe-tier-loved",
  WELL_LOVED: "border-shoe-tier-wellloved text-shoe-tier-wellloved",
};

const SIZES = [
  "0", "1", "2", "3", "4", "5", "6", "7", "8",
  "1T", "2T", "3T", "4T", "5T",
  "6C", "7C", "8C", "9C", "10C", "11C", "12C", "13C",
  "1Y", "2Y", "3Y", "4Y", "5Y",
];

export default function NewShoePage() {
  const [kind, setKind]         = useState<"PAIR" | "SINGLE" | "">("");
  const [listType, setListType] = useState<"SALE" | "TRADE" | "FREE" | "">("");
  const [condition, setCondition] = useState("");

  const creditsEarned = condition && listType === "FREE"
    ? CONDITIONS.find((c) => c.key === condition)?.credits ?? 0
    : null;

  return (
    <div className="min-h-screen bg-shoe-bg">

      {/* Header */}
      <header className="bg-shoe-bg-deep border-b border-shoe-border">
        <div className="container-shoe py-6 flex items-center justify-between">
          <div>
            <p className="label-shoe mb-1">NEW LISTING</p>
            <h1 className="text-4xl font-bold text-shoe-cream tracking-tight">POST A SHOE</h1>
          </div>
          <Link href={shoePath()}>
            <button className="btn-shoe-ghost">← BACK</button>
          </Link>
        </div>
      </header>

      <main className="container-shoe py-8 max-w-2xl">
        <form action={createShoePost} className="space-y-8">

          {/* Step 1: Pair or Single */}
          <div className="card-shoe">
            <p className="label-shoe mb-4">WHAT ARE YOU LISTING?</p>
            <div className="grid grid-cols-2 gap-3">
              {(["PAIR", "SINGLE"] as const).map((k) => (
                <label key={k} className="cursor-pointer">
                  <input
                    type="radio"
                    name="listingKind"
                    value={k}
                    required
                    className="sr-only"
                    onChange={() => setKind(k)}
                  />
                  <div className={`border-2 p-5 text-center transition-colors ${
                    kind === k
                      ? "border-shoe-accent bg-shoe-bg-deep"
                      : "border-shoe-border hover:border-shoe-cream"
                  }`}>
                    <p className="text-2xl font-bold text-shoe-cream">{k}</p>
                    <p className="text-xs text-shoe-cream-dim mt-1">
                      {k === "PAIR" ? "Both shoes, complete set" : "One shoe only"}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Step 2: Listing type */}
          <div className="card-shoe">
            <p className="label-shoe mb-4">HOW ARE YOU LISTING IT?</p>
            <div className="grid grid-cols-3 gap-3">
              {(["SALE", "TRADE", "FREE"] as const).map((t) => (
                <label key={t} className="cursor-pointer">
                  <input
                    type="radio"
                    name="listingType"
                    value={t}
                    required
                    className="sr-only"
                    onChange={() => setListType(t)}
                  />
                  <div className={`border-2 p-4 text-center transition-colors ${
                    listType === t
                      ? "border-shoe-accent bg-shoe-bg-deep"
                      : "border-shoe-border hover:border-shoe-cream"
                  }`}>
                    <p className="font-bold text-shoe-cream text-sm tracking-widest">{t}</p>
                    <p className="text-xs text-shoe-cream-dim mt-1">
                      {t === "SALE"  ? "Set an asking price"
                      : t === "TRADE" ? "Swap for another shoe"
                      :                 "Give away, earn credits"}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Step 3: Condition */}
          <div className="card-shoe">
            <p className="label-shoe mb-4">CONDITION</p>
            <div className="grid grid-cols-2 gap-3">
              {CONDITIONS.map((c) => (
                <label key={c.key} className="cursor-pointer">
                  <input
                    type="radio"
                    name="condition"
                    value={c.key}
                    required
                    className="sr-only"
                    onChange={() => setCondition(c.key)}
                  />
                  <div className={`border-2 p-4 transition-colors ${
                    condition === c.key
                      ? `${CONDITION_COLOR[c.key]} bg-shoe-bg-deep`
                      : "border-shoe-border hover:border-shoe-cream"
                  }`}>
                    <div className="flex items-center justify-between mb-1">
                      <p className={`font-bold text-sm ${
                        condition === c.key ? CONDITION_COLOR[c.key].split(" ")[1] : "text-shoe-cream"
                      }`}>{c.label}</p>
                      <span className="text-xs text-shoe-cream-dim">{c.credits} cr</span>
                    </div>
                    <p className="text-xs text-shoe-cream-dim">{c.desc}</p>
                  </div>
                </label>
              ))}
            </div>
            {creditsEarned !== null && (
              <div className="mt-3 border border-shoe-tier-new p-3">
                <p className="text-shoe-tier-new text-sm font-bold">
                  You&apos;ll earn {creditsEarned} credit{creditsEarned !== 1 ? "s" : ""} when this is claimed.
                </p>
              </div>
            )}
          </div>

          {/* Step 4: Details */}
          <div className="card-shoe space-y-4">
            <p className="label-shoe">SHOE DETAILS</p>

            <div>
              <label className="label-shoe mb-2 block">TITLE *</label>
              <input
                name="title"
                required
                className="input-shoe"
                placeholder="e.g. Nike Air Max Toddler Sneakers"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label-shoe mb-2 block">BRAND</label>
                <input
                  name="brand"
                  className="input-shoe"
                  placeholder="Nike, Adidas, New Balance…"
                />
              </div>
              <div>
                <label className="label-shoe mb-2 block">SIZE *</label>
                <select name="size" required className="select-shoe">
                  <option value="">Select size…</option>
                  {SIZES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            {listType === "SALE" && (
              <div>
                <label className="label-shoe mb-2 block">ASKING PRICE ($) *</label>
                <input
                  name="askingPrice"
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  className="input-shoe"
                  placeholder="0.00"
                />
              </div>
            )}

            <div>
              <label className="label-shoe mb-2 block">DESCRIPTION</label>
              <textarea
                name="description"
                rows={3}
                className="input-shoe resize-none"
                placeholder="Any extra details — color, style, condition notes…"
              />
            </div>
          </div>

          <button type="submit" className="btn-shoe-primary w-full py-4 text-base">
            POST LISTING
          </button>
        </form>
      </main>
    </div>
  );
}
