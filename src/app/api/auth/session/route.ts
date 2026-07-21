import { NextResponse } from "next/server";
import { getPortalSession, publicSessionView } from "@/lib/portal-session";

export async function GET() {
  try {
    const session = await getPortalSession();
    if (!session) {
      return NextResponse.json({ authenticated: false });
    }
    return NextResponse.json(publicSessionView(session));
  } catch (error) {
    console.error("auth session read failed", error);
    return NextResponse.json({ authenticated: false });
  }
}
