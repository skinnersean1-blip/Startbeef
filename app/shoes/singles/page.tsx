export const dynamic = "force-dynamic";

import Link from "next/link";
import { shoeDb } from "@/lib/shoe-prisma";
import { shoePath } from "@/lib/shoepath";

type ShoePost = Awaited<ReturnType<typeof fetchListings>>[number];

async function fetchListings(condition?: string) {
  return shoeDb.shoePost.findMany({
    where: {
      listingKind: "SINGLE",
      status: "ACTIVE",
      ...(condition ? { condition } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 100,
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

function ShoeTile({ post }: { post: ShoePost }) {
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
      <div className="border border-shoe-border bg-shoe-panel group-hover:bg-shoe-panel-lite transition-colors duration-100 cursor-pointer">
        <div className="aspect-square overflow-hidden border-b border-shoe-border">
          {thumbUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={thumbUrl}
              alt=""
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full bg-shoe-bg-deep flex items-center justify-center">
              <span className="text-shoe-cream-dim text-xs tracking-widest">NO PHOTO</span>
            </div>
          )}
        </div>
        <div className="p-3">
          <p className="font-bold text-shoe-cream group-hover:text-shoe-accent transition-colors text-sm leading-snug line-clamp-2">
            {post.title}
          </p>
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            {post.brand && <span className="text-xs text-shoe-cream-dim">{post.brand}</span>}
            {post.brand && <span className="text-xs text-shoe-cream-dim">·</span>}
            <span className="text-xs text-shoe-cream-dim">Sz {post.size}</span>
            <span className="text-xs text-shoe-cream-dim">·</span>
            <span className={`text-xs font-bold ${CONDITION_COLOR[post.condition]}`}>
              {CONDITION_LABEL[post.condition]}
            </span>
          </div>
          <div className="mt-2">
            {post.listingType === "SALE" && post.askingPrice != null && (
              <p className="font-bold text-shoe-accent text-sm">${post.askingPrice.toFixed(2)}</p>
            )}
            {post.listingType === "TRADE" && (
              <p className="text-shoe-cream text-xs font-bold tracking-widest">TRADE</p>
            )}
            {post.listingType === "FREE" && (
              <p className="text-shoe-tier-new text-xs font-bold tracking-widest">
                FREE +{TIER_CREDITS[post.condition]}cr
              </p>
            )}
          </div>
          <p className="text-xs text-shoe-cream-dim mt-1">@{handle}</p>
        </div>
      </div>
    </Link>
  );
}

export default async function SinglesPage({
  searchParams,
}: {
  searchParams: Promise<{ condition?: string }>;
}) {
  const { condition } = await searchParams;
  const listings = await fetchListings(condition);

  return (
    <div className="min-h-screen bg-shoe-bg">

      <header className="bg-shoe-bg-deep border-b border-shoe-border">
        <div className="container-shoe py-5 flex items-center justify-between">
          <Link href={shoePath()} className="btn-shoe-ghost">← SHOE SHOE</Link>
          <div className="text-right">
            <h1 className="text-2xl font-bold text-shoe-cream tracking-tight">SINGLES</h1>
            <p className="label-shoe mt-0.5">INDIVIDUAL SHOES</p>
          </div>
        </div>
      </header>

      {/* Condition filter */}
      <div className="border-b border-shoe-border bg-shoe-panel">
        <div className="container-shoe py-3">
          <div className="flex items-center gap-6 flex-wrap">
            <p className="label-shoe whitespace-nowrap">FILTER BY CONDITION</p>
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
                  href={isActive ? shoePath("/singles") : `${shoePath("/singles")}?condition=${t.key}`}
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
              <Link href={shoePath("/singles")} className="text-xs text-shoe-cream-dim hover:text-shoe-accent transition-colors ml-1">
                ✕ clear
              </Link>
            )}
            <p className="text-shoe-cream-dim text-sm ml-auto">{listings.length} listed</p>
          </div>
        </div>
      </div>

      <main className="container-shoe py-8">
        {listings.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-shoe-cream-dim text-sm tracking-widest">NO SINGLES LISTED YET</p>
            <Link href={shoePath("/new")} className="btn-shoe-ghost mt-4 inline-block">
              BE THE FIRST
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {listings.map((p) => <ShoeTile key={p.id} post={p} />)}
          </div>
        )}
      </main>

      <footer className="container-shoe py-8 border-t border-shoe-border">
        <div className="flex justify-between items-center">
          <p className="text-shoe-cream-dim text-xs tracking-widest">
            © 2026 SHOE SHOE. WHERE TINY FEET FIND THEIR MATCH.
          </p>
          <Link href="/" className="text-shoe-cream-dim text-xs tracking-widest hover:text-shoe-accent transition-colors">
            ← BACK TO HOME
          </Link>
        </div>
      </footer>
    </div>
  );
}
