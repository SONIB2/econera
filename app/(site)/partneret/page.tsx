import type { Metadata } from "next";
import { PartnerForm } from "@/components/site/partner-form";
import { BuildingIcon, CompassIcon, FactoryIcon, GrowthIcon, HandshakeIcon, LeafIcon, SparkleIcon, VerifyIcon } from "@/components/site/tool-icons";
import { tr } from "@/lib/lang";
import { getLang } from "@/lib/lang-server";
import { unsplash } from "@/lib/market/photos";
import { PARTNER_CATEGORY, publishedPartners } from "@/lib/partners";

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getLang();
  return {
    title: tr(lang, "Partnerët", "Our Partners"),
    description: tr(lang, "Bashkohu me rrjetin e partnerëve të ECONERA për ndërtim qarkullues në Shqipëri.", "Join the ECONERA partner network for circular construction in Albania."),
  };
}

const PHOTO = "1793145781481-4ec728b40a5e";

export default async function PartneretPage() {
  const [lang, PARTNERS] = await Promise.all([getLang(), publishedPartners()]);
  const t = (sq: string, en: string) => tr(lang, sq, en);
  const ink = "text-[#0c2f2b] dark:text-ink";
  const types = [
    { Icon: FactoryIcon, title: t("Furnitorë dhe prodhues", "Suppliers & manufacturers"), text: t("Katalog dhe stok i tepërt në treg.", "Catalogue and surplus stock on the marketplace.") },
    { Icon: BuildingIcon, title: t("Kompani ndërtimi", "Construction companies"), text: t("Materiale nga kantieret, të ripërdorura.", "Site materials, put back to use.") },
    { Icon: CompassIcon, title: t("Arkitektë dhe dizajnerë", "Architects & designers"), text: t("Projekte me materiale që ekzistojnë.", "Projects built from materials that exist.") },
    { Icon: HandshakeIcon, title: t("Institucione dhe logjistikë", "Institutions & logistics"), text: t("Programe, transport dhe pika grumbullimi.", "Programmes, transport and collection points.") },
  ];
  const why = [
    { Icon: GrowthIcon, title: t("Më shumë klientë", "Reach new clients"), text: t("Materialet tuaja përpara blerësve dhe projekteve aktive.", "Your materials in front of active buyers and projects.") },
    { Icon: LeafIcon, title: t("Qëndrueshmëri e dukshme", "Visible sustainability"), text: t("Materialet e ripërdorura dhe me ndikim të ulët theksohen.", "Reused and low-impact materials are highlighted.") },
    { Icon: SparkleIcon, title: t("Mjetet AI", "AI tools"), text: t("Produktet shfaqen te Smart Basket, SmartCut dhe AI Renovation.", "Products appear in Smart Basket, SmartCut and AI Renovation.") },
    { Icon: VerifyIcon, title: t("Besim", "Trust"), text: t("Partnerët dhe listimet shqyrtohen nga njerëz.", "Partners and listings are reviewed by people.") },
  ];
  const steps = [
    [t("Apliko", "Apply"), t("Plotëso formularin më poshtë me organizatën dhe idenë e bashkëpunimit.", "Fill in the form below with your organisation and partnership idea.")],
    [t("Shqyrtimi", "Review"), t("Një person nga ECONERA ju kontakton për të përcaktuar fushën dhe kushtet.", "A person at ECONERA contacts you to agree the scope and terms.")],
    [t("Në rrjet", "Go live"), t("Pas marrëveshjes, profili dhe logo juaj shfaqen këtu me lejen tuaj.", "Once agreed, your profile and logo appear here with your permission.")],
  ];

  return (
    <>
      <section className="relative -mt-[76px] overflow-hidden bg-[#f5f7f4] pt-[76px] dark:bg-bg">
        <div className="absolute inset-y-0 right-0 hidden w-[52%] md:block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={unsplash(PHOTO, 1200, 900)} alt="" fetchPriority="high" className="size-full object-cover" />
          <div aria-hidden className="absolute inset-0 bg-[linear-gradient(90deg,#f5f7f4_0%,rgba(245,247,244,0.6)_22%,transparent_55%)] dark:bg-[linear-gradient(90deg,var(--color-bg)_0%,transparent_55%)]" />
        </div>
        <div className="container-x relative py-14 md:py-20">
          <div className="max-w-xl">
            <h1 className={`display text-[clamp(2.3rem,4.6vw,3.6rem)] leading-[1.03] ${ink}`}>{t("Një rrjet në rritje për ndërtimin qarkullues.", "A growing network for circular construction.")}</h1>
            <p className="mt-4 max-w-lg text-ink-2">{t("Bashkëpunojmë me furnitorë, prodhues, kompani ndërtimi dhe institucione për ta mbajtur materialin në përdorim më gjatë.", "We work with suppliers, manufacturers, construction companies and institutions to keep materials in use for longer.")}</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <a href="#apliko" className="btn-primary">{t("Bëhu partner", "Become a Partner")} <span aria-hidden>→</span></a>
              <a href="#si" className="btn-ghost">{t("Si funksionon", "How it works")}</a>
            </div>
          </div>
        </div>
      </section>

      <section aria-label={t("Me kë bashkëpunojmë", "Who we work with")} className="border-y border-line bg-card">
        <ul className="container-x grid gap-px py-6 sm:grid-cols-2 lg:grid-cols-4 lg:divide-x lg:divide-line">
          {types.map(({ Icon, title, text }) => (
            <li key={title} className="flex items-start gap-3 py-2 lg:px-6 lg:first:pl-0">
              <Icon className="mt-0.5 size-6 shrink-0 text-lime-dim dark:text-lime" />
              <span><span className={`block font-semibold ${ink}`}>{title}</span><span className="block text-sm text-ink-2">{text}</span></span>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="rrjeti" className="container-x py-14 md:py-16">
        <h2 id="rrjeti" className={`display text-3xl md:text-4xl ${ink}`}>{t("Rrjeti ynë i partnerëve", "Our partner network")}</h2>
        {PARTNERS.length ? (
          <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {PARTNERS.map((p) => {
              const body = (
                <>
                  <span className="grid h-14 place-items-start">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {p.logo ? <img src={p.logo} alt={p.name} className="max-h-12 w-auto max-w-[180px] object-contain" /> : <span className={`text-lg font-semibold ${ink}`}>{p.name}</span>}
                  </span>
                  {p.logo && <span className={`mt-2 block font-semibold ${ink}`}>{p.name}</span>}
                  <span className="block text-xs text-ink-2">{PARTNER_CATEGORY[p.category]?.[lang]}</span>
                  {(lang === "en" ? p.description_en ?? p.description_sq : p.description_sq ?? p.description_en) && <span className="mt-2 block text-sm text-ink-2">{lang === "en" ? p.description_en ?? p.description_sq : p.description_sq ?? p.description_en}</span>}
                </>
              );
              return (
                <li key={p.id} className="rounded-xl border border-line bg-card p-5">
                  {p.website ? <a href={p.website} target="_blank" rel="noopener noreferrer" className="block hover:opacity-90">{body}</a> : body}
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="mt-6 grid gap-5 rounded-2xl border border-dashed border-lime-dim/40 bg-[#f5f7f4] p-6 md:grid-cols-[1fr_auto] md:items-center md:p-8 dark:bg-bg-2">
            <div>
              <p className={`text-lg font-semibold ${ink}`}>{t("Partnerët e parë po bashkohen gjatë pilotit në Tiranë.", "Our first partners are joining during the Tirana pilot.")}</p>
              <p className="mt-1.5 max-w-2xl text-ink-2">{t("Këtu shfaqen vetëm partnerët me marrëveshje të nënshkruar dhe me leje për logon. Organizata juaj mund të jetë ndër të parat.", "Only partners with a signed agreement and permission to show their logo appear here. Your organisation can be among the first.")}</p>
            </div>
            <a href="#apliko" className="btn-primary w-fit">{t("Apliko si partner", "Apply to partner")}</a>
          </div>
        )}
      </section>

      <section aria-labelledby="pse" className="border-t border-line bg-card">
        <div className="container-x py-14 md:py-16">
          <h2 id="pse" className={`display text-center text-3xl md:text-4xl ${ink}`}>{t("Pse të bashkëpunoni me ECONERA?", "Why partner with ECONERA?")}</h2>
          <ul className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {why.map(({ Icon, title, text }) => (
              <li key={title}>
                <span className="grid size-11 place-items-center rounded-xl bg-accent text-lime-dim dark:text-lime"><Icon /></span>
                <p className={`mt-4 font-semibold ${ink}`}>{title}</p>
                <p className="mt-1 text-sm text-ink-2">{text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="si" aria-labelledby="si-h" className="container-x scroll-mt-24 py-14 md:py-16">
        <h2 id="si-h" className={`display text-3xl md:text-4xl ${ink}`}>{t("Si funksionon partneriteti", "How partnership works")}</h2>
        <ol className="mt-8 grid gap-6 md:grid-cols-3">
          {steps.map(([title, text], i) => (
            <li key={title} className="border-t-2 border-lime pt-4">
              <p className="text-sm font-semibold text-lime-dim dark:text-lime">{i + 1}</p>
              <p className={`mt-1 text-lg font-semibold ${ink}`}>{title}</p>
              <p className="mt-1 text-ink-2">{text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section id="apliko" aria-labelledby="apliko-h" className="scroll-mt-24 bg-[#062321] text-white">
        <div className="container-x grid gap-8 py-14 md:py-16 lg:grid-cols-[0.8fr_1.2fr] [&>*]:min-w-0">
          <div>
            <HandshakeIcon className="size-10 text-[#c8f169]" />
            <h2 id="apliko-h" className="display mt-4 text-3xl text-white md:text-4xl">{t("Bashkohu me rrjetin e partnerëve.", "Join the ECONERA partner network.")}</h2>
            <p className="mt-3 max-w-md text-white/75">{t("Na tregoni kush jeni dhe si mund ta bëjmë së bashku ndërtimin më qarkullues. Përgjigjemi me email.", "Tell us who you are and how we can make construction more circular together. We reply by email.")}</p>
          </div>
          <PartnerForm />
        </div>
      </section>
    </>
  );
}
