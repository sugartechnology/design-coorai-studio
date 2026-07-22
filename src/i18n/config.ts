export const locales = ["tr", "en"] as const;
export type AppLocale = (typeof locales)[number];
export const defaultLocale: AppLocale = "tr";
export const LOCALE_COOKIE = "NEXT_LOCALE";

export function isAppLocale(value: string | undefined | null): value is AppLocale {
  return value === "tr" || value === "en";
}

export function toBcp47(locale: AppLocale): string {
  return locale === "en" ? "en-US" : "tr-TR";
}
