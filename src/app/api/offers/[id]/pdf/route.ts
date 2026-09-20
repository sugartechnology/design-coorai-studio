import { NextRequest, NextResponse } from "next/server";

import { getPortalSession } from "@/lib/portal-session";

function resolveCrmWebOrigin(): string | null {
  const configured =
    process.env.NEXT_PUBLIC_CRM_WEB_ORIGIN?.trim() ||
    process.env.NEXT_PUBLIC_CRM_WEB_URL?.trim() ||
    (process.env.NODE_ENV !== "production" ? "http://localhost:3001" : "");
  if (!configured) return null;
  return configured.replace(/\/$/, "");
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const session = await getPortalSession();
  if (!session) {
    return NextResponse.json({ error: "Oturum gerekli." }, { status: 401 });
  }

  const { id } = await context.params;
  const offerId = id?.trim();
  if (!offerId) {
    return NextResponse.json({ message: "Offer id is required." }, { status: 400 });
  }

  const crmWebOrigin = resolveCrmWebOrigin();
  if (!crmWebOrigin) {
    return NextResponse.json(
      { message: "CRM web origin is not configured. Set NEXT_PUBLIC_CRM_WEB_ORIGIN." },
      { status: 500 },
    );
  }

  try {
    const upstream = await fetch(
      `${crmWebOrigin}/api/offers/${encodeURIComponent(offerId)}/pdf`,
      {
        method: "GET",
        headers: {
          Accept: "application/pdf",
          Authorization: `Bearer ${session.accessToken}`,
          "X-Company-Slug": session.companySlug,
        },
        cache: "no-store",
      },
    );

    const upstreamBody = await upstream.arrayBuffer();
    if (!upstream.ok) {
      const contentType = upstream.headers.get("Content-Type") ?? "";
      if (contentType.includes("application/json")) {
        return new NextResponse(upstreamBody, {
          status: upstream.status,
          headers: { "Content-Type": contentType },
        });
      }
      return NextResponse.json(
        { message: "PDF could not be generated." },
        { status: upstream.status >= 400 ? upstream.status : 502 },
      );
    }

    const filename =
      upstream.headers.get("Content-Disposition")?.match(/filename="?([^"]+)"?/i)?.[1] ||
      `${offerId}.pdf`;

    return new NextResponse(upstreamBody, {
      status: 200,
      headers: {
        "Content-Type": upstream.headers.get("Content-Type") || "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch {
    return NextResponse.json(
      { message: "CRM web PDF endpoint is unreachable." },
      { status: 502 },
    );
  }
}
