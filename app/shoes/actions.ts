"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { shoePath } from "@/lib/shoepath";

const TIER_CREDITS: Record<string, number> = {
  NEW: 4,
  LIKE_NEW: 3,
  LOVED: 2,
  WELL_LOVED: 1,
};

export async function createShoePost(formData: FormData) {
  const session = await getServerSession(authOptions);
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

  await prisma.shoePost.create({
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
    },
  });

  redirect(shoePath());
}

export async function submitOffer(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/auth/signin");

  const postId = formData.get("postId") as string;
  const type = formData.get("type") as string;
  const message = (formData.get("message") as string) || null;
  const offerPostId = (formData.get("offerPostId") as string) || null;
  const priceRaw = formData.get("offerPrice") as string | null;
  const offerPrice = priceRaw ? parseFloat(priceRaw) : null;

  await prisma.shoeOffer.create({
    data: {
      postId,
      offerUserId: session.user.id,
      type,
      message,
      offerPostId,
      offerPrice,
    },
  });
}

export async function acceptOffer(offerId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/auth/signin");

  const offer = await prisma.shoeOffer.findUnique({
    where: { id: offerId },
    include: { post: true },
  });

  if (!offer) throw new Error("Offer not found");
  if (offer.post.userId !== session.user.id) throw new Error("Not authorized");

  await prisma.$transaction(async (tx) => {
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
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/auth/signin");

  const offer = await prisma.shoeOffer.findUnique({
    where: { id: offerId },
    include: { post: { select: { userId: true, id: true } } },
  });

  if (!offer) throw new Error("Offer not found");
  if (offer.post.userId !== session.user.id) throw new Error("Not authorized");

  await prisma.shoeOffer.update({
    where: { id: offerId },
    data: { status: "DECLINED" },
  });

  redirect(shoePath(`/${offer.post.id}`));
}
