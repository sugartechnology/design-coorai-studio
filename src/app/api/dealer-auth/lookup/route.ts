import { NextRequest, NextResponse } from "next/server";
import { crmFetch } from "@/lib/crm";

export async function POST(request: NextRequest) {
  let body: { dealerCode?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  if (!body.dealerCode?.trim()) {
    return NextResponse.json({ error: "Bayi kodu zorunludur." }, { status: 400 });
  }

  try {
    const upstream = await crmFetch("/public/dealer-auth/lookup", {
      method: "POST",
      body: JSON.stringify({ dealerCode: body.dealerCode.trim() }),
    });
    const data = await upstream.json().catch(() => ({}));
    if (!upstream.ok) {
      const message =
        typeof data?.message === "string"
          ? data.message.replace(/^Resource not found:\s*/i, "")
          : upstream.status === 404
            ? "Bayi bulunamadı"
            : upstream.status === 403
              ? "Bayi henüz açılmamış"
              : "Bayi sorgusu başarısız.";
      return NextResponse.json({ error: message }, { status: upstream.status });
    }
    return NextResponse.json(data);
  } catch (error) {
    console.error("dealer-auth lookup failed", error);
    return NextResponse.json(
      { error: "Bayi servisine şu anda ulaşılamıyor." },
      { status: 503 },
    );
  }
}
