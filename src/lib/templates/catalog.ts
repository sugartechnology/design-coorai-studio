import type { PortalTemplate } from "./schema";
import { normalizeHost, parsePortalTemplate } from "./schema";
import bellonaJson from "./bellona.json";
import istikbalJson from "./istikbal.json";

/** Client / Edge-safe static brand catalog (same JSON as the server provider). */
const catalog: PortalTemplate[] = [
  parsePortalTemplate(bellonaJson),
  parsePortalTemplate(istikbalJson),
];

const FALLBACK_ID = "bellona";

function fallbackTemplate(): PortalTemplate {
  return catalog.find((template) => template.id === FALLBACK_ID) ?? catalog[0]!;
}

export function getTemplateByCompanySlug(
  slug: string | null | undefined,
): PortalTemplate | null {
  const needle = slug?.trim().toLowerCase();
  if (!needle) return null;
  return (
    catalog.find((template) => template.companySlug.toLowerCase() === needle) ??
    catalog.find((template) => template.id.toLowerCase() === needle) ??
    null
  );
}

export function getTemplateByHost(host: string | null | undefined): PortalTemplate {
  const forced = process.env.BRAND_OVERRIDE?.trim().toLowerCase();
  if (forced) {
    const byId = catalog.find((template) => template.id === forced);
    if (byId) return byId;
  }
  if (!host) return fallbackTemplate();
  const needle = normalizeHost(host);
  const match = catalog.find((template) =>
    template.hosts.some((entry) => normalizeHost(entry) === needle),
  );
  return match ?? fallbackTemplate();
}
