import { NextRequest, NextResponse } from "next/server";
import { crmUrl } from "@/lib/crm";
import {
  PORTAL_SESSION_COOKIE,
  getPortalSession,
  portalSessionCookieOptions,
} from "@/lib/portal-session";

type RouteContext = { params: Promise<{ path: string[] }> };

export async function GET(request: NextRequest, context: RouteContext) {
  return proxy(request, context);
}

export async function POST(request: NextRequest, context: RouteContext) {
  return proxy(request, context);
}

export async function PUT(request: NextRequest, context: RouteContext) {
  return proxy(request, context);
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  return proxy(request, context);
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  return proxy(request, context);
}

function clearSessionResponse(body: Record<string, unknown>, status = 401) {
  const response = NextResponse.json(body, { status });
  response.cookies.set(PORTAL_SESSION_COOKIE, "", {
    ...portalSessionCookieOptions(0),
    maxAge: 0,
  });
  return response;
}

function isInvalidTokenPayload(status: number, bodyText: string) {
  if (status === 401) return true;
  const normalized = bodyText.toLowerCase();
  return (
    normalized.includes("token not found") ||
    normalized.includes("token expired") ||
    normalized.includes("invalid_token") ||
    normalized.includes("full authentication is required")
  );
}

async function proxy(request: NextRequest, context: RouteContext) {
  const session = await getPortalSession();
  if (!session) {
    return NextResponse.json({ error: "Oturum gerekli." }, { status: 401 });
  }

  const { path } = await context.params;
  const suffix = path.map(encodeURIComponent).join("/");
  const upstreamUrl = crmUrl(`/${suffix}`);
  upstreamUrl.search = request.nextUrl.search;

  const headers = new Headers();
  headers.set("Accept", request.headers.get("Accept") ?? "application/json");
  headers.set("Authorization", `Bearer ${session.accessToken}`);
  headers.set("X-Company-Slug", session.companySlug);
  const contentType = request.headers.get("Content-Type");
  if (contentType) {
    headers.set("Content-Type", contentType);
  }

  const method = request.method.toUpperCase();
  const hasBody = method !== "GET" && method !== "HEAD";

  try {
    const upstream = await fetch(upstreamUrl, {
      method,
      headers,
      body: hasBody ? await request.arrayBuffer() : undefined,
      cache: "no-store",
    });

    const upstreamBody = await upstream.arrayBuffer();
    const bodyText = new TextDecoder().decode(upstreamBody);

    if (isInvalidTokenPayload(upstream.status, bodyText)) {
      return clearSessionResponse(
        { error: "SESSION_EXPIRED", message: "Oturumunuz sona erdi. Lütfen tekrar giriş yapın." },
        401,
      );
    }

    const responseHeaders = new Headers();
    const upstreamContentType = upstream.headers.get("Content-Type");
    if (upstreamContentType) {
      responseHeaders.set("Content-Type", upstreamContentType);
    }

    return new NextResponse(upstreamBody, {
      status: upstream.status,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error("CRM proxy failed", error);
    return NextResponse.json(
      { error: "CRM servisine ulaşılamıyor." },
      { status: 503 },
    );
  }
}
