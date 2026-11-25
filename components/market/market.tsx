"use client";

import { useMemo, useState } from "react";
import { formatLek, formatQty } from "@/lib/demo";
import { CATEGORIES, CITIES, CONDITIONS, coverPlan, parseQuery, searchStock, type City, type Condition } from "@/lib/market";
import { SupplierMap } from "./supplier-map";

type Sort = "match" | "price" | "distance";

export function Market({ initialQuery = "", initialCategory = "", initialCity = "Tiranë" }: { initialQuery?: string; initialCategory?: string; initialCity?: City }) {
  const [query, setQuery] = useState(initialQuery);
  const [submitted, setSubmitted] = useState(initialQuery);
  const [category, setCategory] = useState(initialCategory || parseQuery(initialQuery).category || "");
  const [city, setCity] = useState<City>(initialCity);
  const [condition, setCondition] = useState<Condition | "">("");
  const [sort, setSort] = useState<Sort>("match");
  const [hover, setHover] = useState<string | null>(null);

  const parsed = useMemo(() => parseQuery(submitted), [submitted]);
  const effectiveCategory = category || parsed.category || "";
  const effectiveCity = parsed.city ?? city;
  const offers = useMemo(
    () => searchStock({ category: effectiveCategory || undefined, city: effectiveCity, condition: condition || undefined, words: parsed.words, quantity: parsed.quantity, sort }),
    [effectiveCategory, effectiveCity, condition, parsed, sort],
  );
  const plan = useMemo(() => (parsed.quantity && effectiveCategory ? coverPlan([...offers].sort((a, b) => b.match - a.match), parsed.quantity) : null), [offers, parsed.quantity, effectiveCategory]);
  const active = useMemo(() => new Set(offers.map((o) => o.supplier.id)), [offers]);
  const hoverSupplier = hover && offers.find((o) => o.id === hover)?.supplier.id;

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const p = parseQuery(query);
    setSubmitted(query);
    if (p.category) setCategory(p.category);
    if (p.city) setCity(p.city);
    const url = new URL(window.location.href);
    url.searchParams.set("q", query);
    if (p.category) url.searchParams.set("kategoria", p.category);
    window.history.replaceState(null, "", url);
  }

  return (
    <div className="container-x grid gap-8 py-10 lg:grid-cols-[1fr_380px] lg:py-14">
      <div className="min-w-0">
        <form onSubmit={submit} role="search" className="card flex flex-col gap-2 p-2 sm:flex-row sm:items-center">
          <label htmlFor="kerko" className="sr-only">Çfarë të duhet?</label>
          <div className="flex flex-1 items-center gap-3 px-3">
            <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6" className="shrink-0 text-ink-2"><circle cx="8" cy="8" r="5.5" /><path d="M12.5 12.5L16 16" strokeLinecap="round" /></svg>
            <input id="kerko" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="600 tulla me vrima · Tiranë" className="h-12 w-full bg-transparent text-base placeholder:text-ink-2/70 focus:outline-none" autoComplete="off" />
          </div>
          <button className="btn-primary h-12 shrink-0 px-6" type="submit">Kërko me AI</button>
        </form>

        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Select label="Materiali" value={category} onChange={setCategory} options={[["", "Të gjitha"], ...CATEGORIES.map((c) => [c.id, c.label] as [string, string])]} />
          <Select label="Afër" value={city} onChange={(v) => setCity(v as City)} options={(Object.keys(CITIES) as City[]).map((c) => [c, c])} />
          <Select label="Gjendja" value={condition} onChange={(v) => setCondition(v as Condition | "")} options={[["", "Të gjitha"], ...(Object.entries(CONDITIONS) as [string, string][])]} />
          <Select label="Renditja" value={sort} onChange={(v) => setSort(v as Sort)} options={[["match", "Përputhja"], ["price", "Çmimi"], ["distance", "Distanca"]]} />
        </div>

        {plan && plan.picks.length > 0 && (
          <div className="mt-6 rounded-card border border-lime/40 bg-lime/[0.06] p-5" aria-live="polite">
            <p className="eyebrow">ECONERA AI</p>
            <p className="mt-2 text-lg">
              {plan.picks.length} {plan.picks.length === 1 ? "burim mbulon" : "burime mbulojnë"} {formatQty(plan.covered)} {plan.unit}
              {!plan.complete && <span className="text-ink-2"> nga {formatQty(parsed.quantity!)} të kërkuara</span>}.
              {plan.savingPct > 0 && <> Kursim i vlerësuar: <strong className="text-lime">{plan.savingPct}%</strong> kundrejt çmimit të tregut.</>}
            </p>
            <p className="mt-1 text-sm text-ink-2">Totali pa transport: {formatLek(plan.cost)} · Asnjë porosi pa konfirmimin tënd.</p>
          </div>
        )}

        <div className="mt-6 flex items-center justify-between gap-4">
          <p className="text-sm text-ink-2" aria-live="polite"><span className="text-ink">{offers.length}</span> oferta afër {effectiveCity}</p>
          <span className="demo-badge">Të dhëna demonstruese</span>
        </div>

        <ul className="mt-3 grid gap-2">
          {offers.map((offer) => (
            <li key={offer.id} onMouseEnter={() => setHover(offer.id)} onMouseLeave={() => setHover(null)}
              className={`card flex items-center gap-4 p-4 transition-colors ${hover === offer.id ? "border-lime/60" : ""}`}>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium">{offer.title}</p>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${offer.condition === "riperdorur" ? "bg-accent text-lime" : offer.condition === "teprice" ? "bg-[#f3ead6] text-[#6b5a2e]" : "bg-line text-ink-2"}`}>{CONDITIONS[offer.condition]}</span>
                </div>
                <p className="mt-1 text-sm text-ink-2">{offer.supplier.name} · {offer.supplier.area}, {offer.supplier.city} · {formatQty(offer.distanceKm)} km</p>
              </div>
              <div className="hidden text-right sm:block">
                <p className="text-sm"><span className="font-medium">{formatQty(offer.quantity)}</span> {offer.unit}</p>
                <p className="text-sm text-ink-2">{formatLek(offer.priceLek)}/{offer.unit}{offer.savingPct > 0 && <span className="text-lime"> −{offer.savingPct}%</span>}</p>
              </div>
              <div className="w-14 text-right">
                <p className="font-mono text-xl font-semibold text-lime tabular-nums">{offer.match}%</p>
              </div>
            </li>
          ))}
          {offers.length === 0 && <li className="card p-6 text-ink-2">Asnjë ofertë për këtë filtër. Provo një material tjetër ose hiq filtrin e gjendjes.</li>}
        </ul>
      </div>

      <aside className="lg:sticky lg:top-24 lg:self-start" aria-label="Harta">
        <div className="card p-4">
          <SupplierMap city={effectiveCity} active={active} highlight={hoverSupplier ?? null} />
        </div>
        <p className="mt-3 text-xs leading-relaxed text-ink-2">Përputhja llogaritet nga distanca, kursimi dhe sasia e disponueshme. Në pilot, ofertat vijnë nga furnitorë realë.</p>
      </aside>
    </div>
  );
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: [string, string][] }) {
  return (
    <label className="grid gap-1 text-xs text-ink-2">
      {label}
      <select value={value} onChange={(e) => onChange(e.target.value)} className="h-11 rounded-xl border border-line bg-card px-3 text-sm text-ink focus:border-lime focus:outline-none">
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </label>
  );
}
