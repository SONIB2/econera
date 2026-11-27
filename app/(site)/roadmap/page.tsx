import type { Metadata } from "next";
import Link from "next/link";
import { ROADMAP_ICONS } from "@/components/roadmap/icons";
import { InterestForm } from "@/components/roadmap/interest-form";
import { tr } from "@/lib/lang";
import { getLang } from "@/lib/lang-server";
import { PRODUCTS, type RoadmapStatus, shortName, STAGES, STATUS } from "@/lib/roadmap";

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getLang();
  return {
    title: tr(lang, "Plani i produkteve", "Product roadmap"),
    description: tr(lang, "Përtej materialeve. Përtej ndërtimit. Një ekosistem i lidhur për gjithë industrinë e ndërtimit.", "Beyond materials. Beyond construction. One connected ecosystem for the entire construction industry."),
  };
}

const BADGE: Record<RoadmapStatus, string> = {
  available: "bg-lime text-bg border-lime",
  beta: "border-lime text-lime",
  development: "border-lime/60 border-dashed text-lime",
  planned: "border-line text-ink",
  future: "border-dashed border-line text-ink-2",
};
const DOT: Record<RoadmapStatus, string> = {
  available: "bg-[#c8f169]",
  beta: "border-2 border-[#c8f169] bg-[#c8f169]/40",
  development: "border-2 border-dashed border-[#c8f169]",
  planned: "border-2 border-white/70",
  future: "border border-dashed border-white/45",
};

export default async function RoadmapPage({ searchParams }: { searchParams: Promise<{ interes?: string }> }) {
  const [lang, params] = await Promise.all([getLang(), searchParams]);
  const t = (sq: string, en: string) => tr(lang, sq, en);
  const ink = "text-[#0c2f2b] dark:text-ink";
  const inStage = (id: string) => PRODUCTS.filter((p) => p.stage === id);
  const live = (id: string) => inStage(id).filter((p) => p.status === "available" || p.status === "beta").length;

  return (
    <>
      <section className="container-x pt-6 md:pt-10">
        <div className="relative overflow-hidden rounded-[2rem] bg-[#04211d] px-6 py-12 text-white sm:px-10 md:px-14 md:py-16">
          <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(40rem_22rem_at_88%_0%,rgba(200,241,105,0.16),transparent_65%),radial-gradient(36rem_20rem_at_0%_110%,rgba(15,74,67,0.9),transparent_70%)]" />
          <div className="relative">
            <p className="text-xs font-medium tracking-[0.3em] text-white/70">{t("PLANI I PRODUKTEVE", "PRODUCT ROADMAP")}</p>
            <h1 className="display mt-5 max-w-3xl text-[clamp(2.4rem,5.4vw,4.6rem)] leading-[0.98] tracking-[-0.045em]">
              <span className="block">{t("Përtej materialeve.", "Beyond materials.")}</span>
              <span className="block text-[#c8f169]">{t("Përtej ndërtimit.", "Beyond construction.")}</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg text-white/80">{t("Një ekosistem i lidhur për gjithë industrinë e ndërtimit.", "One connected ecosystem for the entire construction industry.")}</p>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/60">{t("ECONERA nis me materialet qarkulluese dhe rritet drejt një platforme ku planifikimi, blerjet, puna në kantier dhe sistemet e kompanisë ndajnë të njëjtat të dhëna.", "ECONERA starts with circular materials and grows into one platform where planning, purchasing, site work and company systems share the same data.")}</p>

            {/* The four stages as one line: where ECONERA is today and where it is going. */}
            <ol className="mt-12 grid gap-6 md:grid-cols-4 md:gap-0">
              {STAGES.map((s, i) => (
                <li key={s.id} className="relative md:pr-6">
                  <div aria-hidden className={`absolute top-[11px] left-6 hidden h-px md:block ${i === STAGES.length - 1 ? "w-0" : "right-0"} ${i === 0 ? "bg-[#c8f169]/60" : "bg-white/15"}`} />
                  <a href={`#${s.id}`} className="group relative flex items-start gap-3 md:block">
                    <span className={`grid size-6 shrink-0 place-items-center rounded-full text-[11px] font-semibold ${i === 0 ? "bg-[#c8f169] text-[#04211d]" : "border border-white/30 bg-[#04211d] text-white/80"}`}>{i + 1}</span>
                    <span className="block md:mt-4">
                      <span className="block text-base font-semibold group-hover:text-[#c8f169]">{s.title[lang]}</span>
                      <span className="mt-1 block text-xs text-white/55">{live(s.id) > 0 ? t(`${live(s.id)} ${live(s.id) === 1 ? "produkt" : "produkte"} në përdorim sot`, `${live(s.id)} ${live(s.id) === 1 ? "product" : "products"} in use today`) : t(`${inStage(s.id).length} produkte në plan`, `${inStage(s.id).length} products on the roadmap`)}</span>
                    </span>
                  </a>
                </li>
              ))}
            </ol>

            <ul className="mt-10 grid grid-cols-2 gap-x-6 gap-y-3 border-t border-white/10 pt-6 text-xs text-white/70 sm:grid-cols-3 lg:grid-cols-5">
              {(Object.keys(STATUS) as RoadmapStatus[]).map((k) => (
                <li key={k} className="flex items-start gap-2" title={STATUS[k].meaning[lang]}>
                  <span aria-hidden className={`mt-[3px] size-2.5 shrink-0 rounded-full ${DOT[k]}`} />
                  <span><span className="font-semibold text-white">{STATUS[k].label[lang]}<span className="max-sm:hidden">.</span></span> <span className="max-sm:hidden">{STATUS[k].meaning[lang]}</span></span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {STAGES.map((s, i) => (
        <section key={s.id} id={s.id} className="container-x scroll-mt-24 border-b border-line py-10 last-of-type:border-0 md:py-20">
          <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_minmax(0,2.2fr)] md:gap-12">
            <div className="md:sticky md:top-28 md:self-start">
              <p className="text-sm font-medium text-ink-2">{t(`Faza ${i + 1} nga 4`, `Stage ${i + 1} of 4`)}</p>
              <h2 className={`display mt-2 text-3xl md:text-4xl ${ink}`}>{s.title[lang]}</h2>
              <p className="mt-3 max-w-sm text-ink-2">{s.text[lang]}</p>
            </div>
            <ul className="-mx-5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-2 [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 sm:pb-0 [&::-webkit-scrollbar]:hidden">
              {inStage(s.id).map((p) => {
                const Icon = ROADMAP_ICONS[p.id];
                const usable = p.status === "available" || p.status === "beta";
                return (
                  <li key={p.id} id={p.id} className="flex w-[82%] shrink-0 snap-start scroll-mt-28 flex-col rounded-2xl border border-line bg-card p-5 target:border-lime sm:w-auto">
                    <div className="flex items-start justify-between gap-3">
                      <span className="grid size-10 place-items-center rounded-xl bg-bg-2 text-lime"><Icon /></span>
                      <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${BADGE[p.status]}`}>{STATUS[p.status].label[lang]}</span>
                    </div>
                    <h3 className={`mt-4 text-lg font-semibold ${ink}`}>{p.name}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-ink-2">{p.text[lang]}</p>
                    <div className="mt-auto pt-4 text-sm">
                      {usable && p.href
                        ? <Link href={p.href} className="font-medium text-lime underline-offset-4 hover:underline">{t(`Hap ${shortName(p.name)}`, `Open ${shortName(p.name)}`)}</Link>
                        : <Link href={`/roadmap?interes=${p.id}#interes`} scroll={false} className="font-medium text-ink underline-offset-4 hover:text-lime hover:underline">{t("Më njoftoni", "Keep me updated")}</Link>}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
      ))}

      <section id="interes" className="scroll-mt-24 bg-bg-2/60 py-16 md:py-24">
        <div className="container-x grid gap-10 md:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] md:gap-14">
          <div>
            <h2 className={`display text-3xl md:text-4xl ${ink}`}>{t("Ndihmoni të zgjedhim çfarë ndërtojmë më pas.", "Help decide what we build next.")}</h2>
            <p className="mt-4 text-ink-2">{t("Produktet e planifikuara do të ndërtohen bashkë me kompanitë që do t'i përdorin. Regjistroni interesin dhe do t'ju kontaktojmë kur të kemi diçka për të provuar.", "Planned products will be built together with the companies that will use them. Register your interest and we will contact you when there is something to try.")}</p>
            <ul className="mt-6 grid gap-3 text-sm text-ink-2">
              <li className="flex gap-3"><span aria-hidden className="mt-2 h-px w-4 shrink-0 bg-lime" />{t("Statuset në këtë faqe tregojnë gjendjen reale të secilit produkt.", "The labels on this page show the real state of each product.")}</li>
              <li className="flex gap-3"><span aria-hidden className="mt-2 h-px w-4 shrink-0 bg-lime" />{t("Një produkt kalon në “Në zhvillim” vetëm kur puna ka nisur dhe ka plan publikimi.", "A product moves to “In development” only when work has started and a release plan exists.")}</li>
              <li className="flex gap-3"><span aria-hidden className="mt-2 h-px w-4 shrink-0 bg-lime" />{t("Të gjitha produktet do të përdorin të njëjtën llogari dhe të njëjtat të dhëna.", "Every product will use the same account and the same data.")}</li>
            </ul>
          </div>
          <InterestForm key={params.interes ?? ""} preselect={params.interes} />
        </div>
      </section>
    </>
  );
}
