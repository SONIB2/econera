import type { Metadata } from "next";
import Link from "next/link";
import { tr } from "@/lib/lang";
import { getLang } from "@/lib/lang-server";

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getLang();
  return { title: tr(lang, "Për bizneset", "For Business"), description: tr(lang, "ECONERA për kompanitë e ndërtimit, kontraktorët, distributorët dhe prodhuesit: shit stokun e tepërt dhe gjej materiale me mjete AI.", "ECONERA for construction companies, contractors, distributors and manufacturers: sell surplus stock and source materials with AI tools.") };
}

export default async function Business() {
  const lang = await getLang();
  const t = (sq: string, en: string) => tr(lang, sq, en);
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
      <section className="container-x pt-12 pb-14 md:pt-16">
        <nav aria-label="Breadcrumb" className="text-sm text-ink-2"><Link href="/" className="hover:text-ink">{t("Kreu", "Home")}</Link> / {t("Për bizneset", "For Business")}</nav>
        <h1 className="display mt-4 max-w-4xl text-4xl md:text-6xl">{t("Stoku që nuk lëviz është para të bllokuara.", "Idle stock is money standing still.")}</h1>
        <p className="mt-5 max-w-2xl text-lg text-ink-2">{t("ECONERA u jep bizneseve të ndërtimit një vend për të shitur materialet e tepërta dhe për të gjetur ato që u duhen, me shqyrtim njerëzor dhe mjete AI.", "ECONERA gives construction businesses one place to sell surplus materials and source what they need, with human review and AI tools.")}</p>
        <div className="mt-8 flex flex-wrap gap-2"><Link href="/regjistrohu?lloji=furnitor" className="btn-primary h-12 px-6">{t("Krijo llogari biznesi", "Create a business account")}</Link><Link href="/cmimet" className="btn-ghost h-12 px-6">{t("Shiko planet", "See plans")}</Link><Link href="/kontakt" className="btn-ghost h-12 px-6">{t("Fol me ne", "Talk to us")}</Link></div>
      </section>
      <section aria-labelledby="per-kend" className="container-x">
        <h2 id="per-kend" className="text-3xl md:text-4xl">{t("Për kë është", "Who it's for")}</h2>
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{audiences.map(([a, b, href, cta]) => <li key={a} className="card flex flex-col p-6"><p className="text-lg font-semibold">{a}</p><p className="mt-2 flex-1 text-sm text-ink-2">{b}</p><Link href={href} className="mt-4 text-sm font-medium text-lime underline-offset-4 hover:underline">{cta}</Link></li>)}</ul>
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
