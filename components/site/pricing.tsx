"use client";

import Link from "next/link";
import { useState } from "react";
import { formatNumber } from "@/lib/format";
import { useLang } from "@/components/lang-provider";
import { ENTERPRISE, PILOT_OFFER, PILOT_OFFER_EN, PLAN_EN, PLAN_NAME_EN, pilotOfferActive, SUPPLIER_PLANS } from "@/lib/pricing";

const Check = () => (
  <svg width="16" height="16" viewBox="0 0 18 18" aria-hidden="true" className="mt-0.5 shrink-0 text-[#3f8f2f] dark:text-lime" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="9" cy="9" r="7.5" /><path d="M5.8 9.2l2.1 2.1 4.3-4.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
);
const INK = "text-[#0c2f2b] dark:text-ink";

/** Supplier plans from lib/pricing (the single source of truth): Free strip, then Start · Growth · Pro · Enterprise. */
export function Pricing() {
  const [annual, setAnnual] = useState(true);
  const { lang, t } = useLang();
  const en = lang === "en";
  const plans = SUPPLIER_PLANS.map((p) => (en ? { ...p, name: PLAN_NAME_EN[p.id], tagline: PLAN_EN[p.id].tagline, features: PLAN_EN[p.id].features, includesFrom: p.includesFrom && (p.includesFrom === "Falas" ? "ECONERA Free" : p.includesFrom === "Rritje" ? "Growth" : p.includesFrom) } : p));
  const [free, ...paid] = plans;
  const enterprise = en ? ["ERP integration", "Annual contracts", "Volume pricing"] : ["Integrim me ERP", "Kontrata vjetore", "Çmim sipas volumit"];

  return (
    <section className="container-x scroll-mt-24 pt-10 pb-12 md:pt-12" id="planet" aria-labelledby="planet-h">
      <div className="flex flex-col items-center text-center">
        <h2 id="planet-h" className={`display text-[clamp(2rem,3.6vw,2.8rem)] ${INK}`}>{t("Planet tona", "Our Plans")}</h2>
        <p className="mt-2 text-ink-2">{t("Zgjidh planin që i përshtatet biznesit tënd.", "Choose the plan that fits your business needs.")}</p>
        <div className="mt-5 inline-flex items-center gap-1 rounded-full border border-line bg-card p-1" role="radiogroup" aria-label={t("Periudha e pagesës", "Billing period")}>
          {([[false, t("Mujore", "Monthly")], [true, t("Vjetore −20%", "Yearly −20%")]] as const).map(([value, label]) => (
            <button key={label} type="button" role="radio" aria-checked={annual === value} onClick={() => setAnnual(value)}
              className={`rounded-full px-5 py-2 text-sm font-medium transition ${annual === value ? "bg-[#0c2f2b] text-white dark:bg-lime dark:text-bg" : "text-ink-2 hover:text-ink"}`}>{label}</button>
          ))}
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-4 rounded-2xl border border-line bg-card px-5 py-4 md:flex-row md:items-center md:gap-6 md:px-6">
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-baseline gap-x-3"><span className={`text-lg font-semibold ${INK}`}>{free.name}</span><span className="text-sm text-ink-2">{t("Për furnitorët që duan ta provojnë tregun para se të kalojnë në plan me pagesë.", "For suppliers who want to explore the marketplace before upgrading.")}</span></p>
          <ul className="mt-2 flex flex-wrap gap-x-5 gap-y-1.5 text-sm">
            {free.features.map((f) => <li key={f} className="flex gap-1.5"><Check />{f}</li>)}
            <li className="flex gap-1.5 font-medium"><Check />{t(`Komision ${free.commission} vetëm për porositë e kryera`, `${free.commission} commission on completed orders only`)}</li>
          </ul>
        </div>
        <p className={`shrink-0 text-2xl font-semibold tabular-nums ${INK}`}>0 <span className="text-sm font-normal text-ink-2">{t("lekë", "ALL")}</span></p>
        <Link href="/regjistrohu?lloji=furnitor&plani=falas" className="btn-ghost shrink-0">{t("Fillo falas", "Start free")}</Link>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {paid.map((plan) => {
          const price = annual ? plan.annual : plan.monthly;
          return (
            <article key={plan.id} className={`relative flex flex-col rounded-2xl border p-6 ${plan.highlight ? "border-[#8fc63f] bg-[#f4fae6] dark:border-lime/60 dark:bg-lime/[0.06]" : "border-line bg-card"}`}>
              {plan.highlight && <span className="absolute -top-2.5 left-6 rounded-full bg-[#0c2f2b] px-2.5 py-0.5 text-[11px] font-semibold text-[#c8f169]">{t("I rekomanduar", "Recommended")}</span>}
              <h3 className={`text-xl font-semibold ${INK}`}>{plan.name}</h3>
              <p className="mt-1 min-h-10 text-sm text-ink-2">{plan.tagline}</p>
              <div className="my-4 h-px bg-line" />
              <p className="text-xs font-medium text-ink-2">{t(`Gjithçka te ${plan.includesFrom}, plus:`, `Everything in ${plan.includesFrom}, plus:`)}</p>
              <ul className="mt-3 grid gap-2 text-sm">
                {plan.features.map((f) => <li key={f} className="flex gap-2"><Check />{f}</li>)}
                <li className="flex gap-2 font-semibold"><Check />{t(`Komision ${plan.commission} vetëm për porositë e kryera`, `${plan.commission} commission on completed orders only`)}</li>
              </ul>
              <div className="mt-auto pt-6">
                <p className="flex items-baseline gap-1.5"><span className={`text-[2rem] font-semibold tabular-nums tracking-tight ${INK}`}>{formatNumber(price, 0)}</span><span className="text-sm text-ink-2">{t("lekë / muaj", "ALL / month")}</span></p>
                <p className="mt-0.5 text-xs text-ink-2">{annual ? t(`Faturohet vjetore: ${formatNumber(price * 12, 0)} lekë, pa TVSH`, `Billed yearly: ${formatNumber(price * 12, 0)} ALL, excl. VAT`) : t("Mujore, pa TVSH, pa kontratë", "Monthly, excl. VAT, no contract")}</p>
                <Link href={`/regjistrohu?lloji=furnitor&plani=${plan.id}`} className={`${plan.highlight ? "btn-primary" : "btn-ghost"} mt-4 w-full`}>{t(`Nis me ${plan.name}`, `Start with ${plan.name}`)}</Link>
              </div>
            </article>
          );
        })}
        <article className="flex flex-col rounded-2xl border border-line bg-card p-6">
          <h3 className={`text-xl font-semibold ${INK}`}>{ENTERPRISE.name}</h3>
          <p className="mt-1 min-h-10 text-sm text-ink-2">{t("Për zhvillues dhe kompani të mëdha me nevoja të personalizuara.", "For developers and large companies with custom needs.")}</p>
          <div className="my-4 h-px bg-line" />
          <ul className="grid gap-2 text-sm">{enterprise.map((f) => <li key={f} className="flex gap-2"><Check />{f}</li>)}</ul>
          <div className="mt-auto pt-6">
            <p className={`text-[2rem] font-semibold tracking-tight ${INK}`}>{t("Me ofertë", "Custom")}</p>
            <p className="mt-0.5 text-xs text-ink-2">{t("Çmim sipas volumit dhe kontratës", "Priced by volume and contract")}</p>
            <Link href="/kontakt" className="btn-ghost mt-4 w-full">{t("Kërko ofertë", "Request a quote")}</Link>
          </div>
        </article>
      </div>

      <div className="mt-4 grid gap-4 rounded-2xl border border-line bg-[#f3f7ee] p-5 md:grid-cols-2 md:divide-x md:divide-line md:p-6 dark:bg-bg-2">
        <div className="flex gap-4">
          <span aria-hidden className="grid size-11 shrink-0 place-items-center rounded-full bg-card text-[#3f8f2f] dark:text-lime"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><circle cx="9" cy="8" r="3" /><path d="M3.5 19c.6-3.2 2.8-5 5.5-5s4.9 1.8 5.5 5M16 11a2.5 2.5 0 1 0 0-5M17.5 14c1.7.5 2.8 2.1 3 5" /></svg></span>
          <div>
            <p className={`font-semibold ${INK}`}>{t("Për blerësit, qasje falas", "For buyers, free access")}</p>
            <p className="mt-1 text-sm text-ink-2">{t("Kërko, krahaso materialet dhe kërko oferta pa tarifë abonimi për blerësit.", "Search, compare materials and request quotes with no buyer subscription fee.")} <Link href="/regjistrohu?lloji=bleres" className="font-medium text-ink underline underline-offset-4">{t("Krijo llogari blerësi", "Create a buyer account")}</Link></p>
          </div>
        </div>
        <div className="flex gap-4 md:pl-6">
          <span aria-hidden className="grid size-11 shrink-0 place-items-center rounded-full bg-card text-lg font-semibold text-[#3f8f2f] dark:text-lime">%</span>
          <div>
            <p className={`font-semibold ${INK}`}>{t("Si funksionon", "How it works")}</p>
            <p className="mt-1 text-sm text-ink-2">{t("Furnitorët zgjedhin një plan abonimi. Komisioni i planit aplikohet vetëm për porositë e kryera.", "Suppliers choose a subscription plan. The plan's commission applies only to completed orders.")}</p>
          </div>
        </div>
      </div>

      <p className="mt-4 rounded-xl bg-[#e9f2df] px-5 py-2.5 text-center text-sm text-ink-2 dark:bg-lime/[0.07]">
        {pilotOfferActive() && <><span className={`font-semibold ${INK}`}>{t("Oferta e pilotit.", "Pilot offer.")}</span> {en ? PILOT_OFFER_EN : PILOT_OFFER} </>}
        {t("Çmimet janë në lekë dhe pa TVSH.", "Prices are in ALL and exclude VAT.")}
      </p>
    </section>
  );
}

/** Centered FAQ accordion: one question open at a time, all closed by default. */
export function Faq({ items }: { items: [string, string][] }) {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div className="mx-auto mt-6 grid max-w-[860px] gap-2">
      {items.map(([q, a], i) => {
        const on = open === i;
        return (
          <div key={q} className="rounded-xl border border-line bg-card">
            <h3>
              <button type="button" id={`faq-q-${i}`} aria-expanded={on} aria-controls={`faq-a-${i}`} onClick={() => setOpen(on ? null : i)}
                className={`flex w-full items-center gap-4 rounded-xl px-5 py-3.5 text-left text-[15px] font-semibold outline-none focus-visible:ring-2 focus-visible:ring-lime ${INK}`}>
                {q}
                <svg width="14" height="14" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden className={`ml-auto shrink-0 transition duration-200 ${on ? "rotate-180" : ""}`}><path d="M2 3.5l3 3 3-3" strokeLinecap="round" /></svg>
              </button>
            </h3>
            <div id={`faq-a-${i}`} role="region" aria-labelledby={`faq-q-${i}`} className={`grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none ${on ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
              <div className="overflow-hidden" inert={!on}><p className="px-5 pb-4 text-sm leading-relaxed text-ink-2">{a}</p></div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
