import "server-only";

import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { LOCALE_COOKIE, toCrmErrorLocale } from "@/i18n/config";
import { crmHeaders, crmUrl, resolveCompanySlug } from "@/lib/crm";

type RecoveryPath =
  | "/public/password-recovery/options"
  | "/public/password-recovery/send";

function upstreamMessage(data: unknown): string | null {
  if (!data || typeof data !== "object") return null;
  const body = data as { message?: unknown; error?: unknown };
  if (typeof body.message === "string" && body.message.trim()) return body.message;
  if (typeof body.error === "string" && body.error.trim()) return body.error;
  return null;
}

export async function proxyPasswordRecovery(
  path: RecoveryPath,
  identifier: string,
  channel?: "EMAIL" | "SMS",
) {
  const companySlug = await resolveCompanySlug();
  const jar = await cookies();
  const locale = toCrmErrorLocale(jar.get(LOCALE_COOKIE)?.value);

  try {
    const upstream = await fetch(crmUrl(path), {
      method: "POST",
      headers: await crmHeaders({
        "Content-Type": "application/json",
        "Accept-Language": locale,
      }),
      body: JSON.stringify({
        companySlug,
        identifier,
        ...(channel ? { channel } : {}),
      }),
      cache: "no-store",
    });

    const data = await upstream.json().catch(() => ({}));
    if (!upstream.ok) {
      return NextResponse.json(
        {
          error:
            upstreamMessage(data) ??
            "Şifre kurtarma servisine şu anda ulaşılamıyor.",
        },
        { status: upstream.status >= 500 ? 503 : upstream.status },
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("CRM password recovery request failed", error);
    return NextResponse.json(
      { error: "Şifre kurtarma servisine şu anda ulaşılamıyor." },
      { status: 503 },
    );
  }
}
