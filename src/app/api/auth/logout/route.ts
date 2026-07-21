import { NextResponse } from "next/server";
import {
  PORTAL_SESSION_COOKIE,
  portalSessionCookieOptions,
} from "@/lib/portal-session";

export async function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.set(PORTAL_SESSION_COOKIE, "", {
    ...portalSessionCookieOptions(0),
    maxAge: 0,
  });
  return response;
}
