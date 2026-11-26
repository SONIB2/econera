import type { Metadata } from "next";
import Link from "next/link";
import { saveSeller, submitSeller } from "@/app/(site)/verify-actions";
import { ToolHeader } from "@/components/tools/tool-header";
import { DocList, DocUpload, Pill, StatusNotice } from "@/components/verify/ui";
import { tr } from "@/lib/lang";
import { getLang } from "@/lib/lang-server";
import { requireAccount } from "@/lib/supabase";
import { SELLER_DOC_TYPES, SELLER_STATUS } from "@/lib/verify/labels";

export const metadata: Metadata = { title: "ECONERA Verify", robots: { index: false } };

type Seller = { kind: "individual" | "business"; legal_name: string; country: string; phone: string | null; address: string | null; registration_number: string | null; tax_number: string | null; representative: string | null; public_name: string | null; status: string; decision_reason: string | null };

export default async function SellerVerification({ searchParams }: { searchParams: Promise<{ status?: string; lloji?: string }> }) {
  const { db, user } = await requireAccount();
  const lang = await getLang();
  const t = (sq: string, en: string) => tr(lang, sq, en);
  const { status, lloji } = await searchParams;
  const [{ data: seller, error }, { data: docs }] = await Promise.all([
    db.from("seller_verifications").select("*").eq("user_id", user.id).maybeSingle<Seller>(),
    db.from("verification_documents").select("id,doc_type,file_name,review_status,expires_on,review_notes,created_at").eq("subject_type", "seller").eq("subject_id", user.id).order("created_at", { ascending: false }),
  ]);
  const editable = !seller || ["draft", "info_required", "rejected"].includes(seller.status);
  const input = "w-full rounded-lg border border-line bg-bg px-3 py-2.5 text-sm";
  const s = seller;
  return (
    <>
      <ToolHeader hub="ECONERA Verify" hubHref="/verifikimi" name={t("Verifikimi i shitësit", "Seller verification")} title={t("Verifiko llogarinë e shitësit.", "Verify your seller account.")}
        lead={t("Identiteti ose regjistrimi i biznesit kontrollohet nga një person i ECONERA-s. Dokumentet mbeten private.", "Your identity or business registration is checked by an ECONERA staff member. Documents stay private.")} />
      <div className="container-x grid gap-6 pb-20">
        <StatusNotice status={error?.code === "42P01" ? "unavailable" : status} lang={lang} />
        {s && (
          <div className="card flex flex-wrap items-center justify-between gap-3 p-5">
            <span className="text-sm">{t("Statusi", "Status")}: <Pill tone={s.status === "approved" ? "ok" : ["rejected", "revoked"].includes(s.status) ? "err" : "warn"}>{SELLER_STATUS[s.status]?.[lang]}</Pill></span>
            {s.decision_reason && <span className="text-sm text-ink-2">{t("Shënimi i shqyrtuesit", "Reviewer note")}: {s.decision_reason}</span>}
          </div>
        )}
        <form action={saveSeller} className="card grid gap-4 p-5 md:grid-cols-2 md:p-7">
          <fieldset className="md:col-span-2" disabled={!editable}>
            <legend className="mb-2 text-sm font-medium">{t("Lloji i shitësit", "Seller type")}</legend>
            <div className="flex flex-wrap gap-2">
              {(["individual", "business"] as const).map((k) => <label key={k} className="cursor-pointer rounded-full border border-line px-4 py-2 text-sm has-[:checked]:border-lime has-[:checked]:bg-accent"><input type="radio" name="kind" value={k} defaultChecked={(s?.kind ?? (lloji === "individual" ? "individual" : "business")) === k} className="sr-only" />{k === "individual" ? t("Individ", "Individual") : t("Biznes / kompani ndërtimi", "Business / construction company")}</label>)}
            </div>
          </fieldset>
          <F label={t("Emri ligjor (si në dokument)", "Legal name (as on the document)")}><input name="legal_name" required minLength={2} maxLength={160} defaultValue={s?.legal_name} disabled={!editable} className={input} /></F>
          <F label={t("Shteti", "Country")}><select name="country" defaultValue={s?.country ?? "AL"} disabled={!editable} className={input}>{[["AL", "Shqipëri / Albania"], ["XK", "Kosovë / Kosovo"], ["MK", "Maqedoni e Veriut"], ["ME", "Mal i Zi"], ["IT", "Itali"], ["GR", "Greqi"], ["DE", "Gjermani"], ["GB", "Mbretëri e Bashkuar"], ["US", "SHBA"]].map(([c, n]) => <option key={c} value={c}>{n}</option>)}</select></F>
          <F label={t("Telefoni", "Phone")}><input name="phone" inputMode="tel" defaultValue={s?.phone ?? ""} disabled={!editable} className={input} placeholder="+355 6X XXX XXXX" /></F>
          <F label={t("Adresa (kur kërkohet)", "Address (when required)")}><input name="address" maxLength={300} defaultValue={s?.address ?? ""} disabled={!editable} className={input} /></F>
          <F label={t("NIPT / numri i regjistrimit (biznes)", "NIPT / registration number (business)")}><input name="registration_number" maxLength={40} defaultValue={s?.registration_number ?? ""} disabled={!editable} className={`${input} uppercase`} placeholder="L12345678A" /></F>
          <F label={t("Numri tatimor (nëse ndryshon)", "Tax number (if different)")}><input name="tax_number" maxLength={40} defaultValue={s?.tax_number ?? ""} disabled={!editable} className={input} /></F>
          <F label={t("Përfaqësuesi i autorizuar", "Authorised representative")}><input name="representative" maxLength={160} defaultValue={s?.representative ?? ""} disabled={!editable} className={input} /></F>
          <F label={t("Emri publik i biznesit", "Public business name")}><input name="public_name" maxLength={120} defaultValue={s?.public_name ?? ""} disabled={!editable} className={input} /></F>
          {editable && <div className="md:col-span-2"><button className="btn-primary">{t("Ruaj të dhënat", "Save details")}</button></div>}
        </form>

        {s && (
          <section className="card grid gap-4 p-5 md:p-7" aria-labelledby="dok">
            <h2 id="dok" className="text-2xl">{t("Dokumentet", "Documents")}</h2>
            <p className="text-sm text-ink-2">{s.kind === "business" ? t("Ngarko ekstraktin e QKB-së dhe, kur kërkohen, licencat. Për Kosovën: certifikata e regjistrimit (ARBK).", "Upload the business registration extract and, when required, licences. Kosovo: ARBK registration certificate.") : t("Ngarko dokumentin e identitetit (letërnjoftim ose pasaportë).", "Upload your identity document (ID card or passport).")}</p>
            <DocList docs={docs ?? []} lang={lang} />
            {editable && <DocUpload lang={lang} subjectType="seller" subjectId={user.id} types={SELLER_DOC_TYPES} back="/verifikimi" required={[s.kind === "business" ? "business_extract" : "identity"]} />}
            {editable && <form action={submitSeller}><button className="btn-primary">{t("Dërgo për verifikim", "Submit for verification")}</button></form>}
          </section>
        )}
        <p className="text-xs text-ink-2">{t("Distinktivat \"Identitet i verifikuar\" dhe \"Biznes i verifikuar\" shfaqen vetëm pas miratimit nga një oficer i ECONERA-s dhe nuk janë garanci për produktet.", "\"Verified Identity\" and \"Verified Business\" appear only after an ECONERA officer approves them and are not a guarantee for products.")} <Link href="/inventari" className="underline">{t("Te listimet e mia", "To my listings")}</Link></p>
      </div>
    </>
  );
}

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="grid gap-1.5 text-sm"><span className="font-medium">{label}</span>{children}</label>;
}
