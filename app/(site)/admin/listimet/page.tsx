import Link from "next/link";
import { Pill } from "@/components/verify/ui";
import { tr } from "@/lib/lang";
import { getLang } from "@/lib/lang-server";
import { listingStatus, RISK } from "@/lib/verify/labels";
import { requireStaff } from "@/lib/verify/staff";

const PAGE = 25;
const STATUSES = ["pending", "under_review", "info_required", "inspection_required", "escalated", "approved", "rejected", "published", "suspended", "expired", "unreviewed"];

export default async function AdminListings({ searchParams }: { searchParams: Promise<{ status?: string; risk?: string; q?: string; page?: string; mine?: string; sort?: string }> }) {
  const s = await requireStaff(["product_officer", "technical_reviewer", "customer_protection", "support"]);
  const lang = await getLang();
  const t = (sq: string, en: string) => tr(lang, sq, en);
  const p = await searchParams;
  const page = Math.max(1, Number(p.page) || 1);
  let q = s.db.from("materials").select("id,title,category,risk_level,moderation,publication,quantity,submitted_at,updated_at,assigned_to,seller_label,region", { count: "exact" });
  if (p.status && ["published", "suspended", "expired"].includes(p.status)) q = q.eq("publication", p.status);
  else if (p.status && STATUSES.includes(p.status)) q = q.eq("moderation", p.status);
  if (p.risk && RISK[p.risk]) q = q.eq("risk_level", p.risk);
  if (p.q) q = q.ilike("title", `%${p.q.replace(/[\\%_*]/g, "\\$&").slice(0, 80)}%`);
  if (p.mine) q = q.eq("assigned_to", s.user.id);
  q = p.sort === "recent" ? q.order("updated_at", { ascending: false }) : q.order("submitted_at", { ascending: true, nullsFirst: false });
  const { data, count } = await q.range((page - 1) * PAGE, page * PAGE - 1);
  const qs = (patch: Record<string, string | undefined>) => `?${new URLSearchParams(Object.entries({ ...p, ...patch }).filter(([, v]) => v) as [string, string][]).toString()}`;
  const sel = "rounded-lg border border-line bg-bg px-3 py-2 text-sm";
  return (
    <div className="grid gap-5">
      <h1 className="display text-4xl">{t("Listimet", "Listings")}</h1>
      <form className="flex flex-wrap items-end gap-3">
        <input name="q" defaultValue={p.q} placeholder={t("Kërko titullin", "Search title")} className={sel} />
        <select name="status" defaultValue={p.status ?? ""} className={sel}><option value="">{t("Çdo status", "Any status")}</option>{STATUSES.map((x) => <option key={x} value={x}>{listingStatus(["published", "suspended", "expired"].includes(x) ? x : "draft", x)[lang]}</option>)}</select>
        <select name="risk" defaultValue={p.risk ?? ""} className={sel}><option value="">{t("Çdo rrezik", "Any risk")}</option>{Object.entries(RISK).map(([k, v]) => <option key={k} value={k}>{v[lang]}</option>)}</select>
        <select name="sort" defaultValue={p.sort ?? ""} className={sel}><option value="">{t("Më të vjetrat në radhë", "Oldest in queue")}</option><option value="recent">{t("Ndryshuar së fundmi", "Recently changed")}</option></select>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="mine" value="1" defaultChecked={Boolean(p.mine)} />{t("Të miat", "Assigned to me")}</label>
        <button className="btn-primary">{t("Filtro", "Filter")}</button>
      </form>
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="border-b border-line text-left text-ink-2"><tr><th className="px-4 py-3 font-medium">{t("Listimi", "Listing")}</th><th className="px-4 py-3 font-medium">{t("Statusi", "Status")}</th><th className="px-4 py-3 font-medium">{t("Rreziku", "Risk")}</th><th className="px-4 py-3 font-medium">{t("Dorëzuar", "Submitted")}</th><th className="px-4 py-3 font-medium">{t("Caktuar", "Assigned")}</th></tr></thead>
          <tbody>
            {data?.map((m) => (
              <tr key={m.id} className="border-b border-line last:border-0 hover:bg-bg-2/50">
                <td className="px-4 py-3"><Link href={`/admin/listimet/${m.id}`} className="font-medium hover:underline">{m.title}</Link><span className="block text-xs text-ink-2">{m.seller_label ?? "—"} · {m.region}</span></td>
                <td className="px-4 py-3"><Pill>{listingStatus(m.publication, m.moderation, Number(m.quantity))[lang]}</Pill></td>
                <td className="px-4 py-3">{m.risk_level ? <Pill tone={RISK[m.risk_level]?.tone}>{RISK[m.risk_level]?.[lang]}</Pill> : "—"}</td>
                <td className="px-4 py-3 text-ink-2">{m.submitted_at ? new Date(m.submitted_at).toLocaleDateString("en-GB") : "—"}</td>
                <td className="px-4 py-3 text-ink-2">{m.assigned_to ? (m.assigned_to === s.user.id ? t("ti", "you") : t("po", "yes")) : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!data?.length && <p className="p-5 text-sm text-ink-2">{t("Asnjë listim me këto filtra.", "No listings with these filters.")}</p>}
      </div>
      <nav className="flex items-center gap-3 text-sm" aria-label={t("Faqet", "Pages")}>
        {page > 1 && <Link href={qs({ page: String(page - 1) })} className="btn-ghost">{t("Mbrapa", "Previous")}</Link>}
        <span className="text-ink-2">{t("Faqja", "Page")} {page} · {count ?? 0} {t("gjithsej", "total")}</span>
        {(count ?? 0) > page * PAGE && <Link href={qs({ page: String(page + 1) })} className="btn-ghost">{t("Para", "Next")}</Link>}
      </nav>
    </div>
  );
}
