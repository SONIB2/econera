import { notFound } from "next/navigation";
import { decideSeller, reviewDocument } from "@/app/(site)/admin/actions";
import { DocList, Pill } from "@/components/verify/ui";
import { tr } from "@/lib/lang";
import { getLang } from "@/lib/lang-server";
import { SELLER_STATUS } from "@/lib/verify/labels";
import { requireStaff } from "@/lib/verify/staff";

export default async function SellerCase({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ r?: string }> }) {
  const s = await requireStaff(["seller_officer"]);
  const lang = await getLang();
  const t = (sq: string, en: string) => tr(lang, sq, en);
  const { id } = await params;
  const { r } = await searchParams;
  const { data: v } = await s.db.from("seller_verifications").select("*").eq("user_id", id).maybeSingle();
  if (!v) notFound();
  const [{ data: docs }, { data: history }] = await Promise.all([
    s.db.from("verification_documents").select("id,doc_type,file_name,review_status,expires_on,review_notes,created_at,owner_id").eq("subject_type", "seller").eq("subject_id", id).order("created_at", { ascending: false }),
    s.db.from("audit_log").select("action,at,details").eq("subject_type", "seller").eq("subject_id", id).order("at", { ascending: false }),
  ]);
  const own = id === s.user.id;
  const msg: Record<string, [string, string]> = { ok: ["Vendimi u regjistrua.", "Decision recorded."], seller_docs: ["Për miratim duhet një dokument identiteti ose ekstrakt biznesi i pranuar.", "Approval needs an accepted identity document or business extract."], invalid_state: ["Veprimi nuk lejohet në këtë status.", "Not allowed in this status."], failed: ["Veprimi dështoi.", "The action failed."], doc_ok: ["Dokumenti u shqyrtua.", "Document reviewed."], doc_failed: ["Dokumenti nuk u shqyrtua.", "Document not reviewed."] };
  const fields: [string, unknown][] = [[t("Lloji", "Type"), v.kind === "business" ? t("Biznes", "Business") : t("Individ", "Individual")], [t("Emri ligjor", "Legal name"), v.legal_name], [t("Shteti", "Country"), v.country], [t("Telefoni", "Phone"), v.phone], [t("Adresa", "Address"), v.address], ["NIPT / Reg.", v.registration_number], [t("Nr. tatimor", "Tax no."), v.tax_number], [t("Përfaqësuesi", "Representative"), v.representative], [t("Emri publik", "Public name"), v.public_name]];
  return (
    <div className="grid gap-5">
      <header className="flex flex-wrap items-center gap-3"><h1 className="display text-4xl">{v.legal_name}</h1><Pill tone={v.status === "approved" ? "ok" : "warn"}>{SELLER_STATUS[v.status]?.[lang]}</Pill></header>
      {r && msg[r] && <p role="status" className="rounded-xl border border-line bg-bg-2 px-4 py-3 text-sm">{msg[r][lang === "en" ? 1 : 0]}</p>}
      <dl className="card grid grid-cols-2 gap-4 p-5 text-sm md:grid-cols-3">{fields.filter(([, x]) => x).map(([k, x]) => <div key={k}><dt className="text-xs text-ink-2">{k}</dt><dd>{String(x)}</dd></div>)}</dl>
      <p className="text-xs text-ink-2">{t("Kontrollo NIPT-in te QKB (qkb.gov.al) ose ARBK për Kosovën. Mos u mbështet vetëm te dokumenti i ngarkuar.", "Check the NIPT at QKB (qkb.gov.al) or ARBK for Kosovo. Do not rely only on the uploaded document.")}</p>
      <section className="card grid gap-3 p-5"><h2 className="text-xl">{t("Dokumentet", "Documents")}</h2>
        <DocList docs={docs ?? []} lang={lang} staffLinks />
        {!own && docs?.filter((d) => d.review_status === "pending").map((d) => (
          <form key={d.id} action={reviewDocument} className="flex flex-wrap items-center gap-2 text-sm"><input type="hidden" name="document" value={d.id} /><input type="hidden" name="back" value={`/admin/shitesit/${id}`} />
            <span className="font-medium">{d.file_name}</span><input name="notes" placeholder={t("Çfarë u kontrollua", "What was checked")} className="min-w-48 flex-1 rounded-lg border border-line bg-bg px-3 py-1.5" />
            <label className="flex items-center gap-1 text-xs"><input type="checkbox" name="registry_checked" />{t("Kontrolluar në regjistër", "Checked in registry")}</label>
            <button name="verdict" value="accepted" className="rounded-full bg-lime px-3 py-1.5 text-xs font-semibold text-bg">{t("Prano", "Accept")}</button><button name="verdict" value="rejected" className="rounded-full border border-line px-3 py-1.5 text-xs">{t("Refuzo", "Reject")}</button></form>
        ))}
      </section>
      {!own && (
        <form action={decideSeller} className="card grid gap-3 p-5"><input type="hidden" name="seller" value={id} />
          <label className="grid gap-1 text-sm"><span className="font-medium">{t("Arsyeja (e detyrueshme)", "Reason (required)")}</span><textarea name="reason" required minLength={5} rows={3} className="rounded-lg border border-line bg-bg px-3 py-2" /></label>
          <div className="flex flex-wrap gap-2">
            {v.status === "submitted" && <button name="decision" value="start" className="btn-ghost">{t("Merr rastin", "Take case")}</button>}
            <button name="decision" value="approve" className="btn-primary">{t("Verifiko", "Verify")}</button>
            <button name="decision" value="request_info" className="btn-ghost">{t("Kërko të dhëna", "Request information")}</button>
            <button name="decision" value="reject" className="btn-ghost">{t("Refuzo", "Reject")}</button>
            {v.status === "approved" && <button name="decision" value="revoke" className="btn-ghost border-[#b5543a] text-[#8a2f1d]">{t("Revoko verifikimin", "Revoke verification")}</button>}
          </div>
        </form>
      )}
      {!!history?.length && <section className="card p-5"><h2 className="text-xl">{t("Historiku", "History")}</h2><ol className="mt-3 grid gap-1.5 text-sm">{history.map((h, i) => <li key={i}>{h.action} · {new Date(h.at).toLocaleString("en-GB")}{(h.details as { reason?: string }).reason ? ` · ${(h.details as { reason?: string }).reason}` : ""}</li>)}</ol></section>}
    </div>
  );
}
