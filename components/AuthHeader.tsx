"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";

export function AuthHeader() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="flex gap-4">
        <div className="w-32 h-12 bg-beef-bg-card animate-pulse rounded-full"></div>
      </div>
    );
  }

  if (session?.user) {
    return (
      <div className="flex items-center gap-4">
        <Link
          href={`/@${session.user.handle || session.user.username}`}
          className="flex items-center gap-2 px-4 py-2 hover:text-beef-gold transition-colors"
        >
          <span className="text-sm text-muted">@{session.user.handle || session.user.username}</span>
        </Link>
        <Link
          href="/bank"
          className="px-4 py-2 text-sm text-beef-gold hover:text-beef-gold-light transition-colors font-medium"
        >
          BANK
        </Link>
        <Link href="/beef/new">
          <button className="btn-primary text-sm px-6 py-3">
            START A BEEF
          </button>
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="px-6 py-2 border border-beef-border rounded-full hover:border-beef-gold hover:text-beef-gold transition-colors text-sm"
        >
          Sign Out
        </button>
      </div>
    );
  }

  return (
    <div className="flex gap-4">
      <Link href="/auth/signin">
        <button className="btn-secondary text-sm px-6 py-3">
          SIGN IN
        </button>
      </Link>
      <Link href="/auth/signup">
        <button className="btn-primary text-sm px-6 py-3">
          JOIN THE ARENA
        </button>
      </Link>
    </div>
  );
}
