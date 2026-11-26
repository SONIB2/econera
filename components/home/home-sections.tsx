import Link from "next/link";
import { Suspense } from "react";
import { ProductCard } from "@/components/market/product-card";
import { SearchBar } from "@/components/market/search-bar";
import { tr, type Lang, type Region } from "@/lib/lang";
import { applyFilters, type MarketItem } from "@/lib/market/live";
import { EUR_TO_LEK } from "@/lib/tools/inventory";
import { IntelligenceRing } from "./intelligence-ring";
import { MaterialSlabs } from "./material-slabs";
import { TrustCompliance } from "./trust-compliance";

/**
 * Homepage below the 3D hero: Intelligence Universe → materials marketplace (samples, search, live listings)
 * → Trust & Compliance and business. Only approved live listings are shown; nothing here is invented.
 */
export function HomeSections({ lang, region, items }: { lang: Lang; region: Region; items: MarketItem[] }) {
  const t = (sq: string, en: string) => tr(lang, sq, en);
  const fresh = applyFilters(items, { sort: "newest" }).slice(0, 8);
  const examples = lang === "en"
    ? ["40 m² of oak flooring under €600 near Tirana", "OSB offcuts 18 mm", "reclaimed bricks", "mineral wool insulation"]
    : ["40 m² parket lisi nën 600 € afër Tiranës", "copa OSB 18 mm", "tulla të rikuperuara", "izolim lesh mineral"];

  return (
    <>
    <div className="theme-dark bg-[#062321] text-ink">
      <IntelligenceRing />

      <section aria-labelledby="tregu" className="relative overflow-hidden border-t border-white/5">
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_55%_45%_at_50%_62%,rgba(200,243,109,0.10),transparent_70%)]" />
        <div className="container-x relative pt-16 text-center md:pt-24">
          <p className="flex items-center justify-center gap-4 text-[12px] font-semibold tracking-[0.3em] text-[#c8f169]"><span aria-hidden className="h-px w-14 bg-[#c8f169]/50" />{t("TREGU I MATERIALEVE", "MATERIALS MARKETPLACE")}<span aria-hidden className="h-px w-14 bg-[#c8f169]/50" /></p>
          <h2 id="tregu" className="display mx-auto mt-5 max-w-4xl text-balance text-[clamp(2.2rem,5vw,4.2rem)] leading-[1.02] text-white">{t("Gjej. Bli. Ripërdor. Ndërto më zgjuar.", "Find. Buy. Reuse. Build smarter.")}</h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-white/75">{t("Materiale të reja, të rikuperuara dhe të tepërta për çdo projekt.", "New, reclaimed and surplus materials for every project.")}</p>
          <Link href="/treg" className="mt-8 inline-flex h-12 items-center gap-2 rounded-full bg-[#c8f169] px-7 font-semibold text-[#062321] transition hover:bg-[#d6f68a] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#c8f169]">{t("Eksploro materialet", "Explore materials")} <span aria-hidden>→</span></Link>
          <MaterialSlabs lang={lang} wide />
        </div>

        <div className="container-x relative pb-20">
          <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.03] p-5 backdrop-blur md:p-8">
            <h3 className="text-2xl text-white md:text-3xl">{t("Çfarë po ndërton?", "What are you building?")}</h3>
            <div className="mt-5"><Suspense><SearchBar big withCategory hint={t("Kërko materiale, furnitorë ose përshkruaj projektin…", "Search materials, suppliers or describe your project…")} /></Suspense></div>
            <ul className="mt-4 flex flex-wrap gap-2">{examples.map((e) => <li key={e}><Link href={`/treg?q=${encodeURIComponent(e)}`} className="rounded-full border border-white/10 px-3.5 py-1.5 text-sm text-white/70 hover:border-[#c8f169] hover:text-white">{e}</Link></li>)}</ul>

            {fresh.length ? (
              <>
                <div className="mt-10 flex items-end justify-between gap-3"><p className="text-lg font-semibold text-white">{t("Të rejat në treg", "New on the marketplace")}</p><Link href="/treg?rendit=newest" className="text-sm font-medium text-[#c8f169] underline-offset-4 hover:underline">{t("Shiko të gjitha", "View all")}</Link></div>
                <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{fresh.map((i) => <ProductCard key={i.id} item={i} lang={lang} region={region} rate={EUR_TO_LEK} />)}</div>
              </>
            ) : (
              <div className="mt-8 grid gap-4 rounded-2xl border border-dashed border-[#c8f169]/30 p-6 md:grid-cols-[1fr_auto] md:items-center">
                <div>
                  <p className="text-xs font-semibold tracking-[0.2em] text-[#c8f169]">{t("QASJE E HERSHME", "EARLY ACCESS")}</p>
                  <p className="mt-2 text-lg font-semibold text-white">{t("Bëhu ndër furnitorët e parë në ECONERA.", "Be among the first suppliers on ECONERA.")}</p>
                  <p className="mt-1 text-sm text-white/70">{t("Listimet publikohen vetëm pasi i shqyrton një person nga ECONERA.", "Listings go live only after a person at ECONERA reviews them.")}</p>
                </div>
                <Link href="/shit" className="btn-primary">{t("Publiko materialet", "Publish your materials")}</Link>
              </div>
            )}
          </div>
        </div>
      </section>

    </div>
    <TrustCompliance lang={lang} />
    </>
  );
}
