"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";

export function HeroCTA() {
  const { data: session, status } = useSession();

  if (status === "loading") return <div className="h-14" />;

  return (
    <div className="flex gap-3 flex-wrap">
      <Link href={session?.user ? "/beef/new" : "/auth/signup"}>
        <button className="btn-primary text-sm px-8 py-4">
          START A BEEF
        </button>
      </Link>
      <a href="#feed">
        <button className="btn-secondary text-sm px-8 py-4">
          WATCH THE ARENA
        </button>
      </a>
    </div>
  );
}
