import "server-only";

import { getPortalTemplate } from "@/lib/templates/provider";

const crmApiUrl = process.env.CRM_API_URL;

/** Env fallback only. Unauth CRM calls use the host template companySlug. */
export const companySlug = process.env.CRM_COMPANY_SLUG ?? "istikbal";

export function crmUrl(path: string) {
  if (!crmApiUrl) {
    throw new Error("CRM_API_URL is not configured");
  }

  return new URL(path.replace(/^\//, ""), `${crmApiUrl.replace(/\/$/, "")}/`);
}

export async function resolveCompanySlug(): Promise<string> {
  const template = await getPortalTemplate();
  return template.companySlug || companySlug;
}

export async function crmHeaders(headers?: HeadersInit): Promise<HeadersInit> {
  const slug = await resolveCompanySlug();
  return {
    Accept: "application/json",
    "X-Company-Slug": slug,
    ...headers,
  };
}

export async function crmFetch(
  path: string,
  init?: RequestInit & { companySlugOverride?: string },
) {
  const { companySlugOverride, headers, ...rest } = init ?? {};
  const slug = companySlugOverride ?? (await resolveCompanySlug());
  return fetch(crmUrl(path), {
    ...rest,
    headers: await crmHeaders({
      "Content-Type": "application/json",
      "X-Company-Slug": slug,
      ...(headers ?? {}),
    }),
  });
}
