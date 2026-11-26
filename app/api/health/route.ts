import { NextResponse } from "next/server";
import { aiStatus } from "@/lib/ai/providers";
import { sharedLimits } from "@/lib/rate-limit";
import { publicDatabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

/** Uptime check: database reachability and which integrations are configured (yes/no only, never values). */
export async function GET() {
  const started = Date.now();
  const db = publicDatabase();
  let database: "ok" | "error" | "not-configured" = "not-configured";
  if (db) {
    const { error } = await db.from("public_catalogue").select("id", { head: true, count: "exact" }).limit(1);
    database = error ? "error" : "ok";
  }
  const body = {
    status: database === "error" ? "degraded" : "ok",
    database, databaseMs: Date.now() - started,
    ai: aiStatus(), sharedRateLimits: sharedLimits(), errorMonitoring: Boolean(process.env.SENTRY_DSN),
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV, version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "local",
  };
  return NextResponse.json(body, { status: database === "error" ? 503 : 200, headers: { "Cache-Control": "no-store" } });
}
