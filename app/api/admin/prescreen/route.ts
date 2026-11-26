import { logError } from "@/lib/monitor";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { claude, firstJson } from "@/lib/ai/providers";
import { aiBudgetExceeded, rateLimited } from "@/lib/rate-limit";
import { currentStaff, hasRole } from "@/lib/verify/staff";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * AI-assisted preliminary review for staff. Sends listing fields and document metadata only (no identity data, no files).
 * The reply is labelled preliminary; it cannot change any status.
 */
export async function POST(request: NextRequest) {
  const s = await currentStaff();
  if (s.kind !== "staff" || !s.mfa || !hasRole(s.roles, ["product_officer", "technical_reviewer"])) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  if (!process.env.ANTHROPIC_API_KEY) return NextResponse.json({ error: "not-configured" }, { status: 503 });
  if (await aiBudgetExceeded("prescreen")) return NextResponse.json({ error: "busy" }, { status: 503 });
  if (await rateLimited(`prescreen:${s.user.id}`, 30, 60 * 60 * 1000)) return NextResponse.json({ error: "rate" }, { status: 429 });
  const parsed = z.object({ id: z.uuid(), lang: z.enum(["sq", "en"]) }).safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const { data: m } = await s.db.from("materials").select("title,description,category,intended_use,condition,quantity,unit,manufacturer,model_ref,batch_no,origin_country,age_years,storage_conditions,known_defects,length_mm,width_mm,thickness_mm,risk_level").eq("id", parsed.data.id).maybeSingle();
  if (!m) return NextResponse.json({ error: "not-found" }, { status: 404 });
  const { data: docs } = await s.db.from("verification_documents").select("doc_type,issuer,reference_no,issued_on,expires_on,review_status").eq("subject_type", "material").eq("subject_id", parsed.data.id);
  const language = parsed.data.lang === "en" ? "English" : "Albanian";
  const system = `You assist a human reviewer at ECONERA, a marketplace for surplus and reclaimed construction materials in Albania. You never approve or reject. Answer in ${language}, JSON only:
{"summary": string (2 sentences), "suggested_risk": "low"|"medium"|"high"|"prohibited", "risk_reason": string, "inconsistencies": string[], "missing_information": string[], "questions_for_seller": string[], "caution": string}.
Consider EU Construction Products Regulation (EU) 2024/3110 logic: structural, fire, electrical and pressure uses need declarations of performance/conformity and may need inspection. Never claim a certificate is authentic.`;
  try {
    const reply = await claude(system, [{ type: "text", text: JSON.stringify({ listing: m, documents: docs ?? [] }) }], 900);
    const json = firstJson<Record<string, unknown>>(reply);
    if (!json) return NextResponse.json({ error: "format" }, { status: 502 });
    return NextResponse.json({ ...json, preliminary: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    logError("ai.prescreen.failed", error);
    return NextResponse.json({ error: "upstream" }, { status: 502 });
  }
}
