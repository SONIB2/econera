import type { Metadata } from "next";
import Link from "next/link";
import { tr } from "@/lib/lang";
import { getLang } from "@/lib/lang-server";
import { CATEGORY_PHOTO, TOOL_PHOTO, unsplash } from "@/lib/market/photos";

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getLang();
  return { title: tr(lang, "Për bizneset", "For Business"), description: tr(lang, "ECONERA për kompanitë e ndërtimit, kontraktorët, distributorët dhe prodhuesit: shit stokun e tepërt dhe gjej materiale me mjete AI.", "ECONERA for construction companies, contractors, distributors and manufacturers: sell surplus stock and source materials with AI tools.") };
}

export default async function Business() {
  const lang = await getLang();
  const t = (sq: string, en: string) => tr(lang, sq, en);
  const photos = [TOOL_PHOTO.crane, CATEGORY_PHOTO.tools, TOOL_PHOTO.renovation, TOOL_PHOTO.warehouse, "1700973408133-b45276ec8feb", TOOL_PHOTO.smartcut, "1629608564457-5d74829a9e14"];
  const audiences: [string, string, string, string][] = [
    [t("Kompani ndërtimi", "Construction companies"), t("Lista e projektit kthehet në Smart Basket; stoku që mbetet në kantier listohet për shitje.", "Your project list becomes a Smart Basket; stock left on site gets listed for sale."), "/ai/shporta", t("Hap Smart Basket", "Open Smart Basket")],
    [t("Kontraktorë dhe rinovues", "Contractors & renovators"), t("Kërko oferta nga disa shitës njëherësh nga shporta.", "Request quotes from several sellers at once from the cart."), "/treg", t("Hap tregun", "Open the marketplace")],
    [t("Arkitektë", "Architects"), t("AI Renovation për koncepte me materiale që ekzistojnë realisht.", "AI Renovation for concepts built from materials that actually exist."), "/ai/renovim", t("Hap AI Renovation", "Open AI Renovation")],
    [t("Distributorë materialesh", "Material distributors"), t("Import i stokut me CSV/Excel dhe profil biznesi i verifikuar.", "Stock import via CSV/Excel and a verified business profile."), "/shit", t("Importo stokun", "Import stock")],
    [t("Prodhues", "Manufacturers"), t("Lote të mbetura, me prodhuesin, modelin dhe dokumentet teknike.", "Leftover batches, with manufacturer, model and technical documents."), "/verifikimi", t("Verifiko biznesin", "Verify your business")],
    [t("Zdrukthëtarë dhe punishte mobiliesh", "Carpenters & furniture workshops"), t("Copat me përmasa të sakta dalin te SmartCut për blerësit.", "Offcuts with exact dimensions appear in SmartCut for buyers."), "/ai/smartcut", t("Hap SmartCut", "Open SmartCut")],
    [t("Kompani shembjesh", "Demolition companies"), t("Materialet e rikuperuara (dyer, tulla, tjegulla) gjejnë blerës para se të shkojnë në landfill.", "Reclaimed materials (doors, bricks, roof tiles) find buyers before landfill."), "/shit", t("Listo materiale", "List materials")],
  ];
  return (
    <div className="pb-20">
      <section className="relative isolate -mt-24 overflow-hidden pt-24 text-white">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={unsplash(TOOL_PHOTO.business, 2000, 1100)} alt="" className="absolute inset-0 -z-10 size-full object-cover" fetchPriority="high" />
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(100deg,rgba(4,33,29,0.94)_0%,rgba(4,33,29,0.78)_45%,rgba(4,33,29,0.25)_100%)]" />
        <div className="container-x pt-14 pb-20 md:pt-24 md:pb-28">
          <nav aria-label="Breadcrumb" className="text-sm text-white/65"><Link href="/" className="hover:text-white">{t("Kreu", "Home")}</Link> / {t("Për bizneset", "For Business")}</nav>
          <p className="mt-8 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium backdrop-blur"><span className="size-1.5 rounded-full bg-[#c8f169]" />{t("ECONERA për bizneset e ndërtimit", "ECONERA for construction businesses")}</p>
          <h1 className="display mt-5 max-w-3xl text-[clamp(2.6rem,6vw,5rem)] leading-[0.98]">{t("Stoku që nuk lëviz është kapital i bllokuar.", "Idle stock is capital standing still.")}</h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/80">{t("Shit materialet e tepërta, gjej ato që të duhen dhe planifiko projektet me mjete AI, në një platformë me shqyrtim njerëzor për çdo listim.", "Sell surplus materials, source what you need and plan projects with AI tools, on one platform where every listing is reviewed by a person.")}</p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link href="/regjistrohu?lloji=furnitor" className="inline-flex h-12 items-center rounded-full bg-[#c8f169] px-6 font-semibold text-[#0c2f2b] hover:bg-[#d6f68a]">{t("Krijo llogari biznesi", "Create a business account")}</Link>
            <Link href="/cmimet" className="inline-flex h-12 items-center rounded-full border border-white/30 px-6 font-medium hover:bg-white/10">{t("Shiko planet", "See plans")}</Link>
            <Link href="/kontakt" className="inline-flex h-12 items-center rounded-full px-4 font-medium text-white/85 underline-offset-4 hover:underline">{t("Fol me ekipin", "Talk to our team")} <span aria-hidden className="ml-1">→</span></Link>
          </div>
          <dl className="mt-14 grid max-w-3xl gap-6 border-t border-white/15 pt-6 sm:grid-cols-3">
            {[[t("Shqyrtim njerëzor", "Human review"), t("Çdo listim kontrollohet para publikimit", "Every listing is checked before it goes live")], [t("Import i stokut", "Stock import"), t("CSV ose Excel, qindra artikuj njëherësh", "CSV or Excel, hundreds of items at once")], [t("Mjete AI", "AI tools"), t("Smart Basket, SmartCut, AI Renovation", "Smart Basket, SmartCut, AI Renovation")]].map(([a, b]) => <div key={a}><dt className="font-semibold">{a}</dt><dd className="mt-1 text-sm text-white/70">{b}</dd></div>)}
          </dl>
        </div>
      </section>
      <section aria-labelledby="per-kend" className="container-x mt-20">
        <div className="flex flex-wrap items-end justify-between gap-4"><h2 id="per-kend" className="max-w-xl text-3xl md:text-5xl">{t("E ndërtuar për gjithë zinxhirin e ndërtimit", "Built for the whole construction chain")}</h2><p className="max-w-sm text-ink-2">{t("Nga kantieri te punishtja: çdo rol ka një mënyrë për të shitur, blerë ose planifikuar më mirë.", "From the site to the workshop: every role has a better way to sell, buy or plan.")}</p></div>
        <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{audiences.map(([a, b, href, cta], i) => (
          <li key={a} className="group flex flex-col overflow-hidden rounded-card border border-line bg-card transition hover:border-lime/50">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <div className="aspect-[16/9] overflow-hidden bg-bg-2"><img src={unsplash(photos[i], 640, 360)} alt="" loading="lazy" className="size-full object-cover transition duration-700 group-hover:scale-105" /></div>
            <div className="flex flex-1 flex-col p-6"><p className="text-xl font-semibold tracking-tight">{a}</p><p className="mt-2 flex-1 text-[15px] leading-relaxed text-ink-2">{b}</p><Link href={href} className="mt-5 text-sm font-semibold text-lime-dim underline-offset-4 hover:underline">{cta} <span aria-hidden>→</span></Link></div>
          </li>
        ))}</ul>
      </section>
      <section aria-labelledby="paneli" className="container-x mt-16">
        <div className="theme-dark grid gap-8 rounded-[2rem] bg-bg p-8 text-ink md:grid-cols-2 md:p-12">
          <div><h2 id="paneli" className="text-3xl md:text-4xl">{t("Paneli i biznesit", "Business dashboard")}</h2><p className="mt-3 text-ink-2">{t("Inventari, kërkesat për ofertë, statusi i verifikimit dhe projektet, në një vend.", "Inventory, quote requests, verification status and projects in one place.")}</p><div className="mt-6 flex flex-wrap gap-2"><Link href="/inventari" className="btn-primary">{t("Hap inventarin", "Open inventory")}</Link><Link href="/inventari/ofertat" className="btn-ghost">{t("Kërkesat për ofertë", "Quote requests")}</Link></div></div>
          <ul className="grid content-center gap-3 text-sm">{[t("Import i stokut me CSV ose Excel", "Stock import via CSV or Excel"), t("Profil biznesi i verifikuar me NIPT/NUI", "Business profile verified by registration number"), t("Pasaporta e produktit për çdo listim të miratuar", "Product passport for each approved listing"), t("Njoftime për çdo vendim dhe ofertë", "Notifications for every decision and quote")].map((x) => <li key={x} className="flex gap-3 rounded-xl border border-line px-4 py-3"><span className="text-lime" aria-hidden>✓</span>{x}</li>)}</ul>
        </div>
      </section>
      <section className="container-x mt-16"><p className="text-sm text-ink-2">{t("Pagesat online, faturimi dhe logjistika e integruar nuk janë aktive ende; marrëveshja bëhet drejtpërdrejt me shitësin pas ofertës.", "Online payments, invoicing and integrated logistics are not active yet; the deal is agreed directly with the seller after the quote.")}</p></section>
    </div>
  );
}
