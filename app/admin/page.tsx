"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// ── Types ─────────────────────────────────────────────────────────────────────

type Tab = "overview" | "users" | "beefs" | "withdrawals" | "topics";

type Stats = {
  totalUsers: number;
  totalBeefs: number;
  openBeefs: number;
  liveBeefs: number;
  completedBeefs: number;
  totalVolume: number;
  platformRevenue: number;
  newUsersThisWeek: number;
};

type User = {
  id: string;
  email: string | null;
  handle: string | null;
  username: string;
  anonHandle: string | null;
  isAnonymous: boolean;
  bankBalance: number;
  wins: number;
  losses: number;
  totalEarnings: number;
  isVerified: boolean;
  createdAt: string;
  _count: { challengesCreated: number; challengesAccepted: number };
};

type Beef = {
  id: string;
  claim: string;
  status: string;
  totalPot: number;
  categories: string;
  createdAt: string;
  challengerIsAnon: boolean;
  responderIsAnon: boolean;
  challenger: { handle: string | null; username: string; anonHandle: string | null; isAnonymous: boolean };
  responder:  { handle: string | null; username: string; anonHandle: string | null; isAnonymous: boolean } | null;
};

type Withdrawal = {
  id: string;
  amount: number;
  status: string;
  createdAt: string;
  user: { email: string | null; handle: string | null; username: string; anonHandle: string | null; isAnonymous: boolean; bankBalance: number } | null;
};

type Topic = { name: string; count: number; volume: number; completed: number };

// ── Helpers ───────────────────────────────────────────────────────────────────

function displayName(
  user: { handle: string | null; username: string; anonHandle: string | null; isAnonymous: boolean },
  isAnonBeef = false
) {
  return user.isAnonymous || isAnonBeef ? (user.anonHandle ?? "GHOST") : `@${user.handle || user.username}`;
}

function fmt(n: number) { return `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`; }

function timeAgo(date: string) {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

const STATUS_COLOR: Record<string, string> = {
  OPEN:      "text-amber-600 bg-amber-50",
  LIVE:      "text-orange-500 bg-orange-50",
  JUDGING:   "text-blue-500 bg-blue-50",
  COMPLETED: "text-gray-400 bg-gray-100",
};

// ── Tab components ────────────────────────────────────────────────────────────

function OverviewTab({ stats }: { stats: Stats | null }) {
  if (!stats) return <Spinner />;
  const tiles = [
    { label: "TOTAL USERS",       value: stats.totalUsers.toLocaleString(),        sub: `+${stats.newUsersThisWeek} this week` },
    { label: "TOTAL BEEFS",       value: stats.totalBeefs.toLocaleString(),        sub: `${stats.liveBeefs} live · ${stats.openBeefs} open` },
    { label: "TOTAL POT VOLUME",  value: fmt(stats.totalVolume),                   sub: `${stats.completedBeefs} completed` },
    { label: "PLATFORM REVENUE",  value: fmt(stats.platformRevenue),               sub: "1.5% fee on all pots" },
  ];
  return (
    <div className="grid grid-cols-2 gap-4">
      {tiles.map((t) => (
        <div key={t.label} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <p className="text-xs font-bold tracking-widest text-gray-400 mb-2">{t.label}</p>
          <p className="text-3xl font-bold text-orange-500">{t.value}</p>
          <p className="text-xs text-gray-400 mt-1">{t.sub}</p>
        </div>
      ))}
    </div>
  );
}

function UsersTab() {
  const [users, setUsers]   = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage]     = useState(1);
  const [total, setTotal]   = useState(0);
  const [pages, setPages]   = useState(1);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/users?q=${encodeURIComponent(search)}&page=${page}`);
    const data = await res.json();
    setUsers(data.users ?? []);
    setTotal(data.total ?? 0);
    setPages(data.pages ?? 1);
    setLoading(false);
  }, [search, page]);

  useEffect(() => { load(); }, [load]);

  async function toggleVerify(id: string, current: boolean) {
    setUpdating(id);
    await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action: current ? "unverify" : "verify" }),
    });
    setUpdating(null);
    load();
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <input
          type="text"
          placeholder="Search email, handle, username..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="flex-1 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-orange-400 text-gray-900 transition-colors"
        />
        <span className="text-xs text-gray-400 whitespace-nowrap">{total} users</span>
      </div>

      {msg && <div className="mb-3 text-xs text-orange-500">{msg}</div>}

      {loading ? <Spinner /> : (
        <div className="space-y-2">
          {users.map((u) => (
            <div key={u.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-sm text-gray-900">
                      {u.isAnonymous ? (u.anonHandle ?? "GHOST") : `@${u.handle || u.username}`}
                    </p>
                    {u.isAnonymous && <span className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">GHOST</span>}
                    {u.isVerified  && <span className="text-xs text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">VERIFIED</span>}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{u.email}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                    <span>Bank: <span className="text-orange-500 font-bold">{fmt(u.bankBalance)}</span></span>
                    <span>{u.wins}W / {u.losses}L</span>
                    <span>{u._count.challengesCreated + u._count.challengesAccepted} beefs</span>
                    <span>{timeAgo(u.createdAt)}</span>
                  </div>
                </div>
                <button
                  onClick={() => toggleVerify(u.id, u.isVerified)}
                  disabled={updating === u.id}
                  className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg hover:border-orange-400 hover:text-orange-500 transition-colors disabled:opacity-40 whitespace-nowrap"
                >
                  {updating === u.id ? "..." : u.isVerified ? "Unverify" : "Verify"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {pages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-4">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg disabled:opacity-40 hover:border-gray-400 transition-colors">← Prev</button>
          <span className="text-xs text-gray-400">Page {page} of {pages}</span>
          <button onClick={() => setPage((p) => Math.min(pages, p + 1))} disabled={page === pages} className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg disabled:opacity-40 hover:border-gray-400 transition-colors">Next →</button>
        </div>
      )}
    </div>
  );
}

function BeefsTab() {
  const [beefs, setBeefs]       = useState<Beef[]>([]);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage]         = useState(1);
  const [total, setTotal]       = useState(0);
  const [pages, setPages]       = useState(1);
  const [loading, setLoading]   = useState(true);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/beefs?status=${statusFilter}&page=${page}`);
    const data = await res.json();
    setBeefs(data.beefs ?? []);
    setTotal(data.total ?? 0);
    setPages(data.pages ?? 1);
    setLoading(false);
  }, [statusFilter, page]);

  useEffect(() => { load(); }, [load]);

  async function cancel(id: string) {
    if (!confirm("Cancel this beef and refund all antes?")) return;
    setCancelling(id);
    const res = await fetch("/api/admin/beefs", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action: "cancel" }),
    });
    setCancelling(null);
    if (res.ok) { setMsg({ type: "ok", text: "Beef cancelled and antes refunded." }); load(); }
    else { const d = await res.json(); setMsg({ type: "err", text: d.error || "Failed" }); }
  }

  const statuses = ["ALL", "OPEN", "LIVE", "JUDGING", "COMPLETED"];

  return (
    <div>
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {statuses.map((s) => (
          <button
            key={s}
            onClick={() => { setStatusFilter(s); setPage(1); }}
            className={`text-xs px-3 py-1.5 border rounded-full transition-colors ${statusFilter === s ? "border-orange-500 text-orange-500" : "border-gray-200 text-gray-400 hover:border-gray-400"}`}
          >
            {s}
          </button>
        ))}
        <span className="text-xs text-gray-400 ml-auto">{total} beefs</span>
      </div>

      {msg && (
        <div className={`mb-3 px-3 py-2 rounded text-xs ${msg.type === "ok" ? "text-green-600 bg-green-50" : "text-red-500 bg-red-50"}`}>
          {msg.text}
        </div>
      )}

      {loading ? <Spinner /> : (
        <div className="space-y-2">
          {beefs.map((b) => {
            const cats: string[] = (() => { try { return JSON.parse(b.categories || "[]"); } catch { return []; } })();
            return (
              <div key={b.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${STATUS_COLOR[b.status] ?? "text-gray-400"}`}>
                        {b.status}
                      </span>
                      {cats.map((c) => (
                        <span key={c} className="text-xs text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">[{c}]</span>
                      ))}
                    </div>
                    <p className="text-sm font-bold leading-snug mb-1 truncate text-gray-900">
                      &ldquo;{b.claim.length > 100 ? b.claim.slice(0, 100) + "…" : b.claim}&rdquo;
                    </p>
                    <div className="flex items-center gap-2 text-xs text-gray-400 flex-wrap">
                      <span className="text-orange-500 font-bold">{displayName(b.challenger, b.challengerIsAnon)}</span>
                      {b.responder && <><span>vs</span><span>{displayName(b.responder, b.responderIsAnon)}</span></>}
                      <span>·</span>
                      <span className="text-orange-500 font-bold">{fmt(b.totalPot)}</span>
                      <span>·</span>
                      <span>{timeAgo(b.createdAt)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Link href={`/beef/${b.id}`} target="_blank" className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg hover:border-gray-400 transition-colors">
                      View
                    </Link>
                    {b.status !== "COMPLETED" && (
                      <button
                        onClick={() => cancel(b.id)}
                        disabled={cancelling === b.id}
                        className="text-xs px-3 py-1.5 border border-red-200 text-red-500 rounded-lg hover:border-red-400 transition-colors disabled:opacity-40"
                      >
                        {cancelling === b.id ? "..." : "Cancel"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {pages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-4">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg disabled:opacity-40 hover:border-gray-400 transition-colors">← Prev</button>
          <span className="text-xs text-gray-400">Page {page} of {pages}</span>
          <button onClick={() => setPage((p) => Math.min(pages, p + 1))} disabled={page === pages} className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg disabled:opacity-40 hover:border-gray-400 transition-colors">Next →</button>
        </div>
      )}
    </div>
  );
}

function WithdrawalsTab() {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading]         = useState(true);
  const [updating, setUpdating]       = useState<string | null>(null);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const load = async () => {
    setLoading(true);
    const res = await fetch("/api/admin/withdrawals");
    const data = await res.json();
    setWithdrawals(data.withdrawals ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  async function handle(id: string, status: "COMPLETED" | "FAILED") {
    setUpdating(id);
    setMsg(null);
    const res = await fetch("/api/admin/withdrawals", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    setUpdating(null);
    if (res.ok) {
      setMsg({ type: "ok", text: status === "COMPLETED" ? "Marked as paid out." : "Marked failed — balance refunded." });
      load();
    } else {
      const d = await res.json();
      setMsg({ type: "err", text: d.error || "Something went wrong" });
    }
  }

  const pending   = withdrawals.filter((w) => w.status === "PENDING");
  const processed = withdrawals.filter((w) => w.status !== "PENDING");

  if (loading) return <Spinner />;

  return (
    <div>
      {msg && (
        <div className={`mb-4 px-3 py-2 rounded text-xs ${msg.type === "ok" ? "text-green-600 bg-green-50" : "text-red-500 bg-red-50"}`}>
          {msg.text}
        </div>
      )}

      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <p className="text-xs font-bold tracking-widest text-gray-500">PENDING</p>
          {pending.length > 0 && (
            <span className="text-xs font-bold bg-orange-50 text-orange-500 px-2 py-0.5 rounded-full">
              {pending.length} outstanding
            </span>
          )}
        </div>
        {pending.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl text-center py-8 shadow-sm"><p className="text-gray-400 text-sm">No pending withdrawals.</p></div>
        ) : (
          <div className="space-y-3">
            {pending.map((w) => (
              <div key={w.id} className="bg-white border border-orange-200 rounded-xl p-6 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-bold text-xl text-orange-500">{fmt(w.amount)}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      {w.user?.isAnonymous ? w.user.anonHandle : `@${w.user?.handle || w.user?.username}`}
                      {" · "}<span className="text-gray-700">{w.user?.email}</span>
                    </p>
                    <p className="text-xs text-gray-400 mt-1">Balance after: {fmt(w.user?.bankBalance ?? 0)}</p>
                    <p className="text-xs text-gray-400 mt-1">{timeAgo(w.createdAt)}</p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button onClick={() => handle(w.id, "COMPLETED")} disabled={updating === w.id} className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold px-4 py-2 rounded-lg transition-colors disabled:opacity-50">
                      {updating === w.id ? "..." : "Mark Paid"}
                    </button>
                    <button onClick={() => handle(w.id, "FAILED")} disabled={updating === w.id} className="px-4 py-2 text-sm border border-red-200 text-red-500 rounded-lg hover:border-red-400 transition-colors disabled:opacity-50">
                      Refund
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {processed.length > 0 && (
        <div>
          <p className="text-xs font-bold tracking-widest text-gray-500 mb-3">PROCESSED</p>
          <div className="space-y-2">
            {processed.map((w) => (
              <div key={w.id} className="bg-white border border-gray-200 rounded-xl flex items-center justify-between opacity-60 p-4">
                <div>
                  <p className="text-sm font-bold text-gray-700">{fmt(w.amount)} · {w.user?.email}</p>
                  <p className="text-xs text-gray-400">{new Date(w.createdAt).toLocaleDateString()}</p>
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${w.status === "COMPLETED" ? "bg-green-50 text-green-600" : "bg-red-50 text-red-500"}`}>
                  {w.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function TopicsTab() {
  const [topics, setTopics]   = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/topics")
      .then((r) => r.json())
      .then((d) => { setTopics(d.topics ?? []); setLoading(false); });
  }, []);

  if (loading) return <Spinner />;
  if (topics.length === 0) return <div className="bg-white border border-gray-200 rounded-xl text-center py-12 shadow-sm"><p className="text-gray-400 text-sm">No topics yet.</p></div>;

  const max = topics[0]?.count || 1;

  return (
    <div className="space-y-3">
      {topics.map((t, i) => (
        <div key={t.name} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-300 w-5 text-right font-bold">{i + 1}</span>
              <span className="font-bold text-sm text-gray-900">[{t.name}]</span>
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-400">
              <span><span className="text-orange-500 font-bold">{t.count}</span> beefs</span>
              <span><span className="text-orange-500 font-bold">{fmt(t.volume)}</span> volume</span>
              <span><span className="text-gray-700 font-bold">{t.completed}</span> judged</span>
            </div>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-orange-400 rounded-full transition-all duration-500"
              style={{ width: `${(t.count / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function Spinner() {
  return <div className="py-12 text-center text-gray-400 text-sm animate-pulse">Loading...</div>;
}

// ── Main Page ─────────────────────────────────────────────────────────────────

const TABS: { id: Tab; label: string }[] = [
  { id: "overview",     label: "Overview"     },
  { id: "users",        label: "Users"        },
  { id: "beefs",        label: "Beefs"        },
  { id: "withdrawals",  label: "Withdrawals"  },
  { id: "topics",       label: "Topics"       },
];

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tab, setTab]     = useState<Tab>("overview");
  const [stats, setStats] = useState<Stats | null>(null);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/auth/signin"); return; }
    if (status === "authenticated") {
      fetch("/api/admin/stats").then(async (r) => {
        if (r.status === 403) { router.push("/"); return; }
        setAuthed(true);
        const data = await r.json();
        setStats(data);
      });
    }
  }, [status]);

  if (!authed) {
    return <div className="min-h-screen flex items-center justify-center"><p className="text-beef-text-muted animate-pulse text-sm">Checking access...</p></div>;
  }

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <header className="px-8 py-5 border-b border-gray-200">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/">
            <div className="cursor-pointer flex items-center gap-3">
              <h1 className="text-2xl font-black tracking-tighter text-gray-900">BEEF</h1>
              <span className="text-xs font-bold tracking-widest text-gray-400 border border-gray-200 px-2 py-0.5 rounded">ADMIN</span>
            </div>
          </Link>
          <p className="text-xs text-gray-400">{session?.user?.email}</p>
        </div>

        {/* Tab bar */}
        <div className="max-w-5xl mx-auto flex items-center gap-1 mt-4 -mb-5">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2 text-xs font-bold tracking-widest border-b-2 transition-colors ${
                tab === t.id
                  ? "border-orange-500 text-orange-500"
                  : "border-transparent text-gray-400 hover:text-gray-700"
              }`}
            >
              {t.label.toUpperCase()}
            </button>
          ))}
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-8 py-8 pb-24">
        {tab === "overview"    && <OverviewTab stats={stats} />}
        {tab === "users"       && <UsersTab />}
        {tab === "beefs"       && <BeefsTab />}
        {tab === "withdrawals" && <WithdrawalsTab />}
        {tab === "topics"      && <TopicsTab />}
      </div>
    </div>
  );
}
