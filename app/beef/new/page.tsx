"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { BackButton } from "@/components/BackButton";

type Step = 1 | 2 | 3;

const ANTE_MIN = 5;
const ANTE_MAX = 500;
const CLAIM_MAX = 500;

export default function StartBeefPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [step, setStep] = useState<Step>(1);
  const [claim, setClaim] = useState("");
  const [ante, setAnte] = useState<number>(ANTE_MIN);
  const [goAnon, setGoAnon] = useState(false);
  const [bankBalance, setBankBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (session?.user) {
      fetch("/api/bank/balance")
        .then((r) => r.ok ? r.json() : null)
        .then((d) => d && setBankBalance(d.balance))
        .catch(() => {});
    }
  }, [session]);

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
    if (step === 2) return ante >= ANTE_MIN && (bankBalance === null || bankBalance >= ante);
    return true;
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/beef", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ claim, ante, challengerIsAnon: goAnon }),
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

  const stepLabels = ["CLAIM", "ANTE", "CONFIRM"];

  return (
    <div className="min-h-screen">
      <header className="container-beef py-6">
        <div className="flex items-center justify-between">
          <Link href="/">
            <div className="cursor-pointer">
              <p className="section-label mb-2">OPINION MARKET</p>
              <h1 className="text-4xl font-bold tracking-tighter">BEEF</h1>
            </div>
          </Link>
          <p className="text-muted text-sm">@{session.user.handle || session.user.username}</p>
        </div>
      </header>

      {/* Back + Progress */}
      <div className="container-beef pb-8">
        <div className="mb-4">
          <BackButton />
        </div>
        <div className="flex items-center gap-2 mb-2">
          {stepLabels.map((label, i) => (
            <div key={label} className="flex flex-col items-center gap-1 flex-1">
              <div className={`h-1 w-full rounded-full transition-all duration-300 ${i + 1 <= step ? "bg-beef-gold" : "bg-beef-border"}`} />
              <span className={`text-xs font-bold tracking-widest hidden sm:block ${i + 1 === step ? "text-beef-gold" : i + 1 < step ? "text-beef-gold/50" : "text-beef-border"}`}>
                {label}
              </span>
            </div>
          ))}
        </div>
        <p className="section-label mt-2">STEP {step} OF 3</p>
      </div>

      <div className="container-beef pb-20">
        <div className="max-w-2xl mx-auto">

          {/* Step 1: Write the Claim */}
          {step === 1 && (
            <div>
              <p className="section-label mb-4">STEP 01 — WRITE THE CLAIM</p>
              <h2 className="text-3xl sm:text-4xl font-bold mb-8">WHAT&apos;S YOUR BEEF?</h2>
              <div className="card-beef">
                <p className="text-muted text-sm mb-4">
                  Make it specific. Make it debatable. Make it something you&apos;d put money on.
                </p>
                <textarea
                  value={claim}
                  onChange={(e) => setClaim(e.target.value.slice(0, CLAIM_MAX))}
                  rows={5}
                  className="w-full px-4 py-3 bg-beef-bg-light border border-beef-border rounded-lg focus:outline-none focus:border-beef-gold transition-colors resize-none text-lg"
                  placeholder={`e.g. "Kendrick Lamar won the rap beef and it wasn't even close."`}
                  autoFocus
                />
                <div className="flex justify-between items-center mt-3">
                  <p className={`text-sm ${claim.length >= CLAIM_MAX ? "text-beef-orange" : "text-muted"}`}>
                    {claim.length}/{CLAIM_MAX}
                  </p>
                  {claim.trim().length < 10 && claim.length > 0 && (
                    <p className="text-xs text-beef-orange">At least 10 characters</p>
                  )}
                </div>
              </div>

              <div className="mt-6 card-beef bg-beef-bg-light border-beef-gold/30">
                <p className="section-label mb-2">AI WILL AUTO-TAG THIS</p>
                <p className="text-muted text-sm">
                  Once posted, AI reads your claim and assigns it to the relevant categories.
                  It can land in multiple arenas at once.
                </p>
              </div>
            </div>
          )}

          {/* Step 2: Set Ante */}
          {step === 2 && (
            <div>
              <p className="section-label mb-4">STEP 02 — SET YOUR ANTE</p>
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">HOW MUCH IS YOUR CONVICTION WORTH?</h2>
              <p className="text-muted mb-8">
                Your opponent must match this to accept. Winner takes the full pot minus a 1.5% platform fee.
              </p>

              <div className="card-beef mb-6">
                {/* Big dollar display */}
                <div className="text-center mb-8">
                  <p className="text-5xl sm:text-7xl font-bold text-beef-gold">${ante}</p>
                  <p className="text-beef-text-muted text-sm mt-2 tracking-widest">YOUR ANTE</p>
                </div>

                {/* Slider */}
                <div className="px-2">
                  <input
                    type="range"
                    min={ANTE_MIN}
                    max={ANTE_MAX}
                    step={5}
                    value={ante}
                    onChange={(e) => setAnte(Number(e.target.value))}
                    className="w-full accent-beef-gold cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-beef-text-muted mt-1">
                    <span>${ANTE_MIN}</span>
                    <span>${ANTE_MAX}</span>
                  </div>
                </div>

                {/* Quick-pick chips */}
                <div className="flex gap-2 justify-center mt-6 flex-wrap">
                  {[10, 25, 50, 100, 250, 500].map((v) => (
                    <button
                      key={v}
                      onClick={() => setAnte(v)}
                      className={`px-4 py-1.5 rounded-full text-sm font-bold border transition-all duration-150 ${
                        ante === v
                          ? "border-beef-gold text-beef-gold bg-beef-gold/10"
                          : "border-beef-border text-beef-text-muted hover:border-beef-gold/50"
                      }`}
                    >
                      ${v}
                    </button>
                  ))}
                </div>
              </div>

              {/* Pot preview */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4">
                <div className="card-beef text-center">
                  <p className="section-label mb-1">TOTAL POT</p>
                  <p className="text-3xl font-bold text-beef-gold">${ante * 2}</p>
                </div>
                <div className="card-beef text-center">
                  <p className="section-label mb-1">WINNER TAKES</p>
                  <p className="text-3xl font-bold">${(ante * 2 * 0.985).toFixed(2)}</p>
                </div>
              </div>

              {/* Balance warning */}
              {bankBalance !== null && bankBalance < ante && (
                <div className="bg-red-900/20 border border-red-500 text-red-400 px-4 py-3 rounded-lg text-sm">
                  Insufficient balance. You have ${bankBalance.toFixed(2)} in your Bank.{" "}
                  <Link href="/bank" className="underline hover:text-red-300">Deposit funds →</Link>
                </div>
              )}
              {bankBalance !== null && bankBalance >= ante && (
                <p className="text-xs text-beef-text-muted text-center">
                  Bank balance: ${bankBalance.toFixed(2)} · ${ante} will be locked when posted
                </p>
              )}
            </div>
          )}

          {/* Step 3: Confirm */}
          {step === 3 && (
            <div>
              <p className="section-label mb-4">STEP 03 — POST IT</p>
              <h2 className="text-3xl sm:text-4xl font-bold mb-8">YOU SURE ABOUT THIS?</h2>

              <div className="card-beef border-beef-gold mb-6">
                <p className="section-label mb-3">THE CLAIM</p>
                <p className="text-xl font-bold leading-relaxed">&quot;{claim}&quot;</p>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-6">
                <div className="card-beef text-center">
                  <p className="section-label mb-2">YOUR ANTE</p>
                  <p className="text-3xl sm:text-4xl font-bold text-beef-gold">${ante}</p>
                </div>
                <div className="card-beef text-center">
                  <p className="section-label mb-2">POT IF MATCHED</p>
                  <p className="text-3xl sm:text-4xl font-bold">${ante * 2}</p>
                </div>
              </div>

              <div className="card-beef bg-beef-bg-light border-beef-gold/30 mb-6">
                <p className="section-label mb-2">WHAT HAPPENS NEXT</p>
                <p className="text-muted text-sm">
                  Your beef goes live as an open challenge. When someone matches your ${ante},
                  the 24-hour clock starts — free-flowing thread, no rounds,
                  last convincing word wins. AI judges the full thread when time expires.
                  Winner takes <strong className="text-beef-gold">${(ante * 2 * 0.985).toFixed(2)}</strong> after the 1.5% platform fee.
                </p>
              </div>

              {/* Anon toggle — only for handled (non-ghost) users */}
              {!session.user.isAnonymous && session.user.handle && (
                <button
                  type="button"
                  onClick={() => setGoAnon((v) => !v)}
                  className={`w-full flex items-center justify-between px-5 py-4 rounded-lg border-2 transition-all duration-200 mb-6 ${
                    goAnon
                      ? "border-beef-orange bg-beef-orange/10"
                      : "border-beef-border hover:border-beef-border/80"
                  }`}
                >
                  <div className="text-left">
                    <p className="font-bold text-sm">{goAnon ? "👻 POSTING AS GHOST" : "POST UNDER YOUR HANDLE"}</p>
                    <p className="text-xs text-beef-text-muted mt-0.5">
                      {goAnon
                        ? "Your codename will be shown — your identity stays hidden"
                        : "Tap to hide your identity for this beef"}
                    </p>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 ${goAnon ? "bg-beef-orange border-beef-orange" : "border-beef-border"}`} />
                </button>
              )}

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
              {loading && (
                <p className="text-muted text-xs text-center mt-3">AI is tagging your claim...</p>
              )}
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-4 mt-10">
            {step > 1 && (
              <button onClick={() => setStep((s) => (s - 1) as Step)} className="btn-secondary flex-1">
                BACK
              </button>
            )}
            {step < 3 && (
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
