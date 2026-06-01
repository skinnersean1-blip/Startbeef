export const dynamic = "force-dynamic";

import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { shoeDb } from "@/lib/shoe-prisma";
import { getServerSession } from "next-auth";
import { shoeAuthOptions } from "@/lib/shoe-auth";
import { shoePath } from "@/lib/shoepath";
import { EditForm } from "./edit-form";

export default async function EditShoePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getServerSession(shoeAuthOptions);
  if (!session?.user?.id) redirect("/auth/signin");

  const post = await shoeDb.shoePost.findUnique({
    where: { id },
    select: {
      id: true,
      userId: true,
      title: true,
      brand: true,
      size: true,
      condition: true,
      description: true,
      askingPrice: true,
      listingType: true,
      images: true,
    },
  });

  if (!post || post.userId !== session.user.id) notFound();

  return (
    <div className="min-h-screen bg-shoe-bg">
      <header className="bg-shoe-bg-deep border-b border-shoe-border">
        <div className="container-shoe py-6 flex items-center justify-between">
          <div>
            <p className="label-shoe mb-1">EDIT LISTING</p>
            <h1 className="text-4xl font-bold text-shoe-cream tracking-tight">EDIT SHOE</h1>
          </div>
          <Link href={shoePath(`/${id}`)} className="btn-shoe-ghost">← BACK</Link>
        </div>
      </header>
      <main className="container-shoe py-8 max-w-2xl">
        <EditForm post={post} />
      </main>
    </div>
  );
}
