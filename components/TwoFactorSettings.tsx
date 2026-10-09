"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

export function TwoFactorSettings() {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [setupMode, setSetupMode] = useState(false);
  const [qrCode, setQrCode] = useState("");
  const [secret, setSecret] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    checkTwoFactorStatus();
  }, []);

  const checkTwoFactorStatus = async () => {
    try {
      const res = await fetch("/api/user/stats");
      if (res.ok) {
        const data = await res.json();
        // We'll need to add twoFactorEnabled to the stats endpoint
        setEnabled(data.twoFactorEnabled || false);
      }
    } catch (err) {
      console.error("Failed to check 2FA status:", err);
    } finally {
      setLoading(false);
    }
  };

  const startSetup = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/user/2fa/setup", { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to start setup");
        setLoading(false);
        return;
      }

      setQrCode(data.qrCode);
      setSecret(data.secret);
      setSetupMode(true);
    } catch (err) {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const enableTwoFactor = async () => {
    if (!verificationCode) {
      setError("Please enter verification code");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/user/2fa/enable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: verificationCode }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to enable 2FA");
        setLoading(false);
        return;
      }

      setBackupCodes(data.backupCodes);
      setShowBackupCodes(true);
      setEnabled(true);
      setSetupMode(false);
      setSuccess("2FA enabled successfully!");
    } catch (err) {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const disableTwoFactor = async () => {
    const code = prompt("Enter your 2FA code or backup code to disable:");
    if (!code) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/user/2fa/disable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: code }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to disable 2FA");
        setLoading(false);
        return;
      }

      setEnabled(false);
      setSuccess("2FA disabled successfully");
      setBackupCodes([]);
    } catch (err) {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (loading && !setupMode) {
    return <div className="text-beef-text-muted text-sm">Loading 2FA settings...</div>;
  }

  return (
    <div className="card-beef">
      <div className="flex items-center gap-3 mb-6">
        <span className="text-2xl">🔐</span>
        <div>
          <h2 className="text-xl font-bold">Two-Factor Authentication</h2>
          <p className="text-sm text-beef-text-muted">
            Add an extra layer of security to your account
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-900/20 border border-red-500 text-red-500 px-4 py-3 rounded-lg mb-6 text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-900/20 border border-green-500 text-green-500 px-4 py-3 rounded-lg mb-6 text-sm">
          {success}
        </div>
      )}

      {!setupMode && !showBackupCodes && (
        <div>
          <div className="flex items-center justify-between py-4 border-b border-beef-border">
            <div>
              <p className="font-bold text-sm mb-1">Status</p>
              <p className="text-xs text-beef-text-muted">
                {enabled ? "2FA is enabled" : "2FA is disabled"}
              </p>
            </div>
            <div
              className={`px-3 py-1 rounded-full text-xs font-bold ${
                enabled
                  ? "bg-green-900/20 border border-green-500 text-green-500"
                  : "bg-beef-bg-light border border-beef-border text-beef-text-muted"
              }`}
            >
              {enabled ? "✓ ENABLED" : "DISABLED"}
            </div>
          </div>

          <div className="pt-6">
            {enabled ? (
              <button
                onClick={disableTwoFactor}
                disabled={loading}
                className="w-full px-6 py-3 border border-red-500 text-red-500 rounded-full hover:bg-red-900/10 transition-colors text-sm font-bold disabled:opacity-50"
              >
                Disable 2FA
              </button>
            ) : (
              <button
                onClick={startSetup}
                disabled={loading}
                className="w-full btn-primary disabled:opacity-50"
              >
                Enable 2FA
              </button>
            )}
          </div>
        </div>
      )}

      {setupMode && (
        <div>
          <h3 className="text-lg font-bold mb-4">Set Up Authenticator App</h3>

          <div className="space-y-6">
            <div>
              <p className="text-sm text-beef-text-muted mb-4">
                1. Download an authenticator app (Google Authenticator, Authy, etc.)
              </p>
              <p className="text-sm text-beef-text-muted mb-4">
                2. Scan this QR code with your authenticator app:
              </p>

              {qrCode && (
                <div className="bg-white p-4 rounded-lg inline-block">
                  <img src={qrCode} alt="2FA QR Code" width={200} height={200} />
                </div>
              )}

              <p className="text-sm text-beef-text-muted mt-4 mb-2">
                Or enter this code manually:
              </p>
              <code className="bg-beef-bg-light px-3 py-2 rounded text-xs font-mono break-all block">
                {secret}
              </code>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                3. Enter the 6-digit code from your app to verify:
              </label>
              <input
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000"
                className="w-full px-4 py-3 bg-beef-bg-light border border-beef-border rounded-lg focus:outline-none focus:border-beef-gold text-center text-2xl font-mono tracking-widest"
                maxLength={6}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setSetupMode(false);
                  setQrCode("");
                  setSecret("");
                  setVerificationCode("");
                }}
                className="flex-1 px-6 py-3 border border-beef-border rounded-full hover:border-beef-gold hover:text-beef-gold transition-colors text-sm font-bold"
              >
                Cancel
              </button>
              <button
                onClick={enableTwoFactor}
                disabled={loading || verificationCode.length !== 6}
                className="flex-1 btn-primary disabled:opacity-50"
              >
                {loading ? "Verifying..." : "Enable 2FA"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showBackupCodes && (
        <div>
          <h3 className="text-lg font-bold mb-4">⚠️ Save Your Backup Codes</h3>
          <p className="text-sm text-beef-text-muted mb-4">
            Store these codes in a safe place. Each code can be used once if you lose access to your authenticator app.
          </p>

          <div className="bg-beef-bg-light p-4 rounded-lg mb-4">
            <div className="grid grid-cols-2 gap-2 font-mono text-sm">
              {backupCodes.map((code, i) => (
                <div key={i} className="text-center py-2 bg-beef-bg-card rounded">
                  {code}
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => {
              setShowBackupCodes(false);
              setBackupCodes([]);
            }}
            className="w-full btn-primary"
          >
            I've Saved My Backup Codes
          </button>
        </div>
      )}
    </div>
  );
}
