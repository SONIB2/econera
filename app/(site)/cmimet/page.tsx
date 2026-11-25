import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/site/page-hero";
import { Pricing } from "@/components/site/pricing";

export const metadata: Metadata = { title: "Çmimet", description: "Blerësit kërkojnë falas. Furnitorët nisin falas dhe paguajnë vetëm kur rriten. Abonim i thjeshtë dhe komision vetëm për porositë e kryera." };

const faq: [string, string][] = [
  ["Pse blerësit nuk paguajnë?", "Sa më shumë blerës, aq më shumë shitje për furnitorët. Ne fitojmë nga abonimi i furnitorëve, komisioni për porositë e kryera, koordinimi i transportit dhe kontratat Enterprise."],
  ["Kur paguhet komisioni?", "Vetëm kur porosia kryhet dhe konfirmohet nga të dyja palët. Kërkesat për ofertë dhe ofertat e refuzuara nuk kushtojnë asgjë."],
  ["Si llogaritet kursimi për blerësin?", "Stoku i tepërt shitet zakonisht 20–50% nën çmimin e tregut. Te Tregu shfaqet kursimi i vlerësuar për çdo ofertë."],
  ["A mund ta ndryshoj planin?", "Po, në çdo kohë. Plani i ri vlen nga muaji pasardhës, pa kontratë për planet mujore."],
];

export default function CmimetPage() {
  return (
    <>
      <PageHero eyebrow="Çmimet" title={<>Blerësit kërkojnë falas.<br />Furnitorët paguajnë kur shesin.</>} lead="Abonim i thjeshtë për furnitorët dhe kompanitë e ndërtimit, plus një komision i vogël vetëm për porositë e kryera.">
        <div className="flex flex-wrap gap-3"><a href="#planet" className="btn-primary">Shiko planet</a><Link href="/regjistrohu?lloji=bleres" className="btn-ghost">Jam blerës, hyj falas</Link></div>
      </PageHero>
      <Pricing />
      <section className="border-t border-line bg-bg-2">
        <div className="container-x grid gap-10 py-16 md:grid-cols-[1fr_1.6fr]">
          <h2 className="display text-4xl">Pyetje të shpeshta.</h2>
          <dl className="grid gap-6">
            {faq.map(([q, a]) => <div key={q} className="border-b border-line pb-6"><dt className="text-lg font-semibold">{q}</dt><dd className="mt-2 text-ink-2">{a}</dd></div>)}
          </dl>
        </div>
      </section>
    </>
  );
}
