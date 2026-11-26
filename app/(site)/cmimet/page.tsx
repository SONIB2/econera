import type { Metadata } from "next";
import Link from "next/link";
import { Faq, Pricing } from "@/components/site/pricing";
import { tr } from "@/lib/lang";
import { getLang } from "@/lib/lang-server";
import { unsplash } from "@/lib/market/photos";

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getLang();
  return {
    title: tr(lang, "Planet dhe çmimet", "Plans & Pricing"),
    description: tr(lang, "Falas për blerësit. Plane fleksibël për bizneset: abonim për furnitorët dhe komision vetëm për porositë e kryera.", "Free for buyers. Flexible plans for businesses: supplier subscriptions with commission on completed orders only."),
  };
}

const PHOTO = "1759671953272-a4719ca32266";

/** Answers follow lib/pricing and the existing commercial terms; nothing here promises savings. */
const FAQ: [string, string, string, string][] = [
  ["Pse blerësit nuk paguajnë?", "Sa më shumë blerës, aq më shumë shitje për furnitorët. ECONERA fiton nga abonimet e furnitorëve, komisioni për porositë e kryera, koordinimi i transportit dhe kontratat Enterprise.",
    "Why don't buyers pay?", "More buyers means more sales for suppliers. ECONERA earns from supplier subscriptions, commission on completed orders, transport coordination and Enterprise contracts."],
  ["Kur paguhet komisioni?", "Vetëm kur porosia kryhet dhe konfirmohet nga të dyja palët. Kërkesat për ofertë dhe ofertat e refuzuara nuk kushtojnë asgjë.",
    "When is the commission charged?", "Only when an order is completed and confirmed by both sides. Quote requests and declined offers cost nothing."],
  ["Si llogaritet kursimi për blerësin?", "Kur shitësi jep një çmim reference, Tregu tregon diferencën e vlerësuar për atë ofertë. Është vlerësim, jo kursim i garantuar.",
    "How is the buyer's saving calculated?", "When the seller gives a reference price, the Market shows the estimated difference for that offer. It is an estimate, not a guaranteed saving."],
  ["A mund ta ndryshoj planin?", "Po, në çdo kohë. Plani i ri vlen nga muaji pasardhës.",
    "Can I change my plan?", "Yes, at any time. The new plan applies from the following month."],
  ["A ka plan falas për furnitorët?", "Po. ECONERA Falas përfshin deri në 10 artikuj aktivë, 5 skanime me AI në muaj, kërkesa për ofertë dhe 1 përdorues, me komision 4% vetëm për porositë e kryera.",
    "Is there a free plan for suppliers?", "Yes. ECONERA Free includes up to 10 active listings, 5 AI scans a month, quote requests and 1 user, with a 4% commission on completed orders only."],
  ["Çfarë përfshin abonimi im?", "Veçoritë e listuara në kartën e planit. Çdo plan përfshin gjithçka nga plani paraardhës, plus veçoritë e tij.",
    "What is included in my subscription?", "The features listed on the plan's card. Each plan includes everything in the plan before it, plus its own features."],
  ["A përfshijnë çmimet TVSH-në?", "Jo. Të gjitha çmimet janë në lekë dhe pa TVSH.",
    "Are prices inclusive of VAT?", "No. All prices are in ALL and exclude VAT."],
  ["Si funksionon pagesa vjetore?", "Paguani 12 muaj në një faturë, me çmim mujor rreth 20% më të ulët. P.sh. Start kushton 2,000 lekë në muaj dhe faturohet 24,000 lekë në vit.",
    "How does annual billing work?", "You pay for 12 months in one invoice at a monthly rate about 20% lower. For example, Start costs 2,000 ALL a month, billed 24,000 ALL a year."],
  ["A mund ta anuloj abonimin?", "Planet mujore nuk kanë kontratë dhe anulohen në çdo kohë. Për planet vjetore, na kontaktoni para rinovimit.",
    "Can I cancel my subscription?", "Monthly plans have no contract and can be cancelled at any time. For yearly plans, contact us before renewal."],
];

export default async function CmimetPage() {
  const lang = await getLang();
  const t = (sq: string, en: string) => tr(lang, sq, en);
  const ink = "text-[#0c2f2b] dark:text-ink";
  return (
    <>
      <section className="relative -mt-[76px] overflow-hidden bg-[#f5f7f4] pt-[76px] dark:bg-bg">
        <div className="absolute inset-y-0 right-0 w-full md:w-[50%]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={unsplash(PHOTO, 1200, 800)} alt="" fetchPriority="high" className="size-full object-cover object-[50%_30%] opacity-25 md:opacity-100" />
          <div aria-hidden className="absolute inset-0 hidden bg-[linear-gradient(90deg,#f5f7f4_0%,rgba(245,247,244,0.55)_25%,transparent_60%)] md:block dark:bg-[linear-gradient(90deg,var(--color-bg)_0%,transparent_60%)]" />
        </div>
        <div className="container-x relative flex min-h-[300px] flex-col justify-center py-10 text-center md:min-h-[330px] md:text-left">
          <h1 className={`display text-[clamp(2.1rem,4.2vw,3.3rem)] leading-[1.05] ${ink}`}>
            {t("Falas për blerësit.", "Free for buyers.")}<br />
            {t("Plane fleksibël për ", "Flexible plans for ")}<span className="bg-[linear-gradient(transparent_82%,#c8f169_82%,#c8f169_94%,transparent_94%)]">{t("bizneset.", "businesses.")}</span>
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-ink-2 md:mx-0">{t("Abonime fleksibël për furnitorët dhe kompanitë e ndërtimit, me komision vetëm për porositë e kryera.", "Flexible subscriptions for suppliers and construction companies, with commissions charged only on completed orders.")}</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3 md:justify-start">
            <a href="#planet" className="btn-primary">{t("Shiko planet", "See the plans")} <span aria-hidden>→</span></a>
            <Link href="/regjistrohu?lloji=bleres" className="btn-ghost bg-card/70">{t("Jam blerës, hyj falas", "I'm a buyer, join free")}</Link>
          </div>
        </div>
      </section>

      <Pricing />

      <section aria-labelledby="pyetje" className="border-t border-line pt-12 pb-16">
        <div className="container-x">
          <h2 id="pyetje" className={`display text-center text-[clamp(1.8rem,3vw,2.4rem)] ${ink}`}>{t("Pyetje të shpeshta", "Frequently asked questions")}</h2>
          <p className="mt-2 text-center text-ink-2">{t("Përgjigje të shpejta për planet, pagesat dhe komisionet.", "Find quick answers about plans, payments and commissions.")}</p>
          <Faq items={FAQ.map(([q, a, qe, ae]) => [t(q, qe), t(a, ae)])} />
        </div>
      </section>
    </>
  );
}
