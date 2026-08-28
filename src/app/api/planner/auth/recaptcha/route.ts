import { NextResponse } from "next/server";
import {
  plannerUnavailableResponse,
  plannerUpstream,
  proxyPlannerResponse,
} from "@/lib/planner-api";

export async function GET() {
  try {
    const upstream = await plannerUpstream("/auth/recaptcha", {
      method: "GET",
      headers: { Accept: "application/json" },
    });
    return proxyPlannerResponse(upstream);
  } catch (error) {
    console.error("planner recaptcha proxy failed", error);
    return plannerUnavailableResponse();
  }
}
