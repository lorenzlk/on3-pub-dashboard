import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Lightweight liveness probe for platforms (Railway) that should not depend on
 * external services like Google Sheets during deploy healthchecks.
 */
export function GET() {
  return NextResponse.json({ ok: true, kind: "liveness" });
}
