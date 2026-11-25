"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLang } from "@/components/lang-provider";
import { formatNumber } from "@/lib/format";
import type { Listing } from "@/lib/tools/inventory";
import { handoff, projects } from "@/lib/tools/projects";
import { DEFAULT_SETTINGS, MATERIALS, NEW_PRICE_PER_M2, optimise, validate, type CutPlan, type PieceSpec, type Settings, type SheetLayout, type Stock } from "@/lib/tools/smartcut";

type Unit = "mm" | "cm" | "in";
const TO_MM: Record<Unit, number> = { mm: 1, cm: 10, in: 25.4 };
const COLORS = ["#cfe8c0", "#e7d7b0", "#bcd7e8", "#e9c9c0", "#d9cfe9", "#c8e4dc", "#efe1a8", "#d7d7d0"];
const lek = (n: number) => `${formatNumber(Math.round(n), 0)} L`;

type Own = { id: string; length: number; width: number; quantity: number };
export type CutState = { material: string; thickness: number; unit: Unit; pieces: PieceSpec[]; own: Own[]; settings: Settings };

const START: CutState = {
  material: "MDF", thickness: 18, unit: "mm",
  pieces: [
    { id: "a", label: "A", length: 800, width: 400, quantity: 2 },
    { id: "b", label: "B", length: 600, width: 300, quantity: 2 },
    { id: "c", label: "C", length: 1100, width: 500, quantity: 1, grain: true },
    { id: "d", label: "D", length: 400, width: 400, quantity: 1 },
  ],
  own: [], settings: { ...DEFAULT_SETTINGS },
};

export function SmartCut({ listings }: { listings: Listing[] }) {
  const { t } = useLang();
  const router = useRouter();
  const [state, setState] = useState<CutState>(START);
  const [plan, setPlan] = useState<CutPlan | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [projectId, setProjectId] = useState<string | undefined>();
  const [notice, setNotice] = useState<string | null>(null);
  const k = TO_MM[state.unit];

  useEffect(() => {
    const timer = setTimeout(() => {
      const id = new URLSearchParams(window.location.search).get("projekt");
      const p = id ? projects.get(id) : undefined;
      if (p?.kind === "smartcut") { setState(p.data as CutState); setProjectId(p.id); }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const offcuts = useMemo(() => listings.filter((l) => l.sheet && l.sheet.material === state.material && Math.abs(l.sheet.thicknessMm - state.thickness) < 0.5 && l.quantity > 0), [listings, state.material, state.thickness]);
  const thicknesses = useMemo(() => [...new Set(listings.filter((l) => l.sheet?.material === state.material).map((l) => l.sheet!.thicknessMm))].sort((a, b) => a - b), [listings, state.material]);

  function run() {
    const stock: Stock[] = [
      ...state.own.filter((o) => o.length > 0 && o.width > 0).map((o) => ({ id: `own:${o.id}`, title: t("Copëz e imja", "My offcut"), material: state.material, length: o.length, width: o.width, thickness: state.thickness, quantity: o.quantity, priceLek: 0, sellerName: t("Ti", "You") })),
      ...offcuts.map((l) => ({ id: l.id, title: l.title, material: l.sheet!.material, length: l.sheet!.lengthMm, width: l.sheet!.widthMm, thickness: l.sheet!.thicknessMm, quantity: l.quantity, priceLek: l.priceLek, newPriceLek: l.marketPriceLek, sellerName: l.sellerName, city: l.city, source: l.source, defects: l.sheet!.defects, href: l.href })),
    ];
    const result = optimise(state.pieces, stock, state.settings, NEW_PRICE_PER_M2[state.material]);
    setErrors(validate(result, state.settings.kerf));
    setPlan(result);
    setNotice(null);
  }

  const setPiece = (id: string, patch: Partial<PieceSpec>) => setState((s) => ({ ...s, pieces: s.pieces.map((p) => (p.id === id ? { ...p, ...patch } : p)) }));
  const nextLabel = () => { const used = new Set(state.pieces.map((p) => p.label)); return "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").find((c) => !used.has(c)) ?? `P${state.pieces.length + 1}`; };
  const toUnit = (mm: number) => Math.round((mm / k) * 100) / 100;
  const fromUnit = (v: string) => Math.max(0, Number(v) * k);

  function save() {
    const p = projects.save("smartcut", `${state.material} ${state.thickness} mm · ${state.pieces.reduce((a, x) => a + x.quantity, 0)} ${t("pjesë", "pieces")}`, state, projectId);
    setProjectId(p.id);
    setNotice(t("U ruajt te Projektet e mia.", "Saved to My projects."));
  }

  function toBasket() {
    if (!plan) return;
    const counts = new Map<string, { s: Stock; n: number }>();
    for (const sh of plan.sheets) if (!sh.stock.id.startsWith("own:")) counts.set(sh.stock.id, { s: sh.stock, n: (counts.get(sh.stock.id)?.n ?? 0) + 1 });
    handoff.putItems([...counts.values()].map(({ s, n }) => ({ text: s.title, category: "copeza", quantity: n, unit: "copë", listingId: s.id })));
    router.push("/ai/shporta");
  }

  return (
    <div className="grid gap-6">
      <section aria-labelledby="pjeset" className="card p-5 md:p-7">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 id="pjeset" className="text-2xl">{t("Pjesët që të duhen", "Pieces you need")}</h2>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <label className="flex items-center gap-2">{t("Materiali", "Material")}
              <select value={state.material} onChange={(e) => setState((s) => ({ ...s, material: e.target.value }))} className="rounded-lg border border-line bg-bg px-3 py-2">{MATERIALS.map((m) => <option key={m}>{m}</option>)}</select>
            </label>
            <label className="flex items-center gap-2">{t("Trashësia", "Thickness")}
              <input type="number" min={1} value={state.thickness} onChange={(e) => setState((s) => ({ ...s, thickness: Number(e.target.value) }))} list="trashesite" className="w-20 rounded-lg border border-line bg-bg px-3 py-2" /> mm
              <datalist id="trashesite">{thicknesses.map((x) => <option key={x} value={x} />)}</datalist>
            </label>
            <label className="flex items-center gap-2">{t("Njësia", "Unit")}
              <select value={state.unit} onChange={(e) => setState((s) => ({ ...s, unit: e.target.value as Unit }))} className="rounded-lg border border-line bg-bg px-2 py-2"><option>mm</option><option>cm</option><option value="in">inch</option></select>
            </label>
          </div>
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead className="text-left text-ink-2"><tr><th className="pb-2 font-medium">{t("Emri", "Label")}</th><th className="pb-2 font-medium">{t("Gjatësia", "Length")} ({state.unit})</th><th className="pb-2 font-medium">{t("Gjerësia", "Width")} ({state.unit})</th><th className="pb-2 font-medium">{t("Sasia", "Qty")}</th><th className="pb-2 font-medium">{t("Fibra / modeli", "Grain / pattern")}</th><th /></tr></thead>
            <tbody>
              {state.pieces.map((p) => (
                <tr key={p.id} className="border-t border-line">
                  <td className="py-2 pr-3"><input aria-label={t("Emri", "Label")} value={p.label} onChange={(e) => setPiece(p.id, { label: e.target.value.slice(0, 8) })} className="w-20 rounded-lg border border-line bg-bg px-3 py-2" /></td>
                  <td className="py-2 pr-3"><input aria-label={t("Gjatësia", "Length")} type="number" min={0} step="any" value={toUnit(p.length)} onChange={(e) => setPiece(p.id, { length: fromUnit(e.target.value) })} className="w-28 rounded-lg border border-line bg-bg px-3 py-2 tabular-nums" /></td>
                  <td className="py-2 pr-3"><input aria-label={t("Gjerësia", "Width")} type="number" min={0} step="any" value={toUnit(p.width)} onChange={(e) => setPiece(p.id, { width: fromUnit(e.target.value) })} className="w-28 rounded-lg border border-line bg-bg px-3 py-2 tabular-nums" /></td>
                  <td className="py-2 pr-3"><input aria-label={t("Sasia", "Qty")} type="number" min={1} value={p.quantity} onChange={(e) => setPiece(p.id, { quantity: Math.max(1, Math.floor(Number(e.target.value))) })} className="w-20 rounded-lg border border-line bg-bg px-3 py-2 tabular-nums" /></td>
                  <td className="py-2 pr-3"><label className="inline-flex items-center gap-2"><input type="checkbox" checked={Boolean(p.grain)} onChange={(e) => setPiece(p.id, { grain: e.target.checked })} className="size-4 accent-[var(--color-lime)]" />{t("sipas gjatësisë", "along length")}</label></td>
                  <td className="py-2 text-right"><button type="button" onClick={() => setState((s) => ({ ...s, pieces: s.pieces.filter((x) => x.id !== p.id) }))} aria-label={t(`Hiq pjesën ${p.label}`, `Remove piece ${p.label}`)} className="rounded-lg px-2 py-1 text-ink-2 hover:bg-bg-2">✕</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button type="button" className="btn-ghost mt-4" onClick={() => setState((s) => ({ ...s, pieces: [...s.pieces, { id: `p${Date.now().toString(36)}`, label: nextLabel(), length: 500, width: 300, quantity: 1 }] }))}>{t("Shto pjesë", "Add piece")}</button>

        <details className="mt-6 rounded-xl border border-line p-4">
          <summary className="cursor-pointer font-medium">{t("Cilësimet e prerjes", "Cutting settings")}</summary>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <NumberField label={t("Trashësia e sharrës (kerf), mm", "Blade width (kerf), mm")} value={state.settings.kerf} onChange={(v) => setState((s) => ({ ...s, settings: { ...s.settings, kerf: v } }))} />
            <NumberField label={t("Mbetja më e vogël e ripërdorshme, mm", "Smallest reusable leftover, mm")} value={state.settings.minLeftover} onChange={(v) => setState((s) => ({ ...s, settings: { ...s.settings, minLeftover: v } }))} />
            <NumberField label={t("Pastrim i skajeve, mm", "Edge trim, mm")} value={state.settings.edgeTrim} onChange={(v) => setState((s) => ({ ...s, settings: { ...s.settings, edgeTrim: v } }))} />
            <label className="flex items-center gap-2 self-end pb-2 text-sm"><input type="checkbox" checked={state.settings.allowRotation} onChange={(e) => setState((s) => ({ ...s, settings: { ...s.settings, allowRotation: e.target.checked } }))} className="size-4 accent-[var(--color-lime)]" />{t("Lejo rrotullimin e pjesëve", "Allow rotating pieces")}</label>
          </div>
          <h3 className="mt-6 text-base font-semibold">{t("Copëzat e mia (falas)", "My own offcuts (free)")}</h3>
          {state.own.map((o) => (
            <div key={o.id} className="mt-2 flex flex-wrap items-center gap-2 text-sm">
              <input aria-label={t("Gjatësia", "Length")} type="number" value={toUnit(o.length)} onChange={(e) => setState((s) => ({ ...s, own: s.own.map((x) => (x.id === o.id ? { ...x, length: fromUnit(e.target.value) } : x)) }))} className="w-28 rounded-lg border border-line bg-bg px-3 py-2" />×
              <input aria-label={t("Gjerësia", "Width")} type="number" value={toUnit(o.width)} onChange={(e) => setState((s) => ({ ...s, own: s.own.map((x) => (x.id === o.id ? { ...x, width: fromUnit(e.target.value) } : x)) }))} className="w-28 rounded-lg border border-line bg-bg px-3 py-2" />{state.unit}
              <button type="button" onClick={() => setState((s) => ({ ...s, own: s.own.filter((x) => x.id !== o.id) }))} className="rounded-lg px-2 py-1 text-ink-2 hover:bg-bg-2" aria-label={t("Hiq", "Remove")}>✕</button>
            </div>
          ))}
          <button type="button" className="mt-3 text-sm text-lime underline underline-offset-4" onClick={() => setState((s) => ({ ...s, own: [...s.own, { id: Date.now().toString(36), length: 1000, width: 500, quantity: 1 }] }))}>{t("+ Shto një copëz që e ke vetë", "+ Add an offcut you already have")}</button>
        </details>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button type="button" className="btn-primary" onClick={run}>{t("Optimizo prerjen", "Optimise the cut")}</button>
          <span className="text-sm text-ink-2">{offcuts.length ? t(`${offcuts.length} copëza/fletë ${state.material} ${state.thickness} mm në treg`, `${offcuts.length} ${state.material} ${state.thickness} mm offcuts/sheets on the market`) : t(`Nuk ka ${state.material} ${state.thickness} mm në treg tani.`, `No ${state.material} ${state.thickness} mm on the market now.`)}</span>
        </div>
      </section>

      {plan && <Result plan={plan} errors={errors} unit={state.unit} onSave={save} onBasket={toBasket} saved={Boolean(projectId)} notice={notice} />}
    </div>
  );
}

function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return <label className="grid gap-1.5 text-sm"><span>{label}</span><input type="number" min={0} step="any" value={value} onChange={(e) => onChange(Math.max(0, Number(e.target.value)))} className="rounded-lg border border-line bg-bg px-3 py-2" /></label>;
}

function Result({ plan, errors, unit, onSave, onBasket, saved, notice }: { plan: CutPlan; errors: string[]; unit: Unit; onSave: () => void; onBasket: () => void; saved: boolean; notice: string | null }) {
  const { t } = useLang();
  const m2 = (mm2: number) => `${formatNumber(mm2 / 1e6, 2)} m²`;
  const colorOf = useMemo(() => { const ids = [...new Set(plan.sheets.flatMap((s) => s.placements.map((p) => p.pieceId)))]; return (id: string) => COLORS[ids.indexOf(id) % COLORS.length]; }, [plan]);
  const marketSheets = plan.sheets.filter((s) => !s.stock.id.startsWith("own:"));

  return (
    <section aria-labelledby="plani" className="grid gap-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h2 id="plani" className="text-3xl">{t("Plani i prerjes", "Cutting plan")}</h2>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn-ghost" onClick={() => void exportPdf(plan, t)}>{t("Shkarko PDF", "Download PDF")}</button>
          <button type="button" className="btn-ghost" onClick={onSave}>{saved ? t("Ruaj ndryshimet", "Save changes") : t("Ruaj projektin", "Save project")}</button>
          {marketSheets.length > 0 && <button type="button" className="btn-primary" onClick={onBasket}>{t("Dërgo në Smart Basket", "Send to Smart Basket")}</button>}
        </div>
      </div>
      {notice && <p role="status" className="rounded-xl border border-line bg-bg-2 px-4 py-3 text-sm">{notice}</p>}
      {errors.length > 0 && <p role="alert" className="rounded-xl border border-[#e8b7a8] bg-[#fdf0ec] px-4 py-3 text-sm">{t("Kontrolli gjeometrik gjeti probleme:", "The geometry check found issues:")} {errors.join("; ")}</p>}

      <dl className="card grid grid-cols-2 gap-4 p-5 md:grid-cols-6 md:p-7">
        <Stat label={t("Kosto e copëzave", "Offcut cost")} value={lek(plan.costLek)} strong />
        <Stat label={t("Me fletë të reja (vlerësim)", "With new sheets (estimate)")} value={plan.newCostLek !== undefined ? lek(plan.newCostLek) : "–"} />
        <Stat label={t("Kursimi", "Saving")} value={plan.savingLek !== undefined ? lek(plan.savingLek) : "–"} />
        <Stat label={t("Shfrytëzimi", "Utilisation")} value={`${Math.round(plan.utilization * 100)}%`} />
        <Stat label={t("Mbetje të ripërdorshme", "Reusable leftovers")} value={m2(plan.reusableLeftoverArea)} />
        <Stat label={t("Mbetje skarco", "Waste")} value={m2(Math.max(0, plan.wasteArea))} />
      </dl>

      {plan.unplaced.length > 0 && <p className="rounded-xl border border-[#ecd29a] bg-[#fdf6e3] px-4 py-3 text-sm">{t("Pa vend:", "Not placed:")} {plan.unplaced.map((u) => `${u.label} (${formatNumber(u.length / TO_MM[unit], 1)}×${formatNumber(u.width / TO_MM[unit], 1)} ${unit})`).join(", ")}. {t("Shto copëzat e tua, ndrysho trashësinë ose blej një fletë të re.", "Add your own offcuts, change the thickness or buy a new sheet.")}</p>}

      <div className="grid gap-5 lg:grid-cols-2">
        {plan.sheets.map((sh, i) => <SheetView key={`${sh.stock.id}-${sh.copy}`} sheet={sh} n={i + 1} unit={unit} colorOf={colorOf} />)}
      </div>

      {marketSheets.length > 0 && (
        <div className="card p-5 md:p-7">
          <h3 className="text-xl">{t("Çfarë blen dhe nga kush", "What you buy, and from whom")}</h3>
          <ul className="mt-4 grid gap-2 text-sm">
            {marketSheets.map((sh) => (
              <li key={`${sh.stock.id}-${sh.copy}`} className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-bg-2/60 px-3 py-2.5">
                <span><span className="font-medium">{sh.stock.title}</span>{sh.stock.source === "demo" && <span className="ml-2 rounded-full border border-line px-2 py-0.5 text-[11px] text-ink-2">demo</span>}<span className="block text-xs text-ink-2">{sh.stock.sellerName}{sh.stock.city ? `, ${sh.stock.city}` : ""}</span></span>
                <span className="font-semibold tabular-nums">{lek(sh.stock.priceLek)}</span>
                {sh.stock.href ? <Link href={`${sh.stock.href}/oferte`} className="rounded-full bg-lime px-3 py-1.5 text-xs font-semibold text-bg">{t("Kërko ofertë", "Request quote")}</Link> : <span className="rounded-full border border-line px-3 py-1.5 text-xs text-ink-2">{t("S'porositet", "Not orderable")}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}
      <p className="text-xs leading-relaxed text-ink-2">{t("Plani është ndihmë planifikimi. Kontrollo masat në vend; për xham, gur dhe metal ose për pjesë mbajtëse duhet verifikim nga profesionisti. Krahasimi bëhet me fletë të reja të plota 2800×2070 mm me çmim vlerësimi.", "This plan is planning assistance. Check measurements on site; glass, stone, metal and load-bearing parts need professional validation. The comparison uses whole new 2800×2070 mm sheets at an estimated price.")}</p>
    </section>
  );
}

function Stat({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return <div><dt className="text-xs text-ink-2">{label}</dt><dd className={`mt-1 tabular-nums ${strong ? "text-xl font-semibold" : "text-lg"}`}>{value}</dd></div>;
}

/** One sheet as an SVG drawing with zoom and pan, plus a table for screen readers. */
function SheetView({ sheet, n, unit, colorOf }: { sheet: SheetLayout; n: number; unit: Unit; colorOf: (id: string) => string }) {
  const { t } = useLang();
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const drag = useRef<{ x: number; y: number } | null>(null);
  const L = sheet.stock.length, W = sheet.stock.width;
  const pad = Math.max(L, W) * 0.04;
  const vw = (L + pad * 2) / zoom, vh = (W + pad * 2) / zoom;
  const fmt = (mm: number) => formatNumber(mm / TO_MM[unit], unit === "mm" ? 0 : 1);
  const font = Math.max(L, W) / 40;

  return (
    <figure className="card overflow-hidden">
      <figcaption className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-5 py-3">
        <span><span className="font-semibold">{t("Fleta", "Sheet")} {n}</span> <span className="text-sm text-ink-2">· {sheet.stock.title} · {fmt(L)}×{fmt(W)} {unit}</span></span>
        <span className="flex items-center gap-1">
          <span className="mr-2 text-sm font-medium tabular-nums">{Math.round(sheet.utilization * 100)}%</span>
          <button type="button" aria-label={t("Zmadho", "Zoom in")} onClick={() => setZoom((z) => Math.min(6, z * 1.4))} className="grid size-8 place-items-center rounded-lg border border-line">+</button>
          <button type="button" aria-label={t("Zvogëlo", "Zoom out")} onClick={() => setZoom((z) => Math.max(1, z / 1.4))} className="grid size-8 place-items-center rounded-lg border border-line">−</button>
          <button type="button" aria-label={t("Rikthe pamjen", "Reset view")} onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }} className="grid h-8 place-items-center rounded-lg border border-line px-2 text-xs">1:1</button>
        </span>
      </figcaption>
      <svg role="img" aria-label={t(`Skema e prerjes për fletën ${n}`, `Cutting diagram for sheet ${n}`)} viewBox={`${-pad + pan.x} ${-pad + pan.y} ${vw} ${vh}`} className="block w-full cursor-grab touch-none bg-bg-2 active:cursor-grabbing" style={{ aspectRatio: `${L + pad * 2} / ${W + pad * 2}` }}
        onPointerDown={(e) => { drag.current = { x: e.clientX, y: e.clientY }; (e.target as Element).setPointerCapture?.(e.pointerId); }}
        onPointerMove={(e) => { if (!drag.current || zoom === 1) return; const scale = vw / (e.currentTarget.clientWidth || 1); setPan((p) => ({ x: p.x - (e.clientX - drag.current!.x) * scale, y: p.y - (e.clientY - drag.current!.y) * scale })); drag.current = { x: e.clientX, y: e.clientY }; }}
        onPointerUp={() => { drag.current = null; }}
        onWheel={(e) => { if (!e.ctrlKey && !e.metaKey) return; e.preventDefault(); setZoom((z) => Math.min(6, Math.max(1, z * (e.deltaY < 0 ? 1.15 : 0.87)))); }}>
        <defs><pattern id={`waste-${n}`} width={font} height={font} patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2={font} stroke="#c9d6ce" strokeWidth={font / 6} /></pattern></defs>
        <rect x={0} y={0} width={L} height={W} fill={`url(#waste-${n})`} stroke="#0f4a43" strokeWidth={font / 6} />
        {sheet.leftovers.map((r, i) => <rect key={`l${i}`} x={r.x} y={r.y} width={r.w} height={r.h} fill="#f4f8f5" stroke="#7fb52a" strokeDasharray={`${font / 2} ${font / 3}`} strokeWidth={font / 10} />)}
        {(sheet.stock.defects ?? []).map((d, i) => <g key={`d${i}`}><rect x={d.x} y={d.y} width={d.w} height={d.h} fill="#f3d9d1" stroke="#b5543a" strokeWidth={font / 10} /><text x={d.x + d.w / 2} y={d.y + d.h / 2} fontSize={font * 0.7} textAnchor="middle" dominantBaseline="middle" fill="#8a2f1d">{t("defekt", "defect")}</text></g>)}
        {sheet.placements.map((p) => (
          <g key={`${p.label}-${p.index}`}>
            <rect x={p.x} y={p.y} width={p.w} height={p.h} fill={colorOf(p.pieceId)} stroke="#0c2f2b" strokeWidth={font / 12} />
            <text x={p.x + p.w / 2} y={p.y + p.h / 2 - font * 0.3} fontSize={font * 1.1} fontWeight={600} textAnchor="middle" fill="#0c2f2b">{p.label}{p.rotated ? " ↻" : ""}</text>
            <text x={p.x + p.w / 2} y={p.y + p.h / 2 + font * 0.9} fontSize={font * 0.75} textAnchor="middle" fill="#2c4a44">{fmt(p.w)}×{fmt(p.h)}</text>
          </g>
        ))}
        {sheet.cuts.map((c, i) => <line key={`c${i}`} x1={c.x1} y1={c.y1} x2={c.x2} y2={c.y2} stroke="#b5543a" strokeWidth={font / 14} strokeDasharray={`${font / 3} ${font / 4}`} />)}
        <text x={L / 2} y={-pad * 0.3} fontSize={font * 0.8} textAnchor="middle" fill="#4f6b64">{fmt(L)} {unit}</text>
        <text x={-pad * 0.3} y={W / 2} fontSize={font * 0.8} textAnchor="middle" fill="#4f6b64" transform={`rotate(-90 ${-pad * 0.3} ${W / 2})`}>{fmt(W)} {unit}</text>
      </svg>
      <div className="flex flex-wrap gap-x-4 gap-y-1 px-5 py-3 text-xs text-ink-2">
        <span className="inline-flex items-center gap-1.5"><span className="size-3 rounded-sm border border-[#7fb52a] bg-bg" />{t("mbetje e ripërdorshme", "reusable leftover")}</span>
        <span className="inline-flex items-center gap-1.5"><span className="size-3 rounded-sm bg-[#c9d6ce]" />{t("skarco", "waste")}</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-0 w-4 border-t-2 border-dashed border-[#b5543a]" />{t("vijë prerjeje", "cut line")}</span>
        <span>↻ {t("e rrotulluar", "rotated")}</span>
      </div>
      <details className="border-t border-line px-5 py-3 text-sm">
        <summary className="cursor-pointer">{t("Pozicionet si tabelë", "Positions as a table")}</summary>
        <table className="mt-2 w-full text-left tabular-nums">
          <thead className="text-ink-2"><tr><th>{t("Pjesa", "Piece")}</th><th>X</th><th>Y</th><th>{t("Gjatësi", "Length")}</th><th>{t("Gjerësi", "Width")}</th><th>{t("Rrotulluar", "Rotated")}</th></tr></thead>
          <tbody>{sheet.placements.map((p) => <tr key={`${p.label}-${p.index}`}><td>{p.label}</td><td>{fmt(p.x)}</td><td>{fmt(p.y)}</td><td>{fmt(p.w)}</td><td>{fmt(p.h)}</td><td>{p.rotated ? t("po", "yes") : t("jo", "no")}</td></tr>)}</tbody>
        </table>
      </details>
    </figure>
  );
}

async function exportPdf(plan: CutPlan, t: (sq: string, en: string) => string) {
  const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const ink = rgb(0.05, 0.18, 0.17), muted = rgb(0.31, 0.42, 0.39);
  const safe = (s: string) => s.replace(/[^\u0000-ÿ]/g, (c) => ({ "→": "->", "×": "x", "−": "-", "↻": "(r)" } as Record<string, string>)[c] ?? "");
  for (const [i, sh] of plan.sheets.entries()) {
    const page = doc.addPage([842, 595]);
    page.drawText(safe(`ECONERA SmartCut - ${t("Fleta", "Sheet")} ${i + 1}/${plan.sheets.length}`), { x: 36, y: 560, size: 14, font: bold, color: ink });
    page.drawText(safe(`${sh.stock.title} - ${sh.stock.length} x ${sh.stock.width} mm - ${t("shfrytëzimi", "utilisation")} ${Math.round(sh.utilization * 100)}%`), { x: 36, y: 542, size: 10, font, color: muted });
    const scale = Math.min(770 / sh.stock.length, 440 / sh.stock.width);
    const ox = 36, oy = 70;
    const Y = (y: number, h: number) => oy + (sh.stock.width - y - h) * scale;
    page.drawRectangle({ x: ox, y: oy, width: sh.stock.length * scale, height: sh.stock.width * scale, borderColor: ink, borderWidth: 1, color: rgb(0.86, 0.9, 0.88) });
    for (const r of sh.leftovers) page.drawRectangle({ x: ox + r.x * scale, y: Y(r.y, r.h), width: r.w * scale, height: r.h * scale, color: rgb(0.96, 0.97, 0.96), borderColor: rgb(0.5, 0.71, 0.16), borderWidth: 0.6 });
    for (const p of sh.placements) {
      page.drawRectangle({ x: ox + p.x * scale, y: Y(p.y, p.h), width: p.w * scale, height: p.h * scale, color: rgb(0.81, 0.91, 0.75), borderColor: ink, borderWidth: 0.8 });
      const label = safe(`${p.label}${p.rotated ? " (r)" : ""}  ${p.w}x${p.h}`);
      const size = Math.max(6, Math.min(10, (p.w * scale) / (label.length * 0.55)));
      page.drawText(label, { x: ox + p.x * scale + 4, y: Y(p.y, p.h) + p.h * scale / 2 - size / 2, size, font, color: ink });
    }
    page.drawText(safe(t("Ndihmë planifikimi. Kontrollo masat në vend; materialet e veçanta kërkojnë verifikim profesional.", "Planning assistance. Check measurements on site; special materials need professional validation.")), { x: 36, y: 40, size: 8, font, color: muted });
  }
  const bytes = await doc.save();
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([bytes as BlobPart], { type: "application/pdf" }));
  a.download = "econera-smartcut.pdf";
  a.click();
  URL.revokeObjectURL(a.href);
}
