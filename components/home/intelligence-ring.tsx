"use client";

import Link from "next/link";
import { useState } from "react";
import { useLang } from "@/components/lang-provider";
import { BasketIcon, CutIcon, MarketIcon, RenovationIcon, VerifyIcon, VoiceIcon } from "@/components/site/tool-icons";
import "./intelligence-ring.css";

type Node = { id: string; href: string; name: string; text: { sq: string; en: string }; angle: number; Icon: (p: { className?: string }) => React.JSX.Element; voice?: boolean };

// Angles in degrees on the orbit ellipse (0 = right, 90 = front/bottom). Front nodes sit lower and larger.
const NODES: Node[] = [
  { id: "renovation", href: "/ai/renovim", name: "AI Renovation", angle: 206, Icon: RenovationIcon, text: { sq: "Dizajno hapësirën me materiale reale.", en: "Design your space with real materials." } },
  { id: "basket", href: "/ai/shporta", name: "Smart Basket", angle: 126, Icon: BasketIcon, text: { sq: "Materialet më të mira brenda buxhetit.", en: "The best materials within your budget." } },
  { id: "market", href: "/treg", name: "Marketplace", angle: 97, Icon: MarketIcon, text: { sq: "Materiale të reja, të rikuperuara dhe të tepërta.", en: "New, reclaimed and surplus materials." } },
  { id: "smartcut", href: "/ai/smartcut", name: "SmartCut", angle: 52, Icon: CutIcon, text: { sq: "Optimizo prerjet. Minimizo mbetjet.", en: "Optimize cuts. Minimize waste." } },
  { id: "verify", href: "/verifikimi", name: "Verify", angle: 12, Icon: VerifyIcon, text: { sq: "Listime të shqyrtuara dhe dokumente teknike.", en: "Reviewed listings and technical documents." } },
  { id: "voice", href: "#asistenti", name: "ECONERA Voice", angle: -30, Icon: VoiceIcon, voice: true, text: { sq: "Pyet, kërko dhe listo me zë.", en: "Ask, search and list by voice." } },
];
const A = 43, B = 31; // orbit radii in % of the stage (width, height)
const pos = (deg: number) => { const r = (deg * Math.PI) / 180; return { x: 50 + A * Math.cos(r), y: 50 + B * Math.sin(r), depth: (Math.sin(r) + 1) / 2 }; };

/**
 * ECONERA Intelligence: the illuminated mark on an orbital platform, joined to six product nodes.
 * DOM + SVG + CSS only, so it is light, crisp at any size, keyboard-navigable and calm under reduced motion.
 * On small screens the orbit becomes a compact grid.
 */
export function IntelligenceRing() {
  const { lang, t } = useLang();
  const [hot, setHot] = useState<string | null>(null);
  const hotNode = NODES.find((n) => n.id === hot);

  return (
    <section aria-labelledby="ir-title" className="ir theme-dark relative overflow-hidden bg-[#062321] text-ink">
      <div aria-hidden className="ir-sky absolute inset-0" />
      <div className="container-x relative py-14 md:py-10">
        <div className="text-center md:absolute md:inset-x-0 md:top-8 md:z-10">
          <p className="text-[11px] font-semibold tracking-[0.3em] text-[#c8f169]">ECONERA INTELLIGENCE</p>
          <h2 id="ir-title" className="mt-2 text-2xl text-white md:text-3xl">{t("Gjithçka është e lidhur.", "Everything is connected.")}</h2>
        </div>

        {/* Desktop / tablet: orbital platform */}
        <div className="ir-stage relative mx-auto hidden aspect-[2.3/1] w-full max-w-6xl md:block">
          <div aria-hidden className="ir-ring ir-ring-outer" />
          <div aria-hidden className="ir-ring ir-ring-mid" />
          <div aria-hidden className="ir-ring ir-ring-inner" />
          <div aria-hidden className="ir-pool" />

          <svg aria-hidden className="absolute inset-0 size-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            {NODES.map((n) => { const p = pos(n.angle); return (
              <line key={n.id} x1={p.x} y1={p.y} x2="50" y2="50" vectorEffect="non-scaling-stroke"
                className={`ir-line ${hot === n.id ? "is-hot" : hot ? "is-dim" : ""}`} />
            ); })}
          </svg>

          <div aria-hidden className="ir-core absolute top-1/2 left-1/2">
            <div className="ir-cube">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/brand/mark.svg" alt="" draggable={false} />
            </div>
            <div className="ir-beam" />
          </div>

          <ul className="contents">
            {NODES.map((n) => { const p = pos(n.angle); const scale = 0.86 + p.depth * 0.22; return (
              <li key={n.id} className="absolute" style={{ left: `${p.x}%`, top: `${p.y}%`, zIndex: Math.round(p.depth * 10) + 2 }}>
                <Link href={n.href} data-open-assistant={n.voice ? "" : undefined} aria-describedby={hot === n.id ? "ir-desc" : undefined}
                  onMouseEnter={() => setHot(n.id)} onMouseLeave={() => setHot(null)} onFocus={() => setHot(n.id)} onBlur={() => setHot(null)}
                  className="ir-node group" style={{ ["--s" as string]: scale }}>
                  <n.Icon className="size-7 text-[#c8f169]" />
                  <span className="mt-2 block text-[13px] font-semibold leading-tight text-white">{n.name}</span>
                </Link>
              </li>
            ); })}
          </ul>

          <p id="ir-desc" aria-live="polite" className={`absolute inset-x-0 bottom-1 text-center text-sm transition-opacity duration-300 ${hotNode ? "text-white/85 opacity-100" : "opacity-0"}`}>
            {hotNode ? <><span className="font-semibold text-[#c8f169]">{hotNode.name}</span> · {hotNode.text[lang]}</> : " "}
          </p>
        </div>

        {/* Mobile: compact navigation */}
        <div className="mt-8 md:hidden">
          <div aria-hidden className="ir-core-mobile mx-auto">
            <div className="ir-cube">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/brand/mark.svg" alt="" />
            </div>
          </div>
          <ul className="mt-8 grid grid-cols-2 gap-2.5">
            {NODES.map((n) => (
              <li key={n.id}>
                <Link href={n.href} data-open-assistant={n.voice ? "" : undefined} className="flex h-full flex-col gap-1.5 rounded-2xl border border-[#c8f169]/25 bg-white/[0.04] p-4 backdrop-blur active:bg-white/[0.08]">
                  <n.Icon className="size-6 text-[#c8f169]" />
                  <span className="text-sm font-semibold text-white">{n.name}</span>
                  <span className="text-xs leading-snug text-white/65">{n.text[lang]}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
