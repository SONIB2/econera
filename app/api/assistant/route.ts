import { NextResponse } from "next/server";
import { z } from "zod";
import { answer, type Account } from "@/lib/assistant/brain";
import { detectLang } from "@/lib/assistant/registry";
import { REGIONS } from "@/lib/tools/inventory";
import { MARKET_CATEGORIES } from "@/lib/market/categories";
import { clientIp, rateLimited } from "@/lib/rate-limit";
import { sessionDatabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// The conversation context comes from the browser, so every field is checked against what the app actually supports.
const filters = z.object({
  category: z.string().refine((c) => MARKET_CATEGORIES.some((m) => m.id === c)).optional(),
  q: z.string().max(120).optional(),
  near: z.string().refine((c) => c in REGIONS).optional(),
  qty: z.number().positive().max(1e6).optional(),
  unit: z.string().max(12).optional(),
  maxUnitLek: z.number().positive().max(1e9).optional(),
  sort: z.enum(["relevance", "price_asc", "distance"]).optional(),
  verified: z.boolean().optional(),
});
const body = z.object({
  text: z.string().min(1).max(300),
  lang: z.enum(["sq", "en"]),
  ctx: z.object({ filters: filters.optional().catch(undefined), items: z.array(z.string().max(80)).max(5).optional().catch(undefined) }).catch({}),
});

async function account(): Promise<Account> {
  const db = await sessionDatabase().catch(() => null);
  const user = db ? (await db.auth.getUser()).data.user : null;
  if (!db || !user) return { signedIn: false, seller: "none" };
  const { data } = await db.from("seller_verifications").select("status").eq("user_id", user.id).maybeSingle<{ status: string }>();
  const s = data?.status;
  const seller = s === "approved" ? "approved" : s === "revoked" ? "suspended" : s === "info_required" || s === "rejected" ? "info" : s === "submitted" || s === "under_review" ? "pending" : "none";
  return { signedIn: true, seller };
}

/** ECONERA Voice: understands a message and returns a structured, validated reply (no free-form links). */
export async function POST(req: Request) {
  if (rateLimited(`assistant:${clientIp(req.headers)}`, 40, 60 * 1000)) return NextResponse.json({ error: "rate" }, { status: 429 });
  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const { text, lang, ctx } = parsed.data;
  const reply = await answer(text, detectLang(text, lang), ctx, await account());
  return NextResponse.json(reply, { headers: { "Cache-Control": "no-store" } });
}
