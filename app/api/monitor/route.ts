import { NextResponse } from "next/server";
import { z } from "zod";
import { logError } from "@/lib/monitor";
import { clientIp, rateLimited } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const report = z.object({ message: z.string().max(300), source: z.string().max(200).optional(), page: z.string().max(200), kind: z.enum(["error", "rejection", "webgl"]) });

/** Browser errors reported by <ErrorReporter/>: message, script file and page path only. */
export async function POST(req: Request) {
  if (await rateLimited(`monitor:${clientIp(req.headers)}`, 20, 60 * 1000)) return new NextResponse(null, { status: 204 });
  const parsed = report.safeParse(await req.json().catch(() => null));
  if (parsed.success) logError(`client.${parsed.data.kind}`, parsed.data.message, { source: parsed.data.source, page: parsed.data.page });
  return new NextResponse(null, { status: 204 });
}
