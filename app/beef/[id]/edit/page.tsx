"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { BackButton } from "@/components/BackButton";

const CLAIM_MAX = 500;

export default function EditBeefPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { data: session, status } = useSession();

  const [claim, setClaim] = useState("");
  const [originalClaim, setOriginalClaim] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
      return;
    }
    if (status !== "authenticated") return;

    fetch(`/api/beef/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) { router.push(`/beef/${id}`); return; }
        if (data.beef.status !== "OPEN" || data.beef.challengerId !== session?.user?.id) {
          router.push(`/beef/${id}`);
          return;
        }
        setClaim(data.beef.claim);
        setOriginalClaim(data.beef.claim);
        setLoading(false);
      })
      .catch(() => router.push(`/beef/${id}`));
  }, [id, status, session, router]);

  const handleSave = async () => {
    if (claim.trim().length < 10 || saving) return;
    setSaving(true);
    setError("");

    const res = await fetch(`/api/beef/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ claim }),
    });

    const data = await res.json();
    setSaving(false);

    if (!res.ok) {
      setError(data.error || "Something went wrong");
      return;
    }

    router.push(`/beef/${id}`);
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-beef-gold text-sm tracking-widest animate-pulse">LOADING...</div>
      </div>
    );
  }

  const changed = claim.trim() !== originalClaim.trim();

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
          <p className="text-muted text-sm">@{session?.user?.handle || session?.user?.username}</p>
        </div>
      </header>

      <div className="container-beef pb-20">
        <div className="max-w-2xl mx-auto">
          <div className="mb-6"><BackButton fallback={`/beef/${id}`} /></div>

          <p className="section-label mb-3">EDIT BEEF</p>
          <h2 className="text-3xl sm:text-4xl font-bold mb-8">CHANGE YOUR CLAIM</h2>

          <div className="card-beef mb-6">
            <p className="text-muted text-sm mb-4">
              You can edit your claim while no one has accepted yet. Categories will be re-tagged automatically.
            </p>
            <textarea
              value={claim}
              onChange={(e) => setClaim(e.target.value.slice(0, CLAIM_MAX))}
              rows={5}
              className="w-full px-4 py-3 bg-beef-bg-light border border-beef-border rounded-lg focus:outline-none focus:border-beef-gold transition-colors resize-none text-lg"
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

          {error && (
            <div className="bg-red-900/20 border border-red-500 text-red-500 px-4 py-3 rounded-lg mb-6 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-4">
            <button
              onClick={handleSave}
              disabled={saving || !changed || claim.trim().length < 10}
              className="btn-primary flex-1 py-4 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {saving ? "SAVING..." : "SAVE CHANGES"}
            </button>
            <Link href={`/beef/${id}`} className="btn-secondary flex-1 py-4 text-center">
              CANCEL
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
