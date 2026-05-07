import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="container-beef py-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="section-label mb-2">PAID DISSENT PLATFORM</p>
            <h1 className="text-6xl font-bold tracking-tighter">BEEF</h1>
          </div>
          <div className="flex gap-4">
            <button className="btn-primary">START A BEEF</button>
            <button className="btn-secondary">WATCH THE ARENA</button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container-beef py-16">
        <div className="max-w-4xl">
          <h2 className="text-5xl font-bold mb-6 leading-tight">
            PUT MONEY WHERE YOUR MOUTH IS.
          </h2>
          <p className="text-xl text-muted max-w-2xl">
            No endless reply chains. Post a claim, price the conviction, and let the
            internet watch it burn in a controlled arena.
          </p>
        </div>
      </section>

      {/* Browse & Sort */}
      <section className="container-beef py-8">
        <div className="space-y-6">
          {/* Browse Categories */}
          <div>
            <p className="section-label mb-4">BROWSE</p>
            <div className="flex flex-wrap gap-3">
              {["TRENDING", "POLITICS", "CULTURE", "SPORTS", "TECH", "CALLOUTS"].map((cat) => (
                <button
                  key={cat}
                  className="px-6 py-2 border border-beef-border rounded-full hover:border-beef-gold hover:text-beef-gold transition-colors"
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Sort Options */}
          <div>
            <p className="section-label mb-4">SORT</p>
            <div className="flex flex-wrap gap-3">
              {["HOT POT", "MOST ACTIVE", "ENDING SOON", "NEW CHALLENGES"].map((sort) => (
                <button
                  key={sort}
                  className="px-6 py-2 border border-beef-border rounded-full hover:border-beef-gold hover:text-beef-gold transition-colors"
                >
                  {sort}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Dashboard */}
      <section className="container-beef py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="card-beef">
            <p className="section-label mb-2">TONIGHT'S LIVE POT</p>
            <p className="text-4xl font-bold">$12,480</p>
          </div>
          <div className="card-beef">
            <p className="section-label mb-2">OPEN CHALLENGES</p>
            <p className="text-4xl font-bold">38</p>
          </div>
          <div className="card-beef">
            <p className="section-label mb-2">SIDELINE SPECTATORS</p>
            <p className="text-4xl font-bold">9,204</p>
          </div>
          <div className="card-beef">
            <p className="section-label mb-2">JUDGED IN 24H</p>
            <p className="text-4xl font-bold">96%</p>
          </div>
        </div>
      </section>

      {/* How Beef Actually Runs */}
      <section className="container-beef py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Product Flow */}
          <div className="lg:col-span-1">
            <p className="section-label mb-4">PRODUCT FLOW</p>
            <h3 className="text-3xl font-bold mb-8">HOW BEEF ACTUALLY RUNS</h3>

            <div className="space-y-6">
              {[
                {
                  stage: "01",
                  title: "ENTER ARENA",
                  desc: "Browse first, verify only when money or official challenges are involved."
                },
                {
                  stage: "02",
                  title: "POST A CLAIM",
                  desc: "The challenger writes the claim, chooses debate type, and prices their conviction."
                },
                {
                  stage: "03",
                  title: "MATCH THE BEEF",
                  desc: "Another user accepts, matches the ante, and locks the 24-hour clock."
                },
                {
                  stage: "04",
                  title: "DEBATE LIVE",
                  desc: "Both sides post rounds, receipts, and final statements inside a strict 24-hour structure."
                },
                {
                  stage: "05",
                  title: "JUDGE THE MATCH",
                  desc: "A published rubric and judge system score the case once the clock expires or someone concedes."
                },
                {
                  stage: "06",
                  title: "APPEAL ONCE",
                  desc: "A single appeal route exists so the platform feels firm but not arbitrary."
                },
                {
                  stage: "07",
                  title: "PAY, SHARE, REPEAT",
                  desc: "The winner gets paid, the card is settled, and the debate becomes part of the record."
                }
              ].map((item) => (
                <div key={item.stage} className="card-beef border-l-4 border-l-beef-gold">
                  <p className="text-beef-gold text-sm font-bold mb-2">STAGE {item.stage}</p>
                  <h4 className="text-xl font-bold mb-2">{item.title}</h4>
                  <p className="text-muted text-sm">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Enter Arena */}
          <div className="lg:col-span-1">
            <p className="section-label mb-4">ACTIVE STAGE</p>
            <h3 className="text-3xl font-bold mb-8">ENTER ARENA</h3>

            <div className="space-y-6">
              <div className="card-beef">
                <p className="section-label mb-3">USER EXPERIENCE</p>
                <p className="text-muted">
                  A new user lands in the arena, watches live Beefs, reads receipts, and builds
                  trust before ever touching money. The first moment of friction is when they try
                  to challenge, accept, or place a spectator sidecard.
                </p>
              </div>

              <div className="card-beef">
                <p className="section-label mb-3">PRIMARY ACTIONS</p>
                <div className="space-y-2 mt-4">
                  {["BROWSE BEEFS", "FOLLOW DEBATERS", "VERIFY WALLET", "SET REGION"].map((action) => (
                    <div key={action} className="px-4 py-2 bg-beef-bg-light rounded-lg border border-beef-border">
                      {action}
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="card-beef">
                  <p className="section-label mb-2 text-xs">SYSTEM CHECKS</p>
                  <h4 className="text-sm font-bold mb-2">IDENTITY GATE</h4>
                  <p className="text-xs text-muted">Only money-moving actions trigger KYC, age, and region checks so the browse experience still feels internet-native.</p>
                </div>
                <div className="card-beef">
                  <p className="section-label mb-2 text-xs">SPECTATOR LAYER</p>
                  <h4 className="text-sm font-bold mb-2">FREE WATCH LAYER</h4>
                  <p className="text-xs text-muted">Anonymous or logged-out users can still watch live cards, outcomes, and outcomes.</p>
                </div>
                <div className="card-beef">
                  <p className="section-label mb-2 text-xs">PAYOUT STATE</p>
                  <h4 className="text-sm font-bold mb-2">NO FUNDS HELD</h4>
                  <p className="text-xs text-muted">At this stage the platform is only gathering identity and eligibility, not taking custody.</p>
                </div>
              </div>
            </div>
          </div>

          {/* What Must Be True */}
          <div className="lg:col-span-1">
            <p className="section-label mb-4">OPS RAIL</p>
            <h3 className="text-3xl font-bold mb-8">WHAT MUST BE TRUE</h3>

            <div className="space-y-6">
              <div className="card-beef">
                <p className="section-label mb-3">IDENTITY</p>
                <p className="text-muted text-sm">
                  Users can browse freely, but money-moving actions require verified payment
                  identity and region controls.
                </p>
              </div>

              <div className="card-beef">
                <p className="section-label mb-3">MODERATION</p>
                <p className="text-muted text-sm">
                  Risky claims need category gating, claim framing rules, and escalation hooks
                  before a match goes live.
                </p>
              </div>

              <div className="card-beef">
                <p className="section-label mb-3">JUDGING</p>
                <p className="text-muted text-sm">
                  Every resolved Beef needs a visible rubric, source record, decision trace, and
                  one-appeal ceiling.
                </p>
              </div>

              <div className="card-beef">
                <p className="section-label mb-3">SEPARATION</p>
                <p className="text-muted text-sm">
                  The debate pot, spectator sidecards, and crowd reactions must be distinct
                  products in both UX and accounting.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Product Positioning */}
      <section className="container-beef py-16">
        <div className="card-beef max-w-4xl">
          <p className="section-label mb-4">PRODUCT POSITIONING</p>
          <h2 className="text-4xl font-bold mb-6">
            INTERNET DISSENT, BUT WITH SKIN IN THE GAME.
          </h2>
          <p className="text-xl text-muted">
            Beef turns performative posting into a structured contest. Conviction has a price, the
            arena has rules, and the crowd fuels the spectacle without owning the result.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="container-beef py-12 border-t border-beef-border mt-20">
        <div className="flex justify-between items-center">
          <p className="text-muted text-sm">© 2026 Beef. Put money where your mouth is.</p>
          <div className="flex gap-6 text-sm">
            <Link href="/about" className="text-muted hover:text-beef-gold transition-colors">About</Link>
            <Link href="/rules" className="text-muted hover:text-beef-gold transition-colors">Rules</Link>
            <Link href="/privacy" className="text-muted hover:text-beef-gold transition-colors">Privacy</Link>
            <Link href="/terms" className="text-muted hover:text-beef-gold transition-colors">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
