import { Resend } from "resend";

let _resend: Resend | null = null;
function getResend() {
  if (!process.env.RESEND_API_KEY) throw new Error("RESEND_API_KEY is not set");
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY);
  return _resend;
}

const FROM = "Beef <noreply@startbeef.com>";
const BASE_URL = process.env.NEXTAUTH_URL || "https://startbeef.com";

// ── Password Reset ────────────────────────────────────────────────────────────

export async function sendPasswordResetEmail(to: string, token: string) {
  const url = `${BASE_URL}/auth/reset-password?token=${token}`;
  await getResend().emails.send({
    from: FROM,
    to,
    subject: "Reset your Beef password",
    html: emailShell(
      "Reset your password",
      `<p>Someone requested a password reset for your Beef account. If that was you, click below.</p>
       <p>This link expires in 1 hour.</p>
       ${bigButton(url, "RESET PASSWORD")}
       <p style="color:#A89885;font-size:12px;">If you didn't request this, ignore this email — your password won't change.</p>`
    ),
  });
}

// ── User Transactional ────────────────────────────────────────────────────────

export async function sendBeefAcceptedEmail(
  to: string,
  beefId: string,
  claim: string,
  responderName: string
) {
  const url = `${BASE_URL}/beef/${beefId}`;
  await getResend().emails.send({
    from: FROM,
    to,
    subject: "Your Beef was accepted — it's ON",
    html: emailShell(
      "YOUR BEEF WAS ACCEPTED",
      `<p><strong>${responderName}</strong> just stepped into the arena.</p>
       <p style="border-left:3px solid #D4A574;padding-left:12px;color:#A89885;">"${truncate(claim, 160)}"</p>
       <p>The clock is running. Make your case — the judge is watching.</p>
       ${bigButton(url, "ENTER THE ARENA")}`
    ),
  });
}

export async function sendBeefJudgedEmail(
  to: string,
  beefId: string,
  claim: string,
  won: boolean,
  payout: number
) {
  const url = `${BASE_URL}/beef/${beefId}`;
  const subject = won ? `You won $${payout.toFixed(2)} — the judge has spoken` : "The judge has ruled — better luck next time";
  await getResend().emails.send({
    from: FROM,
    to,
    subject,
    html: emailShell(
      won ? "⚖ JUDGMENT: YOU WIN" : "⚖ JUDGMENT: YOU LOSE",
      `<p style="border-left:3px solid #D4A574;padding-left:12px;color:#A89885;">"${truncate(claim, 160)}"</p>
       ${won
         ? `<p>The judge ruled in your favour. <strong style="color:#D4A574;">$${payout.toFixed(2)}</strong> has been added to your Bank.</p>`
         : `<p>The judge didn't see it your way this time. Study the decision and come back swinging.</p>`
       }
       ${bigButton(url, "SEE THE VERDICT")}`
    ),
  });
}

// ── Admin Notifications ───────────────────────────────────────────────────────

export async function sendAdminNewBeefEmail(beefId: string, claim: string, challengerName: string) {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) return;
  const url = `${BASE_URL}/beef/${beefId}`;
  await getResend().emails.send({
    from: FROM,
    to: adminEmail,
    subject: `New Beef posted by ${challengerName}`,
    html: emailShell(
      "NEW BEEF POSTED",
      `<p><strong>${challengerName}</strong> just posted a new beef.</p>
       <p style="border-left:3px solid #D4A574;padding-left:12px;color:#A89885;">"${truncate(claim, 160)}"</p>
       ${bigButton(url, "VIEW BEEF")}`
    ),
  });
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function truncate(s: string, n: number) {
  return s.length > n ? s.slice(0, n) + "…" : s;
}

function bigButton(url: string, label: string) {
  return `<p style="text-align:center;margin:32px 0;">
    <a href="${url}" style="background:#FF6B47;color:#fff;font-weight:700;font-family:monospace;letter-spacing:0.1em;padding:14px 32px;text-decoration:none;display:inline-block;">${label}</a>
  </p>`;
}

function emailShell(heading: string, body: string) {
  return `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#130E09;font-family:system-ui,sans-serif;color:#F5F1ED;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#130E09;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#2E231A;border:1px solid #3A2F28;max-width:600px;width:100%;">
        <tr><td style="padding:24px 32px;border-bottom:1px solid #3A2F28;">
          <span style="font-size:28px;font-weight:900;letter-spacing:-0.04em;color:#F5F1ED;">BEEF</span>
          <span style="font-size:10px;font-weight:700;letter-spacing:0.15em;color:#A89885;margin-left:12px;">TALK SHIT, MAKE MONEY</span>
        </td></tr>
        <tr><td style="padding:32px;">
          <p style="font-size:11px;font-weight:700;letter-spacing:0.15em;color:#D4A574;margin:0 0 16px;">${heading}</p>
          ${body}
        </td></tr>
        <tr><td style="padding:16px 32px;border-top:1px solid #3A2F28;">
          <p style="font-size:11px;color:#A89885;margin:0;">© 2026 BEEF. TALK SHIT, MAKE MONEY. — <a href="${BASE_URL}" style="color:#D4A574;text-decoration:none;">startbeef.com</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}
