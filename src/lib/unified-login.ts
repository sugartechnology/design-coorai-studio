import { NextResponse } from "next/server";
import {
  encodePortalSession,
  PORTAL_SESSION_COOKIE,
  portalSessionCookieOptions,
  type PortalSession,
} from "@/lib/portal-session";

export type UnifiedCompanyOption = {
  companyId?: string;
  rapidRenderCompanyId?: number | null;
  name?: string;
  slug?: string | null;
  available?: boolean;
  status?: string | null;
};

export type UnifiedUser = {
  id?: string;
  companyId?: string;
  username?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  roles?: string[];
};

export type UnifiedLoginResponse = {
  status?: string;
  selectionToken?: string | null;
  companies?: UnifiedCompanyOption[];
  user?: UnifiedUser | null;
  redirectTo?: string | null;
  supportId?: string | null;
  errorCode?: string | null;
};

export function cookieHeaders(upstream: Response): string[] {
  if (typeof upstream.headers.getSetCookie === "function") {
    return upstream.headers.getSetCookie();
  }
  const single = upstream.headers.get("set-cookie");
  return single ? [single] : [];
}

function parseCookieValue(
  setCookieHeader: string,
): { name: string; value: string; maxAge: number | null } | null {
  const [pair, ...attrs] = setCookieHeader.split(";").map((part) => part.trim());
  if (!pair) return null;
  const eq = pair.indexOf("=");
  if (eq <= 0) return null;
  const name = pair.slice(0, eq).trim();
  const value = pair.slice(eq + 1).trim();
  let maxAge: number | null = null;
  for (const attr of attrs) {
    const [key, raw] = attr.split("=").map((part) => part.trim());
    if (key?.toLowerCase() === "max-age" && raw != null) {
      const parsed = Number(raw);
      if (Number.isFinite(parsed)) maxAge = parsed;
    }
  }
  return { name, value, maxAge };
}

function extractTokensFromCookies(
  setCookies: string[],
  preferredSlug?: string | null,
): { accessToken: string; refreshToken: string; companySlug: string } | null {
  const accessBySlug = new Map<string, string>();
  const refreshBySlug = new Map<string, string>();

  for (const header of setCookies) {
    const parsed = parseCookieValue(header);
    if (!parsed || !parsed.value || parsed.maxAge === 0) continue;
    if (parsed.name.startsWith("crm_token_")) {
      accessBySlug.set(parsed.name.slice("crm_token_".length), parsed.value);
    } else if (parsed.name === "crm_token") {
      accessBySlug.set("", parsed.value);
    } else if (parsed.name.startsWith("crm_refresh_")) {
      refreshBySlug.set(parsed.name.slice("crm_refresh_".length), parsed.value);
    } else if (parsed.name === "crm_refresh") {
      refreshBySlug.set("", parsed.value);
    }
  }

  const preferred = preferredSlug?.trim().toLowerCase() ?? "";
  const slugCandidates = [
    preferred,
    ...accessBySlug.keys(),
    ...refreshBySlug.keys(),
  ].filter((slug, index, all) => all.indexOf(slug) === index);

  for (const slug of slugCandidates) {
    const accessToken = accessBySlug.get(slug);
    const refreshToken = refreshBySlug.get(slug);
    if (accessToken && refreshToken) {
      return {
        accessToken,
        refreshToken,
        companySlug: slug || preferred || "unknown",
      };
    }
  }
  return null;
}

function slugFromRedirectTo(redirectTo?: string | null): string | null {
  if (!redirectTo) return null;
  const match = redirectTo.match(/^\/([^/?#]+)/);
  return match?.[1] ?? null;
}

export function unifiedErrorMessage(errorCode?: string | null): string {
  switch (errorCode) {
    case "LOGIN_RATE_LIMITED":
      return "Çok fazla deneme. Lütfen kısa süre sonra tekrar deneyin.";
    case "AUTH_SERVICE_UNAVAILABLE":
      return "Giriş servisine şu anda ulaşılamıyor.";
    case "LOGIN_SELECTION_EXPIRED":
      return "Şirket seçimi süresi doldu. Tekrar giriş yapın.";
    case "COMPANY_ACCESS_DENIED":
      return "Bu şirkete erişim yetkiniz yok.";
    case "RR_TRANSFER_REQUIRED":
      return "Bu hesap için ek aktarım gerekiyor. Lütfen CRM giriş ekranını kullanın.";
    default:
      return "Giriş bilgileri hatalı.";
  }
}

export function buildPortalSessionFromUnified(
  data: UnifiedLoginResponse,
  setCookies: string[],
  identifierFallback: string,
): PortalSession | null {
  if (data.status !== "AUTHENTICATED" || !data.user?.id || !data.user.companyId) {
    return null;
  }
  const tokens = extractTokensFromCookies(
    setCookies,
    slugFromRedirectTo(data.redirectTo),
  );
  if (!tokens) return null;

  const rrFromMatch = data.companies?.find(
    (company) => company.companyId === data.user?.companyId,
  )?.rapidRenderCompanyId;
  const rrFallback = data.companies?.find(
    (company) => company.rapidRenderCompanyId != null,
  )?.rapidRenderCompanyId;
  const rrCompanyId = rrFromMatch ?? rrFallback ?? null;

  return {
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    companySlug: tokens.companySlug,
    companyId: data.user.companyId,
    rrCompanyId:
      typeof rrCompanyId === "number" && Number.isFinite(rrCompanyId)
        ? rrCompanyId
        : null,
    user: {
      id: data.user.id,
      username: data.user.username ?? identifierFallback,
      email: data.user.email ?? "",
      firstName: data.user.firstName ?? "",
      lastName: data.user.lastName ?? "",
      roles: data.user.roles ?? [],
    },
  };
}

export function portalSessionSuccessResponse(session: PortalSession) {
  const response = NextResponse.json({
    success: true,
    status: "AUTHENTICATED",
    user: {
      firstName: session.user.firstName,
      lastName: session.user.lastName,
      displayName: `${session.user.firstName} ${session.user.lastName}`.trim(),
    },
    companySlug: session.companySlug,
  });
  response.cookies.set(
    PORTAL_SESSION_COOKIE,
    encodePortalSession(session),
    portalSessionCookieOptions(),
  );
  return response;
}
