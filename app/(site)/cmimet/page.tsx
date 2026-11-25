import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/site/page-hero";
import { Pricing } from "@/components/site/pricing";
import { tr } from "@/lib/lang";
import { getLang } from "@/lib/lang-server";

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getLang();
  return {
    title: tr(lang, "Çmimet", "Pricing"),
    description: tr(lang, "Blerësit kërkojnë falas. Furnitorët nisin falas dhe paguajnë vetëm kur rriten. Abonim i thjeshtë dhe komision vetëm për porositë e kryera.", "Buyers search free. Suppliers start free and pay only as they grow. A simple subscription plus commission on completed orders only."),
  };
}

const FAQ: [string, string, string, string][] = [
  ["Pse blerësit nuk paguajnë?", "Sa më shumë blerës, aq më shumë shitje për furnitorët. Ne fitojmë nga abonimi i furnitorëve, komisioni për porositë e kryera, koordinimi i transportit dhe kontratat Enterprise.",
   "Why don't buyers pay?", "More buyers means more sales for suppliers. We earn from supplier subscriptions, commission on completed orders, transport coordination and Enterprise contracts."],
  ["Kur paguhet komisioni?", "Vetëm kur porosia kryhet dhe konfirmohet nga të dyja palët. Kërkesat për ofertë dhe ofertat e refuzuara nuk kushtojnë asgjë.",
   "When is the commission charged?", "Only when an order is completed and confirmed by both sides. Quote requests and declined offers cost nothing."],
  ["Si llogaritet kursimi për blerësin?", "Stoku i tepërt shitet zakonisht 20–50% nën çmimin e tregut. Te Tregu shfaqet kursimi i vlerësuar për çdo ofertë.",
   "How is the buyer's saving calculated?", "Surplus stock usually sells 20–50% below market price. The Market shows the estimated saving for every offer."],
  ["A mund ta ndryshoj planin?", "Po, në çdo kohë. Plani i ri vlen nga muaji pasardhës, pa kontratë për planet mujore.",
   "Can I change my plan?", "Yes, anytime. The new plan applies from the next month, with no contract on monthly plans."],
];

export default async function CmimetPage() {
  const lang = await getLang();
  const t = (sq: string, en: string) => tr(lang, sq, en);
  return (
    <>
      <PageHero eyebrow={t("Çmimet", "Pricing")} title={<>{t("Blerësit kërkojnë falas.", "Buyers search free.")}<br />{t("Furnitorët paguajnë kur shesin.", "Suppliers pay when they sell.")}</>} lead={t("Abonim i thjeshtë për furnitorët dhe kompanitë e ndërtimit, plus një komision i vogël vetëm për porositë e kryera.", "A simple subscription for suppliers and construction companies, plus a small commission on completed orders only.")}>
        <div className="flex flex-wrap gap-3"><a href="#planet" className="btn-primary">{t("Shiko planet", "See the plans")}</a><Link href="/regjistrohu?lloji=bleres" className="btn-ghost">{t("Jam blerës, hyj falas", "I'm a buyer, join free")}</Link></div>
      </PageHero>
      <Pricing />
      <section className="border-t border-line bg-bg-2">
        <div className="container-x grid gap-10 py-16 md:grid-cols-[1fr_1.6fr]">
          <h2 className="display text-4xl">{t("Pyetje të shpeshta.", "Common questions.")}</h2>
          <dl className="grid gap-6">
            {FAQ.map(([q, a, qe, ae]) => <div key={q} className="border-b border-line pb-6"><dt className="text-lg font-semibold">{t(q, qe)}</dt><dd className="mt-2 text-ink-2">{t(a, ae)}</dd></div>)}
          </dl>
        </div>
      </section>
    </>
  );
}
