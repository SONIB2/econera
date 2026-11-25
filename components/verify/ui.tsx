import type { ReactNode } from "react";
import { uploadDocument } from "@/app/(site)/verify-actions";
import { DOC_TYPES, type L } from "@/lib/verify/labels";

export type Lang = "sq" | "en";

const STATUS: Record<string, L & { tone?: "ok" | "warn" | "err" }> = {
  saved: { sq: "U ruajt.", en: "Saved.", tone: "ok" },
  submitted: { sq: "U dorëzua për shqyrtim nga një person i ECONERA-s.", en: "Submitted for review by an ECONERA staff member.", tone: "ok" },
  uploaded: { sq: "Dokumenti u ngarkua. Do të shqyrtohet nga stafi.", en: "Document uploaded. Staff will review it.", tone: "ok" },
  opened: { sq: "Ankesa u hap. Ekipi i mbrojtjes së klientit do të të kontaktojë.", en: "Complaint opened. Customer protection will contact you.", tone: "ok" },
  sent: { sq: "Mesazhi u dërgua.", en: "Message sent.", tone: "ok" },
  invalid: { sq: "Kontrollo fushat dhe provo përsëri.", en: "Check the fields and try again.", tone: "err" },
  nipt: { sq: "NIPT duhet të jetë si L12345678A (shkronjë, 8 shifra, shkronjë).", en: "NIPT must look like L12345678A (letter, 8 digits, letter).", tone: "err" },
  nui: { sq: "NUI i Kosovës ka 9 shifra.", en: "Kosovo NUI has 9 digits.", tone: "err" },
  incomplete: { sq: "Plotëso të dhënat para se ta dorëzosh.", en: "Complete the details before submitting.", tone: "warn" },
  conflict: { sq: "Listimi nuk mund të dorëzohet në këtë status ose ndryshoi ndërkohë.", en: "The listing cannot be submitted in this status or changed meanwhile.", tone: "warn" },
  failed: { sq: "Veprimi nuk u krye. Provo përsëri pas pak.", en: "The action failed. Try again shortly.", tone: "err" },
  unavailable: { sq: "ECONERA Verify nuk është aktivizuar ende në databazë (migrimi 0008).", en: "ECONERA Verify is not enabled in the database yet (migration 0008).", tone: "warn" },
  storage: { sq: "Ruajtja e skedarit dështoi. Kontrollo që bucket-i verify-docs ekziston.", en: "File storage failed. Check that the verify-docs bucket exists.", tone: "err" },
  "file-empty": { sq: "Zgjidh një skedar.", en: "Choose a file.", tone: "err" },
  "file-size": { sq: "Skedari kalon 15 MB.", en: "The file exceeds 15 MB.", tone: "err" },
  "file-type": { sq: "Lejohen vetëm PDF, JPG, PNG ose WEBP.", en: "Only PDF, JPG, PNG or WEBP are allowed.", tone: "err" },
  "file-unsafe": { sq: "PDF-ja përmban skripte ose veprime automatike dhe u refuzua.", en: "The PDF contains scripts or automatic actions and was refused.", tone: "err" },
};

export function StatusNotice({ status, lang, extra }: { status?: string; lang: Lang; extra?: Record<string, L> }) {
  const m = status ? extra?.[status] ?? STATUS[status] : undefined;
  if (!m) return null;
  const tone = "tone" in m ? m.tone : "ok";
  return <p role="status" className={`rounded-xl border px-4 py-3 text-sm ${tone === "err" ? "border-[#e8b7a8] bg-[#fdf0ec]" : tone === "warn" ? "border-[#ecd29a] bg-[#fdf6e3]" : "border-line bg-accent/50"}`}>{m[lang]}</p>;
}

export function Pill({ children, tone = "neutral" }: { children: ReactNode; tone?: "ok" | "warn" | "err" | "neutral" | string }) {
  const cls = tone === "ok" ? "bg-accent text-lime" : tone === "warn" ? "bg-[#fdf3dc] text-[#7a5a12]" : tone === "err" ? "bg-[#fde8e4] text-[#8a2f1d]" : tone === "neutral" ? "bg-bg-2 text-ink-2" : tone;
  return <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${cls}`}>{children}</span>;
}

/** Upload form for a private verification document. */
export function DocUpload({ lang, subjectType, subjectId, types, back, required = [] }: { lang: Lang; subjectType: "seller" | "material" | "dispute"; subjectId: string; types: readonly string[]; back: string; required?: string[] }) {
  const t = (sq: string, en: string) => (lang === "en" ? en : sq);
  const input = "w-full rounded-lg border border-line bg-bg px-3 py-2.5 text-sm";
  return (
    <form action={uploadDocument} className="grid gap-3 rounded-xl border border-dashed border-line p-4 sm:grid-cols-2 lg:grid-cols-3">
      <input type="hidden" name="subject_type" value={subjectType} />
      <input type="hidden" name="subject_id" value={subjectId} />
      <input type="hidden" name="back" value={back} />
      <label className="grid gap-1.5 text-sm"><span className="font-medium">{t("Lloji i dokumentit", "Document type")}</span>
        <select name="doc_type" required className={input} defaultValue={required[0] ?? types[0]}>
          {types.map((x) => <option key={x} value={x}>{DOC_TYPES[x]?.[lang] ?? x}{required.includes(x) ? ` · ${t("i detyrueshëm", "required")}` : ""}</option>)}
        </select>
      </label>
      <label className="grid gap-1.5 text-sm"><span className="font-medium">{t("Skedari (PDF, JPG, PNG, WEBP; deri 15 MB)", "File (PDF, JPG, PNG, WEBP; up to 15 MB)")}</span>
        <input type="file" name="file" required accept="application/pdf,image/jpeg,image/png,image/webp" className="text-sm" /></label>
      <label className="grid gap-1.5 text-sm"><span className="font-medium">{t("Lëshuesi (opsional)", "Issuer (optional)")}</span><input name="issuer" maxLength={160} className={input} /></label>
      <label className="grid gap-1.5 text-sm"><span className="font-medium">{t("Nr. reference / certifikate", "Reference / certificate no.")}</span><input name="reference_no" maxLength={120} className={input} /></label>
      <label className="grid gap-1.5 text-sm"><span className="font-medium">{t("Lëshuar më", "Issued on")}</span><input type="date" name="issued_on" className={input} /></label>
      <label className="grid gap-1.5 text-sm"><span className="font-medium">{t("Skadon më", "Expires on")}</span><input type="date" name="expires_on" className={input} /></label>
      <div className="sm:col-span-2 lg:col-span-3 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-ink-2">{t("Dokumentet ruhen privatisht dhe i shohin vetëm ti dhe stafi i autorizuar. Ngarkimi nuk do të thotë verifikim.", "Documents are stored privately; only you and authorised staff can see them. Uploading is not verification.")}</p>
        <button className="btn-primary">{t("Ngarko dokumentin", "Upload document")}</button>
      </div>
    </form>
  );
}

export function DocList({ docs, lang, staffLinks = false }: { docs: { id: string; doc_type: string; file_name: string; review_status: string; expires_on?: string | null; review_notes?: string | null; created_at: string }[]; lang: Lang; staffLinks?: boolean }) {
  const t = (sq: string, en: string) => (lang === "en" ? en : sq);
  if (!docs.length) return <p className="text-sm text-ink-2">{t("Asnjë dokument ende.", "No documents yet.")}</p>;
  const today = new Date().toISOString().slice(0, 10);
  return (
    <ul className="grid gap-2">
      {docs.map((d) => (
        <li key={d.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line px-3 py-2.5 text-sm">
          <span className="min-w-0"><span className="font-medium">{DOC_TYPES[d.doc_type]?.[lang] ?? d.doc_type}</span><span className="block truncate text-xs text-ink-2">{d.file_name}{d.expires_on ? ` · ${t("skadon", "expires")} ${d.expires_on}` : ""}{d.review_notes ? ` · ${d.review_notes}` : ""}</span></span>
          <span className="flex items-center gap-2">
            {d.expires_on && d.expires_on < today ? <Pill tone="err">{t("Skaduar", "Expired")}</Pill>
              : d.review_status === "accepted" ? <Pill tone="ok">{t("Pranuar", "Accepted")}</Pill>
              : d.review_status === "rejected" ? <Pill tone="err">{t("Refuzuar", "Rejected")}</Pill>
              : <Pill tone="warn">{t("Në shqyrtim", "In review")}</Pill>}
            {staffLinks && <a href={`/admin/dokument/${d.id}`} target="_blank" rel="noreferrer" className="text-xs font-medium text-lime underline underline-offset-4">{t("Hap", "Open")}</a>}
          </span>
        </li>
      ))}
    </ul>
  );
}
