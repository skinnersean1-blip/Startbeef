// lib/shoepath.ts
// Shoe-Shoe pages use this for all internal links so they work on both
// shoe-shoe.com (NEXT_PUBLIC_SHOE_BASE="") and the beef domain ("/shoes").
const SHOE_ROOT = process.env.NEXT_PUBLIC_SHOE_BASE ?? "/shoes";

export function shoePath(subpath: string = ""): string {
  if (!subpath || subpath === "/") return SHOE_ROOT || "/";
  return `${SHOE_ROOT}${subpath}`;
}
