import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { PassportPdf } from "@/components/verify/passport-pdf";
import { tr } from "@/lib/lang";
import { getLang } from "@/lib/lang-server";
import { applicationOrigin } from "@/lib/supabase";
import { DOC_TYPES, INTENDED_USE, RISK } from "@/lib/verify/labels";
import { readVerification } from "@/lib/verify/public";

export const revalidate = 60;
export const metadata: Metadata = { title: "Verifikimi i materialit" };

export default async function VerificationRecord({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const lang = await getLang();
  const t = (sq: string, en: string) => tr(lang, sq, en);
  const rec = await readVerification(id);
  if (!rec) notFound();
  const { v, m } = rec;
  const url = `${applicationOrigin() ?? "https://www.econera.al"}/pasaporta/${v.passport_code ?? ""}`;
  const qr = v.passport_code ? await QRCode.toString(url, { type: "svg", margin: 1, color: { dark: "#0c2f2b", light: "#ffffff" } }) : null;
  const date = (d?: string | null) => (d ? new Date(d).toLocaleDateString("en-GB") : "—");
  const badge = (ok: boolean | null | undefined, sq: string, en: string, scopeSq: string, scopeEn: string) => (
    <li className={`flex gap-3 rounded-xl border p-4 ${ok ? "border-lime/40 bg-accent/40" : "border-line"}`}>
      <span aria-hidden className={`mt-0.5 grid size-6 shrink-0 place-items-center rounded-full text-xs ${ok ? "bg-lime text-bg" : "bg-bg-2 text-ink-2"}`}>{ok ? "✓" : "–"}</span>
      <span><span className="font-semibold">{lang === "en" ? en : sq}</span> <span className="text-sm text-ink-2">{ok ? "" : t("· nuk është kryer", "· not performed")}</span><span className="block text-sm text-ink-2">{lang === "en" ? scopeEn : scopeSq}</span></span>
    </li>
  );
  const docsReviewed = v.documents.length > 0;
  return (
    <div className="container-x grid gap-8 py-12 md:py-16">
      <nav className="text-sm text-ink-2"><Link href={`/materiale/${id}`} className="hover:text-ink">{m.title}</Link> / {t("Verifikimi", "Verification")}</nav>
      <header className="grid gap-6 md:grid-cols-[1fr_auto] md:items-end">
        <div>
          <p className="eyebrow-pill">ECONERA Verify</p>
          <h1 className="display mt-5 text-4xl md:text-6xl">{m.title}</h1>
          <p className="mt-3 text-ink-2">{m.quantity} {m.unit} · {m.region}{v.batch_no ? ` · ${t("Loti", "Lot")} ${v.batch_no}` : ""} · {t("Shqyrtuar më", "Reviewed on")} {date(v.reviewed_at)}</p>
        </div>
        <div className="flex gap-2"><Link href={`/materiale/${id}`} className="btn-primary">{t("Te produkti", "To the product")}</Link><Link href={`/mbrojtja?material=${id}`} className="btn-ghost">{t("Raporto një problem", "Report a problem")}</Link></div>
      </header>

      <section aria-labelledby="niveli" className="grid gap-4">
        <h2 id="niveli" className="text-2xl">{t("Çfarë është kontrolluar", "What has been checked")}</h2>
        <ul className="grid gap-3 md:grid-cols-2">
          {badge(v.identity_verified, "Identitet i verifikuar", "Verified Identity", "Identiteti i shitësit u kontrollua nga një oficer i ECONERA-s.", "The seller's identity was checked by an ECONERA officer.")}
          {badge(v.business_verified, "Biznes i verifikuar", "Verified Business", `Regjistrimi i kompanisë${v.business_name ? ` (${v.business_name})` : ""} u kontrollua.`, `Company registration${v.business_name ? ` (${v.business_name})` : ""} was checked.`)}
          {badge(Boolean(v.reviewed_at), "Listim i shqyrtuar", "Listing Reviewed", `Miratuar nga ${v.approvals > 1 ? "dy shqyrtues" : "një shqyrtues"} njerëzor i autorizuar.`, `Approved by ${v.approvals > 1 ? "two" : "an"} authorised human reviewer${v.approvals > 1 ? "s" : ""}.`)}
          {badge(docsReviewed, "Dokumente të verifikuara", "Documents Verified", "Dokumentacioni i zbatueshëm u shqyrtua sipas politikës së ECONERA-s.", "Applicable documentation was reviewed under ECONERA's policy.")}
          {badge(v.inspection?.result === "pass" || v.inspection?.result === "restricted", "Inspektuar fizikisht", "Physically Inspected", v.inspection ? `${date(v.inspection.date)} · ${v.inspection.scope} · ${t("Loti", "Lot")} ${v.inspection.lot}${v.inspection.result === "restricted" ? " · me kufizime" : ""}` : "Fotot e shitësit nuk llogariten si inspektim.", v.inspection ? `${date(v.inspection.date)} · ${v.inspection.scope} · Lot ${v.inspection.lot}${v.inspection.result === "restricted" ? " · with restrictions" : ""}` : "Seller photos do not count as an inspection.")}
          {badge(v.independent_certified, "Certifikim i pavarur i verifikuar", "Independent Certification Verified", "Certifikata u kontrollua te lëshuesi, brenda fushës së saj.", "The certificate was checked with its issuer, within its scope.")}
        </ul>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section className="card p-6" aria-labelledby="te-dhenat">
          <h2 id="te-dhenat" className="text-2xl">{t("Të dhënat e materialit", "Material information")}</h2>
          <p className="mt-1 text-xs text-ink-2">{t("Deklaruar nga shitësi, përveç ku shënohet ndryshe.", "Declared by the seller unless marked otherwise.")}</p>
          <dl className="mt-4 grid grid-cols-2 gap-4 text-sm">
            {[[t("Prodhuesi", "Manufacturer"), v.manufacturer], [t("Modeli / referenca", "Model / reference"), v.model_ref], [t("Loti / batch", "Batch / lot"), v.batch_no], [t("Origjina", "Origin"), v.origin_country],
              [t("Mosha", "Age"), v.age_years !== null ? `${v.age_years} ${t("vite", "years")}` : null], [t("Ruajtja", "Storage"), v.storage_conditions], [t("Përdorimi i synuar", "Intended use"), INTENDED_USE[v.intended_use]?.[lang]],
              [t("Përmasat", "Dimensions"), m.length_mm ? `${m.length_mm} × ${m.width_mm} × ${m.thickness_mm} mm` : null], [t("Klasa e rrezikut (nga stafi)", "Risk class (set by staff)"), RISK[v.risk_level]?.[lang]]]
              .filter(([, x]) => x).map(([k, x]) => <div key={k as string}><dt className="text-xs text-ink-2">{k}</dt><dd>{x}</dd></div>)}
          </dl>
          {v.known_defects && <p className="mt-4 rounded-lg bg-[#fdf6e3] px-3 py-2 text-sm"><span className="font-medium">{t("Defekte të njohura", "Known defects")}:</span> {v.known_defects}</p>}
          <h3 className="mt-6 text-lg">{t("Dokumentet e shqyrtuara nga ECONERA", "Documents reviewed by ECONERA")}</h3>
          {v.documents.length ? <ul className="mt-2 grid gap-1.5 text-sm">{v.documents.map((d, i) => <li key={i} className="rounded-lg bg-bg-2/60 px-3 py-2">{DOC_TYPES[d.type]?.[lang] ?? d.type}{d.issuer ? ` · ${d.issuer}` : ""}{d.reference ? ` · ${d.reference}` : ""}{d.expires_on ? ` · ${t("vlen deri", "valid until")} ${date(d.expires_on)}` : ""}{d.registry_checked ? ` · ${t("kontrolluar te lëshuesi", "checked with issuer")}` : ""}</li>)}</ul> : <p className="mt-2 text-sm text-ink-2">{t("Nuk ka dokumente teknike publike për këtë material.", "No public technical documents for this material.")}</p>}
        </section>

        <section className="card grid content-start gap-4 p-6" aria-labelledby="pasaporta">
          <h2 id="pasaporta" className="text-2xl">{t("Pasaporta e materialit", "Material passport")}</h2>
          {v.passport_code ? (
            <>
              <p className="font-mono text-lg tracking-wide">{v.passport_code}</p>
              {qr && <div className="w-40 rounded-lg border border-line bg-white p-2" role="img" aria-label={t(`Kodi QR për ${v.passport_code}`, `QR code for ${v.passport_code}`)} dangerouslySetInnerHTML={{ __html: qr }} />}
              <p className="text-xs text-ink-2">{t(`Lëshuar më ${date(v.passport_issued_at)} · versioni i listimit ${v.revision}`, `Issued on ${date(v.passport_issued_at)} · listing version ${v.revision}`)}</p>
              <PassportPdf data={{ code: v.passport_code, title: m.title, category: m.category, quantity: `${m.quantity} ${m.unit}`, region: m.region, seller: v.business_name ?? m.seller_label ?? "", manufacturer: v.manufacturer, batch: v.batch_no, origin: v.origin_country, reviewed: date(v.reviewed_at), inspection: v.inspection ? `${v.inspection.result} · ${date(v.inspection.date)}` : null, documents: v.documents.map((d) => DOC_TYPES[d.type]?.en ?? d.type), url }} />
            </>
          ) : <p className="text-sm text-ink-2">{t("Pasaporta lëshohet me miratimin e lotit.", "The passport is issued when the lot is approved.")}</p>}
          <p className="text-xs text-ink-2">{t("Pasaportë e brendshme ECONERA për gjurmueshmërinë e materialit. Nuk është Pasaportë Digjitale Produkti zyrtare sipas rregulloreve, as certifikatë konformiteti.", "Internal ECONERA passport for material traceability. Not an official regulatory Digital Product Passport or a conformity certificate.")}</p>
        </section>
      </div>
      <p className="text-xs leading-relaxed text-ink-2">{t("Verifikimi i ECONERA-s tregon çfarë është kontrolluar dhe kur. Nuk është garanci e përgjithshme sigurie dhe ECONERA nuk është organ i akredituar certifikimi. Për përdorim strukturor, zjarr, elektrik ose presion, konsultohu me një profesionist të kualifikuar.", "ECONERA verification shows what was checked and when. It is not a blanket safety guarantee and ECONERA is not an accredited certification body. For structural, fire, electrical or pressure use, consult a qualified professional.")}</p>
    </div>
  );
}
