import Link from "next/link";
import { AuthHeader } from "@/components/AuthHeader";

export const metadata = {
  title: "Privacy Policy - StartBeef",
  description: "StartBeef Privacy Policy",
};

export default function PrivacyPage() {
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
          <AuthHeader />
        </div>
      </header>

      <div className="container-beef pb-20">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <Link href="/" className="text-beef-gold hover:text-beef-gold-light text-sm">
              ← Back to Home
            </Link>
          </div>

          <div className="card-beef">
            <h1 className="text-4xl font-bold mb-4">Privacy Policy</h1>
            <p className="text-beef-text-muted mb-8">Last Updated: November 25, 2026</p>

            <div className="prose prose-invert max-w-none space-y-8">

              <section>
                <h2 className="text-2xl font-bold mb-3">1. Introduction</h2>
                <p className="text-beef-text-muted leading-relaxed">
                  StartBeef ("we," "us," "our") respects your privacy. This Privacy Policy explains how we collect,
                  use, disclose, and protect your information when you use our Platform.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-3">2. Information We Collect</h2>
                <div className="space-y-3 text-beef-text-muted">
                  <div>
                    <h3 className="text-lg font-bold text-beef-text mb-2">Information You Provide</h3>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Account Information: Email, username, password, date of birth</li>
                      <li>Payment Information: Processed by Stripe (we do not store card numbers)</li>
                      <li>Content: Debate arguments, comments, forum posts</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-beef-text mb-2">Automatically Collected</h3>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Usage Data: Debates participated in, time spent</li>
                      <li>Technical Data: IP address, browser type, device info</li>
                      <li>Cookies: Session and analytics cookies</li>
                    </ul>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-3">3. How We Use Your Information</h2>
                <ul className="list-disc list-inside space-y-2 ml-4 text-beef-text-muted">
                  <li>Operate the Platform (account management, debate processing, payouts)</li>
                  <li>Process Payments via Stripe</li>
                  <li>Prevent Fraud (detect multi-accounting, payment fraud)</li>
                  <li>Improve Services (analytics, bug fixes)</li>
                  <li>Communicate (account notifications, service updates)</li>
                  <li>Comply with Law</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-3">4. How We Share Your Information</h2>
                <div className="space-y-3 text-beef-text-muted">
                  <p><strong className="text-beef-text">Service Providers:</strong></p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Stripe: Payment processing (PCI-compliant)</li>
                    <li>AI Services: Debate judging (anonymized content)</li>
                    <li>Vercel: Hosting</li>
                  </ul>
                  <div className="bg-beef-gold/10 border border-beef-gold/30 px-6 py-4 rounded-lg mt-4">
                    <p className="text-beef-gold font-bold">We do NOT sell your personal data to third parties</p>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-3">5. Data Security</h2>
                <div className="bg-beef-bg-light border border-beef-border px-6 py-4 rounded-lg">
                  <ul className="list-disc list-inside space-y-2 text-beef-text-muted">
                    <li>HTTPS encryption for all data transmission</li>
                    <li>bcrypt password hashing</li>
                    <li>Stripe PCI-DSS compliant payment processing</li>
                    <li>Limited employee access to data</li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-3">6. Your Rights</h2>
                <p className="text-beef-text-muted mb-3">You may have the right to:</p>
                <ul className="list-disc list-inside space-y-1 ml-4 text-beef-text-muted">
                  <li><strong>Access:</strong> Request a copy of your data</li>
                  <li><strong>Correction:</strong> Update inaccurate information</li>
                  <li><strong>Deletion:</strong> Request account and data deletion</li>
                  <li><strong>Portability:</strong> Receive your data in a portable format</li>
                  <li><strong>Opt-Out:</strong> Unsubscribe from marketing emails</li>
                </ul>
                <p className="text-beef-text-muted mt-3">
                  To exercise these rights, contact:{" "}
                  <a href="mailto:privacy@startbeef.com" className="text-beef-gold hover:text-beef-gold-light">
                    privacy@startbeef.com
                  </a>
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-3">7. Children's Privacy</h2>
                <div className="bg-beef-orange/10 border border-beef-orange/30 px-6 py-4 rounded-lg">
                  <p className="text-beef-text font-bold mb-2">StartBeef is NOT intended for users under 18.</p>
                  <p className="text-beef-text-muted text-sm">
                    We do not knowingly collect information from minors. If we discover a user is under 18,
                    we will immediately terminate the account and delete all associated data.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-3">8. Cookies & Tracking</h2>
                <div className="space-y-2 text-beef-text-muted text-sm">
                  <p><strong className="text-beef-text">We use cookies for:</strong></p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Essential functionality (login sessions)</li>
                    <li>Preferences (remember your settings)</li>
                    <li>Analytics (understand usage patterns)</li>
                  </ul>
                  <p className="mt-3">
                    You can control cookies through your browser settings. Disabling cookies may limit Platform functionality.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-3">9. Contact Us</h2>
                <p className="text-beef-text-muted">
                  Questions about this Privacy Policy?<br />
                  <a href="mailto:privacy@startbeef.com" className="text-beef-gold hover:text-beef-gold-light">
                    privacy@startbeef.com
                  </a>
                </p>
              </section>

              <div className="text-center mt-12">
                <Link
                  href="/terms"
                  className="text-beef-gold hover:text-beef-gold-light underline"
                >
                  View Terms of Service →
                </Link>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
