import "server-only";

import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

export const PORTAL_SESSION_COOKIE = "irender_portal_session";

export type PortalSessionUser = {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
};

export type PortalSession = {
  accessToken: string;
  refreshToken: string;
  companySlug: string;
  companyId: string;
  /** RapidRender numeric company id (`rrCompanyId`). */
  rrCompanyId?: number | null;
  user: PortalSessionUser;
};

function sessionSecret() {
  const secret = process.env.PORTAL_SESSION_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error("PORTAL_SESSION_SECRET is not configured (min 16 chars)");
  }
  return secret;
}

function sign(payload: string) {
  return createHmac("sha256", sessionSecret()).update(payload).digest("base64url");
}

export function encodePortalSession(session: PortalSession): string {
  const payload = Buffer.from(JSON.stringify(session), "utf8").toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function decodePortalSession(raw: string | undefined | null): PortalSession | null {
  if (!raw) return null;
  const [payload, signature] = raw.split(".");
  if (!payload || !signature) return null;
  try {
    const expected = sign(payload);
    const a = Buffer.from(signature);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      return null;
    }
    return JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as PortalSession;
  } catch {
    return null;
  }
}

export async function getPortalSession(): Promise<PortalSession | null> {
  const jar = await cookies();
  return decodePortalSession(jar.get(PORTAL_SESSION_COOKIE)?.value);
}

export function portalSessionCookieOptions(maxAgeSeconds = 60 * 60 * 12) {
  return {
    httpOnly: true as const,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: maxAgeSeconds,
  };
}

export function publicSessionView(session: PortalSession) {
  return {
    authenticated: true as const,
    companySlug: session.companySlug,
    companyId: session.companyId,
    rrCompanyId: session.rrCompanyId ?? null,
    user: {
      id: session.user.id,
      username: session.user.username,
      email: session.user.email,
      firstName: session.user.firstName,
      lastName: session.user.lastName,
      displayName: `${session.user.firstName} ${session.user.lastName}`.trim(),
      roles: session.user.roles,
    },
  };
}
