import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getTemplateByHost } from "@/lib/templates/catalog";

/** Same name as `PORTAL_SESSION_COOKIE` in portal-session.ts (Edge-safe). */
const SESSION_COOKIE = "irender_portal_session";

function isPublicPath(pathname: string): boolean {
  if (pathname === "/login" || pathname.startsWith("/login/")) return true;
  if (pathname === "/ai/upload" || pathname.startsWith("/ai/upload/")) return true;
  if (pathname.startsWith("/api/")) return true;
  return false;
}

function hasSessionCookie(request: NextRequest): boolean {
  const raw = request.cookies.get(SESSION_COOKIE)?.value?.trim();
  return Boolean(raw && raw.includes("."));
}

function requestHost(request: NextRequest): string | null {
  const forwarded = request.headers.get("x-forwarded-host");
  return forwarded?.split(",")[0]?.trim() || request.headers.get("host");
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/favicon.ico") {
    const brand = getTemplateByHost(requestHost(request));
    return NextResponse.rewrite(new URL(brand.assets.faviconUrl, request.url));
  }

  if (isPublicPath(pathname) || hasSessionCookie(request)) {
    return NextResponse.next();
  }
  const login = request.nextUrl.clone();
  login.pathname = "/login";
  login.search = "";
  return NextResponse.redirect(login);
}

export const config = {
  matcher: [
    "/favicon.ico",
    "/((?!_next/static|_next/image|brands|.*\\..*).*)",
  ],
};
