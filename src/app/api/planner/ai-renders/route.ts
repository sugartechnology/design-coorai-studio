import { NextRequest, NextResponse } from "next/server";
import {
  plannerUnavailableResponse,
  plannerUpstream,
  proxyPlannerResponse,
} from "@/lib/planner-api";

export async function GET(request: NextRequest) {
  const authorization = request.headers.get("authorization")?.trim() ?? "";
  if (!authorization.toLowerCase().startsWith("bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const page = request.nextUrl.searchParams.get("page")?.trim() || "1";
  const pageSize = request.nextUrl.searchParams.get("pageSize")?.trim() || "12";
  const path =
    `/ai-renders?page=${encodeURIComponent(page)}` +
    `&pageSize=${encodeURIComponent(pageSize)}`;

  try {
    const upstream = await plannerUpstream(path, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: authorization,
      },
    });
    return proxyPlannerResponse(upstream);
  } catch (error) {
    console.error("planner ai-renders proxy failed", error);
    return plannerUnavailableResponse();
  }
}
