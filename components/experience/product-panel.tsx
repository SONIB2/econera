"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { useLang } from "@/components/lang-provider";
import { BasketVisual, CutVisual, RenovationVisual, VoiceVisual } from "@/components/tools/visuals";
import type { ProductId } from "./model";

type Copy = { name: string; tag: { sq: string; en: string }; points: { sq: string; en: string }[]; cta: { sq: string; en: string }; href: string; voice?: boolean };

export const PRODUCTS: Record<ProductId, Copy> = {
  marketplace: { name: "Marketplace", tag: { sq: "Hyrja kryesore: materiale me jetë të dytë.", en: "The main entrance: materials with a second life." }, points: [{ sq: "Stok i tepërt, i rikuperuar dhe copa", en: "Surplus, reclaimed and offcut stock" }, { sq: "Kërkim me fjalë të lira, me vend dhe me zë", en: "Search in plain words, by location or by voice" }, { sq: "Shporta dërgon kërkesa për ofertë te shitësit", en: "The cart sends quote requests to sellers" }], cta: { sq: "Hap tregun", en: "Open the marketplace" }, href: "/treg" },
  verify: { name: "ECONERA Verify", tag: { sq: "Struktura dhe dokumentacioni: transparencë për çdo listim.", en: "Structure and documentation: transparency for every listing." }, points: [{ sq: "Çdo listim shqyrtohet nga një person para publikimit", en: "Every listing is reviewed by a person before it goes live" }, { sq: "Shitës të verifikuar me dokumente", en: "Sellers verified against documents" }, { sq: "Dokumente teknike dhe pasaportë dixhitale, aty ku janë dorëzuar", en: "Technical documents and a digital passport, where submitted" }, { sq: "Inspektimi fizik shfaqet vetëm kur është kryer", en: "Physical inspection is shown only when it has taken place" }], cta: { sq: "Si funksionon verifikimi", en: "How verification works" }, href: "/verifikimi" },
  basket: { name: "Smart Basket", tag: { sq: "Materialet e ndërtimit: blerje më e zgjuar, çmime më të mira.", en: "Construction materials: smarter procurement, better prices." }, points: [{ sq: "Shkruaj listën e projektit ose ngarko CSV", en: "Write your project list or upload a CSV" }, { sq: "Kombinimi më i mirë brenda buxhetit", en: "The best combination within your budget" }, { sq: "Blerje nga disa shitës njëherësh", en: "Buy from several sellers at once" }], cta: { sq: "Hap Smart Basket", en: "Open Smart Basket" }, href: "/ai/shporta" },
  renovation: { name: "AI Renovation", tag: { sq: "Interieri: nga mbetja te dizajni.", en: "The interior: from waste to design." }, points: [{ sq: "Ngarko foton e dhomës dhe zgjidh stilin", en: "Upload a room photo and pick a style" }, { sq: "Krahaso para dhe pas", en: "Compare before and after" }, { sq: "Materiale reale nga tregu, me kosto", en: "Real marketplace materials, with costs" }], cta: { sq: "Hap AI Renovation", en: "Open AI Renovation" }, href: "/ai/renovim" },
  smartcut: { name: "SmartCut", tag: { sq: "Druri dhe panelet: çdo copë ka vlerë.", en: "Timber and panels: make every piece count." }, points: [{ sq: "Fut përmasat e prerjeve që të duhen", en: "Enter the cuts you need" }, { sq: "Plan prerjeje me përdorimin e materialit", en: "A cutting plan with material utilisation" }, { sq: "Copa të mbetura nga tregu që i mbulojnë", en: "Marketplace offcuts that cover them" }], cta: { sq: "Hap SmartCut", en: "Open SmartCut" }, href: "/ai/smartcut" },
  voice: { name: "ECONERA Voice", tag: { sq: "Asistenti: kërko, shit dhe lundro me zë.", en: "The assistant: search, sell and navigate by voice." }, points: [{ sq: "Kërkim materialesh me fjalë të thjeshta", en: "Material search in plain language" }, { sq: "Listim me zë, që e konfirmon vetë", en: "Voice-assisted listing that you confirm" }, { sq: "Navigim i aksesueshëm në shqip dhe anglisht", en: "Accessible navigation in Albanian and English" }], cta: { sq: "Fol me asistentin", en: "Talk to the assistant" }, href: "#asistenti", voice: true },
  sell: { name: "Sell Materials", tag: { sq: "Zona e tepricave: materialet kthehen në ekonominë qarkulluese.", en: "The surplus yard: materials return to the circular economy." }, points: [{ sq: "Gjashtë hapa, me foto nga celulari", en: "Six steps, with photos from your phone" }, { sq: "Import me CSV ose Excel për bizneset", en: "CSV or Excel import for businesses" }], cta: { sq: "Fillo të shesësh", en: "Start selling" }, href: "/shit" },
};

const VISUAL: Partial<Record<ProductId, React.ReactNode>> = { renovation: <RenovationVisual />, basket: <BasketVisual />, smartcut: <CutVisual />, voice: <VoiceVisual /> };

export function ProductPanel({ id, onClose }: { id: ProductId; onClose: () => void }) {
  const { lang, t } = useLang();
  const p = PRODUCTS[id];
  const close = useRef<HTMLButtonElement>(null);
  useEffect(() => { close.current?.focus(); }, [id]);
  return (
    <aside role="dialog" aria-modal="false" aria-labelledby="xp-product-title" className="xp-panel absolute inset-x-3 bottom-24 z-30 max-h-[70svh] overflow-y-auto rounded-[1.5rem] border border-line bg-bg/92 p-5 text-ink shadow-2xl backdrop-blur-xl md:inset-x-auto md:top-44 md:right-6 md:bottom-auto md:w-[380px]">
      <div className="flex items-start justify-between gap-3">
        <div><h2 id="xp-product-title" className="text-2xl">{p.name}</h2><p className="mt-1 text-sm text-ink-2">{p.tag[lang]}</p></div>
        <button ref={close} type="button" onClick={onClose} aria-label={t("Mbyll", "Close")} className="grid size-9 shrink-0 place-items-center rounded-full border border-line hover:border-lime">✕</button>
      </div>
      {VISUAL[id] && <div className="mt-4 aspect-[2/1] overflow-hidden rounded-xl border border-line">{id === "basket" ? <BasketVisual lang={lang} /> : VISUAL[id]}</div>}
      <ul className="mt-4 grid gap-2 text-sm">{p.points.map((x) => <li key={x.en} className="flex gap-2"><span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-lime" aria-hidden />{x[lang]}</li>)}</ul>
      {p.voice
        ? <a href="#asistenti" data-open-assistant="" onClick={onClose} className="btn-primary mt-5 w-full">{p.cta[lang]}</a>
        : <Link href={p.href} className="btn-primary mt-5 w-full">{p.cta[lang]}</Link>}
    </aside>
  );
}
