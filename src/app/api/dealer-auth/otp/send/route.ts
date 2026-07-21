import { NextRequest, NextResponse } from "next/server";
import { crmFetch } from "@/lib/crm";

export async function POST(request: NextRequest) {
  let body: { dealerCode?: string; phoneId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  if (!body.dealerCode?.trim() || !body.phoneId) {
    return NextResponse.json(
      { error: "Bayi kodu ve telefon seçimi zorunludur." },
      { status: 400 },
    );
  }

  try {
    const upstream = await crmFetch("/public/dealer-auth/otp/send", {
      method: "POST",
      body: JSON.stringify({
        dealerCode: body.dealerCode.trim(),
        phoneId: body.phoneId,
      }),
    });
    const data = await upstream.json().catch(() => ({}));
    if (!upstream.ok) {
      return NextResponse.json(
        {
          error:
            typeof data?.message === "string"
              ? data.message
              : "SMS gönderilemedi.",
        },
        { status: upstream.status },
      );
    }
    return NextResponse.json(data);
  } catch (error) {
    console.error("dealer-auth otp send failed", error);
    return NextResponse.json(
      { error: "SMS servisine şu anda ulaşılamıyor." },
      { status: 503 },
    );
  }
}
