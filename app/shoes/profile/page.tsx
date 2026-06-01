export const dynamic = "force-dynamic";

import Link from "next/link";
import { redirect } from "next/navigation";
import { shoeDb } from "@/lib/shoe-prisma";
import { getServerSession } from "next-auth";
import { shoeAuthOptions } from "@/lib/shoe-auth";
import { shoePath } from "@/lib/shoepath";
import { SignOutButton } from "../components/sign-out-button";
import { DeleteButton } from "../components/delete-button";

const CONDITION_LABEL: Record<string, string> = {
  NEW: "New", LIKE_NEW: "Like New", LOVED: "Loved", WELL_LOVED: "Well Loved",
};

const STATUS_COLOR: Record<string, string> = {
  ACTIVE:  "text-shoe-tier-new border-shoe-tier-new",
  SOLD:    "text-shoe-accent border-shoe-accent",
  TRADED:  "text-shoe-tier-likenew border-shoe-tier-likenew",
  GIVEN:   "text-shoe-tier-loved border-shoe-tier-loved",
};

function timeAgo(date: Date) {
  const s = Math.floor((Date.now() - date.getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export default async function ProfilePage() {
  const session = await getServerSession(shoeAuthOptions);
  if (!session?.user?.id) redirect("/auth/signin");

  const [user, myPosts, offersMade] = await Promise.all([
    shoeDb.user.findUnique({
      where: { id: session.user.id },
      select: { handle: true, username: true, credits: true, email: true },
    }),
    shoeDb.shoePost.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      include: {
        offers: { where: { status: "PENDING" } },
      },
    }),
    shoeDb.shoeOffer.findMany({
      where: { offerUserId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 30,
      include: {
        post: { select: { id: true, title: true, status: true } },
      },
    }),
  ]);

  const handle = user?.handle ?? user?.username ?? "you";
  const activePosts  = myPosts.filter((p) => p.status === "ACTIVE");
  const closedPosts  = myPosts.filter((p) => p.status !== "ACTIVE");

  return (
    <div className="min-h-screen bg-shoe-bg">

      <header className="bg-shoe-bg-deep border-b border-shoe-border">
        <div className="container-shoe py-5 flex items-center justify-between gap-4 flex-wrap">
          <Link href={shoePath()} className="btn-shoe-ghost">← SHOE SHOE</Link>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-shoe-cream font-bold tracking-widest">@{handle}</p>
              <p className="text-xs text-shoe-cream-dim tracking-widest">{user?.credits ?? 0} credits</p>
            </div>
            <SignOutButton />
            <Link href={shoePath("/new")} className="btn-shoe-primary">+ POST A SHOE</Link>
          </div>
        </div>
      </header>

      <main className="container-shoe py-8 space-y-10">

        {/* Active listings */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-shoe-cream tracking-tight">
              MY LISTINGS <span className="text-shoe-cream-dim font-normal text-base">({activePosts.length} active)</span>
            </h2>
          </div>

          {activePosts.length === 0 ? (
            <div className="border border-shoe-border p-8 text-center">
              <p className="text-shoe-cream-dim text-sm tracking-widest mb-4">NO ACTIVE LISTINGS</p>
              <Link href={shoePath("/new")} className="btn-shoe-primary">POST YOUR FIRST SHOE</Link>
            </div>
          ) : (
            <div className="divide-y divide-shoe-border border border-shoe-border">
              {activePosts.map((post) => {
                let thumbUrl: string | null = null;
                try { thumbUrl = JSON.parse(post.images || "[]")[0] ?? null; } catch {}

                return (
                  <div key={post.id} className="flex items-center gap-4 p-4 bg-shoe-panel">
                    {thumbUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={thumbUrl} alt="" className="w-14 h-14 object-cover border border-shoe-border flex-shrink-0" />
                    ) : (
                      <div className="w-14 h-14 bg-shoe-bg-deep border border-shoe-border flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <Link href={shoePath(`/${post.id}`)} className="font-bold text-shoe-cream hover:text-shoe-accent transition-colors text-sm leading-snug line-clamp-1">
                        {post.title}
                      </Link>
                      <p className="text-xs text-shoe-cream-dim mt-0.5">
                        Sz {post.size} · {CONDITION_LABEL[post.condition]} · {timeAgo(post.createdAt)}
                      </p>
                      {post.offers.length > 0 && (
                        <p className="text-xs text-shoe-accent font-bold mt-0.5">
                          {post.offers.length} pending offer{post.offers.length !== 1 ? "s" : ""}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Link href={shoePath(`/${post.id}/edit`)} className="btn-shoe-ghost text-xs px-3 py-1.5">
                        EDIT
                      </Link>
                      <DeleteButton postId={post.id} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Offers I've made */}
        {offersMade.length > 0 && (
          <section>
            <h2 className="text-xl font-bold text-shoe-cream tracking-tight mb-4">MY OFFERS</h2>
            <div className="divide-y divide-shoe-border border border-shoe-border">
              {offersMade.map((offer) => (
                <div key={offer.id} className="flex items-center justify-between gap-4 p-4 bg-shoe-panel">
                  <div className="flex-1 min-w-0">
                    <Link href={shoePath(`/${offer.post.id}`)} className="font-bold text-shoe-cream hover:text-shoe-accent transition-colors text-sm line-clamp-1">
                      {offer.post.title}
                    </Link>
                    <p className="text-xs text-shoe-cream-dim mt-0.5">{timeAgo(offer.createdAt)}</p>
                  </div>
                  <span className={`text-xs font-bold tracking-widest border px-2 py-1 flex-shrink-0 ${
                    offer.status === "ACCEPTED" ? "text-shoe-tier-new border-shoe-tier-new"
                    : offer.status === "DECLINED" ? "text-shoe-cream-dim border-shoe-border"
                    : "text-shoe-accent border-shoe-accent"
                  }`}>
                    {offer.status}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Closed listings */}
        {closedPosts.length > 0 && (
          <section>
            <h2 className="text-xl font-bold text-shoe-cream tracking-tight mb-4">
              HISTORY <span className="text-shoe-cream-dim font-normal text-base">({closedPosts.length})</span>
            </h2>
            <div className="divide-y divide-shoe-border border border-shoe-border">
              {closedPosts.map((post) => (
                <div key={post.id} className="flex items-center justify-between gap-4 p-4 bg-shoe-panel">
                  <div className="flex-1 min-w-0">
                    <Link href={shoePath(`/${post.id}`)} className="font-bold text-shoe-cream hover:text-shoe-accent transition-colors text-sm line-clamp-1">
                      {post.title}
                    </Link>
                    <p className="text-xs text-shoe-cream-dim mt-0.5">Sz {post.size} · {timeAgo(post.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`text-xs font-bold tracking-widest border px-2 py-1 ${STATUS_COLOR[post.status] ?? "text-shoe-cream-dim border-shoe-border"}`}>
                      {post.status}
                    </span>
                    <DeleteButton postId={post.id} />
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

      </main>

      <footer className="container-shoe py-8 border-t border-shoe-border">
        <div className="flex justify-between items-center">
          <p className="text-shoe-cream-dim text-xs tracking-widest">© 2026 SHOE SHOE. WHERE TINY FEET FIND THEIR MATCH.</p>
          <Link href="/" className="text-shoe-cream-dim text-xs tracking-widest hover:text-shoe-accent transition-colors">← BACK TO HOME</Link>
        </div>
      </footer>
    </div>
  );
}
