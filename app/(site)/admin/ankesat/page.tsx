import Link from "next/link";
import { Pill } from "@/components/verify/ui";
import { tr } from "@/lib/lang";
import { getLang } from "@/lib/lang-server";
import { DISPUTE_KIND, DISPUTE_STATUS } from "@/lib/verify/labels";
import { requireStaff } from "@/lib/verify/staff";

export default async function Disputes({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const s = await requireStaff(["customer_protection", "support"]);
  const lang = await getLang();
  const t = (sq: string, en: string) => tr(lang, sq, en);
  const p = await searchParams;
  let q = s.db.from("disputes").select("id,kind,status,created_at,assigned_to,material_id,refund_status").order("created_at", { ascending: true }).limit(100);
  q = p.status && DISPUTE_STATUS[p.status] ? q.eq("status", p.status) : q.in("status", ["open", "assigned", "investigating", "waiting_customer"]);
  const { data } = await q;
  return (
    <div className="grid gap-5">
      <h1 className="display text-4xl">{t("Ankesat dhe mosmarrëveshjet", "Complaints and disputes")}</h1>
      <form className="flex gap-3"><select name="status" defaultValue={p.status ?? ""} className="rounded-lg border border-line bg-bg px-3 py-2 text-sm"><option value="">{t("Të hapura", "Open")}</option>{Object.entries(DISPUTE_STATUS).map(([k, v]) => <option key={k} value={k}>{v[lang]}</option>)}</select><button className="btn-primary">{t("Filtro", "Filter")}</button></form>
      <ul className="grid gap-2">
        {data?.map((d) => <li key={d.id}><Link href={`/admin/ankesat/${d.id}`} className="card flex flex-wrap items-center justify-between gap-3 p-4 hover:border-lime/60"><span><span className="font-medium">{DISPUTE_KIND[d.kind]?.[lang]}</span><span className="block text-xs text-ink-2">{new Date(d.created_at).toLocaleString("en-GB")}{d.assigned_to ? ` · ${d.assigned_to === s.user.id ? t("tek ti", "yours") : t("e caktuar", "assigned")}` : ""}</span></span><Pill tone={d.status === "resolved" ? "ok" : "warn"}>{DISPUTE_STATUS[d.status]?.[lang]}</Pill></Link></li>)}
        {!data?.length && <li className="text-sm text-ink-2">{t("Asnjë ankesë.", "No complaints.")}</li>}
      </ul>
    </div>
  );
}
