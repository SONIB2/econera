import { saveRequirement } from "@/app/(site)/admin/actions";
import { tr } from "@/lib/lang";
import { getLang } from "@/lib/lang-server";
import { DOC_TYPES, INTENDED_USE, RISK } from "@/lib/verify/labels";
import { currentStaff } from "@/lib/verify/staff";
import { redirect } from "next/navigation";

export default async function Requirements({ searchParams }: { searchParams: Promise<{ r?: string }> }) {
  const s = await currentStaff();
  if (s.kind !== "staff") redirect("/admin");
  if (!s.mfa) redirect("/admin/mfa");
  const lang = await getLang();
  const t = (sq: string, en: string) => tr(lang, sq, en);
  const { r } = await searchParams;
  const admin = s.roles.includes("super_admin");
  const { data } = await s.db.from("verification_requirements").select("*").order("country").order("risk_level", { nullsFirst: true });
  const input = "rounded-lg border border-line bg-bg px-3 py-2 text-sm";
  return (
    <div className="grid gap-5">
      <h1 className="display text-4xl">{t("Matrica e kërkesave", "Requirements matrix")}</h1>
      <p className="text-sm text-ink-2">{t("Dokumentet që kërkohen sipas shtetit, kategorisë, rrezikut dhe përdorimit. Para aktivizimit të kategorive të rregulluara në një treg të ri, kërkohet shqyrtim ligjor dhe teknik i kualifikuar (p.sh. Rregullorja (BE) 2024/3110 për BE).", "Documents required by country, category, risk and intended use. Before enabling regulated categories in a new market, qualified legal and technical review is required (e.g. Regulation (EU) 2024/3110 for the EU).")}</p>
      {r && <p role="status" className="rounded-xl border border-line bg-bg-2 px-4 py-3 text-sm">{r === "ok" ? t("U ruajt.", "Saved.") : t("Kontrollo fushat.", "Check the fields.")}</p>}
      <div className="card overflow-x-auto"><table className="w-full min-w-[760px] text-sm"><thead className="border-b border-line text-left text-ink-2"><tr><th className="px-3 py-2">{t("Shteti", "Country")}</th><th className="px-3 py-2">{t("Kategoria", "Category")}</th><th className="px-3 py-2">{t("Rreziku", "Risk")}</th><th className="px-3 py-2">{t("Përdorimi", "Use")}</th><th className="px-3 py-2">{t("Dokumenti", "Document")}</th><th className="px-3 py-2">{t("I detyrueshëm", "Required")}</th><th className="px-3 py-2">{t("Aktiv", "Active")}</th></tr></thead>
        <tbody>{data?.map((x) => <tr key={x.id} className="border-b border-line last:border-0"><td className="px-3 py-2">{x.country}</td><td className="px-3 py-2">{x.category ?? t("të gjitha", "all")}</td><td className="px-3 py-2">{x.risk_level ? RISK[x.risk_level]?.[lang] : t("të gjitha", "all")}</td><td className="px-3 py-2">{x.intended_use ? INTENDED_USE[x.intended_use]?.[lang] : "—"}</td><td className="px-3 py-2">{DOC_TYPES[x.doc_type]?.[lang] ?? x.doc_type}</td><td className="px-3 py-2">{x.required ? "✓" : "—"}</td>
          <td className="px-3 py-2">{admin ? <form action={saveRequirement}><input type="hidden" name="op" value="toggle" /><input type="hidden" name="id" value={x.id} /><input type="hidden" name="active" value={String(!x.active)} /><button className="underline">{x.active ? t("po", "yes") : t("jo", "no")}</button></form> : x.active ? "✓" : "—"}</td></tr>)}</tbody></table></div>
      {admin && (
        <form action={saveRequirement} className="card grid gap-3 p-5 md:grid-cols-4">
          <input type="hidden" name="op" value="add" />
          <input name="country" defaultValue="AL" maxLength={2} className={input} aria-label={t("Shteti", "Country")} />
          <input name="category" placeholder={t("kategoria (bosh = të gjitha)", "category (empty = all)")} className={input} />
          <select name="risk_level" className={input}><option value="">{t("çdo rrezik", "any risk")}</option>{["low", "medium", "high"].map((k) => <option key={k} value={k}>{RISK[k][lang]}</option>)}</select>
          <select name="intended_use" className={input}><option value="">{t("çdo përdorim", "any use")}</option>{Object.entries(INTENDED_USE).map(([k, v]) => <option key={k} value={k}>{v[lang]}</option>)}</select>
          <select name="doc_type" className={input}>{Object.entries(DOC_TYPES).map(([k, v]) => <option key={k} value={k}>{v[lang]}</option>)}</select>
          <input name="note_sq" placeholder="Shënim (shqip)" className={input} /><input name="note_en" placeholder="Note (English)" className={input} />
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="required" defaultChecked />{t("I detyrueshëm", "Required")}</label>
          <button className="btn-primary w-fit">{t("Shto rregull", "Add rule")}</button>
        </form>
      )}
    </div>
  );
}
