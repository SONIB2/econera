import Link from "next/link";
import { tr } from "@/lib/lang";
import { getLang } from "@/lib/lang-server";
import { requireStaff } from "@/lib/verify/staff";

const PAGE = 50;
export default async function Audit({ searchParams }: { searchParams: Promise<{ q?: string; page?: string }> }) {
  const s = await requireStaff(["super_admin"]);
  const lang = await getLang();
  const t = (sq: string, en: string) => tr(lang, sq, en);
  const p = await searchParams;
  const page = Math.max(1, Number(p.page) || 1);
  let q = s.db.from("audit_log").select("id,at,actor,action,subject_type,subject_id,details", { count: "exact" }).order("id", { ascending: false });
  if (p.q) q = q.or(`action.ilike.%${p.q.replace(/[^\w.:-]/g, "")}%,subject_id.eq.${p.q.replace(/[^\w-]/g, "")}`);
  const { data, count } = await q.range((page - 1) * PAGE, page * PAGE - 1);
  return (
    <div className="grid gap-5">
      <h1 className="display text-4xl">{t("Regjistri i auditit", "Audit log")}</h1>
      <p className="text-sm text-ink-2">{t("Vetëm shtim: askush, as administratorët, nuk mund ta ndryshojë ose fshijë.", "Append-only: nobody, administrators included, can edit or delete it.")}</p>
      <form className="flex gap-3"><input name="q" defaultValue={p.q} placeholder={t("Veprimi ose ID e subjektit", "Action or subject ID")} className="rounded-lg border border-line bg-bg px-3 py-2 text-sm" /><button className="btn-primary">{t("Kërko", "Search")}</button></form>
      <div className="card overflow-x-auto"><table className="w-full min-w-[720px] text-xs"><thead className="border-b border-line text-left text-ink-2"><tr><th className="px-3 py-2">#</th><th className="px-3 py-2">{t("Koha", "Time")}</th><th className="px-3 py-2">{t("Aktori", "Actor")}</th><th className="px-3 py-2">{t("Veprimi", "Action")}</th><th className="px-3 py-2">{t("Subjekti", "Subject")}</th><th className="px-3 py-2">{t("Detaje", "Details")}</th></tr></thead>
        <tbody>{data?.map((a) => <tr key={a.id} className="border-b border-line align-top last:border-0"><td className="px-3 py-2">{a.id}</td><td className="px-3 py-2 whitespace-nowrap">{new Date(a.at).toLocaleString("en-GB")}</td><td className="px-3 py-2 font-mono">{a.actor?.slice(0, 8) ?? "system"}</td><td className="px-3 py-2 font-medium">{a.action}</td><td className="px-3 py-2">{a.subject_type === "material" ? <Link className="underline" href={`/admin/listimet/${a.subject_id}`}>{a.subject_id.slice(0, 8)}</Link> : `${a.subject_type}:${a.subject_id.slice(0, 8)}`}</td><td className="px-3 py-2"><code className="break-all">{JSON.stringify(a.details).slice(0, 220)}</code></td></tr>)}</tbody></table></div>
      <nav className="flex items-center gap-3 text-sm">{page > 1 && <Link className="btn-ghost" href={`?page=${page - 1}${p.q ? `&q=${p.q}` : ""}`}>{t("Mbrapa", "Previous")}</Link>}<span className="text-ink-2">{count ?? 0}</span>{(count ?? 0) > page * PAGE && <Link className="btn-ghost" href={`?page=${page + 1}${p.q ? `&q=${p.q}` : ""}`}>{t("Para", "Next")}</Link>}</nav>
    </div>
  );
}
