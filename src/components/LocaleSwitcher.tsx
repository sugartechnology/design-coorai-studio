"use client";

import { useLocale, useTranslations } from "next-intl";
import { defaultLocale, isAppLocale, type AppLocale } from "@/i18n/config";
import { useSetLocale } from "@/i18n/locale-client";

const OPTIONS: {
  value: AppLocale;
  shortKey: "langTrShort" | "langEnShort" | "langDeShort" | "langArShort";
}[] = [
  { value: "tr", shortKey: "langTrShort" },
  { value: "en", shortKey: "langEnShort" },
  { value: "de", shortKey: "langDeShort" },
  { value: "ar", shortKey: "langArShort" },
];

export function LocaleSwitcher() {
  const t = useTranslations("common");
  const locale = useLocale();
  const current = isAppLocale(locale) ? locale : defaultLocale;
  const { setLocale, pending } = useSetLocale();

  return (
    <div
      role="group"
      aria-label={t("language")}
      className="inline-flex h-9 items-center rounded-full border border-[color:var(--brand-primary)]/10 p-0.5"
    >
      {OPTIONS.map(({ value, shortKey }) => {
        const active = current === value;
        return (
          <button
            key={value}
            type="button"
            disabled={pending || active}
            aria-pressed={active}
            aria-label={t(shortKey)}
            onClick={() => setLocale(value)}
            className={[
              "h-8 min-w-8 px-2 rounded-full text-[11px] font-bold tracking-wide transition-colors",
              active
                ? "bg-[color:var(--brand-primary)] text-white"
                : "text-[color:var(--brand-primary)]/60 hover:bg-[color:var(--brand-primary)]/5 hover:text-[color:var(--brand-primary)]",
              pending && !active ? "opacity-60" : "",
            ].join(" ")}
          >
            {t(shortKey)}
          </button>
        );
      })}
    </div>
  );
}
