export const locales = ["tr", "en", "de", "ar"] as const;
export type AppLocale = (typeof locales)[number];
export const defaultLocale: AppLocale = "tr";
export const LOCALE_COOKIE = "NEXT_LOCALE";

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
