import "server-only";

import { NextResponse } from "next/server";

export function plannerUrl(path: string): string {
  const base = process.env.PLANNER_API_URL?.trim();
  if (!base) {
    throw new Error("PLANNER_API_URL is not configured");
  }
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${base.replace(/\/+$/, "")}${normalized}`;
}

export async function plannerUpstream(
  path: string,
  init?: RequestInit,
): Promise<Response> {
  return fetch(plannerUrl(path), {
    ...init,
    cache: "no-store",
  });
}

const BODYLESS_STATUSES = new Set([204, 205, 304]);

export async function proxyPlannerResponse(
  upstream: Response,
): Promise<NextResponse> {
  if (BODYLESS_STATUSES.has(upstream.status)) {
    return new NextResponse(null, { status: upstream.status });
  }
  const data = await upstream.json().catch(() => ({}));
  return NextResponse.json(data, { status: upstream.status });
}

export function plannerUnavailableResponse(): NextResponse {
  return NextResponse.json(
    { status: "ERROR", errorCode: "AUTH_SERVICE_UNAVAILABLE" },
    { status: 503 },
  );
}
