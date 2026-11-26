"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLang } from "@/components/lang-provider";
import { formatNumber } from "@/lib/format";
import { CITIES } from "@/lib/market";
import { buildPlans, cityPoint, type Plan } from "@/lib/tools/basket";
import { EUR_TO_LEK, type Listing } from "@/lib/tools/inventory";
import { CONDITION_LABEL, MODE_LABEL } from "@/lib/tools/labels";
import { handoff, projects } from "@/lib/tools/projects";
import { DEFAULT_ASSUMPTIONS, designPrompt, estimate, ROOM_TYPES, STYLES, toRequirements, type Assumption, type Brief, type EstimateLine, type Room } from "@/lib/tools/renovation";
import { SourceBadge } from "./smart-basket";

type Analysis = { room: string; observations: string[]; currentMaterials: string[]; condition: string; suggestions: string[]; caution: string };
type State = { room: Room; brief: Brief; assumptions: Assumption[]; overrides: Record<string, number>; photo?: string; plan?: string; planName?: string; analysis?: Analysis };

const START: State = {
  room: { type: "ndenje", lengthM: 5, widthM: 4, heightM: 2.8, doors: 1, windows: 2, floor: "parket", scope: { floor: true, walls: true, ceiling: true, wallTiles: true, doors: true, fixtures: true } },
  brief: { propertyType: "apartament", style: "skandinav", budgetEur: 2500, colors: "", preference: "perzier", city: "Tiranë", sustainability: "larte", keepLayout: true },
  assumptions: DEFAULT_ASSUMPTIONS, overrides: {},
};

const STEPS = [
  { sq: "Hapësira", en: "Your space" }, { sq: "Kërkesat", en: "Requirements" }, { sq: "Koncepti", en: "Concept" },
  { sq: "Materialet", en: "Materials" }, { sq: "Tregu dhe kostoja", en: "Market and cost" },
];

const lek = (n: number) => `${formatNumber(Math.round(n), 0)} L`;

export function Renovation({ listings, live, connected }: { listings: Listing[]; live: number; connected: boolean }) {
  const { lang, t } = useLang();
  const router = useRouter();
  const [s, setS] = useState<State>(START);
  const [step, setStep] = useState(0);
  const [status, setStatus] = useState<{ analysis: boolean; design: boolean } | null>(null);
  const [busy, setBusy] = useState<"analysis" | "design" | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [consent, setConsent] = useState(false);
  const [designs, setDesigns] = useState<string[]>([]);
  const [shown, setShown] = useState(0);
  const [projectId, setProjectId] = useState<string | undefined>();
  const [notice, setNotice] = useState<string | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    fetch("/api/ai/status").then((r) => r.json()).then(setStatus).catch(() => setStatus({ analysis: false, design: false }));
    const timer = setTimeout(() => {
      const id = new URLSearchParams(window.location.search).get("projekt");
      const p = id ? projects.get(id) : undefined;
      if (p?.kind === "renovim") { setS(p.data as State); setProjectId(p.id); }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const style = STYLES.find((x) => x.id === s.brief.style)!;
  const base = useMemo(() => estimate(s.room, style, s.assumptions), [s.room, style, s.assumptions]);
  const lines: EstimateLine[] = useMemo(() => base.map((l) => (s.overrides[l.key] !== undefined ? { ...l, quantity: s.overrides[l.key] } : l)), [base, s.overrides]);
  const budgetLek = s.brief.budgetEur ? s.brief.budgetEur * EUR_TO_LEK : undefined;
  const usable = useMemo(() => listings.filter((l) => s.brief.preference === "perzier" || l.condition === s.brief.preference || (s.brief.preference === "teprice" && l.condition === "riperdorur")), [listings, s.brief.preference]);
  const plans = useMemo(() => buildPlans({ requirements: toRequirements(lines), listings: usable, from: cityPoint(s.brief.city), budgetLek }), [lines, usable, s.brief.city, budgetLek]);
  const plan = plans.find((p) => p.mode === (s.brief.sustainability === "larte" ? "eco" : s.brief.sustainability === "e-ulet" ? "budget" : "balanced"))!;

  const go = (n: number) => { setStep(n); setTimeout(() => headingRef.current?.focus(), 0); };
  const room = (patch: Partial<Room>) => setS((x) => ({ ...x, room: { ...x.room, ...patch } }));
  const brief = (patch: Partial<Brief>) => setS((x) => ({ ...x, brief: { ...x.brief, ...patch } }));

  async function onPhoto(file: File) {
    const dataUrl = await downscale(file, 1280);
    setS((x) => ({ ...x, photo: dataUrl, analysis: undefined }));
    setDesigns([]);
  }

  async function analyse() {
    if (!s.photo) return;
    setBusy("analysis"); setAiError(null);
    try {
      const res = await fetch("/api/ai/room", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ image: s.photo, lang, roomType: s.room.type, style: style.en, consent: true }) });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "error");
      const analysis = (await res.json()) as Analysis;
      setS((x) => ({ ...x, analysis }));
    } catch (e) {
      setAiError(aiMessage((e as Error).message, t));
    } finally { setBusy(null); }
  }

  async function generate() {
    if (!s.photo) return;
    setBusy("design"); setAiError(null);
    try {
      const prompt = designPrompt(s.room, style, s.brief, lines.map((l) => l.en));
      const res = await fetch("/api/ai/design", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ image: s.photo, prompt, consent: true }) });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "error");
      const { image } = (await res.json()) as { image: string };
      setDesigns((d) => [...d, image]); setShown(designs.length);
    } catch (e) {
      setAiError(aiMessage((e as Error).message, t));
    } finally { setBusy(null); }
  }

  function save() {
    const name = `${ROOM_TYPES.find((r) => r.id === s.room.type)?.[lang]} · ${lang === "en" ? style.en : style.sq}`;
    const p = projects.save("renovim", name, s, projectId);
    setProjectId(p.id);
    setNotice(t("Projekti u ruajt te Projektet e mia. Fotot ruhen vetëm në këtë pajisje.", "Project saved to My projects. Photos stay on this device only."));
  }

  function toBasket() {
    handoff.putItems(lines.filter((l) => l.quantity > 0).map((l) => ({ text: lang === "en" ? l.en : l.sq, category: l.category, quantity: l.quantity, unit: l.unit })));
    router.push("/ai/shporta");
  }

  return (
    <div className="grid gap-6">
      <ol className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]" aria-label={t("Hapat", "Steps")}>
        {STEPS.map((x, i) => (
          <li key={x.sq}>
            <button type="button" onClick={() => go(i)} aria-current={step === i ? "step" : undefined}
              className={`flex items-center gap-2 whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition ${step === i ? "border-lime bg-lime text-bg" : i < step ? "border-line bg-card text-ink" : "border-line text-ink-2 hover:text-ink"}`}>
              <span className={`grid size-5 place-items-center rounded-full text-[11px] ${step === i ? "bg-bg/20" : "bg-bg-2"}`}>{i + 1}</span>{x[lang]}
            </button>
          </li>
        ))}
      </ol>

      <section className="card p-5 md:p-7" aria-labelledby="hapi">
        <h2 id="hapi" ref={headingRef} tabIndex={-1} className="text-2xl focus:outline-none">{STEPS[step][lang]}</h2>

        {step === 0 && (
          <div className="mt-5 grid gap-6 lg:grid-cols-[1.1fr_1fr]">
            <div className="grid gap-4">
              <Field label={t("Lloji i pronës", "Property type")}>
                <select value={s.brief.propertyType} onChange={(e) => brief({ propertyType: e.target.value as Brief["propertyType"] })} className={inputCls}>
                  <option value="apartament">{t("Apartament", "Apartment")}</option><option value="shtepi">{t("Shtëpi", "House")}</option><option value="zyre">{t("Zyrë", "Office")}</option><option value="dyqan">{t("Dyqan / ambient komercial", "Shop / commercial")}</option>
                </select>
              </Field>
              <fieldset>
                <legend className="mb-2 text-sm font-medium">{t("Dhoma që do rinovosh", "Room to renovate")}</legend>
                <div className="flex flex-wrap gap-2">
                  {ROOM_TYPES.map((r) => <label key={r.id} className="cursor-pointer rounded-full border border-line px-3.5 py-2 text-sm has-[:checked]:border-lime has-[:checked]:bg-accent"><input type="radio" name="dhoma" className="sr-only" checked={s.room.type === r.id} onChange={() => room({ type: r.id })} />{r[lang]}</label>)}
                </div>
              </fieldset>
              <div className="grid grid-cols-3 gap-3">
                <Num label={t("Gjatësia (m)", "Length (m)")} value={s.room.lengthM} onChange={(v) => room({ lengthM: v })} />
                <Num label={t("Gjerësia (m)", "Width (m)")} value={s.room.widthM} onChange={(v) => room({ widthM: v })} />
                <Num label={t("Lartësia (m)", "Height (m)")} value={s.room.heightM} onChange={(v) => room({ heightM: v })} />
                <Num label={t("Dyer", "Doors")} value={s.room.doors} step={1} onChange={(v) => room({ doors: Math.round(v) })} />
                <Num label={t("Dritare", "Windows")} value={s.room.windows} step={1} onChange={(v) => room({ windows: Math.round(v) })} />
                <div className="grid content-end text-sm text-ink-2">{formatNumber(s.room.lengthM * s.room.widthM, 1)} m²</div>
              </div>
              <p className="text-xs text-ink-2">{t("Masat i konfirmon ti. Llogaritjet bazohen vetëm mbi këto masa.", "You confirm the measurements. Estimates are based on them only.")}</p>
            </div>
            <div className="grid content-start gap-4">
              <div className="rounded-xl border border-dashed border-line p-4">
                <p className="text-sm font-medium">{t("Foto e dhomës", "Room photo")}</p>
                {s.photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={s.photo} alt={t("Foto e dhomës që ngarkove", "The room photo you uploaded")} className="mt-3 aspect-[4/3] w-full rounded-lg object-cover" />
                ) : <p className="mt-1 text-sm text-ink-2">{t("Opsionale. Fotoja zvogëlohet dhe mbetet në pajisjen tënde derisa ta dërgosh vetë për analizë.", "Optional. The photo is resized and stays on your device until you choose to send it for analysis.")}</p>}
                <div className="mt-3 flex flex-wrap gap-2">
                  <label className="btn-ghost cursor-pointer"><input type="file" accept="image/*" className="sr-only" onChange={(e) => { const f = e.target.files?.[0]; if (f) void onPhoto(f); e.target.value = ""; }} />{t("Ngarko foto", "Upload photo")}</label>
                  <label className="btn-ghost cursor-pointer"><input type="file" accept="image/*" capture="environment" className="sr-only" onChange={(e) => { const f = e.target.files?.[0]; if (f) void onPhoto(f); e.target.value = ""; }} />{t("Bëj foto", "Take photo")}</label>
                  {s.photo && <button type="button" className="btn-ghost" onClick={() => setS((x) => ({ ...x, photo: undefined, analysis: undefined }))}>{t("Fshi foton", "Delete photo")}</button>}
                </div>
              </div>
              <div className="rounded-xl border border-dashed border-line p-4">
                <p className="text-sm font-medium">{t("Planimetria", "Floor plan")}</p>
                <p className="mt-1 text-sm text-ink-2">{s.planName ?? t("Ruhet si referencë për projektin. Leximi automatik i masave nga planimetria vjen në fazën tjetër.", "Kept as a reference for the project. Reading measurements from the plan comes next.")}</p>
                <label className="btn-ghost mt-3 cursor-pointer"><input type="file" accept="image/*,.pdf" className="sr-only" onChange={async (e) => { const f = e.target.files?.[0]; if (f) { const plan = f.type.startsWith("image/") ? await downscale(f, 1600) : undefined; setS((x) => ({ ...x, plan, planName: f.name })); } e.target.value = ""; }} />{t("Ngarko planimetrinë", "Upload floor plan")}</label>
              </div>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="mt-5 grid gap-6">
            <fieldset>
              <legend className="mb-3 text-sm font-medium">{t("Stili", "Style")}</legend>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                {STYLES.map((st) => (
                  <label key={st.id} className="cursor-pointer rounded-xl border border-line p-3 has-[:checked]:border-lime has-[:checked]:shadow-[0_0_0_3px_rgba(15,74,67,0.12)]">
                    <input type="radio" name="stili" className="sr-only" checked={s.brief.style === st.id} onChange={() => { brief({ style: st.id }); room({ floor: st.floor }); }} />
                    <span className="flex h-8 overflow-hidden rounded-md" aria-hidden>{st.palette.map((c) => <span key={c} className="flex-1" style={{ background: c }} />)}</span>
                    <span className="mt-2 block text-sm font-semibold">{st[lang]}</span>
                    <span className="block text-xs text-ink-2">{lang === "en" ? st.notesEn : st.notesSq}</span>
                  </label>
                ))}
              </div>
            </fieldset>
            <div className="grid gap-4 md:grid-cols-3">
              <Num label={t("Buxheti maksimal (€)", "Maximum budget (€)")} value={s.brief.budgetEur ?? 0} step={100} onChange={(v) => brief({ budgetEur: v || undefined })} />
              <Field label={t("Ngjyrat që të pëlqejnë", "Colours you like")}><input value={s.brief.colors} onChange={(e) => brief({ colors: e.target.value })} placeholder={t("p.sh. bezhë, jeshile ulliri", "e.g. beige, olive green")} className={inputCls} /></Field>
              <Field label={t("Qyteti", "City")}><select value={s.brief.city} onChange={(e) => brief({ city: e.target.value })} className={inputCls}>{Object.keys(CITIES).map((c) => <option key={c}>{c}</option>)}</select></Field>
              <Field label={t("Materialet", "Materials")}>
                <select value={s.brief.preference} onChange={(e) => brief({ preference: e.target.value as Brief["preference"] })} className={inputCls}>
                  <option value="perzier">{t("Të përziera", "Mixed")}</option><option value="riperdorur">{t("Vetëm të ripërdorura", "Reclaimed only")}</option><option value="teprice">{t("Stok i tepërt dhe të ripërdorura", "Surplus and reclaimed")}</option><option value="e-re">{t("Vetëm të reja", "New only")}</option>
                </select>
              </Field>
              <Field label={t("Përparësia ekologjike", "Sustainability priority")}>
                <select value={s.brief.sustainability} onChange={(e) => brief({ sustainability: e.target.value as Brief["sustainability"] })} className={inputCls}>
                  <option value="larte">{t("E lartë", "High")}</option><option value="mesatare">{t("Mesatare", "Medium")}</option><option value="e-ulet">{t("Çmimi para së gjithash", "Price first")}</option>
                </select>
              </Field>
              <Field label={t("Dyshemeja", "Flooring")}>
                <select value={s.room.floor} onChange={(e) => room({ floor: e.target.value as Room["floor"] })} className={inputCls}><option value="parket">{t("Parket / dru", "Parquet / wood")}</option><option value="pllaka">{t("Pllaka", "Tiles")}</option></select>
              </Field>
            </div>
            <fieldset>
              <legend className="mb-2 text-sm font-medium">{t("Çfarë do të rinovosh", "What you will renovate")}</legend>
              <div className="flex flex-wrap gap-2">
                {([["floor", t("Dyshemeja", "Floor")], ["walls", t("Lyerja e mureve", "Wall paint")], ["ceiling", t("Tavani", "Ceiling")], ["wallTiles", t("Pllaka muri (banjo/kuzhinë)", "Wall tiles (bath/kitchen)")], ["doors", t("Dyert", "Doors")], ["fixtures", t("Sanitaret", "Sanitary fixtures")]] as const).map(([k, label]) => (
                  <label key={k} className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-line px-3.5 py-2 text-sm has-[:checked]:border-lime has-[:checked]:bg-accent"><input type="checkbox" className="size-4 accent-[var(--color-lime)]" checked={s.room.scope[k]} onChange={(e) => room({ scope: { ...s.room.scope, [k]: e.target.checked } })} />{label}</label>
                ))}
              </div>
            </fieldset>
            <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" className="size-4 accent-[var(--color-lime)]" checked={s.brief.keepLayout} onChange={(e) => brief({ keepLayout: e.target.checked })} />{t("Ruaj planin ekzistues të dhomës", "Keep the existing room layout")}</label>
          </div>
        )}

        {step === 2 && (
          <div className="mt-5 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
            <div>
              {designs.length > 0 && s.photo ? (
                <BeforeAfter before={s.photo} after={designs[shown]} />
              ) : (
                <div className="overflow-hidden rounded-xl border border-line">
                  <div className="flex h-40" aria-hidden>{style.palette.map((c) => <span key={c} className="flex-1" style={{ background: c }} />)}</div>
                  <div className="p-5">
                    <p className="text-lg font-semibold">{lang === "en" ? style.en : style.sq}</p>
                    <p className="text-sm text-ink-2">{lang === "en" ? style.notesEn : style.notesSq}</p>
                    <ul className="mt-4 grid gap-1.5 text-sm">{lines.map((l) => <li key={l.key}>· {lang === "en" ? l.en : l.sq}</li>)}</ul>
                  </div>
                </div>
              )}
              {designs.length > 1 && (
                <div className="mt-3 flex gap-2" role="group" aria-label={t("Variantet", "Variants")}>{designs.map((d, i) => <button key={i} type="button" aria-pressed={shown === i} onClick={() => setShown(i)} className={`rounded-full border px-3 py-1 text-sm ${shown === i ? "border-lime bg-accent" : "border-line"}`}>{t("Varianti", "Variant")} {i + 1}</button>)}</div>
              )}
              {designs.length > 0 && <p className="mt-3 text-xs text-ink-2">{t("Koncept dizajni i krijuar me AI. Nuk është garanci për rezultatin e ndërtimit.", "AI-generated design concept. Not a guarantee of the construction outcome.")}</p>}
            </div>
            <div className="grid content-start gap-4">
              {!s.photo && <p className="rounded-xl bg-bg-2 px-4 py-3 text-sm">{t("Ngarko një foto te hapi 1 për analizë dhe koncept vizual.", "Upload a photo in step 1 for analysis and a visual concept.")}</p>}
              {s.photo && (
                <label className="flex items-start gap-3 rounded-xl border border-line p-4 text-sm">
                  <input type="checkbox" className="mt-0.5 size-4 accent-[var(--color-lime)]" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
                  <span>{t("Pranoj që fotoja të dërgohet te shërbimi AI (Anthropic për analizën, OpenAI për imazhin) vetëm për këtë kërkesë. ECONERA nuk e ruan në server.", "I agree to send the photo to the AI service (Anthropic for analysis, OpenAI for the image) for this request only. ECONERA does not store it on its server.")}</span>
                </label>
              )}
              <div className="flex flex-wrap gap-2">
                <button type="button" className="btn-primary" disabled={!s.photo || !consent || busy !== null || status?.analysis === false} onClick={analyse}>{busy === "analysis" ? t("Duke analizuar…", "Analysing…") : t("Analizo foton", "Analyse photo")}</button>
                <button type="button" className="btn-ghost" disabled={!s.photo || !consent || busy !== null || status?.design === false} onClick={generate}>{busy === "design" ? t("Duke krijuar…", "Creating…") : designs.length ? t("Krijo variant tjetër", "Create another variant") : t("Krijo koncept vizual", "Create visual concept")}</button>
              </div>
              {status && (!status.analysis || !status.design) && (
                <p className="rounded-xl border border-[#ecd29a] bg-[#fdf6e3] px-4 py-3 text-sm">
                  {!status.analysis && t("Analiza e fotos nuk është aktive: mungon ANTHROPIC_API_KEY në server. ", "Photo analysis is not active: ANTHROPIC_API_KEY is missing on the server. ")}
                  {!status.design && t("Koncepti vizual nuk është aktiv: mungon OPENAI_API_KEY në server. Pjesa tjetër e mjetit punon pa to.", "The visual concept is not active: OPENAI_API_KEY is missing on the server. The rest of the tool works without them.")}
                </p>
              )}
              {aiError && <p role="alert" className="rounded-xl border border-[#e8b7a8] bg-[#fdf0ec] px-4 py-3 text-sm">{aiError}</p>}
              {s.analysis && (
                <div className="rounded-xl border border-line p-4 text-sm">
                  <p className="font-semibold">{s.analysis.room}</p>
                  <List title={t("Çfarë shihet", "What is visible")} items={s.analysis.observations} />
                  <List title={t("Materialet aktuale", "Current materials")} items={s.analysis.currentMaterials} />
                  <p className="mt-3"><span className="font-medium">{t("Gjendja", "Condition")}:</span> {s.analysis.condition}</p>
                  <List title={t("Sugjerime", "Suggestions")} items={s.analysis.suggestions} />
                  <p className="mt-3 text-xs text-ink-2">{s.analysis.caution}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="mt-5 grid gap-5">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] text-sm">
                <thead className="text-left text-ink-2"><tr><th className="pb-2 font-medium">{t("Materiali", "Material")}</th><th className="pb-2 font-medium">{t("Sasia", "Quantity")}</th><th className="pb-2 font-medium">{t("Si u llogarit", "How it was calculated")}</th></tr></thead>
                <tbody>
                  {lines.map((l) => (
                    <tr key={l.key} className="border-t border-line">
                      <td className="py-2.5 pr-3 font-medium">{lang === "en" ? l.en : l.sq}</td>
                      <td className="py-2.5 pr-3"><span className="inline-flex items-center gap-2"><input aria-label={t(`Sasia për ${l.sq}`, `Quantity for ${l.en}`)} type="number" min={0} step="any" value={l.quantity} onChange={(e) => setS((x) => ({ ...x, overrides: { ...x.overrides, [l.key]: Math.max(0, Number(e.target.value)) } }))} className="w-24 rounded-lg border border-line bg-bg px-3 py-2 tabular-nums" />{l.unit}{s.overrides[l.key] !== undefined && <button type="button" className="text-xs text-ink-2 underline" onClick={() => setS((x) => { const o = { ...x.overrides }; delete o[l.key]; return { ...x, overrides: o }; })}>{t("rikthe", "reset")}</button>}</span></td>
                      <td className="py-2.5 text-ink-2">{lang === "en" ? l.basisEn : l.basisSq}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <details className="rounded-xl border border-line p-4">
              <summary className="cursor-pointer font-medium">{t("Supozimet (mund t'i ndryshosh)", "Assumptions (editable)")}</summary>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {s.assumptions.map((a) => <Num key={a.key} label={`${a[lang]}${a.unit ? ` (${a.unit})` : ""}`} value={a.value} onChange={(v) => setS((x) => ({ ...x, assumptions: x.assumptions.map((y) => (y.key === a.key ? { ...y, value: v } : y)) }))} />)}
              </div>
            </details>
            <p className="text-xs text-ink-2">{t("Vlerësime planifikimi, jo llogaritje të certifikuara arkitektonike ose inxhinierike. Mate në vend para blerjes.", "Planning estimates, not certified architectural or engineering calculations. Measure on site before buying.")}</p>
          </div>
        )}

        {step === 4 && <MarketStep plan={plan} plans={plans} lines={lines} budgetLek={budgetLek} live={live} connected={connected} />}

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
          <button type="button" className="btn-ghost" disabled={step === 0} onClick={() => go(step - 1)}>{t("Mbrapa", "Back")}</button>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn-ghost" onClick={save}>{projectId ? t("Ruaj ndryshimet", "Save changes") : t("Ruaj projektin", "Save project")}</button>
            {step === 4 && <button type="button" className="btn-ghost" onClick={() => void exportReport(s, lines, plan, t, lang)}>{t("Shkarko raportin PDF", "Download PDF report")}</button>}
            {step < 4 ? <button type="button" className="btn-primary" onClick={() => go(step + 1)}>{t("Vazhdo", "Continue")}</button> : <button type="button" className="btn-primary" onClick={toBasket}>{t("Hap në Smart Basket", "Open in Smart Basket")}</button>}
          </div>
        </div>
        {notice && <p role="status" className="mt-4 rounded-xl border border-line bg-bg-2 px-4 py-3 text-sm">{notice}</p>}
      </section>
    </div>
  );
}

function MarketStep({ plan, plans, lines, budgetLek, live, connected }: { plan: Plan; plans: Plan[]; lines: EstimateLine[]; budgetLek?: number; live: number; connected: boolean }) {
  const { lang, t } = useLang();
  const label = new Map(lines.map((l) => [`ren-${l.key}`, lang === "en" ? l.en : l.sq]));
  return (
    <div className="mt-5 grid gap-5">
      <SourceBadge live={live} connected={connected} />
      <div className="grid gap-3 md:grid-cols-3">
        {plans.map((p) => (
          <div key={p.mode} className={`rounded-xl border p-4 ${p.mode === plan.mode ? "border-lime bg-accent/40" : "border-line"}`}>
            <p className="text-sm font-semibold">{MODE_LABEL[lang][p.mode]}{p.mode === plan.mode && <span className="ml-2 text-xs font-normal text-ink-2">{t("sipas përparësisë sate", "matches your priority")}</span>}</p>
            <p className="display mt-2 text-3xl tabular-nums">{lek(p.totalLek)}</p>
            <p className="text-xs text-ink-2">{t("materiale", "materials")} {lek(p.materialLek)} + {t("transport", "transport")} {lek(p.transportLek)}</p>
          </div>
        ))}
      </div>
      <dl className="grid grid-cols-2 gap-4 rounded-xl bg-bg-2 p-4 md:grid-cols-5">
        <div><dt className="text-xs text-ink-2">{t("Totali i vlerësuar", "Estimated total")}</dt><dd className="text-lg font-semibold tabular-nums">{lek(plan.totalLek)}</dd></div>
        <div><dt className="text-xs text-ink-2">{t("Buxheti", "Budget")}</dt><dd className="text-lg tabular-nums">{budgetLek ? lek(budgetLek) : "–"}</dd></div>
        <div><dt className="text-xs text-ink-2">{t("Kursimi ndaj çmimit të ri", "Saving vs new price")}</dt><dd className="text-lg tabular-nums">{lek(plan.savingLek)}</dd></div>
        <div><dt className="text-xs text-ink-2">{t("Ripërdorim", "Reuse")}</dt><dd className="text-lg tabular-nums">{Math.round(plan.reuseShare * 100)}%</dd></div>
        <div><dt className="text-xs text-ink-2">{t("CO₂ e shmangur (vlerësim)", "CO₂ avoided (estimate)")}</dt><dd className="text-lg tabular-nums">{formatNumber(plan.co2AvoidedKg, 0)} kg</dd></div>
      </dl>
      <ul className="grid gap-2 text-sm">
        {plan.lines.map((l) => (
          <li key={`${l.requirementId}-${l.listing.id}`} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line px-3 py-2.5">
            <span className="min-w-0 flex-1"><span className="text-xs text-ink-2">{label.get(l.requirementId)}</span><span className="block font-medium">{l.listing.title} <span className="rounded-full bg-bg-2 px-2 py-0.5 text-[11px] font-normal text-ink-2">{CONDITION_LABEL[lang][l.listing.condition]}</span>{l.listing.source === "demo" && <span className="ml-1 rounded-full border border-line px-2 py-0.5 text-[11px] font-normal text-ink-2">demo</span>}</span><span className="block text-xs text-ink-2">{l.listing.sellerName}, {l.listing.city} · {formatNumber(l.distanceKm, 0)} km</span></span>
            <span className="tabular-nums">{formatNumber(l.take, 1)} {l.listing.unit}</span>
            <span className="w-24 text-right font-semibold tabular-nums">{lek(l.costLek)}</span>
            {l.listing.href ? <Link href={`${l.listing.href}/oferte`} className="rounded-full bg-lime px-3 py-1.5 text-xs font-semibold text-bg">{t("Kërko ofertë", "Request quote")}</Link> : <span className="rounded-full border border-line px-3 py-1.5 text-xs text-ink-2">{t("S'porositet", "Not orderable")}</span>}
          </li>
        ))}
      </ul>
      {plan.missing.length > 0 && <p className="rounded-xl border border-[#ecd29a] bg-[#fdf6e3] px-4 py-3 text-sm">{t("Duhet të sigurohen veçmas", "Source separately")}: {plan.missing.map((m) => `${label.get(m.requirementId)} (${formatNumber(m.quantity, 1)} ${m.unit ?? ""})`).join(", ")}.</p>}
      <p className="text-xs text-ink-2">{t("Totali, transporti, kursimi dhe CO₂ janë vlerësime. Çmimet e listimeve reale konfirmohen nga shitësi me ofertë.", "Total, transport, saving and CO₂ are estimates. Real listing prices are confirmed by the seller with a quote.")}</p>
    </div>
  );
}

function BeforeAfter({ before, after }: { before: string; after: string }) {
  const { t } = useLang();
  const [pos, setPos] = useState(50);
  return (
    <figure>
      <div className="relative aspect-square overflow-hidden rounded-xl border border-line">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={after} alt={t("Koncepti pas rinovimit", "Concept after renovation")} className="absolute inset-0 size-full object-cover" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={before} alt={t("Dhoma tani", "The room now")} className="absolute inset-0 size-full object-cover" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }} />
        <span aria-hidden className="absolute inset-y-0 w-0.5 bg-white shadow" style={{ left: `${pos}%` }} />
        <span className="absolute top-3 left-3 rounded-full bg-black/55 px-2.5 py-1 text-xs text-white">{t("Para", "Before")}</span>
        <span className="absolute top-3 right-3 rounded-full bg-black/55 px-2.5 py-1 text-xs text-white">{t("Pas (koncept)", "After (concept)")}</span>
      </div>
      <label className="mt-3 flex items-center gap-3 text-sm"><span className="sr-only">{t("Krahaso para dhe pas", "Compare before and after")}</span><input type="range" min={0} max={100} value={pos} onChange={(e) => setPos(Number(e.target.value))} className="w-full accent-[var(--color-lime)]" /></label>
    </figure>
  );
}

const inputCls = "w-full rounded-lg border border-line bg-bg px-3 py-2.5 text-sm";
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="grid gap-1.5 text-sm"><span className="font-medium">{label}</span>{children}</label>;
}
function Num({ label, value, onChange, step = 0.1 }: { label: string; value: number; onChange: (v: number) => void; step?: number }) {
  return <Field label={label}><input type="number" min={0} step={step} value={value} onChange={(e) => onChange(Math.max(0, Number(e.target.value)))} className={`${inputCls} tabular-nums`} /></Field>;
}
function List({ title, items }: { title: string; items: string[] }) {
  if (!items?.length) return null;
  return <div className="mt-3"><p className="font-medium">{title}</p><ul className="mt-1 list-disc pl-5 text-ink-2">{items.map((i) => <li key={i}>{i}</li>)}</ul></div>;
}

function aiMessage(code: string, t: (sq: string, en: string) => string) {
  if (code === "not-configured") return t("Shërbimi AI nuk është lidhur ende në server.", "The AI service is not connected on the server yet.");
  if (code === "rate") return t("Ke arritur kufirin e kërkesave për tani. Provo më vonë.", "You reached the request limit for now. Try later.");
  if (code === "busy") return t("Mjeti AI ka arritur kufirin ditor të përdorimit. Provo nesër.", "The AI tool has reached today's usage limit. Try again tomorrow.");
  if (code === "photo") return t("Fotoja duhet të jetë JPG, PNG ose WEBP deri në 5 MB.", "The photo must be JPG, PNG or WEBP up to 5 MB.");
  return t("Shërbimi AI nuk u përgjigj. Provo përsëri pas pak.", "The AI service did not respond. Try again shortly.");
}

/** Resizes a photo in the browser before anything else happens with it. */
async function downscale(file: File, max: number): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale); canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.85);
}

async function exportReport(s: State, lines: EstimateLine[], plan: Plan, t: (sq: string, en: string) => string, lang: "sq" | "en") {
  const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica), bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const safe = (x: string) => x.replace(/[^\u0000-ÿ]/g, (c) => ({ "→": "->", "×": "x", "²": "2", "₂": "2", "−": "-" } as Record<string, string>)[c] ?? "");
  let page = doc.addPage([595, 842]); let y = 800;
  const ink = rgb(0.05, 0.18, 0.17), muted = rgb(0.31, 0.42, 0.39);
  const line = (text: string, size = 10, f = font, color = ink) => { if (y < 60) { page = doc.addPage([595, 842]); y = 800; } page.drawText(safe(text), { x: 48, y, size, font: f, color }); y -= size + 6; };
  const style = STYLES.find((x) => x.id === s.brief.style)!;
  line(t("ECONERA · Raport rinovimi", "ECONERA · Renovation report"), 18, bold);
  line(`${ROOM_TYPES.find((r) => r.id === s.room.type)?.[lang]} · ${lang === "en" ? style.en : style.sq} · ${s.brief.city}`, 11, font, muted);
  line(`${s.room.lengthM} x ${s.room.widthM} x ${s.room.heightM} m · ${formatNumber(s.room.lengthM * s.room.widthM, 1)} m2`, 11, font, muted);
  y -= 8; line(t("Materialet e vlerësuara", "Estimated materials"), 13, bold);
  for (const l of lines) line(`${lang === "en" ? l.en : l.sq}: ${formatNumber(l.quantity, 1)} ${l.unit}  (${lang === "en" ? l.basisEn : l.basisSq})`, 9);
  y -= 8; line(`${t("Plani", "Plan")}: ${MODE_LABEL[lang][plan.mode]}`, 13, bold);
  for (const l of plan.lines) line(`${l.listing.title} · ${l.listing.sellerName}, ${l.listing.city} · ${formatNumber(l.take, 1)} ${l.listing.unit} · ${formatNumber(l.costLek, 0)} L${l.listing.source === "demo" ? " (demo)" : ""}`, 9);
  for (const m of plan.missing) line(`${t("Mungon", "Missing")}: ${formatNumber(m.quantity, 1)} ${m.unit ?? ""} · ${m.reason}`, 9, font, muted);
  y -= 8;
  line(`${t("Materiale", "Materials")}: ${formatNumber(plan.materialLek, 0)} L · ${t("Transport (vlerësim)", "Transport (estimate)")}: ${formatNumber(plan.transportLek, 0)} L · ${t("Totali", "Total")}: ${formatNumber(plan.totalLek, 0)} L`, 10, bold);
  line(`${t("Kursimi ndaj çmimit të ri", "Saving vs new price")}: ${formatNumber(plan.savingLek, 0)} L · ${t("Ripërdorim", "Reuse")}: ${Math.round(plan.reuseShare * 100)}% · CO2 ${t("e shmangur", "avoided")}: ${formatNumber(plan.co2AvoidedKg, 0)} kg`, 10);
  y -= 10; line(t("Vlerësime planifikimi, jo llogaritje të certifikuara. Konceptet AI nuk janë garanci rezultati.", "Planning estimates, not certified calculations. AI concepts are not a guarantee of results."), 8, font, muted);
  const bytes = await doc.save();
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([bytes as BlobPart], { type: "application/pdf" }));
  a.download = "econera-rinovim.pdf"; a.click(); URL.revokeObjectURL(a.href);
}
