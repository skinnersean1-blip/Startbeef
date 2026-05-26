import { NextRequest, NextResponse } from "next/server";

const SHOE_HOSTS = new Set(["shoe-shoe.com", "www.shoe-shoe.com"]);

export function middleware(request: NextRequest) {
  const host = request.headers.get("host") ?? "";
  if (!SHOE_HOSTS.has(host)) return NextResponse.next();

  const { pathname } = request.nextUrl;

  // Pass through Next.js internals
  if (pathname.startsWith("/_next")) return NextResponse.next();

  // Rewrite auth API calls to the shoe-specific NextAuth endpoint
  if (pathname.startsWith("/api/auth")) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.replace("/api/auth", "/api/shoe-auth");
    return NextResponse.rewrite(url);
  }

  // Rewrite registration to shoe-specific endpoint
  if (pathname === "/api/auth/register") {
    const url = request.nextUrl.clone();
    url.pathname = "/api/shoe-auth/register";
    return NextResponse.rewrite(url);
  }

  // Pass other API and auth page routes through unchanged
  if (pathname.startsWith("/api") || pathname.startsWith("/auth")) {
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
