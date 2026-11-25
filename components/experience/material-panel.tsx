"use client";

import Link from "next/link";
import { useMemo } from "react";
import { formatLek, formatQty, stockFor } from "@/lib/demo";
import { hotspotLabel, hotspotSummary, type Hotspot } from "@/lib/interior";
import { useLang } from "@/components/lang-provider";

export function MaterialPanel({ hotspot, xray, onXray, onClose }: { hotspot: Hotspot; xray: boolean; onXray: (on: boolean) => void; onClose: () => void }) {
  const { lang, t } = useLang();
  const offers = useMemo(() => stockFor(hotspot.categories, undefined, 3), [hotspot]);
  const query = new URLSearchParams({ kategoria: hotspot.categories[0] }).toString();

  return (
    <aside
      aria-labelledby="panel-titulli"
      className="xp-panel absolute inset-x-0 bottom-0 z-30 max-h-[72dvh] overflow-y-auto rounded-t-[1.5rem] border border-line bg-bg/92 p-6 backdrop-blur-xl md:inset-y-4 md:right-4 md:left-auto md:max-h-none md:w-[400px] md:rounded-card"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="eyebrow">{t("Materiali", "Material")}</p>
          <h2 id="panel-titulli" className="display mt-2 text-3xl">{hotspotLabel(hotspot, lang)}</h2>
          <p className="mt-1 text-sm text-ink-2">{hotspotSummary(hotspot, lang)}</p>
        </div>
        <button type="button" onClick={onClose} className="btn-ghost size-10 shrink-0 px-0" aria-label={t("Mbyll panelin", "Close panel")}>
          <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M3 3l10 10M13 3L3 13" /></svg>
        </button>
      </div>

      <ul className="mt-5 flex flex-wrap gap-2" aria-label={t("Llojet e materialit", "Material types")}>
        {hotspot.types.map((type) => <li key={type} className="rounded-full border border-line bg-card px-3 py-1 text-xs text-ink">{type}</li>)}
      </ul>

      <section className="mt-7" aria-labelledby="stoku-afer">
        <div className="flex items-center justify-between gap-3">
          <h3 id="stoku-afer" className="text-sm font-semibold">{t("Stok afër teje", "Stock near you")}</h3>
          <span className="demo-badge">{t("Të dhëna demonstruese", "Demo data")}</span>
        </div>
        <ul className="mt-3 grid gap-2">
          {offers.map((offer) => (
            <li key={offer.id} className="card flex items-center gap-4 p-3.5">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{offer.title}</p>
                <p className="mt-0.5 truncate text-xs text-ink-2">{offer.supplier.name} · {formatQty(offer.distanceKm)} km</p>
                <p className="mt-1.5 text-xs text-ink-2"><span className="text-ink">{formatQty(offer.quantity)} {offer.unit}</span> · {formatLek(offer.priceLek)}/{offer.unit}{offer.savingPct > 0 && <span className="text-lime"> · −{offer.savingPct}%</span>}</p>
              </div>
              <div className="text-right" aria-label={`${t("Përputhje", "Match")} ${offer.match}%`}>
                <span className="font-mono text-lg font-semibold text-lime tabular-nums">{offer.match}%</span>
                <span className="block text-[10px] tracking-wide text-ink-2 uppercase">{t("përputhje", "match")}</span>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <Link href={`/treg?${query}`} className="btn-primary mt-5 w-full">
        <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M8 1.5v3M8 11.5v3M1.5 8h3M11.5 8h3M3.4 3.4l2.1 2.1M10.5 10.5l2.1 2.1M3.4 12.6l2.1-2.1M10.5 5.5l2.1-2.1" /></svg>
        {t("Kërko me AI", "Search with AI")}
      </Link>

      <section className="mt-8 border-t border-line pt-6" aria-labelledby="pasaporta">
        <div className="flex items-center justify-between gap-3">
          <h3 id="pasaporta" className="text-sm font-semibold">{t("Pasaporta Digjitale e Materialit", "Digital Material Passport")}</h3>
          <button type="button" aria-pressed={xray} onClick={() => onXray(!xray)} className={`rounded-full border px-3 py-1 text-xs font-medium transition ${xray ? "border-lime bg-lime text-bg" : "border-line text-ink-2 hover:border-lime hover:text-lime"}`}>X-Ray</button>
        </div>
        {hotspot.layers && (
          <ol className="mt-4 grid gap-1.5 text-sm">
            {hotspot.layers.map((layer, i) => (
              <li key={layer.name} className="flex items-center gap-3">
                <span className="font-mono text-xs text-lime">{i + 1}</span>
                <span className="size-3 shrink-0 rounded-sm border border-line" style={{ background: layer.color }} aria-hidden="true" />
                <span className="flex-1">{layer.name}</span>
                <span className="text-xs text-ink-2 tabular-nums">{layer.thicknessCm} cm</span>
              </li>
            ))}
          </ol>
        )}
        <dl className="mt-5 grid gap-3 text-sm">
          <div><dt className="text-xs text-ink-2">{t("Origjina", "Origin")}</dt><dd>{hotspot.passport.origin}</dd></div>
          <div><dt className="text-xs text-ink-2">{t("CO₂ e trupëzuar", "Embodied CO₂")}</dt><dd>{hotspot.passport.co2}</dd></div>
          <div><dt className="text-xs text-ink-2">{t("Certifikata", "Certificates")}</dt><dd>{hotspot.passport.certificates.join(" · ")}</dd></div>
          <div><dt className="text-xs text-ink-2">{t("Ripërdorimi", "Reuse")}</dt><dd>{hotspot.passport.reuse}</dd></div>
        </dl>
        <p className="mt-4 text-[11px] leading-relaxed text-ink-2">{t("Shembull pasaporte me të dhëna demonstruese. Në pilot, të dhënat vijnë nga furnitori dhe verifikohen.", "Sample passport with demo data. In the pilot, data comes from the supplier and is verified.")}</p>
      </section>
    </aside>
  );
}
