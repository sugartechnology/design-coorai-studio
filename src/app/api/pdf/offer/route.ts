import { NextRequest, NextResponse } from "next/server";
import { getPortalSession } from "@/lib/portal-session";

const MAX_HTML_BYTES = 2_000_000;

function resolvePdfServiceBaseUrl(): string | null {
  const configuredUrl =
    process.env.PDF_SERVICE_URL ||
    process.env.NEXT_PUBLIC_PDF_SERVICE_URL ||
    (process.env.NODE_ENV !== "production" ? "http://localhost:8085" : null);
  if (!configuredUrl) return null;
  return configuredUrl.replace(/\/$/, "");
}

export async function POST(request: NextRequest) {
  const session = await getPortalSession();
  if (!session) {
    return NextResponse.json({ error: "Oturum gerekli." }, { status: 401 });
  }

  let body: { html?: unknown; baseUri?: unknown; filename?: unknown };
  try {
    body = (await request.json()) as { html?: unknown; baseUri?: unknown; filename?: unknown };
  } catch {
    return NextResponse.json({ error: "html is required" }, { status: 400 });
  }

  const html = typeof body.html === "string" ? body.html : "";
  if (!html.trim()) {
    return NextResponse.json({ error: "html is required" }, { status: 400 });
  }
  if (Buffer.byteLength(html, "utf8") > MAX_HTML_BYTES) {
    return NextResponse.json({ error: "PDF payload is too large" }, { status: 413 });
  }

  const pdfServiceBaseUrl = resolvePdfServiceBaseUrl();
  if (!pdfServiceBaseUrl) {
    return NextResponse.json(
      { message: "PDF service URL is not configured. Set PDF_SERVICE_URL." },
      { status: 500 },
    );
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/pdf",
  };
  const sharedSecret = process.env.PDF_SERVICE_SHARED_SECRET;
  if (sharedSecret) {
    headers["x-pdf-service-secret"] = sharedSecret;
  }

  const filename =
    typeof body.filename === "string" && body.filename.trim()
      ? body.filename.trim().replace(/[^\w.\-]+/g, "_")
      : "offer.pdf";

  try {
    const upstream = await fetch(`${pdfServiceBaseUrl}/api/pdf/offer`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        html,
        baseUri: typeof body.baseUri === "string" ? body.baseUri : undefined,
      }),
      cache: "no-store",
    });

    if (!upstream.ok) {
      return NextResponse.json(
        { message: "PDF service responded with an error" },
        { status: upstream.status >= 400 ? upstream.status : 502 },
      );
    }

    return new NextResponse(upstream.body, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch {
    return NextResponse.json(
      { message: "PDF service responded with an error" },
      { status: 502 },
    );
  }
}
