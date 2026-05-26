import { NextRequest, NextResponse } from "next/server";

const SHOE_HOSTS = new Set(["shoe-shoe.com", "www.shoe-shoe.com"]);

export function middleware(request: NextRequest) {
  const host = request.headers.get("host") ?? "";
  if (!SHOE_HOSTS.has(host)) return NextResponse.next();

  const { pathname } = request.nextUrl;

  // Pass through Next.js internals, auth, and api routes
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/auth")
  ) {
    return NextResponse.next();
  }

  // Already rooted under /shoes — serve directly (handles post-redirect navigations)
  if (pathname.startsWith("/shoes")) return NextResponse.next();

  // Rewrite everything else: / → /shoes, /new → /shoes/new, /:id → /shoes/:id
  const url = request.nextUrl.clone();
  url.pathname = pathname === "/" ? "/shoes" : `/shoes${pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
