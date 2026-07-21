"use client";

import { localizeCrmError, type CrmErrorBody } from "@/lib/crm-errors";
import { redirectToLoginOnUnauthorized } from "@/lib/auth-redirect";

export type PortalSessionView = {
  authenticated: true;
  companySlug: string;
  companyId: string;
  user: {
    id: string;
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    displayName: string;
    roles: string[];
  };
};

export class PortalCrmError extends Error {
  status: number;
  body: CrmErrorBody;

  constructor(message: string, status: number, body: CrmErrorBody = {}) {
    super(message);
    this.name = "PortalCrmError";
    this.status = status;
    this.body = body;
  }
}

type PortalCrmFetchOptions = {
  method?: string;
  /** JSON-serializable body, or FormData for multipart uploads */
  body?: unknown;
  searchParams?: Record<string, string | number | undefined | null>;
  router?: { replace: (href: string) => void };
};

export async function getPortalSessionView(): Promise<PortalSessionView | null> {
  const res = await fetch("/api/auth/session", { credentials: "include" });
  const data = await res.json().catch(() => ({}));
  if (!data?.authenticated) return null;
  return data as PortalSessionView;
}

/**
 * Authenticated CRM call via BFF proxy. On 401 redirects to login when router is provided.
 */
export async function portalCrmFetch<T>(
  path: string,
  options: PortalCrmFetchOptions = {},
): Promise<T> {
  const { method = "GET", body, searchParams, router } = options;
  const params = new URLSearchParams();
  if (searchParams) {
    for (const [key, value] of Object.entries(searchParams)) {
      if (value === undefined || value === null || value === "") continue;
      params.set(key, String(value));
    }
  }
  const qs = params.toString();
  const url = `/api/crm/${path.replace(/^\//, "")}${qs ? `?${qs}` : ""}`;

  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
  const res = await fetch(url, {
    method,
    credentials: "include",
    headers: body !== undefined && !isFormData ? { "Content-Type": "application/json" } : undefined,
    body:
      body === undefined
        ? undefined
        : isFormData
          ? (body as FormData)
          : JSON.stringify(body),
  });

  if (router && redirectToLoginOnUnauthorized(res.status, router)) {
    throw new PortalCrmError("Oturum gerekli.", 401);
  }

  if (!res.ok) {
    const contentType = res.headers.get("Content-Type") ?? "";
    if (contentType.includes("application/json")) {
      const errBody = (await res.json().catch(() => ({}))) as CrmErrorBody;
      throw new PortalCrmError(localizeCrmError(errBody, "İşlem şu an yapılamıyor."), res.status, errBody);
    }
    const text = await res.text().catch(() => "");
    throw new PortalCrmError(text || "İşlem şu an yapılamıyor.", res.status);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  const contentType = res.headers.get("Content-Type") ?? "";
  if (contentType.includes("application/json")) {
    return (await res.json()) as T;
  }
  // File upload and some CRM endpoints return plain text (URL string).
  return (await res.text()) as T;
}
