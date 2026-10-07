import { NextRequest, NextResponse } from "next/server";
import { getPortalSession } from "@/lib/portal-session";
import {
  getTemplateByCompanySlug,
  getTemplateByHost,
} from "@/lib/templates/catalog";

type RouteContext = { params: Promise<{ companyId: string }> };

const DEFAULT_SUGARTECH_API_URL = "https://api.sugartech.io/api";

function sugartechApiBase(): string {
  const raw = process.env.SUGARTECH_API_URL?.trim() || DEFAULT_SUGARTECH_API_URL;
  return raw.replace(/\/+$/, "");
}

function parseCompanyId(raw: string): number | null {
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 1 || !Number.isInteger(n)) return null;
  return n;
}

function resolveAllowedRrCompanyId(
  session: { companySlug: string; rrCompanyId?: number | null },
  host: string | null,
): number | null {
  if (
    typeof session.rrCompanyId === "number" &&
    Number.isFinite(session.rrCompanyId)
  ) {
    return session.rrCompanyId;
  }
  const bySlug = getTemplateByCompanySlug(session.companySlug)?.rrCompanyId;
  if (typeof bySlug === "number" && Number.isFinite(bySlug)) return bySlug;
  const byHost = getTemplateByHost(host).rrCompanyId;
  if (typeof byHost === "number" && Number.isFinite(byHost)) return byHost;
  return null;
}

export async function POST(request: NextRequest, context: RouteContext) {
  const session = await getPortalSession();
  if (!session) {
    return NextResponse.json({ error: "Oturum gerekli." }, { status: 401 });
  }

  const { companyId: companyIdParam } = await context.params;
  const requestedId = parseCompanyId(companyIdParam);
  if (requestedId == null) {
    return NextResponse.json({ error: "Geçersiz şirket id." }, { status: 400 });
  }

  const allowedRr = resolveAllowedRrCompanyId(
    session,
    request.headers.get("host"),
  );

  const allowOverride = process.env.NODE_ENV === "development";
  if (!allowOverride) {
    if (allowedRr == null) {
      return NextResponse.json(
        { error: "Şirket id tanımlı değil." },
        { status: 400 },
      );
    }
    if (requestedId !== allowedRr) {
      return NextResponse.json({ error: "Yetkisiz şirket." }, { status: 403 });
    }
  }

  const upstreamUrl = `${sugartechApiBase()}/configurator2/company/${encodeURIComponent(String(requestedId))}`;

  try {
    const upstream = await fetch(upstreamUrl, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: "{}",
      cache: "no-store",
    });

    const text = await upstream.text();
    let body: unknown = text;
    try {
      body = text ? JSON.parse(text) : [];
    } catch {
      body = { error: "Upstream yanıtı JSON değil.", detail: text.slice(0, 200) };
    }

    if (!upstream.ok) {
      return NextResponse.json(
        typeof body === "object" && body !== null
          ? body
          : { error: `Upstream ${upstream.status}` },
        { status: upstream.status },
      );
    }

    return NextResponse.json(body, { status: 200 });
  } catch (error) {
    console.error("[configurator/company] upstream failed", error);
    return NextResponse.json(
      { error: "Configurator listesi alınamadı." },
      { status: 502 },
    );
  }
}
