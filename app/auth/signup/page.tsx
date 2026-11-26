"use client";

import { useState, useRef, useEffect, type FormEvent, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { BackButton } from "@/components/BackButton";
import { Turnstile } from "@marsidev/react-turnstile";

function SignUpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState({
    email: "",
    username: "",
    handle: "",
    password: "",
    confirmPassword: "",
    dateOfBirth: "",
  });
  const [invitationCode, setInvitationCode] = useState("");
  const [inviteValidated, setInviteValidated] = useState(false);
  const [invitedBy, setInvitedBy] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // Check for invite code in URL on mount
  useEffect(() => {
    const code = searchParams.get("invite");
    if (code) {
      setInvitationCode(code);
      validateInviteCode(code);
    }
  }, [searchParams]);

  const validateInviteCode = async (code: string) => {
    if (!code) return;

    try {
      const res = await fetch("/api/invitations/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      const data = await res.json();
      if (data.valid) {
        setInviteValidated(true);
        setInvitedBy(data.invitedBy);
        setError("");
      } else {
        setInviteValidated(false);
        setError(data.error || "Invalid invitation code");
      }
    } catch (err) {
      setInviteValidated(false);
      setError("Failed to validate invitation code");
    }
  };

  const set = (k: keyof typeof formData, v: string) =>
    setFormData((prev) => ({ ...prev, [k]: v }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate invitation code
    if (!invitationCode) {
      setError("Invitation code is required. StartBeef is currently invite-only.");
      return;
    }

    if (!inviteValidated) {
      setError("Please enter a valid invitation code");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    if (!agreedToTerms) {
      setError("You must agree to the Terms of Service and Privacy Policy");
      return;
    }

    setLoading(true);

    // TODO: Add Stripe $0.01 payment flow here
    // For now, proceeding without payment - will add in next iteration

    const body: Record<string, unknown> = {
      email:          formData.email,
      username:       formData.username,
      handle:         formData.handle,
      password:       formData.password,
      dateOfBirth:    formData.dateOfBirth,
      isAnonymous:    false, // All users have handles, choose anonymity per-beef
      turnstileToken,
      invitationCode: invitationCode.toUpperCase().trim(),
    };

    const res = await fetch("/api/auth/register", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(body),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Something went wrong");
      setLoading(false);
      return;
    }

    const signInResult = await signIn("credentials", {
      identifier: formData.email,
      password:   formData.password,
      redirect:   false,
    });

    if (signInResult?.error) {
      setError("Account created but sign in failed. Please try signing in.");
      setLoading(false);
      return;
    }

    router.push("/auth/notifications");
    router.refresh();
  };

  // ── Registration form ───────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold mb-2">BEEF</h1>
          <p className="section-label">CREATE YOUR ACCOUNT</p>
          <p className="text-xs text-beef-text-muted mt-2">
            Choose anonymity per-debate after signup
          </p>
        </div>

        <div className="card-beef">
          <h2 className="text-xl font-bold mb-6">Join StartBeef</h2>

          {error && (
            <div className="bg-red-900/20 border border-red-500 text-red-500 px-4 py-3 rounded-lg mb-6 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Invitation Code - REQUIRED */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Invitation Code <span className="text-beef-orange">*</span>
              </label>
              <input
                type="text"
                required
                value={invitationCode}
                onChange={(e) => {
                  const code = e.target.value.toUpperCase();
                  setInvitationCode(code);
                  if (code.length >= 13) {
                    validateInviteCode(code);
                  } else {
                    setInviteValidated(false);
                    setInvitedBy("");
                  }
                }}
                className={`w-full px-4 py-3 bg-beef-bg-light border rounded-lg focus:outline-none transition-colors font-mono ${
                  inviteValidated
                    ? "border-green-500 focus:border-green-500"
                    : invitationCode.length > 0
                    ? "border-red-500 focus:border-red-500"
                    : "border-beef-border focus:border-beef-gold"
                }`}
                placeholder="BEEF-XXXX-XXXX"
                maxLength={13}
              />
              {inviteValidated && invitedBy && (
                <p className="text-xs text-green-400 mt-2">
                  ✓ Valid! Invited by <span className="font-bold">{invitedBy}</span>
                </p>
              )}
              {!inviteValidated && invitationCode.length >= 13 && (
                <p className="text-xs text-red-400 mt-2">
                  Invalid or expired invitation code
                </p>
              )}
              <p className="text-xs text-beef-text-muted mt-2">
                StartBeef is currently invite-only. Don't have a code?{" "}
                <a href="mailto:hello@startbeef.com" className="text-beef-gold hover:underline">
                  Contact us
                </a>
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Username</label>
              <input
                type="text"
                required
                value={formData.username}
                onChange={(e) => set("username", e.target.value)}
                className="w-full px-4 py-3 bg-beef-bg-light border border-beef-border rounded-lg focus:outline-none focus:border-beef-gold transition-colors"
                placeholder="username"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Handle <span className="text-beef-text-muted text-xs">(Your @handle)</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-3 text-beef-gold">@</span>
                <input
                  type="text"
                  required
                  value={formData.handle}
                  onChange={(e) => set("handle", e.target.value)}
                  className="w-full pl-8 pr-4 py-3 bg-beef-bg-light border border-beef-border rounded-lg focus:outline-none focus:border-beef-gold transition-colors"
                  placeholder="yourhandle"
                />
              </div>
              <p className="text-xs text-beef-text-muted mt-2">
                You can choose to post anonymously on individual debates
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Email{" "}
                <span className="text-beef-text-muted text-xs">(private — for account recovery only)</span>
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => set("email", e.target.value)}
                className="w-full px-4 py-3 bg-beef-bg-light border border-beef-border rounded-lg focus:outline-none focus:border-beef-gold transition-colors"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Date of Birth{" "}
                <span className="text-beef-text-muted text-xs">(must be 18+)</span>
              </label>
              <input
                type="date"
                required
                value={formData.dateOfBirth}
                onChange={(e) => set("dateOfBirth", e.target.value)}
                max={new Date(Date.now() - 18 * 365.25 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]}
                className="w-full px-4 py-3 bg-beef-bg-light border border-beef-border rounded-lg focus:outline-none focus:border-beef-gold transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Password</label>
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => set("password", e.target.value)}
                className="w-full px-4 py-3 bg-beef-bg-light border border-beef-border rounded-lg focus:outline-none focus:border-beef-gold transition-colors"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Confirm Password</label>
              <input
                type="password"
                required
                value={formData.confirmPassword}
                onChange={(e) => set("confirmPassword", e.target.value)}
                className="w-full px-4 py-3 bg-beef-bg-light border border-beef-border rounded-lg focus:outline-none focus:border-beef-gold transition-colors"
                placeholder="••••••••"
              />
            </div>

            {process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && (
              <Turnstile
                siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
                onSuccess={(token) => setTurnstileToken(token)}
                options={{ theme: "dark" }}
              />
            )}

            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-beef-gold flex-shrink-0 cursor-pointer"
              />
              <span className="text-xs text-beef-text-muted leading-relaxed">
                I am at least 18 years old and I agree to the{" "}
                <Link href="/terms" target="_blank" className="text-beef-gold underline hover:text-beef-gold/80">
                  Terms of Service
                </Link>
                {" "}and{" "}
                <Link href="/privacy" target="_blank" className="text-beef-gold underline hover:text-beef-gold/80">
                  Privacy Policy
                </Link>
                . I understand that this is a skill-based debate platform and all staked debates are final and subject to AI judgment.
              </span>
            </label>

            <button
              type="submit"
              disabled={loading || !agreedToTerms}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Creating Account..." : "Create Account"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-beef-text-muted text-sm">
              Already have an account?{" "}
              <Link href="/auth/signin" className="text-beef-gold hover:text-beef-gold-light transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SignUpPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl font-bold mb-2">BEEF</div>
          <div className="text-beef-text-muted">Loading...</div>
        </div>
      </div>
    }>
      <SignUpForm />
    </Suspense>
  );
}
