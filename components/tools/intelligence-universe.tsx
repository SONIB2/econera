"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useLang } from "@/components/lang-provider";
import { TOOL_ICON } from "@/components/site/tool-icons";
import "./intelligence-universe.css";

type Id = keyof typeof TOOL_ICON;
const NODES: { id: Id; href: string; name: string; verb: { sq: string; en: string }; x: number; y: number; voice?: boolean }[] = [
  { id: "renovation", href: "/ai/renovim", name: "AI Renovation", verb: { sq: "Dizajno", en: "Design" }, x: 19, y: 22 },
  { id: "basket", href: "/ai/shporta", name: "Smart Basket", verb: { sq: "Zbulo", en: "Discover" }, x: 81, y: 22 },
  { id: "smartcut", href: "/ai/smartcut", name: "SmartCut", verb: { sq: "Optimizo", en: "Optimize" }, x: 19, y: 78 },
  { id: "voice", href: "#asistenti", name: "ECONERA Voice", verb: { sq: "Bisedo", en: "Interact" }, x: 81, y: 78, voice: true },
];

/**
 * The Intelligence Universe: the ECONERA core in the centre, four tools orbiting it, each joined by a live connection.
 * Plain DOM + SVG + CSS (no WebGL): light, keyboard-navigable, and calm under prefers-reduced-motion.
 */
export function IntelligenceUniverse() {
  const { lang, t } = useLang();
  const [hot, setHot] = useState<Id | null>(null);
  const stage = useRef<HTMLDivElement>(null);
  const onMove = (e: React.PointerEvent) => {
    const el = stage.current;
    if (!el || e.pointerType !== "mouse") return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--px", ((e.clientX - r.left) / r.width - 0.5).toFixed(3));
    el.style.setProperty("--py", ((e.clientY - r.top) / r.height - 0.5).toFixed(3));
  };

  return (
    <section aria-labelledby="universe-title" className="iu theme-dark relative overflow-hidden bg-[#031a16] text-ink">
      <div aria-hidden className="iu-sky absolute inset-0" />
      <div className="container-x relative pt-12 pb-12 sm:pt-14">
        <div className="text-center">
          <p className="text-[11px] font-semibold tracking-[0.22em] text-lime">ECONERA INTELLIGENCE</p>
          <h1 id="universe-title" className="display mx-auto mt-4 max-w-3xl text-[clamp(2.2rem,5.4vw,4.2rem)] leading-[1.02] text-white">{t("Gjithçka është e lidhur.", "Everything is connected.")}</h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-ink-2 sm:text-lg">{t("Katër teknologji, një inteligjencë e vetme. Zgjidh një nyje për të hapur mjetin.", "Four technologies, one intelligence. Choose a node to open the tool.")}</p>
        </div>

        <div ref={stage} onPointerMove={onMove} onPointerLeave={() => { stage.current?.style.setProperty("--px", "0"); stage.current?.style.setProperty("--py", "0"); }}
          className="iu-stage relative mx-auto mt-6 aspect-[4/5] w-full max-w-5xl sm:mt-2 sm:aspect-[16/9]">
          {/* Orbits */}
          <div aria-hidden className="iu-orbit iu-orbit-1" />
          <div aria-hidden className="iu-orbit iu-orbit-2" />
          <div aria-hidden className="iu-orbit iu-orbit-3" />

          {/* Connections: a hairline, a brighter line when its node is active, and a spark travelling to the core. */}
          <svg aria-hidden className="absolute inset-0 size-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
            {NODES.map((n, i) => (
              <g key={n.id} className={hot === n.id ? "iu-link is-hot" : hot ? "iu-link is-dim" : "iu-link"}>
                <line x1={n.x} y1={n.y} x2="50" y2="50" className="iu-line" vectorEffect="non-scaling-stroke" />
                <line x1={n.x} y1={n.y} x2="50" y2="50" className="iu-spark" vectorEffect="non-scaling-stroke" style={{ animationDelay: `${i * 0.9}s` }} />
              </g>
            ))}
          </svg>

          {/* Core: the isometric ECONERA mark floating above its shadow, inside a breathing lime halo. */}
          <div className="iu-core absolute top-1/2 left-1/2" aria-hidden>
            <div className="iu-halo" />
            <div className="iu-mark">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/brand/mark.svg" alt="" draggable={false} className="iu-mark-img" />
              <span className="iu-shadow" />
            </div>
            <p className="iu-core-label">AI CORE</p>
          </div>

          {/* Nodes */}
          <ul className="contents">
            {NODES.map((n) => {
              const Icon = TOOL_ICON[n.id];
              const below = n.y > 50;
              return (
                <li key={n.id} className="iu-node absolute" style={{ left: `${n.x}%`, top: `${n.y}%` }}>
                  <Link href={n.href} data-open-assistant={n.voice ? "" : undefined} aria-label={`${n.name}: ${n.verb[lang]}`}
                    onMouseEnter={() => setHot(n.id)} onMouseLeave={() => setHot(null)} onFocus={() => setHot(n.id)} onBlur={() => setHot(null)}
                    className={`group flex -translate-x-1/2 -translate-y-1/2 items-center gap-3 outline-none ${below ? "flex-col-reverse" : "flex-col"}`}>
                    <span className="text-center">
                      <span className="block text-sm font-semibold tracking-tight text-white sm:text-xl">{n.name}</span>
                      <span className="block text-xs text-ink-2 transition-colors group-hover:text-lime sm:text-sm">{n.verb[lang]}</span>
                    </span>
                    <span className="iu-bubble grid place-items-center rounded-full text-lime group-focus-visible:ring-2 group-focus-visible:ring-lime group-focus-visible:ring-offset-4 group-focus-visible:ring-offset-[#031a16]">
                      <Icon className="size-7 sm:size-9" />
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="mx-auto mt-6 max-w-md border-t border-line pt-6 text-center">
          <p className="font-semibold text-lime">{t("Një inteligjencë. Mundësi pa fund.", "One intelligence. Endless possibilities.")}</p>
          <p className="mt-1 text-sm text-ink-2">{t("Dizajno më zgjuar. Bli më mirë. Hidh më pak.", "Design smarter. Source better. Waste less.")}</p>
        </div>
      </div>
    </section>
  );
}
