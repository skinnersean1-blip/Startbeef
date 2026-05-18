"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export function BankBadge() {
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/bank/balance")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => d && setBalance(d.balance))
      .catch(() => {});
  }, []);

  return (
    <Link
      href="/bank"
      className="flex items-center gap-2 px-4 py-2 border border-beef-gold/40 rounded-full hover:border-beef-gold transition-colors group"
    >
      <span className="text-beef-gold text-sm">⬡</span>
      <span className="text-sm font-bold text-beef-gold group-hover:text-beef-gold-light transition-colors">
        {balance !== null ? `$${balance.toFixed(2)}` : "BANK"}
      </span>
    </Link>
  );
}
