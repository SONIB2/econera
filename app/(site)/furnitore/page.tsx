import type { Metadata } from "next";
import Link from "next/link";
import { LeadForm } from "@/components/site/lead-form";
import { PageHero } from "@/components/site/page-hero";
import { tr } from "@/lib/lang";
import { getLang } from "@/lib/lang-server";

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getLang();
  return { title: tr(lang, "Për furnitorët", "For suppliers"), description: tr(lang, "Shit stokun e tepërt te blerës të rinj. Regjistrim falas.", "Sell surplus stock to new buyers. Free to register.") };
}

export default async function FurnitorePage() {
  const lang = await getLang();
  const t = (sq: string, en: string) => tr(lang, sq, en);
  const problems = [
    [t("Stok i padukshëm", "Invisible stock"), t("Materialet e tepërta nuk janë në asnjë katalog.", "Surplus materials are not in any catalogue.")],
    [t("Oferta me telefon", "Quotes by phone"), t("Çmimet negociohen një nga një, pa krahasim.", "Prices are negotiated one by one, without comparison.")],
    [t("Transport i ndarë", "Separate transport"), t("Kostoja e dërgesës del vetëm pas blerjes.", "Delivery costs only appear after the sale.")],
    [t("Pa dokumente", "No documents"), t("Origjina dhe gjendja nuk verifikohen.", "Origin and condition are not checked.")],
  ];
  const steps = [
    ["01", t("Krijo llogari dhe verifikohu", "Create an account and get verified"), t("Identiteti ose NIPT-i shqyrtohet nga stafi i ECONERA.", "ECONERA staff review your identity or business registration.")],
    ["02", t("Listo materialet", "List your materials"), t("Shto foto, sasinë, çmimin dhe dokumentet. Ose importo një skedar CSV ose Excel.", "Add photos, quantity, price and documents, or import a CSV or Excel file.")],
    ["03", t("Merr kërkesa", "Receive requests"), t("Pas miratimit, blerësit afër të gjejnë dhe të dërgojnë kërkesë për ofertë.", "Once approved, nearby buyers find you and send quote requests.")],
  ];
  return (
    <>
      <PageHero eyebrow={t("Për furnitorët", "For suppliers")} title={<>{t("Stoku i tepërt", "Surplus stock")}<br />{t("ka një blerës.", "has a buyer.")}</>} lead={t("Materialet që zënë vend në depo shiten te projekti i radhës. Regjistrimi është falas.", "Materials taking up depot space go to the next project. Registration is free.")}>
        <div className="flex flex-wrap gap-3"><Link href="/shit" className="btn-primary">{t("Shit materiale", "Sell materials")}</Link><a href="#regjistrohu" className="btn-ghost">{t("Na kontaktoni", "Contact us")}</a></div>
      </PageHero>

      <section className="container-x py-16 md:py-20">
        <p className="eyebrow">{t("Problemi", "The problem")}</p>
        <h2 className="display mt-4 max-w-2xl text-4xl md:text-5xl">{t("Materialet ekzistojnë. Askush nuk i gjen.", "The materials exist. Nobody can find them.")}</h2>
        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {problems.map(([title, d]) => (
            <article key={title} className="card p-6"><h3 className="text-lg font-semibold">{title}</h3><p className="mt-2 text-sm text-ink-2">{d}</p></article>
          ))}
        </div>
      </section>

      <section className="border-y border-line bg-bg-2">
        <div className="container-x py-16 md:py-20">
          <p className="eyebrow">{t("Si funksionon", "How it works")}</p>
          <h2 className="display mt-4 text-4xl md:text-5xl">{t("Në 3 hapa.", "In 3 steps.")}</h2>
          <ol className="mt-10 grid gap-6 md:grid-cols-3">
            {steps.map(([n, title, d]) => (
              <li key={n} className="border-t border-lime/50 pt-6"><p className="grid size-8 place-items-center rounded-full bg-accent text-sm font-semibold text-lime">{Number(n)}</p><h3 className="mt-4 text-xl font-semibold">{title}</h3><p className="mt-2 text-ink-2">{d}</p></li>
            ))}
          </ol>
          <p className="mt-10 text-sm text-ink-2">{t("Çdo listim shqyrtohet nga një person i ECONERA para publikimit.", "Every listing is reviewed by a person at ECONERA before it goes live.")}</p>
        </div>
      </section>

      <section id="regjistrohu" className="container-x grid scroll-mt-24 gap-10 py-16 md:py-20 lg:grid-cols-[360px_minmax(0,1fr)]">
        <div>
          <p className="eyebrow">{t("Pilot në Tiranë", "Tirana pilot")}</p>
          <h2 className="display mt-4 text-4xl">{t("Regjistro interesin.", "Register your interest.")}</h2>
          <p className="lead mt-4 text-base">{t("Kërkojmë 20 furnitorë, depo dhe kantiere për 12 muajt e parë. Ju kontaktojmë për të regjistruar stokun bashkë.", "We are looking for 20 suppliers, depots and sites for the first 12 months. We will contact you to list your stock together.")}</p>
        </div>
        <LeadForm source="furnitore" defaultRole="furnitor" defaultInterest="ka" />
      </section>
    </>
  );
}
