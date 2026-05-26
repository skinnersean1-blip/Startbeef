export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import { shoeDb } from "@/lib/shoe-prisma";
import { getServerSession } from "next-auth";
import { shoeAuthOptions } from "@/lib/shoe-auth";
import { submitOffer, acceptOffer, declineOffer } from "../actions";
import { shoePath } from "@/lib/shoepath";

const CONDITION_LABEL: Record<string, string> = {
  NEW: "New",
  LIKE_NEW: "Like New",
  LOVED: "Loved",
  WELL_LOVED: "Well Loved",
};

const CONDITION_COLOR: Record<string, string> = {
  NEW: "text-shoe-tier-new border-shoe-tier-new",
  LIKE_NEW: "text-shoe-tier-likenew border-shoe-tier-likenew",
  LOVED: "text-shoe-tier-loved border-shoe-tier-loved",
  WELL_LOVED: "text-shoe-tier-wellloved border-shoe-tier-wellloved",
};

const TIER_CREDITS: Record<string, number> = {
  NEW: 4,
  LIKE_NEW: 3,
  LOVED: 2,
  WELL_LOVED: 1,
};

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: "Active",
  SOLD: "Sold",
  TRADED: "Traded",
  GIVEN: "Given Away",
};

function timeAgo(date: Date) {
  const s = Math.floor((Date.now() - date.getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export default async function ShoeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getServerSession(shoeAuthOptions);

  const post = await shoeDb.shoePost.findUnique({
    where: { id },
    include: {
      user: { select: { handle: true, username: true } },
      offers: {
        orderBy: { createdAt: "desc" },
        include: {
          offerUser: { select: { handle: true, username: true } },
        },
      },
    },
  });

  if (!post) notFound();

  const isOwner = session?.user?.id === post.userId;
  const isActive = post.status === "ACTIVE";

  // For TRADE offers, show the buyer's own active listings in a dropdown
  let myListings: { id: string; title: string; condition: string }[] = [];
  if (session?.user?.id && post.listingType === "TRADE" && !isOwner && isActive) {
    myListings = await shoeDb.shoePost.findMany({
      where: { userId: session.user.id, status: "ACTIVE" },
      select: { id: true, title: true, condition: true },
    });
  }

  const handle = post.user.handle || post.user.username;
  const conditionCls = CONDITION_COLOR[post.condition] ?? "text-shoe-cream border-shoe-border";
  const conditionLabel = CONDITION_LABEL[post.condition] ?? post.condition;

  return (
    <div className="min-h-screen bg-shoe-bg">

      {/* Header */}
      <header className="bg-shoe-bg-deep border-b border-shoe-border">
        <div className="container-shoe py-5 flex items-center justify-between">
          <Link href={shoePath()}>
            <button className="btn-shoe-ghost">← SHOE-SHOE</button>
          </Link>
          <p className="label-shoe">{post.listingKind} LISTING</p>
        </div>
      </header>

      <main className="container-shoe py-8 max-w-2xl">

        {/* Main listing card */}
        <div className="card-shoe mb-6">

          {/* Status badge */}
          {post.status !== "ACTIVE" && (
            <div className="mb-4 border border-shoe-cream-dim p-2 text-center">
              <p className="text-shoe-cream-dim text-xs font-bold tracking-widest">
                {STATUS_LABEL[post.status]}
              </p>
            </div>
          )}

          {/* Title + meta */}
          <h2 className="text-2xl font-bold text-shoe-cream leading-snug mb-2">
            {post.title}
          </h2>
          {post.brand && (
            <p className="text-shoe-cream-dim text-sm mb-3">{post.brand}</p>
          )}

          {/* Tags row */}
          <div className="flex flex-wrap items-center gap-3 mb-5">
            <span className={`border px-3 py-1 text-xs font-bold tracking-widest ${conditionCls}`}>
              {conditionLabel.toUpperCase()} ({TIER_CREDITS[post.condition]}cr)
            </span>
            <span className="border border-shoe-border text-shoe-cream px-3 py-1 text-xs font-bold tracking-widest">
              SIZE {post.size}
            </span>
            <span className="border border-shoe-border text-shoe-cream-dim px-3 py-1 text-xs font-bold tracking-widest">
              {post.listingKind}
            </span>
          </div>

          {/* Price / type */}
          <div className="border-t border-shoe-border pt-4 mb-4">
            {post.listingType === "SALE" && post.askingPrice != null && (
              <div className="flex items-baseline gap-2">
                <p className="label-shoe">ASKING PRICE</p>
                <p className="text-3xl font-bold text-shoe-accent">${post.askingPrice.toFixed(2)}</p>
              </div>
            )}
            {post.listingType === "TRADE" && (
              <p className="text-shoe-cream font-bold tracking-widest">
                TRADE — offer any tier, trades evenly
              </p>
            )}
            {post.listingType === "FREE" && (
              <div>
                <p className="text-shoe-tier-new font-bold tracking-widest text-lg">FREE</p>
                <p className="text-xs text-shoe-cream-dim mt-0.5">
                  Poster earns {TIER_CREDITS[post.condition]} credit{TIER_CREDITS[post.condition] !== 1 ? "s" : ""} when claimed
                </p>
              </div>
            )}
          </div>

          {/* Description */}
          {post.description && (
            <p className="text-shoe-cream-dim text-sm leading-relaxed border-t border-shoe-border pt-4 mb-4">
              {post.description}
            </p>
          )}

          {/* Footer meta */}
          <div className="flex items-center justify-between text-xs text-shoe-cream-dim">
            <span>Posted by @{handle}</span>
            <span>{timeAgo(post.createdAt)}</span>
          </div>
        </div>

        {/* Offer form — shown to non-owners when active */}
        {isActive && !isOwner && session && (
          <div className="card-shoe mb-6">
            <p className="label-shoe mb-4">MAKE AN OFFER</p>

            <form action={submitOffer} className="space-y-4">
              <input type="hidden" name="postId" value={post.id} />
              <input
                type="hidden"
                name="type"
                value={
                  post.listingType === "SALE" ? "BUY"
                  : post.listingType === "TRADE" ? "TRADE"
                  : "ACCEPT_FREE"
                }
              />

              {post.listingType === "SALE" && (
                <div>
                  <label className="label-shoe mb-2 block">YOUR OFFER ($)</label>
                  <input
                    name="offerPrice"
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    className="input-shoe"
                    placeholder={post.askingPrice?.toFixed(2) ?? "0.00"}
                  />
                </div>
              )}

              {post.listingType === "TRADE" && (
                <div>
                  <label className="label-shoe mb-2 block">OFFER ONE OF YOUR LISTINGS</label>
                  {myListings.length === 0 ? (
                    <p className="text-shoe-cream-dim text-sm">
                      You have no active listings to trade.{" "}
                      <Link href={shoePath("/new")} className="text-shoe-accent underline">
                        Post a shoe first.
                      </Link>
                    </p>
                  ) : (
                    <select name="offerPostId" required className="select-shoe">
                      <option value="">Select a shoe to offer…</option>
                      {myListings.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.title} — {CONDITION_LABEL[l.condition]}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              <div>
                <label className="label-shoe mb-2 block">MESSAGE (optional)</label>
                <textarea
                  name="message"
                  rows={2}
                  className="input-shoe resize-none"
                  placeholder="Say hello…"
                />
              </div>

              {(post.listingType !== "TRADE" || myListings.length > 0) && (
                <button type="submit" className="btn-shoe-primary w-full">
                  {post.listingType === "FREE" ? "CLAIM THIS SHOE" : "SEND OFFER"}
                </button>
              )}
            </form>
          </div>
        )}

        {/* Sign-in prompt */}
        {isActive && !isOwner && !session && (
          <div className="card-shoe mb-6 text-center">
            <p className="text-shoe-cream mb-4">Sign in to make an offer.</p>
            <Link href="/auth/signin">
              <button className="btn-shoe-secondary">SIGN IN</button>
            </Link>
          </div>
        )}

        {/* Owner: view offers */}
        {isOwner && (
          <div className="card-shoe">
            <p className="label-shoe mb-4">
              OFFERS ({post.offers.filter((o) => o.status === "PENDING").length} pending)
            </p>

            {post.offers.length === 0 ? (
              <p className="text-shoe-cream-dim text-sm">No offers yet.</p>
            ) : (
              <div className="divide-y divide-shoe-border">
                {post.offers.map((offer) => {
                  const offerHandle = offer.offerUser.handle || offer.offerUser.username;
                  return (
                    <div key={offer.id} className="py-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-shoe-cream text-sm font-bold">
                            @{offerHandle}
                            <span className="text-shoe-cream-dim font-normal ml-2">
                              · {timeAgo(offer.createdAt)}
                            </span>
                          </p>
                          {offer.type === "BUY" && offer.offerPrice != null && (
                            <p className="text-shoe-accent font-bold mt-1">
                              Offering ${offer.offerPrice.toFixed(2)}
                            </p>
                          )}
                          {offer.type === "TRADE" && (
                            <p className="text-shoe-cream-dim text-xs mt-1">Trade offer</p>
                          )}
                          {offer.type === "ACCEPT_FREE" && (
                            <p className="text-shoe-tier-new text-xs font-bold mt-1">Claiming for free</p>
                          )}
                          {offer.message && (
                            <p className="text-shoe-cream-dim text-xs mt-2 italic">&ldquo;{offer.message}&rdquo;</p>
                          )}
                        </div>

                        {offer.status === "PENDING" && isActive && (
                          <div className="flex gap-2 flex-shrink-0">
                            <form action={acceptOffer.bind(null, offer.id)}>
                              <button type="submit" className="btn-shoe-primary text-xs px-4 py-2">
                                ACCEPT
                              </button>
                            </form>
                            <form action={declineOffer.bind(null, offer.id)}>
                              <button type="submit" className="btn-shoe-ghost text-xs px-4 py-2">
                                DECLINE
                              </button>
                            </form>
                          </div>
                        )}

                        {offer.status !== "PENDING" && (
                          <span className={`text-xs font-bold tracking-widest ${
                            offer.status === "ACCEPTED" ? "text-shoe-tier-new" : "text-shoe-cream-dim"
                          }`}>
                            {offer.status}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
