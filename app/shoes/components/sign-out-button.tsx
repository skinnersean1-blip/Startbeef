"use client";

import { signOut } from "next-auth/react";
import { shoePath } from "@/lib/shoepath";

export function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: shoePath() })}
      className="text-xs text-shoe-cream-dim hover:text-shoe-accent transition-colors tracking-widest"
    >
      SIGN OUT
    </button>
  );
}
