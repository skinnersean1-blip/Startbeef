"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";

type Step = 1 | 2 | 3 | 4 | 5 | 6;

const CATEGORIES = [
  { id: "POLITICS", label: "POLITICS", desc: "Policy, elections, governance" },
  { id: "CULTURE", label: "CULTURE", desc: "Film, music, society, trends" },
  { id: "SPORTS", label: "SPORTS", desc: "Teams, athletes, performance" },
  { id: "TECH", label: "TECH", desc: "Products, startups, builders" },
  { id: "CALLOUTS", label: "CALLOUTS", desc: "Direct challenges to individuals" },
] as const;

const DEBATE_TYPES = [
  {
    id: "PERSUASION",
    label: "PERSUASION",
    desc: "Best argument wins. Judges score rhetoric, evidence, and delivery.",
    tag: "SUBJECTIVE",
  },
  {
    id: "OBJECTIVE_CLAIM",
    label: "OBJECTIVE CLAIM",
    desc: "Fact-checkable. Winner is determined by what the evidence proves.",
    tag: "VERIFIABLE",
  },
  {
    id: "TASTE_BATTLE",
    label: "TASTE BATTLE",
    desc: "Creative merit. Judges decide on taste, craft, and cultural weight.",
    tag: "AESTHETIC",
  },
] as const;

const ANTE_OPTIONS = [
  { amount: 10, label: "$10", desc: "Entry level" },
  { amount: 25, label: "$25", desc: "Serious" },
  { amount: 50, label: "$50", desc: "High stakes" },
  { amount: 100, label: "$100", desc: "Put up or shut up" },
] as const;

const JUDGE_TYPES = [
  {
    id: "PANEL_OF_3_MODELS",
    label: "PANEL OF 3 MODELS",
    desc: "Three AI judges score each round independently using a published rubric.",
    tag: "FASTEST",
  },
  {
    id: "COMMUNITY",
    label: "COMMUNITY VOTE",
    desc: "Spectators vote after the final round. The crowd decides.",
    tag: "MOST DEMOCRATIC",
  },
  {
    id: "EXPERT",
    label: "EXPERT REVIEW",
    desc: "A verified domain expert reviews and scores the full debate.",
    tag: "HIGHEST LEGITIMACY",
  },
] as const;

const CLAIM_MAX = 500;

export default function StartBeefPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [step, setStep] = useState<Step>(1);
  const [claim, setClaim] = useState("");
  const [category, setCategory] = useState<string>("");
  const [debateType, setDebateType] = useState<string>("");
  const [ante, setAnte] = useState<number>(0);
  const [judgeType, setJudgeType] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-beef-gold text-sm tracking-widest animate-pulse">LOADING...</div>
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="card-beef max-w-md w-full text-center">
          <p className="section-label mb-4">IDENTITY GATE</p>
          <h2 className="text-3xl font-bold mb-4">SIGN IN TO START A BEEF</h2>
          <p className="text-muted mb-8">You need an account to challenge someone. Watching is free.</p>
          <div className="flex flex-col gap-3">
            <Link href="/auth/signin" className="btn-primary text-center">SIGN IN</Link>
            <Link href="/auth/signup" className="btn-secondary text-center">CREATE ACCOUNT</Link>
          </div>
        </div>
      </div>
    );
  }

  const canAdvance = () => {
    if (step === 1) return claim.trim().length >= 10;
    if (step === 2) return !!category;
    if (step === 3) return !!debateType;
    if (step === 4) return ante > 0;
    if (step === 5) return !!judgeType;
    return true;
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/beef", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ claim, category, debateType, ante, judgeType }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong");
        setLoading(false);
        return;
      }

      router.push(`/beef/${data.beef.id}`);
    } catch {
      setError("Something went wrong");
      setLoading(false);
    }
  };

  const stepLabels = ["CLAIM", "CATEGORY", "BATTLE TYPE", "ANTE", "JUDGE", "CONFIRM"];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="container-beef py-6">
        <div className="flex items-center justify-between">
          <Link href="/">
            <div className="cursor-pointer">
              <p className="section-label mb-2">PAID DISSENT PLATFORM</p>
              <h1 className="text-4xl font-bold tracking-tighter">BEEF</h1>
            </div>
          </Link>
          <p className="text-muted text-sm">@{session.user.handle || session.user.username}</p>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="container-beef pb-8">
        <div className="flex items-center gap-2 mb-2">
          {stepLabels.map((label, i) => (
            <div key={label} className="flex items-center gap-2 flex-1">
              <div className="flex flex-col items-center gap-1 flex-1">
                <div
                  className={`h-1 w-full rounded-full transition-all duration-300 ${
                    i + 1 <= step ? "bg-beef-gold" : "bg-beef-border"
                  }`}
                />
                <span
                  className={`text-xs font-bold tracking-widest hidden sm:block ${
                    i + 1 === step ? "text-beef-gold" : i + 1 < step ? "text-beef-gold/50" : "text-beef-border"
                  }`}
                >
                  {label}
                </span>
              </div>
            </div>
          ))}
        </div>
        <p className="section-label mt-2">STEP {step} OF 6</p>
      </div>

      {/* Step Content */}
      <div className="container-beef pb-20">
        <div className="max-w-2xl mx-auto">

          {/* Step 1: Write the Claim */}
          {step === 1 && (
            <div>
              <p className="section-label mb-4">STEP 01 — WRITE THE CLAIM</p>
              <h2 className="text-4xl font-bold mb-8">WHAT'S YOUR BEEF?</h2>
              <div className="card-beef">
                <p className="text-muted text-sm mb-4">
                  Write a clear, debatable claim. Be specific. Vague claims get weak challenges.
                </p>
                <textarea
                  value={claim}
                  onChange={(e) => setClaim(e.target.value.slice(0, CLAIM_MAX))}
                  rows={5}
                  className="w-full px-4 py-3 bg-beef-bg-light border border-beef-border rounded-lg focus:outline-none focus:border-beef-gold transition-colors resize-none text-lg"
                  placeholder="e.g. 'Kendrick Lamar won the rap beef and it wasn't even close.'"
                />
                <div className="flex justify-between items-center mt-3">
                  <p className={`text-sm ${claim.length >= CLAIM_MAX ? "text-beef-orange" : "text-muted"}`}>
                    {claim.length}/{CLAIM_MAX}
                  </p>
                  {claim.trim().length < 10 && claim.length > 0 && (
                    <p className="text-xs text-beef-orange">At least 10 characters required</p>
                  )}
                </div>
              </div>

              <div className="mt-6 card-beef bg-beef-bg-light border-beef-gold/30">
                <p className="section-label mb-2">GOOD CLAIMS</p>
                <ul className="text-muted text-sm space-y-1">
                  <li>• Specific and falsifiable</li>
                  <li>• Something you'd back with money</li>
                  <li>• Clear enough that a judge can score it</li>
                </ul>
              </div>
            </div>
          )}

          {/* Step 2: Category */}
          {step === 2 && (
            <div>
              <p className="section-label mb-4">STEP 02 — PICK YOUR CATEGORY</p>
              <h2 className="text-4xl font-bold mb-8">WHERE DOES THIS BEEF LIVE?</h2>
              <div className="space-y-3">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setCategory(cat.id)}
                    className={`w-full text-left card-beef border-2 transition-all duration-200 ${
                      category === cat.id
                        ? "border-beef-gold bg-beef-bg-light"
                        : "border-beef-border hover:border-beef-gold/50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold text-lg">{cat.label}</p>
                        <p className="text-muted text-sm">{cat.desc}</p>
                      </div>
                      {category === cat.id && (
                        <div className="w-6 h-6 rounded-full bg-beef-gold flex items-center justify-center text-beef-bg text-sm font-bold">✓</div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Debate Type */}
          {step === 3 && (
            <div>
              <p className="section-label mb-4">STEP 03 — CHOOSE BATTLE TYPE</p>
              <h2 className="text-4xl font-bold mb-8">HOW DO YOU WIN?</h2>
              <div className="space-y-4">
                {DEBATE_TYPES.map((dt) => (
                  <button
                    key={dt.id}
                    onClick={() => setDebateType(dt.id)}
                    className={`w-full text-left card-beef border-2 transition-all duration-200 ${
                      debateType === dt.id
                        ? "border-beef-gold bg-beef-bg-light"
                        : "border-beef-border hover:border-beef-gold/50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <p className="font-bold text-lg">{dt.label}</p>
                          <span className="text-xs font-bold tracking-widest text-beef-gold bg-beef-gold/10 px-2 py-1 rounded-full">
                            {dt.tag}
                          </span>
                        </div>
                        <p className="text-muted text-sm">{dt.desc}</p>
                      </div>
                      {debateType === dt.id && (
                        <div className="w-6 h-6 rounded-full bg-beef-gold flex items-center justify-center text-beef-bg text-sm font-bold flex-shrink-0">✓</div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Ante */}
          {step === 4 && (
            <div>
              <p className="section-label mb-4">STEP 04 — SET YOUR ANTE</p>
              <h2 className="text-4xl font-bold mb-4">HOW MUCH IS YOUR CONVICTION WORTH?</h2>
              <p className="text-muted mb-8">
                Your opponent must match this amount to accept. The winner takes the pot.
              </p>
              <div className="grid grid-cols-2 gap-4">
                {ANTE_OPTIONS.map((opt) => (
                  <button
                    key={opt.amount}
                    onClick={() => setAnte(opt.amount)}
                    className={`card-beef border-2 text-center transition-all duration-200 py-8 ${
                      ante === opt.amount
                        ? "border-beef-gold bg-beef-bg-light"
                        : "border-beef-border hover:border-beef-gold/50"
                    }`}
                  >
                    <p className="text-5xl font-bold mb-2">{opt.label}</p>
                    <p className={`text-sm font-bold tracking-widest ${ante === opt.amount ? "text-beef-gold" : "text-muted"}`}>
                      {opt.desc.toUpperCase()}
                    </p>
                  </button>
                ))}
              </div>
              {ante > 0 && (
                <div className="card-beef mt-6 text-center">
                  <p className="section-label mb-1">TOTAL POT IF MATCHED</p>
                  <p className="text-4xl font-bold text-beef-gold">${ante * 2}</p>
                </div>
              )}
            </div>
          )}

          {/* Step 5: Judge Type */}
          {step === 5 && (
            <div>
              <p className="section-label mb-4">STEP 05 — SELECT JUDGE</p>
              <h2 className="text-4xl font-bold mb-8">WHO DECIDES THE WINNER?</h2>
              <div className="space-y-4">
                {JUDGE_TYPES.map((jt) => (
                  <button
                    key={jt.id}
                    onClick={() => setJudgeType(jt.id)}
                    className={`w-full text-left card-beef border-2 transition-all duration-200 ${
                      judgeType === jt.id
                        ? "border-beef-gold bg-beef-bg-light"
                        : "border-beef-border hover:border-beef-gold/50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <p className="font-bold text-lg">{jt.label}</p>
                          <span className="text-xs font-bold tracking-widest text-beef-gold bg-beef-gold/10 px-2 py-1 rounded-full">
                            {jt.tag}
                          </span>
                        </div>
                        <p className="text-muted text-sm">{jt.desc}</p>
                      </div>
                      {judgeType === jt.id && (
                        <div className="w-6 h-6 rounded-full bg-beef-gold flex items-center justify-center text-beef-bg text-sm font-bold flex-shrink-0">✓</div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 6: Confirm */}
          {step === 6 && (
            <div>
              <p className="section-label mb-4">STEP 06 — REVIEW & POST</p>
              <h2 className="text-4xl font-bold mb-8">CONFIRM YOUR BEEF</h2>

              <div className="card-beef border-beef-gold mb-6">
                <p className="section-label mb-3">THE CLAIM</p>
                <p className="text-xl font-bold leading-relaxed">"{claim}"</p>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="card-beef">
                  <p className="section-label mb-2">CATEGORY</p>
                  <p className="font-bold">{category}</p>
                </div>
                <div className="card-beef">
                  <p className="section-label mb-2">BATTLE TYPE</p>
                  <p className="font-bold">{DEBATE_TYPES.find(d => d.id === debateType)?.label}</p>
                </div>
                <div className="card-beef">
                  <p className="section-label mb-2">YOUR ANTE</p>
                  <p className="text-3xl font-bold text-beef-gold">${ante}</p>
                </div>
                <div className="card-beef">
                  <p className="section-label mb-2">JUDGE</p>
                  <p className="font-bold text-sm">{JUDGE_TYPES.find(j => j.id === judgeType)?.label}</p>
                </div>
              </div>

              <div className="card-beef bg-beef-bg-light border-beef-gold/30 mb-6">
                <p className="section-label mb-2">WHAT HAPPENS NEXT</p>
                <p className="text-muted text-sm">
                  Your Beef goes live as an open challenge. Another user must match your ${ante} ante
                  to accept. Once matched, the 24-hour debate clock starts and the pot locks at ${ante * 2}.
                </p>
              </div>

              {error && (
                <div className="bg-red-900/20 border border-red-500 text-red-500 px-4 py-3 rounded-lg mb-6">
                  {error}
                </div>
              )}

              <button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed text-xl py-5"
              >
                {loading ? "POSTING..." : "POST THE BEEF"}
              </button>

              <p className="text-muted text-xs text-center mt-4">
                By posting, you agree to the Beef rules and terms of service.
              </p>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-4 mt-10">
            {step > 1 && (
              <button
                onClick={() => setStep((s) => (s - 1) as Step)}
                className="btn-secondary flex-1"
              >
                BACK
              </button>
            )}
            {step < 6 && (
              <button
                onClick={() => setStep((s) => (s + 1) as Step)}
                disabled={!canAdvance()}
                className="btn-primary flex-1 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                NEXT
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
