import { NextRequest, NextResponse } from "next/server";
import { companySlug, crmHeaders, crmUrl } from "@/lib/crm";

type LoginBody = {
  username?: string;
  password?: string;
};

export async function POST(request: NextRequest) {
  let body: LoginBody;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  if (!body.username || !body.password) {
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
        username: body.username,
        password: body.password,
        companySlug,
      }),
      cache: "no-store",
    });

    if (!upstream.ok) {
      return NextResponse.json(
        { error: "Giriş bilgileri hatalı." },
        { status: upstream.status === 429 ? 429 : 401 },
      );
    }

    const response = NextResponse.json({ success: true });
    const cookieHeaders =
      typeof upstream.headers.getSetCookie === "function"
        ? upstream.headers.getSetCookie()
        : ([upstream.headers.get("set-cookie")].filter(Boolean) as string[]);

    for (const cookie of cookieHeaders) {
      response.headers.append("set-cookie", cookie);
    }

    return response;
  } catch (error) {
    console.error("CRM login request failed", error);
    return NextResponse.json(
      { error: "Giriş servisine şu anda ulaşılamıyor." },
      { status: 503 },
    );
  }
}
