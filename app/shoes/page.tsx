export const dynamic = "force-dynamic";

import Link from "next/link";
import { shoeDb } from "@/lib/shoe-prisma";
import { getServerSession } from "next-auth";
import { shoeAuthOptions } from "@/lib/shoe-auth";
import { shoePath } from "@/lib/shoepath";

type ShoePost = Awaited<ReturnType<typeof fetchSide>>[number];

async function fetchSide(kind: "PAIR" | "SINGLE") {
  return shoeDb.shoePost.findMany({
    where: { listingKind: kind, status: "ACTIVE" },
    orderBy: { createdAt: "desc" },
    take: 20,
    include: { user: { select: { handle: true, username: true } } },
  });
}

const CONDITION_LABEL: Record<string, string> = {
  NEW: "New",
  LIKE_NEW: "Like New",
  LOVED: "Loved",
  WELL_LOVED: "Well Loved",
};

const CONDITION_COLOR: Record<string, string> = {
  NEW: "text-shoe-tier-new",
  LIKE_NEW: "text-shoe-tier-likenew",
  LOVED: "text-shoe-tier-loved",
  WELL_LOVED: "text-shoe-tier-wellloved",
};

const TIER_CREDITS: Record<string, number> = {
  NEW: 4,
  LIKE_NEW: 3,
  LOVED: 2,
  WELL_LOVED: 1,
};

const TYPE_LABEL: Record<string, string> = {
  SALE: "For Sale",
  TRADE: "Trade",
  FREE: "Free",
};

function timeAgo(date: Date) {
  const s = Math.floor((Date.now() - date.getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function ShoeCard({ post }: { post: ShoePost }) {
  const handle = post.user.handle || post.user.username;
  return (
    <Link href={shoePath(`/${post.id}`)}>
      <div className="border border-shoe-border bg-shoe-panel hover:bg-shoe-panel-lite transition-colors duration-100 cursor-pointer p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="font-bold text-shoe-cream leading-snug truncate">{post.title}</p>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {post.brand && (
                <span className="text-xs text-shoe-cream-dim">{post.brand}</span>
              )}
              <span className="text-xs text-shoe-cream-dim">·</span>
              <span className="text-xs text-shoe-cream-dim">Sz {post.size}</span>
              <span className="text-xs text-shoe-cream-dim">·</span>
              <span className={`text-xs font-bold ${CONDITION_COLOR[post.condition]}`}>
                {CONDITION_LABEL[post.condition]}
              </span>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            {post.listingType === "SALE" && post.askingPrice != null && (
              <p className="font-bold text-shoe-accent text-sm">${post.askingPrice.toFixed(2)}</p>
            )}
            {post.listingType === "TRADE" && (
              <p className="font-bold text-shoe-cream text-xs tracking-widest">TRADE</p>
            )}
            {post.listingType === "FREE" && (
              <p className="font-bold text-shoe-tier-new text-xs tracking-widest">
                FREE +{TIER_CREDITS[post.condition]}cr
              </p>
            )}
            <p className="text-xs text-shoe-cream-dim mt-1">{timeAgo(post.createdAt)}</p>
          </div>
        </div>
        <p className="text-xs text-shoe-cream-dim mt-2">@{handle}</p>
      </div>
    </Link>
  );
}

function EmptyHalf({ kind }: { kind: string }) {
  return (
    <div className="p-8 text-center">
      <p className="text-shoe-cream-dim text-sm tracking-widest">NO {kind.toUpperCase()} LISTED YET</p>
      <Link href={shoePath("/new")}>
        <button className="btn-shoe-ghost mt-4">BE THE FIRST</button>
      </Link>
    </div>
  );
}

export default async function ShoesPage() {
  const session = await getServerSession(shoeAuthOptions);

  const [pairs, singles, userRow] = await Promise.all([
    fetchSide("PAIR"),
    fetchSide("SINGLE"),
    session?.user?.id
      ? shoeDb.user.findUnique({ where: { id: session.user.id }, select: { credits: true } })
      : null,
  ]);

  return (
    <div className="min-h-screen bg-shoe-bg">

      {/* Header */}
      <header className="bg-shoe-bg-deep border-b border-shoe-border">
        <div className="container-shoe py-6 flex items-center justify-between gap-6">
          <div>
            <p className="label-shoe mb-1">CHILDREN&apos;S SHOE EXCHANGE</p>
            <h1 className="text-5xl font-bold text-shoe-cream tracking-tight leading-none">
              SHOE-SHOE
            </h1>
          </div>

          <div className="flex items-center gap-4">
            {session ? (
              <>
                <div className="text-right">
                  <p className="text-xs text-shoe-cream-dim tracking-widest">YOUR CREDITS</p>
                  <p className="text-xl font-bold text-shoe-accent">{userRow?.credits ?? 0}</p>
                </div>
                <Link href={shoePath("/new")}>
                  <button className="btn-shoe-primary">+ POST A SHOE</button>
                </Link>
              </>
            ) : (
              <Link href="/auth/signin">
                <button className="btn-shoe-secondary">SIGN IN TO POST</button>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Tier guide */}
      <div className="border-b border-shoe-border bg-shoe-panel">
        <div className="container-shoe py-3">
          <div className="flex items-center gap-6 flex-wrap">
            <p className="label-shoe whitespace-nowrap">CONDITION TIERS</p>
            {[
              { key: "NEW",        label: "New",        credits: 4, cls: "text-shoe-tier-new" },
              { key: "LIKE_NEW",   label: "Like New",   credits: 3, cls: "text-shoe-tier-likenew" },
              { key: "LOVED",      label: "Loved",      credits: 2, cls: "text-shoe-tier-loved" },
              { key: "WELL_LOVED", label: "Well Loved", credits: 1, cls: "text-shoe-tier-wellloved" },
            ].map((t) => (
              <div key={t.key} className="flex items-center gap-1.5">
                <span className={`font-bold text-sm ${t.cls}`}>{t.label}</span>
                <span className="text-xs text-shoe-cream-dim">({t.credits}cr)</span>
              </div>
            ))}
            <p className="text-xs text-shoe-cream-dim ml-auto">
              Free listings earn credits · Any tier trades evenly
            </p>
          </div>
        </div>
      </div>

      {/* Two-column marketplace */}
      <main className="container-shoe py-8">
        <div className="grid grid-cols-2 gap-0 border border-shoe-border">

          {/* PAIRS */}
          <div className="border-r border-shoe-border">
            <div className="bg-shoe-bg-deep border-b border-shoe-border px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-shoe-cream tracking-tight">PAIRS</h2>
                <p className="label-shoe mt-0.5">COMPLETE SETS</p>
              </div>
              <span className="text-shoe-cream-dim text-sm">{pairs.length} listed</span>
            </div>
            <div className="divide-y divide-shoe-border">
              {pairs.length === 0
                ? <EmptyHalf kind="pairs" />
                : pairs.map((p) => <ShoeCard key={p.id} post={p} />)
              }
            </div>
          </div>

          {/* SINGLES */}
          <div>
            <div className="bg-shoe-bg-deep border-b border-shoe-border px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-shoe-cream tracking-tight">SINGLES</h2>
                <p className="label-shoe mt-0.5">INDIVIDUAL SHOES</p>
              </div>
              <span className="text-shoe-cream-dim text-sm">{singles.length} listed</span>
            </div>
            <div className="divide-y divide-shoe-border">
              {singles.length === 0
                ? <EmptyHalf kind="singles" />
                : singles.map((p) => <ShoeCard key={p.id} post={p} />)
              }
            </div>
          </div>

        </div>
      </main>

      <footer className="container-shoe py-8 border-t border-shoe-border">
        <div className="flex justify-between items-center">
          <p className="text-shoe-cream-dim text-xs tracking-widest">
            © 2026 SHOE-SHOE. WHERE TINY FEET FIND THEIR MATCH.
          </p>
          <Link href="/" className="text-shoe-cream-dim text-xs tracking-widest hover:text-shoe-cream transition-colors">
            ← BACK TO BEEF
          </Link>
        </div>
      </footer>
    </div>
  );
}
