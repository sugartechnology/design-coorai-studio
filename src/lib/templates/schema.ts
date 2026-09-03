import { z } from "zod";

const hexColor = z
  .string()
  .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "Expected a hex color");

export const portalTemplateSchema = z.object({
  id: z.string().min(1),
  companySlug: z.string().min(1),
  displayName: z.string().min(1),
  productName: z.string().min(1),
  /** Rapid / sugar-model-viewer `company-id` (İstikbal 42, Bellona 43). */
  rrCompanyId: z.number().int().positive(),
  hosts: z.array(z.string().min(1)).min(1),
  colors: z.object({
    primary: hexColor,
    primaryStrong: hexColor,
    accent: hexColor,
    background: hexColor,
    surface: hexColor,
    text: hexColor,
    muted: hexColor,
    border: hexColor,
    soft: hexColor,
    loginAsideFrom: hexColor,
    loginAsideTo: hexColor,
  }),
  assets: z.object({
    logoUrl: z.string().min(1),
    faviconUrl: z.string().min(1),
  }),
});

export type PortalTemplate = z.infer<typeof portalTemplateSchema>;

export function parsePortalTemplate(raw: unknown): PortalTemplate {
  return portalTemplateSchema.parse(raw);
}

export function normalizeHost(host: string): string {
  return host.trim().toLowerCase().split(":")[0]?.replace(/^www\./, "") ?? "";
}

export function hexLuminance(hex: string): number {
  const raw = hex.replace("#", "");
  const normalized =
    raw.length === 3
      ? raw
          .split("")
          .map((ch) => ch + ch)
          .join("")
      : raw;
  const n = Number.parseInt(normalized, 16);
  if (!Number.isFinite(n)) return 0;
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

export function isLightHex(hex: string): boolean {
  return hexLuminance(hex) > 0.55;
}
