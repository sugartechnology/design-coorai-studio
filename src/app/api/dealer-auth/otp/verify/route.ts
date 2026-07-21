import { NextRequest, NextResponse } from "next/server";
import { crmFetch } from "@/lib/crm";
import {
  encodePortalSession,
  PORTAL_SESSION_COOKIE,
  portalSessionCookieOptions,
  type PortalSession,
} from "@/lib/portal-session";

type VerifyResponse = {
  success?: boolean;
  message?: string;
  accessToken?: string;
  refreshToken?: string;
  companySlug?: string;
  companyId?: string;
  user?: {
    id: string;
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    roles?: string[];
  };
};

export async function POST(request: NextRequest) {
  let body: { sessionId?: string; code?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  if (!body.sessionId || !body.code?.trim()) {
    return NextResponse.json(
      { error: "Oturum ve pin kodu zorunludur." },
      { status: 400 },
    );
  }

  try {
    const upstream = await crmFetch("/public/dealer-auth/otp/verify", {
      method: "POST",
      body: JSON.stringify({
        sessionId: body.sessionId,
        code: body.code.trim(),
      }),
    });
    const data = (await upstream.json().catch(() => ({}))) as VerifyResponse;
    if (!upstream.ok || !data.success) {
      return NextResponse.json(
        {
          error:
            typeof data.message === "string"
              ? data.message
              : "Pin kodu doğrulanamadı.",
        },
        { status: upstream.ok ? 401 : upstream.status },
      );
    }

    if (
      !data.accessToken ||
      !data.refreshToken ||
      !data.companySlug ||
      !data.companyId ||
      !data.user
    ) {
      return NextResponse.json(
        { error: "Kimlik doğrulama yanıtı eksik." },
        { status: 502 },
      );
    }

    const session: PortalSession = {
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      companySlug: data.companySlug,
      companyId: data.companyId,
      user: {
        id: data.user.id,
        username: data.user.username,
        email: data.user.email,
        firstName: data.user.firstName,
        lastName: data.user.lastName,
        roles: data.user.roles ?? [],
      },
    };

    const response = NextResponse.json({
      success: true,
      user: {
        firstName: session.user.firstName,
        lastName: session.user.lastName,
        displayName: `${session.user.firstName} ${session.user.lastName}`.trim(),
      },
      companySlug: session.companySlug,
    });
    response.cookies.set(
      PORTAL_SESSION_COOKIE,
      encodePortalSession(session),
      portalSessionCookieOptions(),
    );
    return response;
  } catch (error) {
    console.error("dealer-auth otp verify failed", error);
    return NextResponse.json(
      { error: "Doğrulama servisine şu anda ulaşılamıyor." },
      { status: 503 },
    );
  }
}
