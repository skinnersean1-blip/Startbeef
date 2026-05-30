export const dynamic = "force-dynamic";

import Link from "next/link";
import { shoeDb } from "@/lib/shoe-prisma";
import { getServerSession } from "next-auth";
import { shoeAuthOptions } from "@/lib/shoe-auth";
import { shoePath } from "@/lib/shoepath";

type ShoePost = Awaited<ReturnType<typeof fetchSide>>[number];

async function fetchSide(kind: "PAIR" | "SINGLE", condition?: string) {
  return shoeDb.shoePost.findMany({
    where: {
      listingKind: kind,
      status: "ACTIVE",
      ...(condition ? { condition } : {}),
    },
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

  let thumbUrl: string | null = null;
  if (post.images) {
    try {
      const urls: string[] = JSON.parse(post.images);
      if (urls.length > 0) thumbUrl = urls[0];
    } catch {}
  }

  return (
    <Link href={shoePath(`/${post.id}`)} className="group">
      <div className="border border-shoe-border bg-shoe-panel group-hover:bg-shoe-panel-lite transition-colors duration-100 cursor-pointer p-4">
        <div className="flex items-start gap-3">
          {thumbUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={thumbUrl}
              alt=""
              className="flex-shrink-0 w-16 h-16 object-cover border border-shoe-border"
            />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-bold text-shoe-cream group-hover:text-shoe-accent transition-colors leading-snug truncate">{post.title}</p>
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
            {post.description && (
              <p className="text-xs text-shoe-cream-dim mt-2 line-clamp-2">{post.description}</p>
            )}
            <p className="text-xs text-shoe-cream-dim mt-2">@{handle}</p>
          </div>
        </div>
      </div>
    </Link>
  );
}

function EmptyHalf({ kind }: { kind: string }) {
  return (
    <div className="p-8 text-center">
      <p className="text-shoe-cream-dim text-sm tracking-widest">NO {kind.toUpperCase()} LISTED YET</p>
      <Link href={shoePath("/new")} className="btn-shoe-ghost mt-4 inline-block">
        BE THE FIRST
      </Link>
    </div>
  );
}

export default async function ShoesPage({
  searchParams,
}: {
  searchParams: Promise<{ condition?: string }>;
}) {
  const { condition } = await searchParams;
  const session = await getServerSession(shoeAuthOptions);

  const [pairs, singles, userRow] = await Promise.all([
    fetchSide("PAIR", condition),
    fetchSide("SINGLE", condition),
    session?.user?.id
      ? shoeDb.user.findUnique({ where: { id: session.user.id }, select: { credits: true, handle: true, username: true } })
      : null,
  ]);

  return (
    <div className="min-h-screen bg-shoe-bg">

      {/* Header */}
      <header className="bg-shoe-bg-deep border-b border-shoe-border overflow-hidden">
        <div className="container-shoe pt-5 pb-1 flex items-center justify-between gap-6">
          <p className="label-shoe">Buy, Swap, Sell</p>
          <div className="flex items-center gap-4">
            {session ? (
              <>
                <div className="text-right">
                  <p className="text-xs text-shoe-cream-dim tracking-widest">
                    @{userRow?.handle ?? userRow?.username ?? "you"}
                  </p>
                  <p className="text-xs text-shoe-cream-dim tracking-widest">
                    {userRow?.credits ?? 0} credits
                  </p>
                </div>
                <Link href={shoePath("/new")} className="btn-shoe-primary">
                  + POST A SHOE
                </Link>
              </>
            ) : (
              <Link href="/auth/signin" className="btn-shoe-secondary">
                SIGN IN TO POST
              </Link>
            )}
          </div>
        </div>
        <Link href={shoePath()} className="block">
          <h1
            className="font-black text-shoe-cream leading-none whitespace-nowrap pb-1 hover:text-shoe-accent transition-colors select-none relative left-1/2 -translate-x-1/2 w-max"
            style={{ fontSize: "20vw", letterSpacing: "-0.02em" }}
          >
            SHOE SHOE
          </h1>
        </Link>
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
            ].map((t) => {
              const isActive = condition === t.key;
              return (
                <Link
                  key={t.key}
                  href={isActive ? shoePath() : `${shoePath()}?condition=${t.key}`}
                  className="flex items-center gap-1.5 group"
                >
                  <span className={`font-bold text-sm ${t.cls} ${isActive ? "underline underline-offset-2" : "group-hover:underline group-hover:underline-offset-2 group-hover:text-shoe-accent"} transition-colors`}>
                    {t.label}
                  </span>
                  <span className="text-xs text-shoe-cream-dim">({t.credits}cr)</span>
                </Link>
              );
            })}
            {condition && (
              <Link href={shoePath()} className="text-xs text-shoe-cream-dim hover:text-shoe-accent transition-colors ml-1">
                ✕ clear
              </Link>
            )}
            <p className="text-xs text-shoe-cream-dim ml-auto">
              Free listings earn credits · Any tier trades evenly
            </p>
          </div>
        </div>
      </div>

      {/* Two-column marketplace */}
      <main className="container-shoe py-8">
        <div className="grid grid-cols-2 gap-8">

          {/* PAIRS */}
          <div className="border border-shoe-border">
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
          <div className="border border-shoe-border">
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
          <Link href="/" className="text-shoe-cream-dim text-xs tracking-widest hover:text-shoe-accent transition-colors">
            ← BACK TO BEEF
          </Link>
        </div>
      </footer>
    </div>
  );
}
