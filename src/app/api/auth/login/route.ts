import { NextRequest, NextResponse } from "next/server";
import { crmHeaders, crmUrl } from "@/lib/crm";
import {
  buildPortalSessionFromUnified,
  cookieHeaders,
  portalSessionSuccessResponse,
  unifiedErrorMessage,
  type UnifiedLoginResponse,
} from "@/lib/unified-login";

type LoginBody = {
  username?: string;
  identifier?: string;
  password?: string;
};

export async function POST(request: NextRequest) {
  let body: LoginBody;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  const identifier = (body.identifier ?? body.username)?.trim();
  const password = body.password;
  if (!identifier || !password) {
    return NextResponse.json(
      { error: "Kullanıcı adı ve şifre alanları zorunludur." },
      { status: 400 },
    );
  }

  try {
    const upstream = await fetch(crmUrl("/login/unified"), {
      method: "POST",
      headers: crmHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ identifier, password }),
      cache: "no-store",
    });

    const data = (await upstream.json().catch(() => ({}))) as UnifiedLoginResponse;
    const setCookies = cookieHeaders(upstream);

    if (!upstream.ok || data.status === "ERROR") {
      const code = data.errorCode ?? null;
      return NextResponse.json(
        { error: unifiedErrorMessage(code), errorCode: code },
        {
          status:
            upstream.status === 429
              ? 429
              : upstream.status >= 500
                ? 503
                : 401,
        },
      );
    }

    if (data.status === "COMPANY_SELECTION_REQUIRED") {
      return NextResponse.json({
        success: false,
        status: "COMPANY_SELECTION_REQUIRED",
        selectionToken: data.selectionToken,
        companies: (data.companies ?? []).map((company) => ({
          companyId: company.companyId,
          name: company.name,
          slug: company.slug,
          available: company.available !== false,
          status: company.status,
        })),
        supportId: data.supportId ?? null,
      });
    }

    if (data.status === "RR_TRANSFER_REQUIRED") {
      return NextResponse.json(
        {
          error: unifiedErrorMessage("RR_TRANSFER_REQUIRED"),
          errorCode: "RR_TRANSFER_REQUIRED",
          status: "RR_TRANSFER_REQUIRED",
          companies: data.companies ?? [],
          supportId: data.supportId ?? null,
        },
        { status: 403 },
      );
    }

    if (data.status === "AUTHENTICATED") {
      const session = buildPortalSessionFromUnified(data, setCookies, identifier);
      if (!session) {
        return NextResponse.json(
          { error: "Kimlik doğrulama yanıtı eksik." },
          { status: 502 },
        );
      }
      return portalSessionSuccessResponse(session);
    }

    return NextResponse.json(
      {
        error: unifiedErrorMessage(data.errorCode),
        errorCode: data.errorCode ?? null,
      },
      { status: 401 },
    );
  } catch (error) {
    console.error("CRM unified login request failed", error);
    return NextResponse.json(
      { error: "Giriş servisine şu anda ulaşılamıyor." },
      { status: 503 },
    );
  }
}
