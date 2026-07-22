"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { LOCALE_COOKIE, type AppLocale, isAppLocale } from "@/i18n/config";

export function setLocaleCookie(locale: AppLocale) {
  const maxAge = 60 * 60 * 24 * 365;
  document.cookie = `${LOCALE_COOKIE}=${locale};path=/;max-age=${maxAge};SameSite=Lax`;
}

export function useSetLocale() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return {
    pending,
    setLocale: (locale: string) => {
      if (!isAppLocale(locale)) return;
      setLocaleCookie(locale);
      startTransition(() => {
        router.refresh();
      });
    },
  };
}
