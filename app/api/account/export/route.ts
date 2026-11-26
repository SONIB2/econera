import { NextResponse } from "next/server";
import { logError } from "@/lib/monitor";
import { clientIp, rateLimited } from "@/lib/rate-limit";
import { sessionDatabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

/** Every query runs with the visitor's own session, so Row Level Security limits each table to rows they may see. */
const TABLES: [string, string][] = [
  ["profiles", "user_id"], ["seller_verifications", "user_id"], ["materials", "owner_id"], ["verification_documents", "owner_id"],
  ["quotation_requests", "buyer_id"], ["availability_requests", "owner_id"], ["disputes", "reporter_id"], ["notifications", "user_id"],
  ["tool_projects", "owner_id"], ["organization_members", "user_id"],
];

/** Data access request: a JSON copy of the signed-in person's own records (document files stay in private storage). */
export async function GET(req: Request) {
  const db = await sessionDatabase();
  const user = db ? (await db.auth.getUser()).data.user : null;
  if (!db || !user) return NextResponse.json({ error: "login" }, { status: 401 });
  if (await rateLimited(`export:${user.id}:${clientIp(req.headers)}`, 5, 60 * 60 * 1000)) return NextResponse.json({ error: "rate" }, { status: 429 });
  const out: Record<string, unknown> = {
    exported_at: new Date().toISOString(),
    account: { id: user.id, email: user.email, created_at: user.created_at, email_confirmed_at: user.email_confirmed_at },
  };
  for (const [table, column] of TABLES) {
    const { data, error } = await db.from(table).select("*").eq(column, user.id).limit(5000);
    if (error) { if (error.code !== "42P01") logError("account.export.table", error.message, { table }); continue; }
    out[table] = data;
  }
  return new NextResponse(JSON.stringify(out, null, 2), {
    headers: { "content-type": "application/json; charset=utf-8", "content-disposition": `attachment; filename="econera-te-dhenat-${new Date().toISOString().slice(0, 10)}.json"`, "cache-control": "no-store" },
  });
}
