"use client";

import Link from "next/link";
import { useState } from "react";
import { formatNumber } from "@/lib/format";
import { BUYER_FEATURES, ENTERPRISE, PILOT_OFFER, SUPPLIER_PLANS } from "@/lib/pricing";

const Check = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true" className="mt-0.5 shrink-0 text-lime" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="9" cy="9" r="7.5" /><path d="M5.8 9.2l2.1 2.1 4.3-4.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
);

export function Pricing() {
  const [annual, setAnnual] = useState(true);
  const [free, ...paid] = SUPPLIER_PLANS;

  return (
    <section className="container-x py-14 md:py-20" aria-labelledby="planet">
      <div className="flex flex-col items-center text-center">
        <h2 id="planet" className="display text-4xl md:text-5xl">Për furnitorët dhe kompanitë e ndërtimit.</h2>
        <p className="lead mt-4 max-w-2xl">Çdo plan nis falas. Kaloni në plan me pagesë kur ECONERA ju ka sjellë shitjet e para.</p>
        <div className="mt-8 inline-flex items-center gap-1 rounded-full border border-line bg-card p-1" role="radiogroup" aria-label="Periudha e pagesës">
          {([[false, "Mujore"], [true, "Vjetore −20%"]] as const).map(([value, label]) => (
            <button key={label} type="button" role="radio" aria-checked={annual === value} onClick={() => setAnnual(value)}
              className={`rounded-full px-5 py-2 text-sm font-medium transition ${annual === value ? "bg-lime text-bg" : "text-ink-2 hover:text-ink"}`}>{label}</button>
          ))}
        </div>
      </div>

      <div className="card mt-12 flex flex-col gap-5 p-6 md:flex-row md:items-center md:justify-between md:p-8">
        <div className="flex flex-col gap-1 md:flex-row md:items-baseline md:gap-6">
          <h3 className="text-2xl font-semibold">{free.name}</h3>
          <p className="text-ink-2">{free.tagline} {free.features.join(" · ")}. Komision {free.commission} vetëm për porositë e kryera.</p>
        </div>
        <Link href={`/regjistrohu?lloji=furnitor&plani=falas`} className="btn-primary shrink-0">Fillo falas</Link>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        {paid.map((plan) => {
          const price = annual ? plan.annual : plan.monthly;
          return (
            <article key={plan.id} className={`relative flex flex-col rounded-card border p-7 ${plan.highlight ? "border-lime/70 bg-[linear-gradient(180deg,rgba(200,241,105,0.08),transparent_40%)] bg-card" : "border-line bg-card"}`}>
              {plan.highlight && <span className="absolute -top-3 left-7 rounded-full bg-lime px-3 py-1 text-xs font-semibold text-bg">Më i zgjedhuri</span>}
              <h3 className="text-2xl font-semibold">{plan.name}</h3>
              <p className="mt-2 text-sm text-ink-2">{plan.tagline}</p>
              <div className="my-6 h-px bg-line" />
              <p className="text-sm text-ink-2">Gjithçka te {plan.includesFrom}, plus:</p>
              <ul className="mt-4 grid gap-3 text-[15px]">
                {plan.features.map((f) => <li key={f} className="flex gap-3"><Check />{f}</li>)}
                <li className="flex gap-3"><Check />Komision {plan.commission} vetëm për porositë e kryera</li>
              </ul>
              <div className="mt-auto pt-8">
                <p className="flex items-baseline gap-2"><span className="display text-5xl tabular-nums">{formatNumber(price, 0)}</span><span className="text-ink-2">lekë / muaj</span></p>
                <p className="mt-1 h-5 text-xs text-ink-2">{annual ? `Faturohet vjetore: ${formatNumber(price * 12, 0)} lekë` : "Pa kontratë, anulo kur të duash"}</p>
                <Link href={`/regjistrohu?lloji=furnitor&plani=${plan.id}`} className={`${plan.highlight ? "btn-primary" : "btn-ghost"} mt-5 w-full`}>Nis me {plan.name}</Link>
                <p className="mt-3 text-center text-xs text-ink-2">Mjafton 1 shitje në muaj që plani të paguajë veten.</p>
              </div>
            </article>
          );
        })}
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_1.4fr]">
        <div className="card flex flex-col justify-between gap-5 p-7">
          <div>
            <h3 className="text-2xl font-semibold">{ENTERPRISE.name}</h3>
            <p className="mt-2 text-ink-2">{ENTERPRISE.tagline}</p>
          </div>
          <Link href="/kontakt" className="btn-ghost w-fit">Kërko ofertë</Link>
        </div>
        <div className="rounded-card border border-lime/40 bg-lime/[0.06] p-7">
          <p className="eyebrow">Për blerësit · kontraktorë, firma, individë</p>
          <div className="mt-3 flex flex-wrap items-baseline gap-3"><h3 className="display text-4xl">Falas. Përgjithmonë.</h3></div>
          <ul className="mt-5 grid gap-2.5 sm:grid-cols-2">{BUYER_FEATURES.map((f) => <li key={f} className="flex gap-3 text-[15px]"><Check />{f}</li>)}</ul>
          <Link href="/regjistrohu?lloji=bleres" className="btn-primary mt-6 w-fit">Krijo llogari blerësi</Link>
        </div>
      </div>

      <p className="mt-8 rounded-card border border-line bg-bg-2 px-6 py-4 text-center text-sm text-ink-2"><span className="font-semibold text-lime">Oferta e pilotit.</span> {PILOT_OFFER} Çmimet janë pa TVSH.</p>
    </section>
  );
}
