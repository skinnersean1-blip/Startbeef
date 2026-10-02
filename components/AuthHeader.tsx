"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { BankBadge } from "./BankBadge";

export function AuthHeader() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <div className="w-24 h-10 bg-beef-bg-card animate-pulse rounded-full" />;
  }

  if (session?.user) {
    return (
      <div className="flex items-center gap-2 sm:gap-4 flex-wrap justify-end">
        <Link
          href={`/@${session.user.handle || session.user.username}`}
          className="hidden sm:block text-sm text-muted hover:text-beef-gold transition-colors px-2 py-2"
        >
          {session.user.isAnonymous
            ? (session.user.anonHandle ?? "GHOST")
            : `@${session.user.handle || session.user.username}`}
        </Link>
        <BankBadge />
        <Link href="/beef/new">
          <button className="btn-primary text-xs sm:text-sm px-4 sm:px-6 py-3">
            START A BEEF
          </button>
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="hidden sm:block px-4 py-2 border border-beef-border rounded-full hover:border-beef-gold hover:text-beef-gold transition-colors text-sm"
        >
          Sign Out
        </button>
      </div>
    );
  }

  return (
    <div className="flex gap-2 sm:gap-4">
      <Link href="/auth/signin">
        <button className="btn-secondary text-xs sm:text-sm px-4 sm:px-6 py-3">
          SIGN IN
        </button>
      </Link>
      <Link href="/auth/signup">
        <button className="btn-primary text-xs sm:text-sm px-4 sm:px-6 py-3">
          JOIN
        </button>
      </Link>
    </div>
  );
}
