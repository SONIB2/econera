import Link from "next/link";
import { Pill } from "@/components/verify/ui";
import { tr } from "@/lib/lang";
import { getLang } from "@/lib/lang-server";
import { SELLER_STATUS } from "@/lib/verify/labels";
import { requireStaff } from "@/lib/verify/staff";

export default async function Sellers({ searchParams }: { searchParams: Promise<{ status?: string; q?: string }> }) {
  const s = await requireStaff(["seller_officer"]);
  const lang = await getLang();
  const t = (sq: string, en: string) => tr(lang, sq, en);
  const p = await searchParams;
  let q = s.db.from("seller_verifications").select("user_id,kind,legal_name,country,registration_number,status,updated_at").order("updated_at", { ascending: true }).limit(100);
  q = p.status && SELLER_STATUS[p.status] ? q.eq("status", p.status) : q.in("status", ["submitted", "under_review", "info_required"]);
  if (p.q) q = q.ilike("legal_name", `%${p.q.replace(/[\\%_*]/g, "\\$&").slice(0, 80)}%`);
  const { data } = await q;
  return (
    <div className="grid gap-5">
      <h1 className="display text-4xl">{t("Verifikimi i shitësve", "Seller verification")}</h1>
      <form className="flex flex-wrap gap-3"><input name="q" defaultValue={p.q} placeholder={t("Emri ligjor", "Legal name")} className="rounded-lg border border-line bg-bg px-3 py-2 text-sm" />
        <select name="status" defaultValue={p.status ?? ""} className="rounded-lg border border-line bg-bg px-3 py-2 text-sm"><option value="">{t("Në pritje", "Waiting")}</option>{Object.entries(SELLER_STATUS).map(([k, v]) => <option key={k} value={k}>{v[lang]}</option>)}</select><button className="btn-primary">{t("Filtro", "Filter")}</button></form>
      <ul className="grid gap-2">
        {data?.map((x) => <li key={x.user_id}><Link href={`/admin/shitesit/${x.user_id}`} className="card flex flex-wrap items-center justify-between gap-3 p-4 hover:border-lime/60"><span><span className="font-medium">{x.legal_name}</span><span className="block text-xs text-ink-2">{x.kind === "business" ? t("Biznes", "Business") : t("Individ", "Individual")} · {x.country}{x.registration_number ? ` · ${x.registration_number}` : ""}</span></span><Pill tone={x.status === "approved" ? "ok" : "warn"}>{SELLER_STATUS[x.status]?.[lang]}</Pill></Link></li>)}
        {!data?.length && <li className="text-sm text-ink-2">{t("Asnjë rast.", "No cases.")}</li>}
      </ul>
    </div>
  );
}
