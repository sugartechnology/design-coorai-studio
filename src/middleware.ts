import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

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

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (isPublicPath(pathname) || hasSessionCookie(request)) {
    return NextResponse.next();
  }
  const login = request.nextUrl.clone();
  login.pathname = "/login";
  login.search = "";
  return NextResponse.redirect(login);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|brands|.*\\..*).*)"],
};
