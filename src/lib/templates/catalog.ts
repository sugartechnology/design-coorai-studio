import type { PortalTemplate } from "./schema";
import { parsePortalTemplate } from "./schema";
import bellonaJson from "./bellona.json";
import istikbalJson from "./istikbal.json";

/** Client-safe static brand catalog (same JSON as the server provider). */
const catalog: PortalTemplate[] = [
  parsePortalTemplate(bellonaJson),
  parsePortalTemplate(istikbalJson),
];

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
