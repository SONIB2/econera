import type { Metadata } from "next";
import Link from "next/link";
import { tr } from "@/lib/lang";
import { getLang } from "@/lib/lang-server";
import { IntelligenceUniverse } from "@/components/tools/intelligence-universe";
import { BasketVisual, CutVisual, RenovationVisual, VoiceVisual } from "@/components/tools/visuals";

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getLang();
  return { title: "AI Tools", description: tr(lang, "AI Renovation, Smart Basket, SmartCut dhe ECONERA Voice: nga ideja te plani i blerjes me materiale reale.", "AI Renovation, Smart Basket, SmartCut and ECONERA Voice: from idea to purchasing plan with real materials.") };
}

export default async function AiToolsPage() {
  const lang = await getLang();
  const t = (sq: string, en: string) => tr(lang, sq, en);
  const tools = [
    { href: "/ai/renovim", name: "AI Renovation", text: t("Transformo hapësirën me materiale reale dhe të qëndrueshme.", "Transform your space using real, sustainable materials."), visual: <RenovationVisual /> },
    { href: "/ai/shporta", name: "Smart Basket", text: t("Kombinimi më i mirë i materialeve brenda buxhetit tënd.", "Find the best combination of materials within your budget."), visual: <BasketVisual /> },
    { href: "/ai/smartcut", name: "SmartCut", text: t("Copëzat e mbetura kthehen në prerje të optimizuara.", "Turn leftover materials into optimised construction solutions."), visual: <CutVisual /> },
    { href: "#asistenti", name: "ECONERA Voice", text: t("Kërko, shit dhe menaxho materialet me zë.", "Search, sell and manage materials using your voice."), visual: <VoiceVisual />, voice: true },
  ];
  const flow = [
    [t("Ide ose foto", "Idea or photo"), "Voice · AI Renovation"],
    [t("Lista e materialeve", "Material list"), t("Vlerësim nga masat", "Estimated from measurements")],
    [t("Stoku real", "Real stock"), "Smart Basket"],
    [t("Copëzat", "Offcuts"), "SmartCut"],
    [t("Plani i blerjes", "Purchasing plan"), t("Oferta, transport, kursim, CO₂", "Quotes, transport, savings, CO₂")],
  ];

  return (
    <>
      <IntelligenceUniverse />
      <section className="container-x pt-16 pb-12 text-center md:pt-24">
        <p className="eyebrow-pill">AI Tools</p>
        <h2 className="display mx-auto mt-6 max-w-4xl text-[2.6rem] sm:text-5xl md:text-[4rem]">{t("Më shumë se një treg. Një mënyrë më e zgjuar për të ndërtuar.", "More than a marketplace. A smarter way to build.")}</h2>
        <p className="lead mx-auto mt-6 max-w-2xl text-balance">{t("Katër mjete që punojnë bashkë: nga ideja te materialet që mund t'i blesh sot, me më pak shpenzim dhe më pak mbetje.", "Four tools that work together: from an idea to materials you can buy today, spending less and wasting less.")}</p>
        <div className="mt-9 flex flex-wrap justify-center gap-3"><Link href="/ai/renovim" className="btn-primary">{t("Nis rinovimin tënd të zgjuar", "Start your smart renovation")}</Link><Link href="/projektet" className="btn-ghost">{t("Projektet e mia", "My projects")}</Link></div>
      </section>

      <section className="container-x grid gap-5 pb-16 sm:grid-cols-2" aria-label={t("Mjetet", "Tools")}>
        {tools.map((tool) => (
          <Link key={tool.name} href={tool.href} className="group card overflow-hidden transition hover:border-lime/60" data-open-assistant={tool.voice ? "" : undefined}>
            <div className="aspect-[16/8] overflow-hidden border-b border-line bg-bg-2">{tool.visual}</div>
            <div className="flex items-end justify-between gap-4 p-6">
              <div><h2 className="text-2xl">{tool.name}</h2><p className="mt-1 text-ink-2">{tool.text}</p></div>
              <span aria-hidden className="grid size-10 shrink-0 place-items-center rounded-full border border-line transition group-hover:border-lime group-hover:bg-lime group-hover:text-bg">↗</span>
            </div>
          </Link>
        ))}
      </section>

      <section className="border-t border-line bg-bg-2" aria-labelledby="rrjedha">
        <div className="container-x py-16">
          <h2 id="rrjedha" className="text-3xl md:text-4xl">{t("Nga ideja te plani i blerjes.", "From idea to purchasing plan.")}</h2>
          <p className="mt-2 max-w-2xl text-ink-2">{t("Të dhënat kalojnë nga një mjet te tjetri, pa i shkruar dy herë.", "Data moves from one tool to the next, without typing it twice.")}</p>
          <ol className="mt-8 grid gap-3 md:grid-cols-5">
            {flow.map(([a, b], i) => (
              <li key={a} className="relative rounded-xl border border-line bg-card p-4">
                <span className="grid size-7 place-items-center rounded-full bg-accent text-xs font-semibold text-lime">{i + 1}</span>
                <p className="mt-3 font-semibold">{a}</p>
                <p className="text-sm text-ink-2">{b}</p>
              </li>
            ))}
          </ol>
          <p className="mt-6 text-sm text-ink-2">{t("Llogaritjet janë të përcaktuara dhe të shpjegueshme. AI përdoret për të kuptuar fotot dhe gjuhën; çdo veprim i rëndësishëm kërkon konfirmimin tënd.", "Calculations are deterministic and explainable. AI is used to understand photos and language; every consequential action needs your confirmation.")}</p>
        </div>
      </section>
    </>
  );
}


