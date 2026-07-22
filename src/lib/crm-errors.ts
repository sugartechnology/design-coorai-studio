export type CrmErrorBody = {
  error?: unknown;
  message?: unknown;
  license?: {
    status?: unknown;
  };
};

export type CrmErrorLocale = "tr" | "en";

const LICENSE_MESSAGES: Record<CrmErrorLocale, Record<string, string>> = {
  tr: {
    LICENSE_ACCESS_BLOCKED: "Lisans erişimi engellendi.",
    PAYMENT_DUE_SOON: "Lisans ödemenizin vadesi yaklaşıyor.",
    PAYMENT_DUE: "Lisans ödemenizin vadesi geldi. Devam etmek için ödemeyi tamamlayın.",
    GRACE: "Lisansınız ek süre (grace) döneminde. Devam etmek için ödemeyi tamamlayın.",
    SUSPENDED: "Lisansınız askıya alındı. Lütfen yöneticinizle iletişime geçin.",
    ACTIVE: "Lisansınız aktif.",
  },
  en: {
    LICENSE_ACCESS_BLOCKED: "License access is blocked.",
    PAYMENT_DUE_SOON: "Your license payment is due soon.",
    PAYMENT_DUE: "Your license payment is due. Please complete payment to continue.",
    GRACE: "Your license is in grace period. Please complete payment to continue.",
    SUSPENDED: "Your license is suspended. Please contact your administrator.",
    ACTIVE: "Your license is active.",
  },
};

const ENGLISH_LICENSE_MESSAGE_KEYS: Record<string, string> = {
  "Your license payment is due soon.": "PAYMENT_DUE_SOON",
  "Your license payment is due. Please complete payment to continue.": "PAYMENT_DUE",
  "Your license is in grace period. Please complete payment to continue.": "GRACE",
  "Your license is suspended. Please contact your administrator.": "SUSPENDED",
  "Your license is active.": "ACTIVE",
  "License access is currently unavailable.": "LICENSE_UNAVAILABLE",
};

const LICENSE_UNAVAILABLE: Record<CrmErrorLocale, string> = {
  tr: "Lisans erişimi şu an kullanılamıyor.",
  en: "License access is currently unavailable.",
};

const DEFAULT_FALLBACK: Record<CrmErrorLocale, string> = {
  tr: "İşlem şu an yapılamıyor.",
  en: "This action is currently unavailable.",
};

/**
 * Maps CRM / monetization error payloads to localized UI copy.
 * Defaults to Turkish; pass `locale: 'en'` for English.
 */
export function localizeCrmError(
  body: CrmErrorBody | null | undefined,
  fallback?: string,
  locale: CrmErrorLocale = "tr",
): string {
  const messages = LICENSE_MESSAGES[locale] ?? LICENSE_MESSAGES.tr;
  const resolvedFallback = fallback ?? DEFAULT_FALLBACK[locale] ?? DEFAULT_FALLBACK.tr;

  if (!body || typeof body !== "object") {
    return resolvedFallback;
  }

  const errorCode = typeof body.error === "string" ? body.error.trim() : "";
  const message = typeof body.message === "string" ? body.message.trim() : "";
  const licenseStatus =
    body.license && typeof body.license === "object" && typeof body.license.status === "string"
      ? body.license.status.trim().toUpperCase()
      : "";

  if (errorCode === "LICENSE_ACCESS_BLOCKED") {
    if (licenseStatus && messages[licenseStatus]) {
      return messages[licenseStatus];
    }
    const mappedKey = message ? ENGLISH_LICENSE_MESSAGE_KEYS[message] : "";
    if (mappedKey === "LICENSE_UNAVAILABLE") {
      return LICENSE_UNAVAILABLE[locale];
    }
    if (mappedKey && messages[mappedKey]) {
      return messages[mappedKey];
    }
    return messages.LICENSE_ACCESS_BLOCKED;
  }

  const mappedKey = message ? ENGLISH_LICENSE_MESSAGE_KEYS[message] : "";
  if (mappedKey === "LICENSE_UNAVAILABLE") {
    return LICENSE_UNAVAILABLE[locale];
  }
  if (mappedKey && messages[mappedKey]) {
    return messages[mappedKey];
  }

  if (errorCode && messages[errorCode]) {
    return messages[errorCode];
  }

  // Prefer user-facing messages already returned by CRM; keep English license strings mapped above.
  if (message) {
    return message;
  }
  if (errorCode) {
    return errorCode;
  }
  return resolvedFallback;
}
