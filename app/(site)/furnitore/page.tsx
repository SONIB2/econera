import type { Metadata } from "next";
import Link from "next/link";
import { LeadForm } from "@/components/site/lead-form";
import { PageHero } from "@/components/site/page-hero";

export const metadata: Metadata = { title: "Për furnitorët", description: "Shit stokun e tepërt. Regjistrim falas, me foto dhe AI." };

const problems = [
  ["Stok i padukshëm", "Materialet e tepërta nuk janë në asnjë katalog."],
  ["Oferta me telefon", "Çmimet negociohen një nga një, pa krahasim."],
  ["Transport i ndarë", "Kostoja e dërgesës del vetëm pas blerjes."],
  ["Pa dokumente", "Origjina dhe gjendja nuk verifikohen."],
];
const steps = [
  ["01", "Fotografo depon", "Bëj foto të stokut me telefon. Pa formularë të gjatë."],
  ["02", "AI e kthen në inventar", "AI njeh materialet dhe sasitë. Ti konfirmon çdo rresht."],
  ["03", "Merr kërkesa", "Kontraktorët afër të gjejnë dhe të dërgojnë kërkesë për ofertë."],
];

export default function FurnitorePage() {
  return (
    <>
      <PageHero eyebrow="Për furnitorët" title={<>Stoku i tepërt<br />ka një blerës.</>} lead="Materialet që zënë vend në depo shiten te projekti i radhës. Regjistrimi është falas për pilotin.">
        <div className="flex flex-wrap gap-3"><a href="#regjistrohu" className="btn-primary">Regjistro stokun</a><Link href="/ai" className="btn-ghost">Shiko Skano depon</Link></div>
      </PageHero>

      <section className="container-x py-16 md:py-20">
        <p className="eyebrow">Problemi</p>
        <h2 className="display mt-4 max-w-2xl text-4xl md:text-5xl">Materialet ekzistojnë. Askush nuk i gjen.</h2>
        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {problems.map(([t, d], i) => (
            <article key={t} className="card p-6"><p className="font-mono text-sm text-lime">0{i + 1}</p><h3 className="mt-3 text-lg font-semibold">{t}</h3><p className="mt-2 text-sm text-ink-2">{d}</p></article>
          ))}
        </div>
      </section>

      <section className="border-y border-line bg-bg-2">
        <div className="container-x py-16 md:py-20">
          <p className="eyebrow">Si funksionon</p>
          <h2 className="display mt-4 text-4xl md:text-5xl">Në 3 hapa.</h2>
          <ol className="mt-10 grid gap-6 md:grid-cols-3">
            {steps.map(([n, t, d]) => (
              <li key={n} className="border-t border-lime/50 pt-6"><p className="font-mono text-sm text-lime">{n}</p><h3 className="mt-3 text-xl font-semibold">{t}</h3><p className="mt-2 text-ink-2">{d}</p></li>
            ))}
          </ol>
          <p className="mt-10 text-sm text-ink-2">AI propozon, njeriu konfirmon. Asnjë ofertë nuk publikohet pa miratimin tuaj.</p>
        </div>
      </section>

      <section id="regjistrohu" className="container-x grid scroll-mt-24 gap-10 py-16 md:py-20 lg:grid-cols-[360px_1fr]">
        <div>
          <p className="eyebrow">Pilot në Tiranë</p>
          <h2 className="display mt-4 text-4xl">Regjistro interesin.</h2>
          <p className="lead mt-4 text-base">Kërkojmë 20 furnitorë, depo dhe kantiere për 12 muajt e parë. Ju kontaktojmë për të regjistruar stokun bashkë.</p>
        </div>
        <LeadForm source="furnitore" defaultRole="furnitor" defaultInterest="ka" />
      </section>
    </>
  );
}
