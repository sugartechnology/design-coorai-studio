export const locales = ["tr", "en", "de", "ar"] as const;
export type AppLocale = (typeof locales)[number];
export const defaultLocale: AppLocale = "tr";
export const LOCALE_COOKIE = "NEXT_LOCALE";

/** Locales sugar-room-designer ships (`3d-room-designer` translation packs). */
export const plannerLocales = ["tr", "en", "de"] as const;
export type PlannerLocale = (typeof plannerLocales)[number];

export function isAppLocale(value: string | undefined | null): value is AppLocale {
  return (
    value === "tr" || value === "en" || value === "de" || value === "ar"
  );
}

export function isRtlLocale(locale: string): boolean {
  return locale === "ar";
}

export function toBcp47(locale: AppLocale): string {
  switch (locale) {
    case "en":
      return "en-US";
    case "de":
      return "de-DE";
    case "ar":
      return "ar-SA";
    default:
      return "tr-TR";
  }
}

/** CRM error copy is only maintained in tr/en; map other UI locales to English. */
export function toCrmErrorLocale(locale: string | undefined | null): "tr" | "en" {
  return locale === "tr" ? "tr" : "en";
}

/** App locale → planner `language` attr; unsupported (e.g. `ar`) → `en`. */
export function toPlannerLocale(locale: string | undefined | null): PlannerLocale {
  const code = (locale ?? "").trim().toLowerCase().split("-")[0] ?? "";
  if (code === "tr" || code === "en" || code === "de") return code;
  return "en";
}
