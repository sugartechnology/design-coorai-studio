import { NextRequest, NextResponse } from "next/server";
import { crmHeaders, crmUrl } from "@/lib/crm";
import {
  buildPortalSessionFromUnified,
  cookieHeaders,
  portalSessionSuccessResponse,
  unifiedErrorMessage,
  type UnifiedLoginResponse,
} from "@/lib/unified-login";

type CompanySelectBody = {
  selectionToken?: string;
  companyId?: string;
};

export async function POST(request: NextRequest) {
  let body: CompanySelectBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  const selectionToken = body.selectionToken?.trim();
  const companyId = body.companyId?.trim();
  if (!selectionToken || !companyId) {
    return NextResponse.json(
      { error: "Şirket seçimi için gerekli bilgiler eksik." },
      { status: 400 },
    );
  }

  try {
    const upstream = await fetch(crmUrl("/login/unified/company"), {
      method: "POST",
      headers: crmHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ selectionToken, companyId }),
      cache: "no-store",
    });

    const data = (await upstream.json().catch(() => ({}))) as UnifiedLoginResponse;
    const setCookies = cookieHeaders(upstream);

    if (!upstream.ok || data.status === "ERROR") {
      const code = data.errorCode ?? "LOGIN_SELECTION_EXPIRED";
      return NextResponse.json(
        { error: unifiedErrorMessage(code), errorCode: code },
        {
          status:
            upstream.status === 401
              ? 401
              : upstream.status >= 500
                ? 503
                : 403,
        },
      );
    }

    if (data.status !== "AUTHENTICATED") {
      return NextResponse.json(
        { error: "Beklenmeyen giriş yanıtı.", status: data.status ?? null },
        { status: 502 },
      );
    }

    const session = buildPortalSessionFromUnified(data, setCookies, "");
    if (!session) {
      return NextResponse.json(
        { error: "Kimlik doğrulama yanıtı eksik." },
        { status: 502 },
      );
    }
    return portalSessionSuccessResponse(session);
  } catch (error) {
    console.error("CRM unified company selection failed", error);
    return NextResponse.json(
      { error: "Giriş servisine şu anda ulaşılamıyor." },
      { status: 503 },
    );
  }
}
