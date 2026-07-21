export type CrmErrorBody = {
  error?: unknown;
  message?: unknown;
  license?: {
    status?: unknown;
  };
};

const LICENSE_MESSAGES_TR: Record<string, string> = {
  LICENSE_ACCESS_BLOCKED: "Lisans erişimi engellendi.",
  PAYMENT_DUE_SOON: "Lisans ödemenizin vadesi yaklaşıyor.",
  PAYMENT_DUE: "Lisans ödemenizin vadesi geldi. Devam etmek için ödemeyi tamamlayın.",
  GRACE: "Lisansınız ek süre (grace) döneminde. Devam etmek için ödemeyi tamamlayın.",
  SUSPENDED: "Lisansınız askıya alındı. Lütfen yöneticinizle iletişime geçin.",
  ACTIVE: "Lisansınız aktif.",
};

const ENGLISH_LICENSE_MESSAGES: Record<string, string> = {
  "Your license payment is due soon.": LICENSE_MESSAGES_TR.PAYMENT_DUE_SOON,
  "Your license payment is due. Please complete payment to continue.": LICENSE_MESSAGES_TR.PAYMENT_DUE,
  "Your license is in grace period. Please complete payment to continue.": LICENSE_MESSAGES_TR.GRACE,
  "Your license is suspended. Please contact your administrator.": LICENSE_MESSAGES_TR.SUSPENDED,
  "Your license is active.": LICENSE_MESSAGES_TR.ACTIVE,
  "License access is currently unavailable.": "Lisans erişimi şu an kullanılamıyor.",
};

/**
 * Maps CRM / monetization error payloads to Turkish UI copy.
 */
export function localizeCrmError(
  body: CrmErrorBody | null | undefined,
  fallback = "İşlem şu an yapılamıyor.",
): string {
  if (!body || typeof body !== "object") {
    return fallback;
  }

  const errorCode = typeof body.error === "string" ? body.error.trim() : "";
  const message = typeof body.message === "string" ? body.message.trim() : "";
  const licenseStatus =
    body.license && typeof body.license === "object" && typeof body.license.status === "string"
      ? body.license.status.trim().toUpperCase()
      : "";

  if (errorCode === "LICENSE_ACCESS_BLOCKED") {
    if (licenseStatus && LICENSE_MESSAGES_TR[licenseStatus]) {
      return LICENSE_MESSAGES_TR[licenseStatus];
    }
    if (message && ENGLISH_LICENSE_MESSAGES[message]) {
      return ENGLISH_LICENSE_MESSAGES[message];
    }
    return LICENSE_MESSAGES_TR.LICENSE_ACCESS_BLOCKED;
  }

  if (message && ENGLISH_LICENSE_MESSAGES[message]) {
    return ENGLISH_LICENSE_MESSAGES[message];
  }

  if (errorCode && LICENSE_MESSAGES_TR[errorCode]) {
    return LICENSE_MESSAGES_TR[errorCode];
  }

  // Prefer Turkish/user-facing messages already returned by CRM; keep English license strings mapped above.
  if (message) {
    return message;
  }
  if (errorCode) {
    return errorCode;
  }
  return fallback;
}
