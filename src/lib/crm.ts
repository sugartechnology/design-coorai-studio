import "server-only";

const crmApiUrl = process.env.CRM_API_URL;

export const companySlug = process.env.CRM_COMPANY_SLUG ?? "istikbal";

export function crmUrl(path: string) {
  if (!crmApiUrl) {
    throw new Error("CRM_API_URL is not configured");
  }

  return new URL(path.replace(/^\//, ""), `${crmApiUrl.replace(/\/$/, "")}/`);
}

export function crmHeaders(headers?: HeadersInit): HeadersInit {
  return {
    Accept: "application/json",
    "X-Company-Slug": companySlug,
    ...headers,
  };
}

export async function crmFetch(
  path: string,
  init?: RequestInit & { companySlugOverride?: string },
) {
  const { companySlugOverride, headers, ...rest } = init ?? {};
  return fetch(crmUrl(path), {
    ...rest,
    headers: {
      ...crmHeaders({
        "Content-Type": "application/json",
        ...(companySlugOverride
          ? { "X-Company-Slug": companySlugOverride }
          : {}),
        ...headers,
      }),
    },
    cache: "no-store",
  });
}
