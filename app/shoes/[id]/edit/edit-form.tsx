"use client";

import { useState, useRef } from "react";
import { updateShoePost } from "../../actions";
import { shoePath } from "@/lib/shoepath";

const CONDITIONS = [
  { key: "NEW",        label: "New",        credits: 4, desc: "Unworn, tags on or near-perfect" },
  { key: "LIKE_NEW",   label: "Like New",   credits: 3, desc: "Worn briefly, minimal wear" },
  { key: "LOVED",      label: "Loved",      credits: 2, desc: "Visible wear, still great shape" },
  { key: "WELL_LOVED", label: "Well Loved", credits: 1, desc: "Heavy wear, functional but worn" },
];

const CONDITION_COLOR: Record<string, string> = {
  NEW:        "border-shoe-tier-new text-shoe-tier-new",
  LIKE_NEW:   "border-shoe-tier-likenew text-shoe-tier-likenew",
  LOVED:      "border-shoe-tier-loved text-shoe-tier-loved",
  WELL_LOVED: "border-shoe-tier-wellloved text-shoe-tier-wellloved",
};

const SIZES = [
  "0","1","2","3","4","5","6","7","8",
  "1T","2T","3T","4T","5T",
  "6C","7C","8C","9C","10C","11C","12C","13C",
  "1Y","2Y","3Y","4Y","5Y",
];

type Post = {
  id: string;
  title: string;
  brand: string | null;
  size: string;
  condition: string;
  description: string | null;
  askingPrice: number | null;
  listingType: string;
  images: string | null;
};

export function EditForm({ post }: { post: Post }) {
  const [condition, setCondition] = useState(post.condition);
  const [existingImages, setExistingImages] = useState<string[]>(() => {
    try { return JSON.parse(post.images || "[]"); } catch { return []; }
  });
  const [newImages, setNewImages]   = useState<File[]>([]);
  const [newPreviews, setNewPreviews] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  const totalImages = existingImages.length + newImages.length;

  const removeExisting = (i: number) =>
    setExistingImages((prev) => prev.filter((_, idx) => idx !== i));

  const handleImageAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const toAdd = files.slice(0, 5 - totalImages);
    setNewImages((prev) => [...prev, ...toAdd]);
    setNewPreviews((prev) => [...prev, ...toAdd.map((f) => URL.createObjectURL(f))]);
    e.target.value = "";
  };

  const removeNew = (i: number) => {
    URL.revokeObjectURL(newPreviews[i]);
    setNewImages((prev) => prev.filter((_, idx) => idx !== i));
    setNewPreviews((prev) => prev.filter((_, idx) => idx !== i));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const uploadedUrls: string[] = [];
      for (const file of newImages) {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/auth/upload", { method: "POST", body: fd });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || `Upload failed (${res.status})`);
        }
        const { url } = await res.json();
        uploadedUrls.push(url);
      }

      if (!formRef.current) throw new Error("Form not found");
      const formData = new FormData(formRef.current);
      const finalImages = [...existingImages, ...uploadedUrls];
      formData.set("images", finalImages.length > 0 ? JSON.stringify(finalImages) : "");

      await updateShoePost(post.id, formData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-8">

      {/* Condition */}
      <div className="card-shoe">
        <p className="label-shoe mb-4">CONDITION</p>
        <div className="grid grid-cols-2 gap-3">
          {CONDITIONS.map((c) => (
            <label key={c.key} className="cursor-pointer">
              <input
                type="radio"
                name="condition"
                value={c.key}
                className="sr-only"
                defaultChecked={post.condition === c.key}
                onChange={() => setCondition(c.key)}
              />
              <div className={`border-2 p-4 transition-colors ${
                condition === c.key
                  ? `${CONDITION_COLOR[c.key]} bg-shoe-bg-deep`
                  : "border-shoe-border hover:border-shoe-cream"
              }`}>
                <div className="flex items-center justify-between mb-1">
                  <p className={`font-bold text-sm ${
                    condition === c.key ? CONDITION_COLOR[c.key].split(" ")[1] : "text-shoe-cream"
                  }`}>{c.label}</p>
                  <span className="text-xs text-shoe-cream-dim">{c.credits} cr</span>
                </div>
                <p className="text-xs text-shoe-cream-dim">{c.desc}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Details */}
      <div className="card-shoe space-y-4">
        <p className="label-shoe">SHOE DETAILS</p>
        <div>
          <label className="label-shoe mb-2 block">TITLE *</label>
          <input name="title" required defaultValue={post.title} className="input-shoe" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label-shoe mb-2 block">BRAND</label>
            <input name="brand" defaultValue={post.brand ?? ""} className="input-shoe" />
          </div>
          <div>
            <label className="label-shoe mb-2 block">SIZE *</label>
            <select name="size" required defaultValue={post.size} className="select-shoe">
              <option value="">Select size…</option>
              {SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
        {post.listingType === "SALE" && (
          <div>
            <label className="label-shoe mb-2 block">ASKING PRICE ($) *</label>
            <input
              name="askingPrice"
              type="number"
              min="0"
              step="0.01"
              required
              defaultValue={post.askingPrice ?? ""}
              className="input-shoe"
            />
          </div>
        )}
        <div>
          <label className="label-shoe mb-2 block">DESCRIPTION</label>
          <textarea
            name="description"
            rows={3}
            defaultValue={post.description ?? ""}
            className="input-shoe resize-none"
          />
        </div>
      </div>

      {/* Photos */}
      <div className="card-shoe space-y-4">
        <div className="flex items-center justify-between">
          <p className="label-shoe">PHOTOS</p>
          <p className="text-xs text-shoe-cream-dim">{totalImages} / 5</p>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {existingImages.map((url, i) => (
            <div key={`e-${i}`} className="relative aspect-square">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="w-full h-full object-cover border border-shoe-border" />
              <button
                type="button"
                onClick={() => removeExisting(i)}
                className="absolute top-1 right-1 bg-shoe-bg-deep border border-shoe-border text-shoe-cream-dim hover:text-shoe-accent text-xs px-1.5 py-0.5 transition-colors leading-none"
              >✕</button>
            </div>
          ))}
          {newPreviews.map((src, i) => (
            <div key={`n-${i}`} className="relative aspect-square">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="w-full h-full object-cover border border-shoe-border" />
              <button
                type="button"
                onClick={() => removeNew(i)}
                className="absolute top-1 right-1 bg-shoe-bg-deep border border-shoe-border text-shoe-cream-dim hover:text-shoe-accent text-xs px-1.5 py-0.5 transition-colors leading-none"
              >✕</button>
            </div>
          ))}
          {totalImages < 5 && (
            <label className="aspect-square border-2 border-dashed border-shoe-border hover:border-shoe-cream flex flex-col items-center justify-center cursor-pointer transition-colors">
              <input type="file" accept="image/*" multiple className="sr-only" onChange={handleImageAdd} />
              <span className="text-shoe-cream-dim text-3xl leading-none">+</span>
              <span className="text-shoe-cream-dim text-xs mt-1 tracking-widest">ADD PHOTO</span>
            </label>
          )}
        </div>
        <p className="text-xs text-shoe-cream-dim">Up to 5 photos · JPG, PNG · Max 5MB each</p>
      </div>

      {error && (
        <div className="border border-red-500 text-red-400 px-4 py-3 text-sm">{error}</div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="btn-shoe-primary w-full py-4 text-base disabled:opacity-50"
      >
        {submitting ? "SAVING..." : "SAVE CHANGES"}
      </button>
    </form>
  );
}
