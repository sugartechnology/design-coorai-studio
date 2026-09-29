import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { readForcePasswordChange } from "@/lib/portal-session-edge";
import { getTemplateByHost } from "@/lib/templates/catalog";

/** Same name as `PORTAL_SESSION_COOKIE` in portal-session.ts (Edge-safe). */
const SESSION_COOKIE = "irender_portal_session";

function isPublicPath(pathname: string): boolean {
  if (pathname === "/login" || pathname.startsWith("/login/")) return true;
  if (pathname === "/ai/upload" || pathname.startsWith("/ai/upload/")) return true;
  if (pathname.startsWith("/api/")) return true;
  return false;
}

function isPasswordChangePath(pathname: string): boolean {
  return pathname === "/sifre" || pathname.startsWith("/sifre/");
}

function hasSessionCookie(request: NextRequest): boolean {
  const raw = request.cookies.get(SESSION_COOKIE)?.value?.trim();
  return Boolean(raw && raw.includes("."));
}

function requestHost(request: NextRequest): string | null {
  const forwarded = request.headers.get("x-forwarded-host");
  return forwarded?.split(",")[0]?.trim() || request.headers.get("host");
}

function redirectTo(request: NextRequest, pathname: string) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = "";
  return NextResponse.redirect(url);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/favicon.ico") {
    const brand = getTemplateByHost(requestHost(request));
    return NextResponse.rewrite(new URL(brand.assets.faviconUrl, request.url));
  }

  const sessionRaw = request.cookies.get(SESSION_COOKIE)?.value;
  const forcePasswordChange = await readForcePasswordChange(sessionRaw);

  if (
    forcePasswordChange &&
    !isPasswordChangePath(pathname) &&
    !isPublicPath(pathname)
  ) {
    return redirectTo(request, "/sifre");
  }

  if (isPasswordChangePath(pathname)) {
    if (!hasSessionCookie(request)) {
      return redirectTo(request, "/login");
    }
    if (!forcePasswordChange) {
      return redirectTo(request, "/");
    }
    return NextResponse.next();
  }

  if (isPublicPath(pathname) || hasSessionCookie(request)) {
    return NextResponse.next();
  }
  return redirectTo(request, "/login");
}

export const config = {
  matcher: [
    "/favicon.ico",
    "/((?!_next/static|_next/image|brands|.*\\..*).*)",
  ],
};
