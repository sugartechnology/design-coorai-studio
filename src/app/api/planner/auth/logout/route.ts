import { NextRequest, NextResponse } from "next/server";
import {
  plannerUnavailableResponse,
  plannerUpstream,
  proxyPlannerResponse,
} from "@/lib/planner-api";

export async function POST(request: NextRequest) {
  const authorization = request.headers.get("authorization");
  try {
    const headers: HeadersInit = { Accept: "application/json" };
    if (authorization) {
      headers.Authorization = authorization;
    }
    const upstream = await plannerUpstream("/auth/logout", {
      method: "POST",
      headers,
    });
    return proxyPlannerResponse(upstream);
  } catch (error) {
    console.error("planner auth logout proxy failed", error);
    return plannerUnavailableResponse();
  }
}
