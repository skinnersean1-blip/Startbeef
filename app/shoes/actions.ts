"use server";

import { shoeDb } from "@/lib/shoe-prisma";
import { getServerSession } from "next-auth";
import { shoeAuthOptions } from "@/lib/shoe-auth";
import { redirect } from "next/navigation";
import { shoePath } from "@/lib/shoepath";
import { Resend } from "resend";

const TIER_CREDITS: Record<string, number> = {
  NEW: 4,
  LIKE_NEW: 3,
  LOVED: 2,
  WELL_LOVED: 1,
};

export async function createShoePost(formData: FormData) {
  const session = await getServerSession(shoeAuthOptions);
  if (!session?.user?.id) redirect("/auth/signin");

  const title = formData.get("title") as string;
  const listingKind = formData.get("listingKind") as string;
  const listingType = formData.get("listingType") as string;
  const brand = (formData.get("brand") as string) || null;
  const size = formData.get("size") as string;
  const condition = formData.get("condition") as string;
  const description = (formData.get("description") as string) || null;
  const priceRaw = formData.get("askingPrice") as string | null;
  const askingPrice = priceRaw && listingType === "SALE" ? parseFloat(priceRaw) : null;
  const images = (formData.get("images") as string) || null;

  await shoeDb.shoePost.create({
    data: {
      userId: session.user.id,
      title,
      listingKind,
      listingType,
      brand,
      size,
      condition,
      description,
      askingPrice,
      images,
    },
  });

  redirect(shoePath());
}

export async function updateShoePost(postId: string, formData: FormData) {
  const session = await getServerSession(shoeAuthOptions);
  if (!session?.user?.id) redirect("/auth/signin");

  const post = await shoeDb.shoePost.findUnique({
    where: { id: postId },
    select: { userId: true, listingType: true },
  });

  if (!post || post.userId !== session.user.id) throw new Error("Not authorized");

  const title = formData.get("title") as string;
  const brand = (formData.get("brand") as string) || null;
  const size = formData.get("size") as string;
  const condition = formData.get("condition") as string;
  const description = (formData.get("description") as string) || null;
  const priceRaw = formData.get("askingPrice") as string | null;
  const askingPrice = priceRaw && post.listingType === "SALE" ? parseFloat(priceRaw) : null;
  const images = (formData.get("images") as string) || null;

  await shoeDb.shoePost.update({
    where: { id: postId },
    data: { title, brand, size, condition, description, askingPrice, images },
  });

  redirect(shoePath(`/${postId}`));
}

export async function deleteShoePost(postId: string) {
  const session = await getServerSession(shoeAuthOptions);
  if (!session?.user?.id) redirect("/auth/signin");

  const post = await shoeDb.shoePost.findUnique({
    where: { id: postId },
    select: { userId: true },
  });

  if (!post || post.userId !== session.user.id) throw new Error("Not authorized");

  await shoeDb.shoePost.delete({ where: { id: postId } });
  redirect(shoePath());
}

export async function submitOffer(formData: FormData) {
  const session = await getServerSession(shoeAuthOptions);
  if (!session?.user?.id) redirect("/auth/signin");

  const postId = formData.get("postId") as string;
  const type = formData.get("type") as string;
  const message = (formData.get("message") as string) || null;
  const offerPostId = (formData.get("offerPostId") as string) || null;
  const priceRaw = formData.get("offerPrice") as string | null;
  const offerPrice = priceRaw ? parseFloat(priceRaw) : null;

  const [post, offerMaker] = await Promise.all([
    shoeDb.shoePost.findUnique({
      where: { id: postId },
      include: { user: { select: { email: true, handle: true, username: true } } },
    }),
    shoeDb.user.findUnique({
      where: { id: session.user.id },
      select: { handle: true, username: true },
    }),
  ]);

  if (!post) throw new Error("Post not found");

  await shoeDb.shoeOffer.create({
    data: { postId, offerUserId: session.user.id, type, message, offerPostId, offerPrice },
  });

  // Email the listing owner — fire-and-forget, never fail the action
  if (post.user.email) {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const ownerHandle = post.user.handle ?? post.user.username;
      const senderHandle = offerMaker?.handle ?? offerMaker?.username ?? "Someone";
      const postUrl = `${process.env.NEXTAUTH_URL ?? "https://shoe-shoe.com"}/shoes/${postId}`;
      const offerDesc =
        type === "BUY" && offerPrice != null ? `offering $${offerPrice.toFixed(2)}`
        : type === "TRADE" ? "made a trade offer"
        : "wants to claim your free listing";

      await resend.emails.send({
        from: "Shoe Shoe <noreply@shoe-shoe.com>",
        to: post.user.email,
        subject: `New offer on "${post.title}"`,
        html: `
          <div style="font-family:monospace;max-width:480px;margin:0 auto;padding:32px;background:#2C5E78;color:#FFF8DC;">
            <h1 style="font-size:28px;font-weight:bold;letter-spacing:-1px;margin-bottom:8px;">SHOE SHOE</h1>
            <p style="font-size:11px;letter-spacing:2px;color:#7AAEC4;margin-bottom:32px;">BUY, SWAP, SELL</p>
            <p style="margin-bottom:8px;">Hey @${ownerHandle},</p>
            <p style="margin-bottom:24px;"><strong>@${senderHandle}</strong> is ${offerDesc} on <strong>${post.title}</strong>.</p>
            ${message ? `<p style="margin-bottom:24px;color:#c8d8e4;font-style:italic;">"${message}"</p>` : ""}
            <a href="${postUrl}" style="display:inline-block;border:1px solid #FFD45C;color:#FFD45C;padding:12px 24px;text-decoration:none;font-size:12px;letter-spacing:2px;font-weight:bold;">
              VIEW OFFER →
            </a>
          </div>
        `,
      });
    } catch (e) {
      console.error("Offer notification email failed:", e);
    }
  }
}

export async function acceptOffer(offerId: string) {
  const session = await getServerSession(shoeAuthOptions);
  if (!session?.user?.id) redirect("/auth/signin");

  const offer = await shoeDb.shoeOffer.findUnique({
    where: { id: offerId },
    include: { post: true },
  });

  if (!offer) throw new Error("Offer not found");
  if (offer.post.userId !== session.user.id) throw new Error("Not authorized");

  await shoeDb.$transaction(async (tx) => {
    await tx.shoeOffer.update({
      where: { id: offerId },
      data: { status: "ACCEPTED" },
    });

    await tx.shoeOffer.updateMany({
      where: { postId: offer.postId, id: { not: offerId }, status: "PENDING" },
      data: { status: "DECLINED" },
    });

    const newStatus =
      offer.type === "ACCEPT_FREE" ? "GIVEN"
      : offer.type === "TRADE"     ? "TRADED"
      :                               "SOLD";

    await tx.shoePost.update({
      where: { id: offer.postId },
      data: { status: newStatus },
    });

    if (offer.type === "ACCEPT_FREE") {
      const credits = TIER_CREDITS[offer.post.condition] ?? 1;
      await tx.user.update({
        where: { id: offer.post.userId },
        data: { credits: { increment: credits } },
      });
    }
  });

  redirect(shoePath(`/${offer.postId}`));
}

export async function declineOffer(offerId: string) {
  const session = await getServerSession(shoeAuthOptions);
  if (!session?.user?.id) redirect("/auth/signin");

  const offer = await shoeDb.shoeOffer.findUnique({
    where: { id: offerId },
    include: { post: { select: { userId: true, id: true } } },
  });

  if (!offer) throw new Error("Offer not found");
  if (offer.post.userId !== session.user.id) throw new Error("Not authorized");

  await shoeDb.shoeOffer.update({
    where: { id: offerId },
    data: { status: "DECLINED" },
  });

  redirect(shoePath(`/${offer.post.id}`));
}
