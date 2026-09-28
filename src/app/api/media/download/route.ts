import { NextResponse } from "next/server";

const ALLOWED_HOST_SUFFIXES = [
  ".mncdn.com",
  ".sugartech.io",
  ".amazonaws.com",
  ".cloudfront.net",
  ".istikbal.com.tr",
];

const MAX_BYTES = 25 * 1024 * 1024;

function allowedImageUrl(raw: string): URL | null {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" || url.username || url.password) return null;
  const host = url.hostname.toLowerCase();
  const ok = ALLOWED_HOST_SUFFIXES.some(
    (suffix) => host === suffix.slice(1) || host.endsWith(suffix),
  );
  return ok ? url : null;
}

function safeFilename(raw: string | null, fallbackUrl: URL): string {
  const fromUrl = fallbackUrl.pathname.split("/").pop() || "render.jpg";
  const candidate = (raw || fromUrl).replace(/[^\w.\-]+/g, "_").slice(0, 120);
  return /\.(png|jpe?g|webp|gif)$/i.test(candidate) ? candidate : "render.jpg";
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const target = allowedImageUrl(searchParams.get("url") ?? "");
  if (!target) {
    return NextResponse.json({ error: "invalid-url" }, { status: 400 });
  }

  let upstream: Response;
  try {
    upstream = await fetch(target, { redirect: "error", cache: "no-store" });
  } catch {
    return NextResponse.json({ error: "fetch-failed" }, { status: 502 });
  }
  if (!upstream.ok) {
    return NextResponse.json({ error: "upstream" }, { status: 502 });
  }

  const type = upstream.headers.get("content-type") || "image/jpeg";
  if (!type.startsWith("image/") && type !== "application/octet-stream") {
    return NextResponse.json({ error: "not-image" }, { status: 415 });
  }

  const lengthHeader = upstream.headers.get("content-length");
  if (lengthHeader && Number(lengthHeader) > MAX_BYTES) {
    return NextResponse.json({ error: "too-large" }, { status: 413 });
  }

  const bytes = await upstream.arrayBuffer();
  if (bytes.byteLength > MAX_BYTES) {
    return NextResponse.json({ error: "too-large" }, { status: 413 });
  }

  const filename = safeFilename(searchParams.get("name"), target);
  return new NextResponse(bytes, {
    status: 200,
    headers: {
      "Content-Type": type.startsWith("image/") ? type : "image/jpeg",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, max-age=60",
    },
  });
}
