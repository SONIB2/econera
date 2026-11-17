import { isAdmin } from "@/lib/admin-auth";
import { listLeads, toCsv } from "@/lib/leads";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isAdmin())) return new Response("Jo i autorizuar", { status: 401 });
  const date = new Date().toISOString().slice(0, 10);
  return new Response(toCsv(await listLeads()), {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="econera-regjistrime-${date}.csv"`, "Cache-Control": "no-store" },
  });
}
