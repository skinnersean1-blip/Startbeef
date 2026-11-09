"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { BankBadge } from "./BankBadge";
import { NotificationToggle } from "./NotificationToggle";

export function AuthHeader() {
  const { data: session, status } = useSession();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (status === "loading") {
    return <div className="w-24 h-10 bg-beef-bg-card animate-pulse rounded-full" />;
  }

  if (session?.user) {
    return (
      <div className="flex items-center gap-2 sm:gap-4 flex-wrap justify-end">
        <div className="hidden sm:block relative" ref={menuRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="text-sm text-muted hover:text-beef-gold transition-colors px-2 py-2 flex items-center gap-1"
          >
            {session.user.isAnonymous
              ? (session.user.anonHandle ?? "GHOST")
              : `@${session.user.handle || session.user.username}`}
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-beef-bg-card border border-beef-border rounded-lg shadow-lg py-1 z-50">
              <Link
                href="/dashboard"
                className="block px-4 py-2 text-sm hover:bg-beef-bg transition-colors"
                onClick={() => setShowUserMenu(false)}
              >
                Dashboard
              </Link>
              <Link
                href="/account/password"
                className="block px-4 py-2 text-sm hover:bg-beef-bg transition-colors"
                onClick={() => setShowUserMenu(false)}
              >
                Change Password
              </Link>
              <button
                onClick={() => {
                  setShowUserMenu(false);
                  signOut({ callbackUrl: "/" });
                }}
                className="w-full text-left px-4 py-2 text-sm hover:bg-beef-bg transition-colors"
              >
                Sign Out
              </button>
            </div>
          )}
        </div>

        <NotificationToggle />
        <BankBadge />
        {session.user.isAdmin && (
          <Link href="/admin">
            <button className="bg-white text-black text-xs font-bold px-4 py-2 rounded-lg border-2 border-gray-900 hover:bg-gray-100 transition-colors">
              Admin
            </button>
          </Link>
        )}
        <Link href="/beef/new">
          <button className="btn-primary text-xs sm:text-sm px-4 sm:px-6 py-3">
            START A BEEF
          </button>
        </Link>
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
