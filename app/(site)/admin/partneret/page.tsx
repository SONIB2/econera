import { deletePartner, reviewPartnerApplication, savePartner, setPartnerPublished } from "@/app/(site)/admin/actions";
import { Pill } from "@/components/verify/ui";
import { formatDate } from "@/lib/format";
import { tr } from "@/lib/lang";
import { getLang } from "@/lib/lang-server";
import { logoUrl, PARTNER_CATEGORY } from "@/lib/partners";
import { requireStaff } from "@/lib/verify/staff";

export const metadata = { title: "Partnerët" };

type Lead = { id: string; company: string; contact: string; email: string; phone: string; role: string; city: string; materials: string; created_at: string; status: string; review_note: string | null };
type Row = { id: string; name: string; category: string; description_sq: string | null; description_en: string | null; website: string | null; logo_path: string | null; logo_authorized: boolean; confirmation_ref: string; confirmed_on: string; published: boolean; application_id: string | null };

/** Partner management: review applications, record the formal confirmation, then create, edit and publish partner profiles. */
export default async function PartnersAdmin({ searchParams }: { searchParams: Promise<{ r?: string; nga?: string }> }) {
  const s = await requireStaff(["support"]);
  const lang = await getLang();
  const t = (sq: string, en: string) => tr(lang, sq, en);
  const { r, nga } = await searchParams;
  const [{ data: leads, error: leadErr }, { data: partners, error: partErr }] = await Promise.all([
    s.db.from("leads").select("id,company,contact,email,phone,role,city,materials,created_at,status,review_note").eq("source", "partner").order("created_at", { ascending: false }).limit(200),
    s.db.from("partners").select("*").order("name"),
  ]);
  const notDeployed = Boolean(partErr) || Boolean(leadErr);
  const from = (leads as Lead[] | null)?.find((l) => l.id === nga);
  const STATUS: Record<string, [string, string, "ok" | "warn" | "err" | undefined]> = {
    new: [t("E re", "New"), "New", undefined], info_requested: [t("Kërkuar info", "Info requested"), "", "warn"], approved: [t("Miratuar", "Approved"), "", "ok"], rejected: [t("Refuzuar", "Rejected"), "", "err"],
  };
  const msg: Record<string, string> = {
    reviewed: t("Statusi u ruajt.", "Status saved."), saved: t("U ruajt.", "Saved."), deleted: t("U fshi.", "Deleted."), invalid: t("Kontrollo fushat.", "Check the fields."),
    logo_permission: t("Logoja kërkon lejen e partnerit.", "A logo needs the partner's permission."), logo_file: t("Logoja duhet PNG, JPG ose WEBP deri 1 MB.", "The logo must be PNG, JPG or WEBP up to 1 MB."),
    storage: t("Logoja nuk u ngarkua.", "The logo could not be uploaded."), failed: t("Veprimi dështoi.", "The action failed."),
  };
  const input = "w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm";

  const form = (p?: Row, app?: Lead) => (
    <form action={savePartner} className="grid gap-3 sm:grid-cols-2">
      {p && <input type="hidden" name="partner" value={p.id} />}
      {app && <input type="hidden" name="application" value={app.id} />}
      <label className="grid gap-1 text-sm">{t("Emri", "Name")}<input name="name" required defaultValue={p?.name ?? app?.company} className={input} /></label>
      <label className="grid gap-1 text-sm">{t("Kategoria", "Category")}<select name="category" defaultValue={p?.category ?? "supplier"} className={input}>{Object.entries(PARTNER_CATEGORY).map(([k, v]) => <option key={k} value={k}>{v[lang]}</option>)}</select></label>
      <label className="grid gap-1 text-sm sm:col-span-2">{t("Përshkrimi (shqip)", "Description (Albanian)")}<textarea name="description_sq" maxLength={600} rows={2} defaultValue={p?.description_sq ?? ""} className={input} /></label>
      <label className="grid gap-1 text-sm sm:col-span-2">{t("Përshkrimi (anglisht)", "Description (English)")}<textarea name="description_en" maxLength={600} rows={2} defaultValue={p?.description_en ?? ""} className={input} /></label>
      <label className="grid gap-1 text-sm">{t("Faqja (https://)", "Website (https://)")}<input name="website" type="url" defaultValue={p?.website ?? ""} className={input} /></label>
      <label className="grid gap-1 text-sm">{t("Logoja (PNG/JPG/WEBP, ≤1 MB)", "Logo (PNG/JPG/WEBP, ≤1 MB)")}<input name="logo" type="file" accept="image/png,image/jpeg,image/webp" className="text-sm" /></label>
      <label className="grid gap-1 text-sm">{t("Konfirmimi formal (p.sh. marrëveshja, ref.)", "Formal confirmation (e.g. agreement, ref.)")}<input name="confirmation_ref" required minLength={3} maxLength={200} defaultValue={p?.confirmation_ref} className={input} /></label>
      <label className="grid gap-1 text-sm">{t("Data e konfirmimit", "Confirmation date")}<input name="confirmed_on" type="date" required defaultValue={p?.confirmed_on} className={input} /></label>
      <label className="flex items-center gap-2 text-sm sm:col-span-2"><input type="checkbox" name="logo_authorized" defaultChecked={p?.logo_authorized} className="size-4" />{t("Partneri ka dhënë leje me shkrim për përdorimin e logos", "The partner has given written permission to use its logo")}</label>
      <button className="btn-primary w-fit">{p ? t("Ruaj ndryshimet", "Save changes") : t("Krijo profilin (si draft)", "Create profile (as draft)")}</button>
    </form>
  );

  return (
    <div className="grid gap-8">
      <div>
        <h1 className="display text-4xl">{t("Partnerët", "Partners")}</h1>
        <p className="mt-2 text-sm text-ink-2">{t("Aplikimi nuk krijon partneritet. Profili publikohet vetëm pasi regjistrohet konfirmimi formal dhe e publikon një anëtar i stafit.", "An application never creates a partnership. A profile goes public only after the formal confirmation is recorded and a staff member publishes it.")}</p>
        {r && msg[r] && <p role="status" className="mt-3 rounded-lg border border-line bg-bg-2 px-4 py-2 text-sm">{msg[r]}</p>}
        {notDeployed && <p role="alert" className="mt-3 rounded-lg border border-line bg-bg-2 px-4 py-2 text-sm">{t("Tabela e partnerëve nuk është aplikuar ende në databazë (migrimi 0030).", "The partners table is not in the database yet (migration 0030).")}</p>}
      </div>

      <section aria-labelledby="apl" className="grid gap-3">
        <h2 id="apl" className="text-2xl">{t("Aplikimet", "Applications")} <span className="text-ink-2">({leads?.length ?? 0})</span></h2>
        {(leads as Lead[] | null)?.map((l) => (
          <article key={l.id} className="card grid gap-3 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-semibold">{l.company} <span className="font-normal text-ink-2">· {l.contact} · {l.email}{l.phone ? ` · ${l.phone}` : ""} · {l.city}</span></p>
              <span className="flex items-center gap-2 text-xs text-ink-2">{formatDate(new Date(l.created_at))}<Pill tone={STATUS[l.status]?.[2]}>{STATUS[l.status]?.[0] ?? l.status}</Pill></span>
            </div>
            <p className="text-sm text-ink-2">{l.materials}</p>
            {l.review_note && <p className="text-xs text-ink-2">{t("Shënim", "Note")}: {l.review_note}</p>}
            <form action={reviewPartnerApplication} className="flex flex-wrap items-center gap-2">
              <input type="hidden" name="lead" value={l.id} />
              <input name="note" placeholder={t("Shënim për vendimin (opsional)", "Note on the decision (optional)")} className={`${input} max-w-sm`} />
              <button name="status" value="info_requested" className="btn-ghost h-9 text-sm">{t("Kërko info", "Request info")}</button>
              <button name="status" value="approved" className="btn-ghost h-9 text-sm">{t("Mirato", "Approve")}</button>
              <button name="status" value="rejected" className="btn-ghost h-9 text-sm">{t("Refuzo", "Reject")}</button>
              {l.status === "approved" && <a href={`/admin/partneret?nga=${l.id}#i-ri`} className="text-sm underline">{t("Krijo profilin e partnerit", "Create partner profile")}</a>}
            </form>
          </article>
        ))}
        {!leads?.length && !notDeployed && <p className="text-sm text-ink-2">{t("Asnjë aplikim ende.", "No applications yet.")}</p>}
      </section>

      <section aria-labelledby="i-ri" className="card grid gap-3 p-5">
        <h2 id="i-ri" className="text-2xl">{t("Partner i ri", "New partner")}</h2>
        {from && <p className="text-sm text-ink-2">{t("Nga aplikimi i", "From the application by")} {from.company}</p>}
        {form(undefined, from)}
      </section>

      <section aria-labelledby="lista" className="grid gap-3">
        <h2 id="lista" className="text-2xl">{t("Profilet", "Profiles")} <span className="text-ink-2">({partners?.length ?? 0})</span></h2>
        {(partners as Row[] | null)?.map((p) => (
          <details key={p.id} className="card p-4">
            <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-2">
              <span className="flex items-center gap-3 font-semibold">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {p.logo_path && <img src={logoUrl(p.logo_path) ?? ""} alt="" className="h-8 w-auto" />}
                {p.name} <span className="font-normal text-ink-2">· {PARTNER_CATEGORY[p.category]?.[lang]}</span>
              </span>
              <Pill tone={p.published ? "ok" : undefined}>{p.published ? t("Publikuar", "Published") : t("Draft", "Draft")}</Pill>
            </summary>
            <div className="mt-4 grid gap-4">
              {form(p)}
              <div className="flex flex-wrap gap-2 border-t border-line pt-3">
                <form action={setPartnerPublished}><input type="hidden" name="partner" value={p.id} /><input type="hidden" name="published" value={p.published ? "0" : "1"} /><button className="btn-ghost h-9 text-sm">{p.published ? t("Hiqe nga faqja", "Unpublish") : t("Publikoje", "Publish")}</button></form>
                {!p.published && <form action={deletePartner}><input type="hidden" name="partner" value={p.id} /><button className="btn-ghost h-9 text-sm">{t("Fshi draftin", "Delete draft")}</button></form>}
              </div>
            </div>
          </details>
        ))}
      </section>
    </div>
  );
}
