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
  const requestBody = hasBody ? await request.arrayBuffer() : undefined;

  const isCatalogProductSearch =
    method === "POST" && suffix === "catalog/products/search";
  if (isCatalogProductSearch) {
    let bodyJson: unknown = null;
    if (requestBody && requestBody.byteLength > 0) {
      try {
        bodyJson = JSON.parse(new TextDecoder().decode(requestBody));
      } catch {
        bodyJson = "[unparseable body]";
      }
    }
    console.log("[crm-proxy] catalog/products/search", {
      url: upstreamUrl.toString(),
      searchParams: Object.fromEntries(upstreamUrl.searchParams.entries()),
      body: bodyJson,
    });
  }

  try {
    const upstream = await fetch(upstreamUrl, {
      method,
      headers,
      body: requestBody,
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
