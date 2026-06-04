import Link from "next/link";

export const metadata = {
  title: "Terms of Service — Beef",
  description: "Beef platform terms of service, user agreement, and community rules.",
};

const EFFECTIVE_DATE = "May 24, 2026";

export default function TermsPage() {
  return (
    <div className="min-h-screen">
      <header className="container-beef py-6">
        <div className="flex items-center justify-between">
          <Link href="/">
            <div className="cursor-pointer">
              <p className="section-label mb-1">OPINION MARKET</p>
              <h1 className="text-4xl font-bold tracking-tighter">BEEF</h1>
            </div>
          </Link>
        </div>
      </header>

      <div className="container-beef pb-24">
        <div className="max-w-3xl mx-auto">

          <div className="mb-10">
            <p className="section-label mb-3">LEGAL</p>
            <h2 className="text-4xl font-bold mb-2">TERMS OF SERVICE</h2>
            <p className="text-beef-text-muted text-sm">Effective date: {EFFECTIVE_DATE}</p>
          </div>

          <div className="card-beef bg-beef-bg-light border-beef-orange/50 mb-10">
            <p className="text-beef-orange font-bold text-sm mb-2">IMPORTANT — READ BEFORE USING BEEF</p>
            <p className="text-beef-text-muted text-sm leading-relaxed">
              By creating an account or using this platform you agree to these terms in full.
              If you do not agree, do not use Beef. These terms include a binding arbitration
              clause and a waiver of class action rights (Section 14).
            </p>
          </div>

          <div className="space-y-10 text-beef-text-muted leading-relaxed">

            <Section n="1" title="WHO WE ARE">
              <p>
                Beef (&ldquo;the Platform,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; &ldquo;our&rdquo;) is an opinion-staking platform
                that allows users to post public claims, set a monetary stake, and invite others to argue the opposite
                position. The Platform facilitates debate and determines outcomes via AI-assisted judgment.
              </p>
              <p className="mt-3">
                Beef is not a gambling site, a financial product, a prediction market, or a betting exchange.
                Stakes represent a user&apos;s conviction in a stated opinion. Any resemblance to wagering is
                incidental. You are solely responsible for understanding the legal status of this activity in your jurisdiction.
              </p>
            </Section>

            <Section n="2" title="ELIGIBILITY">
              <ul className="list-disc list-inside space-y-2">
                <li>You must be at least <strong className="text-beef-text">18 years old</strong> to create an account or participate in staked debates.</li>
                <li>You must be a human being. Automated accounts, bots, and AI agents are prohibited from participating in debates or holding balances.</li>
                <li>You must be legally permitted to participate in opinion-staking activities in your jurisdiction. It is your responsibility to determine whether using Beef is lawful where you live.</li>
                <li>You may not use Beef if you have previously been banned or removed from the Platform.</li>
              </ul>
            </Section>

            <Section n="3" title="ACCOUNTS AND IDENTITY">
              <p>
                You may register as a named Fighter (public handle) or as a Ghost (anonymous codename).
                Either way, your account is tied to a verified email address. You are responsible for
                maintaining the confidentiality of your password and for all activity under your account.
              </p>
              <p className="mt-3">
                You agree to provide accurate information during registration. Impersonating another person,
                public figure, or entity is prohibited and may result in immediate termination.
              </p>
              <p className="mt-3">
                Ghost accounts are anonymous to other users but not to Beef. We retain the ability to
                identify account holders for legal compliance, fraud prevention, and safety purposes.
              </p>
            </Section>

            <Section n="4" title="USER CONTENT">
              <p>
                You retain ownership of the claims and messages you post. By posting content on Beef,
                you grant us a worldwide, royalty-free, non-exclusive license to display, distribute,
                and moderate that content in connection with operating the Platform.
              </p>
              <p className="mt-3">
                You are solely responsible for your content. Beef does not endorse, verify, or fact-check
                any claims posted by users. A claim being posted on this Platform does not make it true.
              </p>
              <p className="mt-3 font-medium text-beef-text">You agree not to post content that:</p>
              <ul className="list-disc list-inside space-y-2 mt-2">
                <li>Is unlawful, defamatory, or constitutes harassment or threats toward a specific individual</li>
                <li>Incites violence or promotes hate based on race, ethnicity, gender, religion, sexuality, or disability</li>
                <li>Contains the private personal information of others without their consent (doxxing)</li>
                <li>Infringes the intellectual property rights of any third party</li>
                <li>Constitutes spam, coordinated manipulation, or artificial amplification</li>
                <li>Sexually exploits or depicts minors in any form</li>
              </ul>
              <p className="mt-3">
                We reserve the right — but not the obligation — to remove any content that violates these
                terms or that we deem harmful to the Platform or its users, at our sole discretion.
              </p>
            </Section>

            <Section n="5" title="STAKES, BALANCES, AND PAYOUTS">
              <p>
                Monetary stakes are held in your Beef Bank balance. When you post a claim, your stated
                ante is locked until the beef is resolved or cancelled. When a challenger accepts,
                both antes are held in escrow by the Platform until judgment.
              </p>
              <p className="mt-3">
                The winner of a completed beef receives the total pot minus a <strong className="text-beef-text">1.5% platform fee</strong>.
                In the event of a no-contest, system error, or admin cancellation, antes are refunded
                in full to both parties.
              </p>
              <p className="mt-3">
                Deposits are processed via Stripe. Withdrawals are subject to identity verification and
                may take 2–5 business days. We reserve the right to withhold payouts pending fraud review.
                Balances do not earn interest and are not FDIC insured.
              </p>
              <p className="mt-3">
                <strong className="text-beef-text">All monetary transactions are final.</strong> We do not offer
                refunds on platform fees or reverse completed payouts except in cases of verified
                technical error on our part.
              </p>
            </Section>

            <Section n="6" title="AI JUDGMENT">
              <p>
                Completed beefs are judged by one or more large language models (&ldquo;AI Judges&rdquo;). The
                AI Judge reviews the full message thread and delivers a verdict based on the quality,
                coherence, and persuasiveness of each participant&apos;s arguments.
              </p>
              <p className="mt-3">
                AI judgment is <strong className="text-beef-text">final and binding</strong>. Beef does not guarantee
                the accuracy, fairness, or consistency of AI judgments. By participating in a staked debate,
                you accept the AI verdict as the conclusive outcome regardless of your personal assessment
                of the result.
              </p>
              <p className="mt-3">
                We do not accept appeals based on disagreement with the AI&apos;s reasoning. In the event of a
                clear technical failure (e.g., the model returned an error or an invalid response), we reserve
                the right to re-run judgment or issue refunds at our discretion.
              </p>
            </Section>

            <Section n="7" title="PROHIBITED CONDUCT">
              <ul className="list-disc list-inside space-y-2">
                <li>Colluding with your opponent to split the pot or throw a debate</li>
                <li>Using AI tools to generate your debate messages (fights must be conducted by humans)</li>
                <li>Creating multiple accounts to circumvent bans or manipulate the platform</li>
                <li>Attempting to reverse-engineer, scrape, or exploit the Platform&apos;s infrastructure</li>
                <li>Using Beef to launder money, commit fraud, or facilitate any illegal financial activity</li>
                <li>Posting claims designed solely to harass, defame, or target a specific private individual</li>
              </ul>
              <p className="mt-3">
                Violations may result in account suspension, balance forfeiture, and referral to law enforcement.
              </p>
            </Section>

            <Section n="8" title="SPECTATORS">
              <p>
                Viewing beefs on Beef does not require an account and is governed by these terms to
                the extent applicable. Spectators who create accounts in order to comment or side-bet
                are subject to all provisions of this agreement.
              </p>
            </Section>

            <Section n="9" title="PRIVACY">
              <p>
                Your email address, payment information, and account activity are collected and stored
                to operate the Platform. We do not sell your personal data to third parties.
                Ghost accounts display a randomized codename publicly; your email and identity are
                not disclosed to other users.
              </p>
              <p className="mt-3">
                We may disclose account information to law enforcement or regulatory authorities
                when required by law or in response to valid legal process.
              </p>
            </Section>

            <Section n="10" title="INTELLECTUAL PROPERTY">
              <p>
                The Beef name, logo, design, and platform software are the property of Beef and its
                operators. You may not copy, reproduce, or create derivative works from any portion
                of the Platform without our written permission.
              </p>
            </Section>

            <Section n="11" title="DISCLAIMER OF WARRANTIES">
              <p>
                THE PLATFORM IS PROVIDED &ldquo;AS IS&rdquo; AND &ldquo;AS AVAILABLE&rdquo; WITHOUT WARRANTIES OF ANY KIND,
                EXPRESS OR IMPLIED. WE DO NOT WARRANT THAT THE PLATFORM WILL BE UNINTERRUPTED,
                ERROR-FREE, OR FREE OF HARMFUL COMPONENTS. YOUR USE OF THE PLATFORM IS AT YOUR OWN RISK.
              </p>
            </Section>

            <Section n="12" title="LIMITATION OF LIABILITY">
              <p>
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, BEEF AND ITS OPERATORS SHALL NOT BE LIABLE
                FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING
                LOSS OF FUNDS, DATA, OR GOODWILL, ARISING FROM YOUR USE OF OR INABILITY TO USE THE PLATFORM.
              </p>
              <p className="mt-3">
                OUR TOTAL LIABILITY TO YOU FOR ANY CLAIM SHALL NOT EXCEED THE GREATER OF (A) THE AMOUNT
                YOU DEPOSITED IN THE THIRTY (30) DAYS PRECEDING THE CLAIM, OR (B) ONE HUNDRED DOLLARS ($100).
              </p>
            </Section>

            <Section n="13" title="INDEMNIFICATION">
              <p>
                You agree to indemnify and hold harmless Beef, its operators, employees, and agents from
                any claims, damages, losses, or expenses (including legal fees) arising from your use of
                the Platform, your content, or your violation of these terms.
              </p>
            </Section>

            <Section n="14" title="ARBITRATION AND CLASS ACTION WAIVER">
              <p>
                <strong className="text-beef-text">Any dispute arising from your use of Beef will be resolved
                through binding individual arbitration, not in court.</strong> You waive any right to
                participate in a class action lawsuit or class-wide arbitration against Beef.
              </p>
              <p className="mt-3">
                Arbitration will be conducted under the rules of the American Arbitration Association (AAA)
                and governed by the laws of the State of Delaware, without regard to conflict of law provisions.
                You may opt out of this clause within 30 days of creating your account by emailing
                legal@startbeef.com with the subject line &ldquo;Arbitration Opt-Out.&rdquo;
              </p>
            </Section>

            <Section n="15" title="TERMINATION">
              <p>
                We may suspend or terminate your account at any time, with or without notice, for
                violations of these terms or for any reason we deem necessary to protect the Platform
                or its users. Upon termination, your balance will be made available for withdrawal
                for 90 days, after which unclaimed funds may be forfeited.
              </p>
            </Section>

            <Section n="16" title="CHANGES TO THESE TERMS">
              <p>
                We may update these terms at any time. We will notify registered users of material changes
                via email. Continued use of the Platform after changes take effect constitutes acceptance
                of the updated terms.
              </p>
            </Section>

            <Section n="17" title="CONTACT">
              <p>
                Questions about these terms can be directed to:{" "}
                <span className="text-beef-gold">legal@startbeef.com</span>
              </p>
            </Section>

          </div>

          <div className="mt-16 card-beef bg-beef-bg-light border-beef-gold/30 text-center">
            <p className="text-beef-text-muted text-xs leading-relaxed">
              This document was drafted as a starting point and has not been reviewed by a licensed attorney.
              Beef strongly recommends obtaining qualified legal counsel before operating a platform that
              handles real monetary transactions. Laws governing opinion markets, financial services, and
              internet platforms vary by jurisdiction.
            </p>
          </div>

          <div className="text-center mt-10">
            <Link href="/" className="text-beef-text-muted text-sm hover:text-beef-gold transition-colors">
              ← BACK
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}

function Section({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="section-label mb-2">{n.padStart(2, "0")} — {title}</p>
      <div className="text-sm leading-relaxed">{children}</div>
    </div>
  );
}
