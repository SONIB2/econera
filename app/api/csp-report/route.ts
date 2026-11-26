import { NextResponse } from "next/server";
import { clientIp, rateLimited } from "@/lib/rate-limit";
import { logEvent } from "@/lib/monitor";

export const dynamic = "force-dynamic";

/** Receives Content-Security-Policy violation reports (report-only phase) and logs the directive and blocked host only. */
export async function POST(req: Request) {
  if (await rateLimited(`csp:${clientIp(req.headers)}`, 30, 60 * 1000)) return new NextResponse(null, { status: 204 });
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | Record<string, unknown>[] | null;
  const reports = (Array.isArray(body) ? body.map((r) => r.body) : [body?.["csp-report"] ?? body]) as Record<string, string>[];
  for (const r of reports.slice(0, 5)) {
    if (!r) continue;
    const host = (u?: string) => { try { return u ? new URL(u).host || u : ""; } catch { return String(u ?? "").slice(0, 40); } };
    logEvent("csp.violation", {
      directive: String(r["effectiveDirective"] ?? r["effective-directive"] ?? r["violated-directive"] ?? "").slice(0, 60),
      blocked: host(r["blockedURL"] ?? r["blocked-uri"]),
      page: (() => { try { return new URL(r["documentURL"] ?? r["document-uri"] ?? "").pathname; } catch { return ""; } })(),
    });
  }
  return new NextResponse(null, { status: 204 });
}
