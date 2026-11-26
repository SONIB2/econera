import Link from "next/link";
import { Suspense } from "react";
import { ProductCard } from "@/components/market/product-card";
import { SearchBar } from "@/components/market/search-bar";
import { tr, type Lang, type Region } from "@/lib/lang";
import { applyFilters, type MarketItem } from "@/lib/market/live";
import { EUR_TO_LEK } from "@/lib/tools/inventory";
import { IntelligenceRing } from "./intelligence-ring";
import { MaterialSlabs } from "./material-slabs";

/**
 * Homepage below the 3D hero: Intelligence Universe → materials marketplace (samples, search, live listings)
 * → business and trust. Only approved live listings are shown; nothing here is invented.
 */
export function HomeSections({ lang, region, items }: { lang: Lang; region: Region; items: MarketItem[] }) {
  const t = (sq: string, en: string) => tr(lang, sq, en);
  const fresh = applyFilters(items, { sort: "newest" }).slice(0, 8);
  const examples = lang === "en"
    ? ["40 m² of oak flooring under €600 near Tirana", "OSB offcuts 18 mm", "reclaimed bricks", "mineral wool insulation"]
    : ["40 m² parket lisi nën 600 € afër Tiranës", "copa OSB 18 mm", "tulla të rikuperuara", "izolim lesh mineral"];
  const audiences = [t("Kompani ndërtimi", "Construction companies"), t("Furnitorë materialesh", "Material suppliers"), t("Prodhues", "Manufacturers"), t("Arkitektë", "Architects"), t("Kontraktorë", "Contractors")];
  const trust = [
    [t("Listime të shqyrtuara nga njerëz", "Human-reviewed listings"), t("Çdo listim kontrollohet para publikimit.", "Every listing is checked before it goes live."), "/verifikimi"],
    [t("Shitës të verifikuar", "Verified sellers"), t("Identiteti ose NIPT-i, me dokumente.", "Identity or business registration, with documents."), "/verifikimi"],
    [t("Dokumentacion teknik", "Technical documentation"), t("Fletë teknike, CE, DoP kur dorëzohen.", "Datasheets, CE, DoP when submitted."), "/verifikimi"],
    [t("Pasaporta dixhitale", "Digital material passports"), t("Kod publik: çfarë u kontrollua dhe kur.", "A public code: what was checked and when."), "/verifikimi"],
    [t("Mbrojtja e klientit", "Customer protection"), t("Raporto një problem; e shqyrton një person.", "Report a problem; a person reviews it."), "/mbrojtja"],
  ];

  return (
    <div className="theme-dark bg-[#062321] text-ink">
      <IntelligenceRing />

      <section aria-labelledby="tregu" className="relative overflow-hidden border-t border-white/5">
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_50%_60%_at_75%_45%,rgba(200,243,109,0.10),transparent_70%)]" />
        <div className="container-x relative grid items-center gap-6 py-16 md:grid-cols-[0.8fr_1.2fr] md:py-20">
          <div>
            <p className="text-[11px] font-semibold tracking-[0.3em] text-[#c8f169]">{t("TREGU I MATERIALEVE", "MATERIALS MARKETPLACE")}</p>
            <h2 id="tregu" className="display mt-4 text-[clamp(2.2rem,4.4vw,3.6rem)] leading-[1.02] text-white">{t("Gjej. Bli. Ripërdor.", "Find. Buy. Reuse.")}<br />{t("Ndërto më zgjuar.", "Build smarter.")}</h2>
            <p className="mt-4 max-w-sm text-white/75">{t("Materiale të reja, të rikuperuara dhe të tepërta për çdo projekt.", "New, reclaimed and surplus materials for every project.")}</p>
            <Link href="/treg" className="mt-6 inline-flex items-center gap-2 font-semibold text-[#c8f169] underline-offset-4 hover:underline">{t("Eksploro materialet", "Explore materials")} <span aria-hidden>→</span></Link>
          </div>
          <MaterialSlabs lang={lang} />
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

      <section aria-labelledby="biznes" className="border-t border-white/5">
        <div className="container-x grid gap-10 py-16 md:grid-cols-2 md:py-20">
          <div>
            <h2 id="biznes" className="display text-[clamp(1.9rem,3.4vw,2.8rem)] leading-[1.05] text-white">{t("Ndërtuar për një industri ndërtimi më të zgjuar.", "Built for a smarter construction industry.")}</h2>
            <ul className="mt-6 flex flex-wrap gap-2">{audiences.map((a) => <li key={a} className="rounded-full border border-white/12 px-3.5 py-1.5 text-sm text-white/80">{a}</li>)}</ul>
            <Link href="/biznes" className="btn-primary mt-7">{t("Për bizneset", "For Business")} <span aria-hidden>→</span></Link>
          </div>
          <div>
            <p className="text-[11px] font-semibold tracking-[0.3em] text-[#c8f169]">ECONERA VERIFY</p>
            <ul className="mt-4 divide-y divide-white/10 border-y border-white/10">
              {trust.map(([a, b, href]) => (
                <li key={a}><Link href={href} className="group flex items-center gap-4 py-3.5">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#c8f169" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="shrink-0"><path d="M12 3.5 19 6v5.5c0 4.2-2.9 7.4-7 9-4.1-1.6-7-4.8-7-9V6z" /><path d="m9 12 2.2 2.2L15.5 10" /></svg>
                  <span className="min-w-0 flex-1"><span className="block font-semibold text-white">{a}</span><span className="block text-sm text-white/65">{b}</span></span>
                  <span aria-hidden className="text-white/40 transition group-hover:translate-x-0.5 group-hover:text-[#c8f169]">→</span>
                </Link></li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-white/50">{t("“I shqyrtuar” do të thotë kontroll i dokumenteve nga ECONERA; inspektimi fizik ose certifikimi i pavarur shfaqen veçmas, vetëm kur janë kryer.", "“Reviewed” means ECONERA checked the documents; physical inspection or independent certification is shown separately, only when it has taken place.")}</p>
          </div>
        </div>
      </section>
    </div>
  );
}
