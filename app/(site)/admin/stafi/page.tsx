import { changeRole } from "@/app/(site)/admin/actions";
import { tr } from "@/lib/lang";
import { getLang } from "@/lib/lang-server";
import { ROLES } from "@/lib/verify/labels";
import { requireStaff } from "@/lib/verify/staff";

export default async function Staff({ searchParams }: { searchParams: Promise<{ r?: string }> }) {
  const s = await requireStaff(["super_admin"]);
  const lang = await getLang();
  const t = (sq: string, en: string) => tr(lang, sq, en);
  const { r } = await searchParams;
  const { data } = await s.db.from("staff_roles").select("user_id,role,granted_at").order("granted_at");
  const { data: activity } = await s.db.from("audit_log").select("actor,action,at").not("actor", "is", null).order("at", { ascending: false }).limit(20);
  const msg: Record<string, [string, string]> = { ok: ["U ruajt.", "Saved."], no_secret: ["Për kërkim me email duhet SUPABASE_SECRET_KEY në server; përndryshe fut ID-në e përdoruesit.", "Email lookup needs SUPABASE_SECRET_KEY on the server; otherwise enter the user ID."], user_missing: ["Përdoruesi nuk u gjet.", "User not found."], invalid_state: ["Nuk lejohet (p.sh. ndryshimi i rolit tënd).", "Not allowed (e.g. changing your own role)."] };
  const input = "rounded-lg border border-line bg-bg px-3 py-2 text-sm";
  return (
    <div className="grid gap-5">
      <h1 className="display text-4xl">{t("Stafi dhe rolet", "Staff and roles")}</h1>
      {r && msg[r] && <p role="status" className="rounded-xl border border-line bg-bg-2 px-4 py-3 text-sm">{msg[r][lang === "en" ? 1 : 0]}</p>}
      <div className="grid gap-3 md:grid-cols-2">{Object.entries(ROLES).map(([k, v]) => <div key={k} className="card p-4 text-sm"><p className="font-semibold">{v[lang]}</p><p className="text-ink-2">{v.text[lang]}</p></div>)}</div>
      <form action={changeRole} className="card flex flex-wrap items-end gap-3 p-5">
        <label className="grid gap-1 text-sm"><span className="font-medium">Email</span><input name="email" type="email" className={input} /></label>
        <label className="grid gap-1 text-sm"><span className="font-medium">{t("ose ID e përdoruesit", "or user ID")}</span><input name="user" className={`${input} w-80`} /></label>
        <label className="grid gap-1 text-sm"><span className="font-medium">{t("Roli", "Role")}</span><select name="role" className={input}>{Object.entries(ROLES).map(([k, v]) => <option key={k} value={k}>{v[lang]}</option>)}</select></label>
        <button name="op" value="grant" className="btn-primary">{t("Jep rolin", "Grant role")}</button>
        <button name="op" value="revoke" className="btn-ghost">{t("Hiq rolin", "Revoke role")}</button>
        <p className="w-full text-xs text-ink-2">{t("Çdo rol kërkon MFA. Askush nuk mund të ndryshojë rolin e vet. Ndryshimet regjistrohen në audit.", "Every role requires MFA. Nobody can change their own role. Changes are audited.")}</p>
      </form>
      <section className="card overflow-x-auto"><table className="w-full text-sm"><thead className="border-b border-line text-left text-ink-2"><tr><th className="px-4 py-3 font-medium">{t("Përdoruesi", "User")}</th><th className="px-4 py-3 font-medium">{t("Roli", "Role")}</th><th className="px-4 py-3 font-medium">{t("Që nga", "Since")}</th></tr></thead>
        <tbody>{data?.map((x) => <tr key={`${x.user_id}${x.role}`} className="border-b border-line last:border-0"><td className="px-4 py-3 font-mono text-xs">{x.user_id}{x.user_id === s.user.id ? ` (${t("ti", "you")})` : ""}</td><td className="px-4 py-3">{ROLES[x.role]?.[lang]}</td><td className="px-4 py-3 text-ink-2">{new Date(x.granted_at).toLocaleDateString("en-GB")}</td></tr>)}</tbody></table></section>
      <section className="card p-5"><h2 className="text-xl">{t("Aktiviteti i fundit i stafit", "Recent staff activity")}</h2><ol className="mt-3 grid gap-1 text-xs">{activity?.map((a, i) => <li key={i} className="font-mono">{new Date(a.at).toLocaleString("en-GB")} · {a.actor?.slice(0, 8)} · {a.action}</li>)}</ol></section>
    </div>
  );
}
