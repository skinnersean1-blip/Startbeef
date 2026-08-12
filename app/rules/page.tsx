import Link from "next/link";

export const metadata = {
  title: "The Rules — BEEF",
  description: "How to conduct yourself on Beef. What's in, what's out, and what gets you removed.",
};

function Rule({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-beef-border/40 py-6">
      <div className="flex gap-4">
        <span className="text-beef-gold font-bold text-xs tracking-widest shrink-0 pt-0.5 w-6">{n}</span>
        <div>
          <p className="font-bold text-sm tracking-widest mb-2">{title}</p>
          <div className="text-beef-text-muted text-sm leading-relaxed">{children}</div>
        </div>
      </div>
    </div>
  );
}

export default function RulesPage() {
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

          <div className="mb-10">
            <p className="text-beef-gold text-xs tracking-widest mb-3">THE RULEBOOK</p>
            <h2 className="text-4xl font-bold tracking-tighter leading-tight mb-4">THE RULES</h2>
            <p className="text-beef-text-muted text-sm leading-relaxed">
              Beef runs on strong opinions and real stakes. These rules exist to keep it fair, keep it honest, and keep it worth showing up to.
            </p>
          </div>

          {/* The spirit */}
          <div className="card-beef border-beef-gold/30 mb-8">
            <p className="section-label mb-3">THE SPIRIT OF BEEF</p>
            <p className="text-beef-text-muted text-sm leading-relaxed">
              A Beef is a public argument with money on the line. You state a claim. Someone disagrees. You both put up stakes. You argue it out in writing. An AI panel decides who made the better case.
            </p>
            <p className="text-beef-text-muted text-sm leading-relaxed mt-3">
              The point is the argument — not the money, not the winning. If you’re here to talk your way out of something you don’t actually believe, this isn’t the place. Say what you mean and mean what you say.
            </p>
          </div>

          {/* The rules */}
          <div className="mb-10">
            <p className="section-label mb-0">THE RULES</p>

            <Rule n="01" title="ARGUE YOUR OWN POSITION">
              <p>You entered this Beef. Argue your corner. Don’t pivot, don’t dodge, don’t reframe your original claim halfway through because you’re losing. The AI judges are reading the whole thread — inconsistency counts against you.</p>
            </Rule>

            <Rule n="02" title="NO AI-WRITTEN ARGUMENTS">
              <p>Your arguments must be your own. Using AI to generate or substantially rewrite your debate messages is prohibited. We built the AI judge — we know what AI writing looks like. Getting caught doing this may result in a forfeit and account review.</p>
            </Rule>

            <Rule n="03" title="ONE ACCOUNT PER PERSON">
              <p>One person, one account. Creating multiple accounts to stack the deck, dodge a ban, or manipulate outcomes will result in all associated accounts being permanently removed and balances forfeited.</p>
            </Rule>

            <Rule n="04" title="NO COLLUSION">
              <p>Don’t arrange outcomes with your opponent in advance. Don’t split pots outside the platform. Don’t throw a debate on purpose. If we detect coordinated manipulation, both accounts will be suspended and the pot will be voided.</p>
            </Rule>

            <Rule n="05" title="KEEP IT ABOVE THE BELT">
              <p>Argue the position, not the person. Personal threats, harassment, doxxing, or content designed to intimidate a specific individual will result in immediate removal. Heated debate is welcome. Targeted abuse is not.</p>
            </Rule>

            <Rule n="06" title="NO HATE">
              <p>Content that dehumanises people based on race, ethnicity, gender, religion, sexual orientation, or disability is not permitted — in claims, arguments, or the Post board. This is a line, not a sliding scale.</p>
            </Rule>

            <Rule n="07" title="REAL MONEY, REAL CLAIMS">
              <p>Stakes are locked in real money. Don’t post a claim you’re not prepared to argue seriously. If your claim is intentionally absurd, unfalsifiable, or designed to make the debate unwinnable for your opponent, expect the AI judge to notice.</p>
            </Rule>

            <Rule n="08" title="THE AI VERDICT IS FINAL">
              <p>You agreed to AI judgment when you entered. The verdict is binding. We don’t accept appeals based on disagreement with the outcome. In the case of a verified technical failure, we may re-run judgment — that’s the only exception.</p>
            </Rule>

            <Rule n="09" title="THE POST BOARD HAS STANDARDS TOO">
              <p>The Post board is for opinions, takes, and conversation — not spam, solicitation, or coordinated flooding. Threads that exist purely to advertise, manipulate, or harass will be removed without notice.</p>
            </Rule>

            <Rule n="10" title="WE RESERVE THE RIGHT TO CALL IT">
              <p>Our team and our systems monitor the platform. If something is clearly wrong — fraud, abuse, a technical failure — we’ll step in. We’ll always err toward fairness, but our decisions on platform integrity are final.</p>
            </Rule>
          </div>

          {/* Consequences */}
          <div className="card-beef border-beef-orange/30 mb-10">
            <p className="section-label mb-3 text-beef-orange">WHAT HAPPENS IF YOU BREAK THEM</p>
            <div className="flex flex-col gap-3">
              {[
                ["WARNING", "For minor or first-time violations where intent is unclear."],
                ["FORFEIT", "The pot is voided and both antes returned, or awarded to your opponent depending on the violation."],
                ["SUSPENSION", "Temporary removal from the platform. Balance held but frozen."],
                ["PERMANENT BAN", "Account deleted. Balance forfeited. No appeal."],
              ].map(([label, desc]) => (
                <div key={label} className="flex gap-3">
                  <span className="text-beef-orange font-bold text-xs tracking-widest shrink-0 pt-0.5 w-32">{label}</span>
                  <span className="text-beef-text-muted text-sm leading-relaxed">{desc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Report */}
          <div className="card-beef mb-10">
            <p className="section-label mb-2">SEE SOMETHING?</p>
            <p className="text-beef-text-muted text-sm leading-relaxed mb-4">
              If you spot a rule violation — collusion, abuse, a fake account — report it. Use The Verdict to flag it or email us directly at <span className="text-beef-gold">rules@startbeef.com</span>. We take every report seriously.
            </p>
            <Link href="/verdict">
              <button className="text-xs font-bold tracking-widest text-beef-gold hover:text-beef-gold/80 border border-beef-gold/40 px-4 py-2 transition-colors">
                GO TO THE VERDICT →
              </button>
            </Link>
          </div>

          <div className="flex gap-4 items-center">
            <Link href="/beef/new">
              <button className="btn-primary px-8 py-3">START A BEEF</button>
            </Link>
            <Link href="/about" className="text-beef-text-muted text-xs tracking-widest hover:text-beef-gold transition-colors">
              HOW IT WORKS →
            </Link>
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
