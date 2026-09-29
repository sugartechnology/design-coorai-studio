import { NextRequest, NextResponse } from "next/server";
import { proxyPasswordRecovery } from "@/lib/password-recovery";

type SendBody = {
  identifier?: string;
  channel?: string;
};

export async function POST(request: NextRequest) {
  let body: SendBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  const identifier = body.identifier?.trim();
  const channel = body.channel;
  if (!identifier) {
    return NextResponse.json(
      { error: "Kullanıcı adı, e-posta veya telefon zorunludur." },
      { status: 400 },
    );
  }
  if (channel !== "EMAIL" && channel !== "SMS") {
    return NextResponse.json(
      { error: "Geçersiz iletişim kanalı." },
      { status: 400 },
    );
  }

  return proxyPasswordRecovery(
    "/public/password-recovery/send",
    identifier,
    channel,
  );
}
