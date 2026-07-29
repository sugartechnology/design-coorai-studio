import { NextRequest, NextResponse } from "next/server";
import { companySlug, crmHeaders, crmUrl } from "@/lib/crm";
import {
  encodePortalSession,
  PORTAL_SESSION_COOKIE,
  portalSessionCookieOptions,
  type PortalSession,
} from "@/lib/portal-session";

type LoginBody = {
  username?: string;
  password?: string;
};

type CrmLoginUser = {
  id?: string;
  companyId?: string;
  username?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  roles?: string[];
};

type CrmLoginResponse = {
  accessToken?: string;
  refreshToken?: string;
  user?: CrmLoginUser;
};

export async function POST(request: NextRequest) {
  let body: LoginBody;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  const username = body.username?.trim();
  const password = body.password;
  if (!username || !password) {
    return NextResponse.json(
      { error: "Kullanıcı adı ve şifre alanları zorunludur." },
      { status: 400 },
    );
  }

  try {
    const upstream = await fetch(crmUrl("/login"), {
      method: "POST",
      headers: crmHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({
        username,
        password,
        companySlug,
      }),
      cache: "no-store",
    });

    const data = (await upstream.json().catch(() => ({}))) as CrmLoginResponse;

    if (!upstream.ok) {
      return NextResponse.json(
        { error: "Giriş bilgileri hatalı." },
        { status: upstream.status === 429 ? 429 : 401 },
      );
    }

    if (
      !data.accessToken ||
      !data.refreshToken ||
      !data.user?.id ||
      !data.user.companyId
    ) {
      return NextResponse.json(
        { error: "Kimlik doğrulama yanıtı eksik." },
        { status: 502 },
      );
    }

    const session: PortalSession = {
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      companySlug,
      companyId: data.user.companyId,
      user: {
        id: data.user.id,
        username: data.user.username ?? username,
        email: data.user.email ?? "",
        firstName: data.user.firstName ?? "",
        lastName: data.user.lastName ?? "",
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
    console.error("CRM login request failed", error);
    return NextResponse.json(
      { error: "Giriş servisine şu anda ulaşılamıyor." },
      { status: 503 },
    );
  }
}
