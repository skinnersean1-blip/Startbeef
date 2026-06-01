"use client";

import { deleteShoePost } from "../actions";

export function DeleteButton({ postId }: { postId: string }) {
  const handleDelete = async () => {
    if (!confirm("Delete this listing? This cannot be undone.")) return;
    await deleteShoePost(postId);
  };

  return (
    <button
      onClick={handleDelete}
      className="btn-shoe-ghost text-xs px-4 py-2 border-red-800 text-red-400 hover:border-red-600 hover:text-red-300 transition-colors"
    >
      DELETE LISTING
    </button>
  );
}
