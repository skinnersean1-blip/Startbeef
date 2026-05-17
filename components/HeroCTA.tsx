"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";

export function HeroCTA() {
  const { data: session, status } = useSession();

  if (status === "loading") return null;

  if (session?.user) {
    return (
      <Link href="/beef/new">
        <button className="btn-primary text-lg px-10 py-5">
          START A BEEF
        </button>
      </Link>
    );
  }

  return (
    <div className="flex gap-4">
      <Link href="/auth/signup">
        <button className="btn-primary text-lg px-10 py-5">
          JOIN THE ARENA
        </button>
      </Link>
      <Link href="/auth/signin">
        <button className="btn-secondary text-lg px-10 py-5">
          SIGN IN
        </button>
      </Link>
    </div>
  );
}
