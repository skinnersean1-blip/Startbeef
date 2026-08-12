import Link from "next/link";

export const metadata = { title: "How It Works — BEEF" };

function Step({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <div className="flex gap-5">
      <div className="shrink-0 w-10 h-10 border border-beef-gold/40 flex items-center justify-center">
        <span className="text-beef-gold font-bold text-sm">{n}</span>
      </div>
      <div className="pt-1.5">
        <p className="font-bold text-sm tracking-widest mb-1">{title}</p>
        <p className="text-beef-text-muted text-sm leading-relaxed">{body}</p>
      </div>
    </div>
  );
}

function FAQ({ q, a }: { q: string; a: string }) {
  return (
    <div className="border-t border-beef-border/40 py-5">
      <p className="font-bold text-sm mb-2">{q}</p>
      <p className="text-beef-text-muted text-sm leading-relaxed">{a}</p>
    </div>
  );
}

export default function AboutPage() {
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
        <div className="max-w-2xl mx-auto">

          <div className="mb-12">
            <p className="text-beef-gold text-xs tracking-widest mb-3">HOW IT WORKS</p>
            <h2 className="text-4xl font-bold tracking-tighter leading-tight mb-4">
              Talk shit.<br />Back it up.<br />Get paid.
            </h2>
            <p className="text-beef-text-muted text-base leading-relaxed max-w-lg">
              Beef is a paid debate platform. You stake real money on your opinion. Someone challenges you — or you challenge them. An AI panel judges who made the better argument. The winner takes the pot.
            </p>
          </div>

          <div className="card-beef mb-8">
            <p className="section-label mb-6">THE FLOW</p>
            <div className="flex flex-col gap-6">
              <Step n="01" title="STATE YOUR CLAIM" body="Start a Beef by writing your take and setting your stake — anywhere from $5 to $500. Your claim goes live as an open challenge." />
              <Step n="02" title="SOMEONE ACCEPTS" body="Any signed-in user can accept your challenge by matching your stake. The pot doubles. The debate clock starts." />
              <Step n="03" title="MAKE YOUR CASE" body="Both sides exchange arguments in a structured thread. This is your chance to back up what you said. Say it clearly. Say it well." />
              <Step n="04" title="THE AI PANEL JUDGES" body="When time runs out, a randomised panel of AI judges independently evaluates both sides — on logic, evidence, and persuasiveness. No favourites. No politics. Just the argument." />
              <Step n="05" title="WINNER TAKES THE POT" body="The panel's verdict is final. The winner receives the full pot minus a small platform fee. Funds hit your Beef balance instantly." />
            </div>
          </div>

          <div className="card-beef mb-8">
            <p className="section-label mb-4">THE AI JUDGMENT PANEL</p>
            <p className="text-beef-text-muted text-sm leading-relaxed mb-4">
              Every completed Beef is evaluated by an independently randomised AI judge — drawn from a rotating roster of large language models. The judge has no knowledge of who either participant is, only the arguments they made.
            </p>
            <p className="text-beef-text-muted text-sm leading-relaxed mb-4">Judges assess each argument on three dimensions:</p>
            <div className="flex flex-col gap-3">
              {[
                ["LOGIC", "Is the argument internally consistent? Does it follow from the claim?"],
                ["EVIDENCE", "Are claims supported? Are examples relevant and accurate?"],
                ["PERSUASIVENESS", "Would a neutral third party be moved by this argument?"],
              ].map(([label, desc]) => (
                <div key={label} className="flex gap-3">
                  <span className="text-beef-gold font-bold text-xs tracking-widest shrink-0 pt-0.5 w-28">{label}</span>
                  <span className="text-beef-text-muted text-sm leading-relaxed">{desc}</span>
                </div>
              ))}
            </div>
            <p className="text-beef-text-muted text-xs mt-5 border-t border-beef-border/40 pt-4">
              The panel is randomised to prevent any single model&apos;s biases from dominating outcomes. No human is involved in the judging process.
            </p>
          </div>

          <div className="card-beef mb-12">
            <p className="section-label mb-4">THE MONEY</p>
            <div className="flex flex-col gap-4">
              {[
                ["YOUR STAKE", "The ante you set when you start a Beef. Your opponent must match it exactly."],
                ["THE POT", "Challenger stake + responder stake. Shown live on every Beef tile."],
                ["PLATFORM FEE", "A small percentage of the pot is retained by Beef to keep the lights on. Shown before you commit."],
                ["YOUR PAYOUT", "The full pot minus the platform fee goes to the winner's Beef balance immediately after judgment."],
                ["WITHDRAWALS", "Cash out your balance to your linked account from the bank page at any time."],
              ].map(([label, desc]) => (
                <div key={label} className="flex gap-3">
                  <span className="text-beef-gold font-bold text-xs tracking-widest shrink-0 pt-0.5 w-32">{label}</span>
                  <span className="text-beef-text-muted text-sm leading-relaxed">{desc}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mb-12">
            <p className="section-label mb-2">COMMON QUESTIONS</p>
            <FAQ q="Can I stay anonymous?" a="Yes. When you sign up, you can choose an anonymous handle. Your real identity is never shown on the platform. You can also set individual Beefs to anonymous mode." />
            <FAQ q="What happens if no one accepts my challenge?" a="Your challenge stays open until someone accepts or you cancel it. Your stake is only locked once both sides are in." />
            <FAQ q="Can I raise the stakes mid-debate?" a="Yes. Either participant can propose a raise during a live Beef. Both sides must agree for the new stake to take effect." />
            <FAQ q="What if the debate ends in a draw?" a="In the rare event the AI panel cannot determine a clear winner, both sides are refunded their full stake." />
            <FAQ q="Who can see my Beef?" a="All Beefs are public by default. The argument thread is visible to any visitor. Only the participants can post to it." />
            <FAQ q="Is there a minimum stake?" a="The minimum stake is $5. The maximum is $500 per side per Beef, keeping things competitive without being reckless." />
          </div>

          <div className="flex gap-4 items-center">
            <Link href="/beef/new"><button className="btn-primary px-8 py-3">START A BEEF</button></Link>
            <Link href="/" className="text-beef-text-muted text-xs tracking-widest hover:text-beef-gold transition-colors">BROWSE OPEN CHALLENGES →</Link>
          </div>

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
