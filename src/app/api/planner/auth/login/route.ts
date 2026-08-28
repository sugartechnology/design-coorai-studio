import { NextRequest, NextResponse } from "next/server";
import {
  plannerUnavailableResponse,
  plannerUpstream,
  proxyPlannerResponse,
} from "@/lib/planner-api";

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  try {
    const upstream = await plannerUpstream("/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(body),
    });
    return proxyPlannerResponse(upstream);
  } catch (error) {
    console.error("planner auth login proxy failed", error);
    return plannerUnavailableResponse();
  }
}
