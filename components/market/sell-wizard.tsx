"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import { createListing, importListings, type SellResult } from "@/app/(site)/shit/actions";
import { useLang } from "@/components/lang-provider";
import { categories, regions, sheetMaterials, units } from "@/lib/data";
import { MARKET_CATEGORIES } from "@/lib/market/categories";
import { interpret } from "@/lib/market/interpret";
import { INTENDED_USE } from "@/lib/verify/labels";

const CAT_EN: Record<string, string> = { dru: "Wood & parquet", qeramike: "Tiles & ceramics", guri: "Stone & masonry", metal: "Metal & profiles", dyer: "Doors & windows", izolim: "Insulation & panels", beton: "Concrete", xham: "Windows & glass", cati: "Roofing", struktura: "Structural materials", fasade: "Facade", hidraulike: "Plumbing", elektrike: "Electrical", hvac: "Heating, ventilation, A/C", suva: "Plaster & drywall", boje: "Paint & finishes", jashte: "Outdoor works", vegla: "Tools & equipment", mobilje: "Furniture & interiors", sanitari: "Sanitary ware" };
type V = Record<string, string>;
const START: V = { title: "", description: "", category: "", region: "", condition: "unused", unit: "m²", quantity: "", unit_price: "", currency: "ALL", fulfillment: "pickup", seller_label: "", intended_use: "non_structural", manufacturer: "", model_ref: "", batch_no: "", origin_country: "", age_years: "", known_defects: "", sheet_material: "", length_mm: "", width_mm: "", thickness_mm: "", color: "" };

export function SellWizard() {
  const { lang, t } = useLang();
  const [mode, setMode] = useState<"one" | "bulk">("one");
  const [step, setStep] = useState(0);
  const [v, setV] = useState<V>(START);
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SellResult | null>(null);
  const [pending, start] = useTransition();
  const set = (k: string, x: string) => setV((o) => ({ ...o, [k]: x }));
  const catName = (id: string) => (lang === "en" ? CAT_EN[id] : categories.find((c) => c.id === id)?.name) ?? id;
  const previews = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files]);
  useEffect(() => () => previews.forEach((u) => URL.revokeObjectURL(u)), [previews]);
  const suggestion = useMemo(() => {
    const ui = interpret(`${v.title} ${v.description}`).category;
    return MARKET_CATEGORIES.find((c) => c.id === ui)?.db[0];
  }, [v.title, v.description]);

  const steps = [t("Fotot", "Photos"), t("Kategoria", "Category"), t("Specifikimet", "Specifications"), t("Çmimi dhe vendi", "Price & location"), t("Marrja", "Fulfilment"), t("Rishiko", "Review")];
  const checks: (() => string | null)[] = [
    () => (files.length ? null : t("Shto të paktën një foto reale.", "Add at least one real photo.")),
    () => (v.title.trim().length < 4 ? t("Titulli duhet të ketë të paktën 4 shkronja.", "The title needs at least 4 characters.") : !v.category ? t("Zgjidh kategorinë.", "Choose a category.") : null),
    () => (v.description.trim().length < 12 ? t("Përshkrimi duhet të ketë të paktën 12 shkronja.", "The description needs at least 12 characters.") : v.sheet_material && !(v.length_mm && v.width_mm && v.thickness_mm) ? t("Për copat, plotëso gjatësinë, gjerësinë dhe trashësinë.", "For offcuts, fill in length, width and thickness.") : null),
    () => (!/^\d{1,8}([.,]\d{1,3})?$/.test(v.quantity) || Number(v.quantity.replace(",", ".")) <= 0 ? t("Shkruaj sasinë.", "Enter the quantity.") : !/^\d{1,8}([.,]\d{1,2})?$/.test(v.unit_price) ? t("Shkruaj çmimin për njësi.", "Enter the unit price.") : !v.region ? t("Zgjidh qarkun.", "Choose the region.") : null),
    () => null,
    () => null,
  ];
  function next() { const e = checks[step](); setError(e); if (!e) setStep((s) => Math.min(5, s + 1)); }
  function submit(send: boolean) {
    const fd = new FormData();
    Object.entries(v).forEach(([k, x]) => fd.set(k, x));
    if (v.category !== "guri") fd.delete("masonry_type");
    files.forEach((f) => fd.append("photos", f));
    if (send) fd.set("submit", "1");
    start(async () => setResult(await createListing(fd)));
  }

  const box = "w-full rounded-xl border border-line bg-bg px-3.5 py-2.5";

  if (result?.status === "created") return (
    <div className="card mx-auto max-w-2xl p-8 text-center">
      <h2 className="text-3xl">{result.submitted ? t("Listimi u dërgua për shqyrtim.", "Listing sent for review.") : t("Listimi u ruajt si skicë.", "Listing saved as a draft.")}</h2>
      <p className="mt-3 text-ink-2">{result.submitted ? t("Një person nga ECONERA e shqyrton para se të publikohet. Do të njoftohesh për vendimin.", "A person at ECONERA reviews it before it goes live. You'll be notified of the decision.") : t("Mund ta plotësosh dhe ta dërgosh për shqyrtim kur të jesh gati.", "You can complete it and send it for review when ready.")}</p>
      <p className="mt-2 text-sm text-ink-2">{t(`${result.photos} foto u ngarkuan`, `${result.photos} photo(s) uploaded`)}{result.photoErrors ? t(` · ${result.photoErrors} nuk u pranuan (vetëm JPG/PNG/WebP deri 15 MB)`, ` · ${result.photoErrors} rejected (JPG/PNG/WebP up to 15 MB only)`) : ""}</p>
      <div className="mt-6 flex flex-wrap justify-center gap-2"><Link href={`/verifikimi/listimi/${result.id}`} className="btn-primary">{t("Shiko verifikimin", "View verification")}</Link><Link href="/inventari" className="btn-ghost">{t("Inventari im", "My inventory")}</Link><button type="button" onClick={() => { setResult(null); setV(START); setFiles([]); setStep(0); }} className="btn-ghost">{t("Listo një tjetër", "List another")}</button></div>
    </div>
  );

  return (
    <div className="grid gap-6">
      <div className="flex justify-self-start rounded-full border border-line p-1" role="tablist">
        {(["one", "bulk"] as const).map((m) => <button key={m} role="tab" aria-selected={mode === m} type="button" onClick={() => setMode(m)} className={`rounded-full px-4 py-2 text-sm font-medium ${mode === m ? "bg-ink text-bg" : "text-ink-2"}`}>{m === "one" ? t("Një material", "One material") : t("Import me CSV / Excel", "CSV / Excel import")}</button>)}
      </div>
      {mode === "bulk" ? <BulkImport /> : (
        <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
          <ol className="flex gap-2 overflow-x-auto lg:grid lg:content-start">
            {steps.map((s, i) => <li key={s}><button type="button" disabled={i > step} onClick={() => setStep(i)} aria-current={i === step ? "step" : undefined} className={`flex w-full shrink-0 items-center gap-3 rounded-xl px-3 py-2 text-left text-sm ${i === step ? "bg-accent font-semibold text-lime" : i < step ? "text-ink" : "text-ink-2"}`}><span className={`grid size-7 shrink-0 place-items-center rounded-full text-xs ${i < step ? "bg-lime text-bg" : "border border-line"}`}>{i < step ? "✓" : i + 1}</span>{s}</button></li>)}
          </ol>
          <div className="card grid content-start gap-5 p-6 md:p-8">
            <h2 className="text-2xl">{steps[step]}</h2>
            {step === 0 && <>
              <p className="text-sm text-ink-2">{t("Foto reale të materialit, deri në 10. Fotot shqyrtohen nga ECONERA para publikimit.", "Real photos of the material, up to 10. ECONERA reviews them before publishing.")}</p>
              <label className="grid cursor-pointer place-items-center rounded-2xl border-2 border-dashed border-line p-10 text-center hover:border-lime">
                <span className="font-medium">{t("Zgjidh ose bëj foto", "Choose or take photos")}</span><span className="text-xs text-ink-2">JPG, PNG, WebP · ≤ 15 MB</span>
                <input type="file" accept="image/jpeg,image/png,image/webp" multiple capture="environment" className="sr-only" onChange={(e) => setFiles((f) => [...f, ...Array.from(e.target.files ?? [])].slice(0, 10))} />
              </label>
              {previews.length > 0 && <ul className="grid grid-cols-3 gap-3 sm:grid-cols-5">{previews.map((p, i) => <li key={p} className="relative aspect-square overflow-hidden rounded-xl border border-line">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={p} alt="" className="size-full object-cover" /><button type="button" onClick={() => setFiles((f) => f.filter((_, k) => k !== i))} aria-label={t("Hiq foton", "Remove photo")} className="absolute top-1 right-1 grid size-7 place-items-center rounded-full bg-black/60 text-xs text-white">✕</button></li>)}</ul>}
            </>}
            {step === 1 && <>
              <L label={t("Titulli", "Title")}><input className={box} value={v.title} maxLength={100} onChange={(e) => set("title", e.target.value)} placeholder={t("p.sh. Pllaka porcelani 60×60, gri", "e.g. Porcelain tiles 60×60, grey")} /></L>
              {suggestion && suggestion !== v.category && <button type="button" onClick={() => set("category", suggestion)} className="justify-self-start rounded-full bg-accent px-4 py-2 text-sm text-lime">{t("Sugjerim nga titulli", "Suggested from the title")}: <b>{catName(suggestion)}</b> · {t("përdor", "use")}</button>}
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">{categories.map((c) => <button key={c.id} type="button" onClick={() => set("category", c.id)} aria-pressed={v.category === c.id} className={`rounded-xl border px-3 py-2.5 text-left text-sm ${v.category === c.id ? "border-lime bg-accent font-medium" : "border-line hover:border-lime"}`}>{catName(c.id)}</button>)}</div>
            </>}
            {step === 2 && <>
              <L label={t("Përshkrimi", "Description")} hint={t("Përmasat, gjendja dhe kufizimet e njohura.", "Dimensions, condition and known limitations.")}><textarea className={box} rows={5} maxLength={2000} value={v.description} onChange={(e) => set("description", e.target.value)} /></L>
              <div className="grid gap-4 sm:grid-cols-2">
                <L label={t("Gjendja", "Condition")}><select className={box} value={v.condition} onChange={(e) => set("condition", e.target.value)}><option value="unused">{t("I papërdorur (stok i tepërt)", "Unused (surplus)")}</option><option value="reusable">{t("I ripërdorshëm (i rikuperuar)", "Reusable (reclaimed)")}</option></select></L>
                <L label={t("Përdorimi i synuar", "Intended use")}><select className={box} value={v.intended_use} onChange={(e) => set("intended_use", e.target.value)}>{Object.entries(INTENDED_USE).map(([k, l]) => <option key={k} value={k}>{l[lang]}</option>)}</select></L>
                <L label={t("Prodhuesi", "Manufacturer")}><input className={box} maxLength={120} value={v.manufacturer} onChange={(e) => set("manufacturer", e.target.value)} /></L>
                <L label={t("Modeli / referenca", "Model / reference")}><input className={box} maxLength={120} value={v.model_ref} onChange={(e) => set("model_ref", e.target.value)} /></L>
                <L label={t("Mosha (vite)", "Age (years)")}><input className={box} inputMode="decimal" value={v.age_years} onChange={(e) => set("age_years", e.target.value)} /></L>
                <L label={t("Origjina", "Origin")}><input className={box} maxLength={60} value={v.origin_country} onChange={(e) => set("origin_country", e.target.value)} /></L>
              </div>
              <details className="rounded-xl border border-line p-4"><summary className="cursor-pointer text-sm font-medium">{t("Është copë / panel? Shto përmasat (për SmartCut)", "Is it an offcut or panel? Add dimensions (for SmartCut)")}</summary>
                <div className="mt-4 grid gap-4 sm:grid-cols-4">
                  <L label={t("Materiali", "Material")}><select className={box} value={v.sheet_material} onChange={(e) => set("sheet_material", e.target.value)}><option value="">—</option>{sheetMaterials.map((m) => <option key={m}>{m}</option>)}</select></L>
                  <L label={t("Gjatësia mm", "Length mm")}><input className={box} inputMode="numeric" value={v.length_mm} onChange={(e) => set("length_mm", e.target.value)} /></L>
                  <L label={t("Gjerësia mm", "Width mm")}><input className={box} inputMode="numeric" value={v.width_mm} onChange={(e) => set("width_mm", e.target.value)} /></L>
                  <L label={t("Trashësia mm", "Thickness mm")}><input className={box} inputMode="numeric" value={v.thickness_mm} onChange={(e) => set("thickness_mm", e.target.value)} /></L>
                </div>
              </details>
              <L label={t("Defekte të njohura", "Known defects")}><textarea className={box} rows={2} maxLength={1000} value={v.known_defects} onChange={(e) => set("known_defects", e.target.value)} /></L>
            </>}
            {step === 3 && <div className="grid gap-4 sm:grid-cols-2">
              <L label={t("Sasia", "Quantity")}><input className={box} inputMode="decimal" value={v.quantity} onChange={(e) => set("quantity", e.target.value)} /></L>
              <L label={t("Njësia", "Unit")}><select className={box} value={v.unit} onChange={(e) => set("unit", e.target.value)}>{units.map((u) => <option key={u}>{u}</option>)}</select></L>
              <L label={t("Çmimi për njësi", "Price per unit")}><input className={box} inputMode="decimal" value={v.unit_price} onChange={(e) => set("unit_price", e.target.value)} /></L>
              <L label={t("Monedha", "Currency")}><select className={box} value={v.currency} onChange={(e) => set("currency", e.target.value)}><option value="ALL">ALL (lekë)</option><option value="EUR">EUR</option></select></L>
              <L label={t("Qarku", "Region")}><select className={box} value={v.region} onChange={(e) => set("region", e.target.value)}><option value="">—</option>{regions.map((r) => <option key={r}>{r}</option>)}</select></L>
              <L label={t("Emri publik i shitësit (opsional)", "Public seller name (optional)")}><input className={box} maxLength={80} value={v.seller_label} onChange={(e) => set("seller_label", e.target.value)} /></L>
            </div>}
            {step === 4 && <fieldset className="grid gap-2">{([["pickup", t("Marrje në vend", "Pickup only")], ["delivery", t("Dorëzoj vetë", "I deliver")], ["both", t("Marrje ose dorëzim", "Pickup or delivery")]] as const).map(([k, l]) => <label key={k} className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${v.fulfillment === k ? "border-lime bg-accent" : "border-line"}`}><input type="radio" checked={v.fulfillment === k} onChange={() => set("fulfillment", k)} className="accent-[var(--color-lime)]" />{l}</label>)}</fieldset>}
            {step === 5 && <>
              <dl className="grid gap-3 text-sm sm:grid-cols-2">{[[t("Titulli", "Title"), v.title], [t("Kategoria", "Category"), catName(v.category)], [t("Sasia", "Quantity"), `${v.quantity} ${v.unit}`], [t("Çmimi", "Price"), `${v.unit_price} ${v.currency} / ${v.unit}`], [t("Qarku", "Region"), v.region], [t("Fotot", "Photos"), String(files.length)]].map(([k, x]) => <div key={k} className="rounded-xl bg-bg-2 px-4 py-3"><dt className="text-xs text-ink-2">{k}</dt><dd className="mt-1 font-medium">{x}</dd></div>)}</dl>
              <p className="text-sm text-ink-2">{t("Pasi e dërgon, një person nga ECONERA kontrollon fotot, përshkrimin dhe dokumentet. Materialet strukturore, elektrike, për zjarr ose me presion mund të kërkojnë dokumente shtesë ose inspektim.", "Once sent, a person at ECONERA checks the photos, description and documents. Structural, electrical, fire-safety or pressure materials may need extra documents or an inspection.")}</p>
            </>}
            {error && <p role="alert" className="text-sm font-medium text-[#8a5a00]">{error}</p>}
            {result && <p role="alert" className="text-sm">{result.status === "login" ? <>{t("Hyr në llogari për të listuar.", "Log in to create a listing.")} <Link href="/hyr" className="font-medium underline">{t("Hyr", "Log in")}</Link></> : result.status === "category" ? t("Kjo kategori nuk është aktive ende. Zgjidh një tjetër.", "This category isn't active yet. Choose another.") : result.status === "invalid" ? t("Disa fusha nuk janë të sakta. Kontrollo hapat.", "Some fields aren't valid. Check the steps.") : t("Ruajtja dështoi. Provo përsëri.", "Saving failed. Try again.")}</p>}
            <div className="flex flex-wrap justify-between gap-2 border-t border-line pt-5">
              <button type="button" onClick={() => { setError(null); setStep((s) => Math.max(0, s - 1)); }} disabled={step === 0} className="btn-ghost disabled:opacity-40">{t("Mbrapa", "Back")}</button>
              {step < 5 ? <button type="button" onClick={next} className="btn-primary">{t("Vazhdo", "Continue")}</button> : <div className="flex gap-2"><button type="button" disabled={pending} onClick={() => submit(false)} className="btn-ghost">{t("Ruaj si skicë", "Save as draft")}</button><button type="button" disabled={pending} onClick={() => submit(true)} className="btn-primary">{pending ? t("Duke dërguar…", "Sending…") : t("Dërgo për shqyrtim", "Submit for review")}</button></div>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function L({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return <label className="grid gap-1.5 text-sm"><span className="font-medium">{label}</span>{children}{hint && <span className="text-xs text-ink-2">{hint}</span>}</label>;
}

const HEAD = ["title", "description", "category", "region", "condition", "unit", "quantity", "unit_price", "currency", "fulfillment"];
function BulkImport() {
  const { t } = useLang();
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();
  async function load(file: File) {
    setMsg(null);
    let table: string[][];
    if (/\.xlsx$/i.test(file.name)) { const { readSheet } = await import("read-excel-file/browser"); table = (await readSheet(file)).map((r) => r.map((c) => (c == null ? "" : String(c)))); }
    else { const text = await file.text(); const sep = text.split("\n")[0].includes(";") ? ";" : ","; table = text.split(/\r?\n/).filter((l) => l.trim()).map((l) => l.split(sep).map((c) => c.trim().replace(/^"|"$/g, ""))); }
    const head = table[0]?.map((h) => h.toLowerCase().trim()) ?? [];
    if (!HEAD.every((h) => head.includes(h))) { setRows([]); setMsg(t("Mungojnë kolonat e detyrueshme. Shkarko shabllonin.", "Required columns are missing. Download the template.")); return; }
    setRows(table.slice(1, 201).map((r) => Object.fromEntries(head.map((h, i) => [h, r[i] ?? ""]))));
  }
  const template = `data:text/csv;charset=utf-8,${encodeURIComponent(`${HEAD.join(",")},seller_label\nPllaka porcelani 60x60,"Kuti të paprekura, gri mat",qeramike,Tiranë,unused,m²,42,1200,ALL,pickup,\n`)}`;
  return (
    <div className="card grid gap-5 p-6 md:p-8">
      <p className="text-ink-2">{t("Ngarko shumë materiale njëherësh. Çdo rresht ruhet si skicë private; fotot dhe dërgimin për shqyrtim i shton më pas te inventari.", "Upload many materials at once. Each row is saved as a private draft; add photos and submit for review from your inventory afterwards.")}</p>
      <p className="text-xs text-ink-2">{t("Kolonat", "Columns")}: {HEAD.join(", ")} · condition: unused / reusable · fulfillment: pickup / delivery / both · {t("kategoria me kodin e saj (p.sh. dru, qeramike, guri, metal, izolim)", "category by its code (e.g. dru, qeramike, guri, metal, izolim)")}</p>
      <div className="flex flex-wrap gap-2"><a href={template} download="econera-template.csv" className="btn-ghost">{t("Shkarko shabllonin CSV", "Download CSV template")}</a>
        <label className="btn-primary cursor-pointer">{t("Zgjidh CSV ose Excel", "Choose CSV or Excel")}<input type="file" accept=".csv,.xlsx,text/csv" className="sr-only" onChange={(e) => e.target.files?.[0] && load(e.target.files[0])} /></label></div>
      {rows.length > 0 && <>
        <div className="overflow-x-auto rounded-xl border border-line"><table className="w-full text-sm"><thead className="bg-bg-2 text-left"><tr>{["title", "category", "quantity", "unit", "unit_price", "region"].map((h) => <th key={h} className="px-3 py-2 font-medium">{h}</th>)}</tr></thead><tbody>{rows.slice(0, 20).map((r, i) => <tr key={i} className="border-t border-line">{["title", "category", "quantity", "unit", "unit_price", "region"].map((h) => <td key={h} className="px-3 py-2">{r[h]}</td>)}</tr>)}</tbody></table></div>
        <button type="button" disabled={pending} onClick={() => start(async () => { const r = await importListings(rows); setMsg(r.status === "login" ? t("Hyr në llogari për të importuar.", "Log in to import.") : !("saved" in r) ? t("Skedari nuk u lexua.", "The file couldn't be read.") : t(`${r.saved} skica u ruajtën.${r.rejected.length ? ` Rreshtat me gabime: ${r.rejected.slice(0, 15).join(", ")}.` : ""}`, `${r.saved} drafts saved.${r.rejected.length ? ` Rows with errors: ${r.rejected.slice(0, 15).join(", ")}.` : ""}`)); })} className="btn-primary justify-self-start">{pending ? t("Duke importuar…", "Importing…") : t(`Importo ${rows.length} rreshta`, `Import ${rows.length} rows`)}</button>
      </>}
      {msg && <p role="status" className="text-sm">{msg} {msg.includes("skica") || msg.includes("drafts") ? <Link href="/inventari" className="underline">{t("Hap inventarin", "Open inventory")}</Link> : null}</p>}
    </div>
  );
}
