import { NextRequest, NextResponse } from "next/server";
import { proxyPasswordRecovery } from "@/lib/password-recovery";

type OptionsBody = {
  identifier?: string;
};

export async function POST(request: NextRequest) {
  let body: OptionsBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  const identifier = body.identifier?.trim();
  if (!identifier) {
    return NextResponse.json(
      { error: "Kullanıcı adı, e-posta veya telefon zorunludur." },
      { status: 400 },
    );
  }

  return proxyPasswordRecovery("/public/password-recovery/options", identifier);
}
