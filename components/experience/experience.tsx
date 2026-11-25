"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useLang } from "@/components/lang-provider";
import { HOTSPOTS, hotspotById, hotspotLabel } from "@/lib/interior";
import { createAmbient } from "./ambient";
import { LogoDraw } from "./logo-draw";
import type { ProductId } from "./model";
import { PRODUCTS, ProductPanel } from "./product-panel";
import { MaterialPanel } from "./material-panel";
import type { Phase } from "./scene";
import { StaticFallback } from "./static-fallback";
import "./experience.css";

const Scene = dynamic(() => import("./scene"), { ssr: false });

function subscribeMedia(query: string) {
  return (callback: () => void) => {
    const media = window.matchMedia(query);
    media.addEventListener("change", callback);
    return () => media.removeEventListener("change", callback);
  };
}
function useMedia(query: string, server = false) {
  return useSyncExternalStore(subscribeMedia(query), () => window.matchMedia(query).matches, () => server);
}

// Probed once: getSnapshot runs on every render, and each probe would otherwise create (and leak) a WebGL context.
let webglSupport: boolean | undefined;
function hasWebGL() {
  if (webglSupport !== undefined) return webglSupport;
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2") ?? canvas.getContext("webgl");
    webglSupport = Boolean(gl);
    gl?.getExtension("WEBGL_lose_context")?.loseContext();
  } catch {
    webglSupport = false;
  }
  return webglSupport;
}
const subscribeNever = () => () => {};

const SEEN = "econera.intro.v2";
const SPOT_TEXT: Record<ProductId, { sq: string; en: string }> = {
  marketplace: { sq: "Hyrja · tregu", en: "Entrance · marketplace" }, verify: { sq: "Struktura · dokumentet", en: "Structure · documents" },
  basket: { sq: "Materialet · blerja", en: "Materials · procurement" }, renovation: { sq: "Interieri · dizajni", en: "Interior · design" },
  smartcut: { sq: "Druri · prerja", en: "Timber · cutting" }, voice: { sq: "Asistenti", en: "Assistant" }, sell: { sq: "Tepricat · shit", en: "Surplus · sell" },
};

export function Experience() {
  const { lang, t } = useLang();
  const router = useRouter();
  const reducedMotion = useMedia("(prefers-reduced-motion: reduce)");
  const small = useMedia("(max-width: 767px)");
  const webgl = useSyncExternalStore(subscribeNever, hasWebGL, () => true);
  const lowPower = small;

  const [phase, setPhase] = useState<Phase>("boot");
  const [sound, setSound] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [xray, setXray] = useState(false);
  const [product, setProduct] = useState<ProductId | null>(null);
  const [exploded, setExploded] = useState(false);
  const [paused, setPaused] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [resetKey, setResetKey] = useState(0);
  const fadeRef = useRef<HTMLDivElement>(null);
  const ambient = useMemo(() => (typeof window === "undefined" ? null : createAmbient()), []);

  // First visit: welcome screen. Returning visitors land on the finished building, with a replay option.
  useEffect(() => {
    let seen = false;
    try { seen = localStorage.getItem(SEEN) === "1"; } catch { /* storage blocked */ }
    const id = setTimeout(() => setPhase(seen ? "outside" : "welcome"), 0);
    return () => clearTimeout(id);
  }, []);
  const remember = () => { try { localStorage.setItem(SEEN, "1"); } catch { /* ignore */ } };
  const start = () => { remember(); setProduct(null); setExploded(false); setPhase("intro"); };

  const exit = useCallback(() => { setSelected(null); setHovered(null); setXray(false); setPhase("exiting"); }, []);
  useEffect(() => { ambient?.set(sound); }, [ambient, sound]);
  useEffect(() => () => ambient?.dispose(), [ambient]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (product) setProduct(null);
      else if (selected) setSelected(null);
      else if (phase === "inside") exit();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, selected, product, exit]);

  const noop = useCallback(() => {}, []);
  const onIntroDone = useCallback(() => setPhase("outside"), []);
  const onDoor = useCallback(() => setPhase("entering"), []);
  const onEntered = useCallback(() => setPhase("inside"), []);
  const onExited = useCallback(() => setPhase("outside"), []);
  const onFade = useCallback((value: number) => { if (fadeRef.current) fadeRef.current.style.opacity = String(value); }, []);
  // Marketplace and Sell go straight to the real pages; the other products open an explanation first.
  const onProduct = useCallback((id: ProductId) => {
    if (id === "marketplace") router.push("/treg");
    else if (id === "sell") router.push("/shit");
    else setProduct((p) => (p === id ? null : id));
  }, [router]);
  const labels = useMemo(() => Object.fromEntries((Object.keys(PRODUCTS) as ProductId[]).map((id) => [id, { name: PRODUCTS[id].name.replace("ECONERA ", ""), text: SPOT_TEXT[id][lang] }])) as Record<ProductId, { name: string; text: string }>, [lang]);

  if (!webgl) return <StaticFallback />;

  const exterior = phase === "intro" || phase === "outside";
  const tool = "grid size-10 place-items-center rounded-full border border-line bg-bg/70 text-ink backdrop-blur transition hover:border-lime aria-pressed:border-lime aria-pressed:text-lime";

  return (
    <section aria-label={t("Hyrja", "Introduction")} className="theme-dark relative h-[100svh] min-h-[560px] overflow-hidden bg-bg text-ink">
      <div className={`absolute inset-0 ${exterior ? "max-md:bottom-[50%] max-md:top-16 lg:left-[34%]" : ""}`}>
        {phase !== "boot" && <Scene phase={phase} lowPower={lowPower} reducedMotion={reducedMotion} onReady={noop} onIntroDone={onIntroDone} onDoor={onDoor} onEntered={onEntered} onExited={onExited} onFade={onFade} hovered={hovered} selected={selected} xray={xray} onHover={setHovered} onSelect={setSelected}
          exploded={exploded} paused={paused} zoom={zoom} resetKey={resetKey} product={product} productLabels={labels} onProduct={onProduct} />}
      </div>
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_60%_45%,transparent_40%,rgba(3,24,21,0.72))]" />
      {exterior && <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(3,24,21,0.85)_0%,rgba(3,24,21,0.35)_42%,transparent_62%),linear-gradient(0deg,rgba(3,24,21,0.75),transparent_38%)]" />}
      <div ref={fadeRef} aria-hidden="true" className="pointer-events-none absolute inset-0 bg-bg opacity-0" />

      {exterior && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 px-5 pb-32 sm:px-8 sm:pb-14">
          <div className="xp-fade-in pointer-events-auto mx-auto w-full max-w-7xl">
            <div className="max-w-2xl">
              <h1 className="display text-[clamp(2.3rem,7vw,5.6rem)] leading-[0.95] text-ink">{t("Mos i hidh materialet. Ndërto mundësi.", "Don't waste materials. Build possibilities.")}</h1>
              <p className="mt-4 max-w-lg text-sm text-ink-2 sm:mt-5 sm:text-lg">{t("Zbulo, ripërdor dhe transformo materialet e ndërtimit me mjete inteligjente që kursejnë para dhe ulin mbetjet.", "Discover, reuse and transform construction materials with intelligent tools that save money and reduce waste.")}</p>
              <div className="mt-7 flex flex-wrap gap-2">
                <Link href="/treg" className="btn-primary h-12 px-6 text-base">{t("Eksploro tregun", "Explore Marketplace")}</Link>
                <Link href="/shit" className="btn-ghost h-12 bg-bg/60 px-6 text-base backdrop-blur">{t("Shit materiale", "Sell Materials")}</Link>
                <Link href="/ai" className="btn-ghost h-12 bg-bg/60 px-6 text-base backdrop-blur">{t("Zbulo mjetet AI", "Discover AI Tools")}</Link>
              </div>
              <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-ink-2">
                {phase === "intro"
                  ? <button type="button" onClick={() => setPhase("outside")} className="underline-offset-4 hover:text-ink hover:underline">{t("Kalo animacionin", "Skip animation")}</button>
                  : <><button type="button" onClick={onDoor} className="underline-offset-4 hover:text-ink hover:underline">{t("Hyr në interier", "Step inside")}</button><button type="button" onClick={start} className="underline-offset-4 hover:text-ink hover:underline">{t("Rishiko hyrjen", "Replay intro")}</button></>}
                <SoundToggle on={sound} onChange={setSound} labelled />
              </div>
            </div>
          </div>
        </div>
      )}

      {phase === "outside" && (
        <div className="xp-fade-in absolute top-20 right-3 z-30 flex flex-col items-end gap-2 sm:top-auto sm:right-6 sm:bottom-28">
          <div role="toolbar" aria-label={t("Kontrollet 3D", "3D controls")} className="flex items-center gap-1.5 rounded-full border border-line bg-bg/60 p-1.5 backdrop-blur">
            <details className="relative">
              <summary className={`${tool} w-auto cursor-pointer list-none px-3.5 text-xs font-medium [&::-webkit-details-marker]:hidden`}>{t("Produktet", "Products")}</summary>
              <ul className="absolute right-0 bottom-12 grid w-56 max-sm:top-12 max-sm:bottom-auto gap-1 rounded-2xl border border-line bg-bg/95 p-2 shadow-2xl backdrop-blur">
                {(Object.keys(PRODUCTS) as ProductId[]).map((id) => <li key={id}><button type="button" onClick={() => onProduct(id)} className="w-full rounded-xl px-3 py-2 text-left text-sm hover:bg-card"><span className="block font-medium">{PRODUCTS[id].name}</span><span className="block text-xs text-ink-2">{SPOT_TEXT[id][lang]}</span></button></li>)}
              </ul>
            </details>
            <button type="button" aria-pressed={exploded} onClick={() => setExploded((v) => !v)} className={`${tool} w-auto px-3.5 text-xs font-medium`}>{exploded ? t("Bashko katet", "Assemble") : t("Pamja e ndarë", "Exploded view")}</button>
            <button type="button" aria-pressed={paused} onClick={() => setPaused((v) => !v)} className={tool} aria-label={paused ? t("Rifillo rrotullimin", "Resume rotation") : t("Ndalo rrotullimin", "Pause rotation")}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" aria-hidden>{paused ? <path d="M3 2l9 5-9 5z" /> : <path d="M3 2h3v10H3zM8 2h3v10H8z" />}</svg>
            </button>
            <button type="button" onClick={() => setZoom((z) => Math.max(0.7, +(z - 0.15).toFixed(2)))} className={`${tool} max-sm:hidden`} aria-label={t("Afro", "Zoom in")}>+</button>
            <button type="button" onClick={() => setZoom((z) => Math.min(1.45, +(z + 0.15).toFixed(2)))} className={`${tool} max-sm:hidden`} aria-label={t("Largo", "Zoom out")}>−</button>
            <button type="button" onClick={() => { setZoom(1); setExploded(false); setResetKey((k) => k + 1); }} className={tool} aria-label={t("Rikthe kamerën", "Reset camera")}>
              <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden><path d="M2.5 8a5.5 5.5 0 1 0 1.7-4M2.5 2.5v3h3" strokeLinecap="round" /></svg>
            </button>
          </div>
          <p className="hidden text-[11px] text-ink-2 sm:block">{t("Tërhiq për ta rrotulluar · kliko pikat për produktet", "Drag to rotate · select a point to explore a product")}</p>
        </div>
      )}

      {product && phase === "outside" && <ProductPanel key={product} id={product} onClose={() => setProduct(null)} />}

      {phase === "inside" && !selected && (
        <div className="xp-fade-in absolute inset-x-0 bottom-0 z-20 flex justify-center px-5 pb-40 sm:pb-14">
          <div className="flex w-full max-w-4xl flex-col items-center gap-3">
            <p className="text-sm text-ink-2" aria-live="polite">{hovered ? hotspotLabel(hotspotById(hovered), lang) : t("Kliko një element për të parë materialet", "Click an element to see its materials")}</p>
            <ul className="flex max-w-full gap-2 overflow-x-auto pb-1 [scrollbar-width:none]" aria-label={t("Elementet e dhomës", "Room elements")}>
              {HOTSPOTS.map((h) => (
                <li key={h.id} className="shrink-0">
                  <button type="button" onClick={() => setSelected(h.id)} onMouseEnter={() => setHovered(h.id)} onMouseLeave={() => setHovered(null)} onFocus={() => setHovered(h.id)} onBlur={() => setHovered(null)}
                    className={`rounded-full border px-3.5 py-2 text-xs font-medium backdrop-blur transition ${hovered === h.id ? "border-lime bg-lime/10 text-lime" : "border-line bg-bg/70 text-ink hover:border-lime"}`}>{hotspotLabel(h, lang)}</button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {phase === "inside" && (
        <div className="xp-fade-in absolute top-24 left-5 z-20 flex flex-col gap-2 sm:left-8">
          <button type="button" className="btn-ghost bg-bg/70 backdrop-blur" onClick={exit}>{t("← Kthehu jashtë", "← Back outside")}</button>
          <button type="button" aria-pressed={xray} onClick={() => setXray((v) => !v)} className={`btn ${xray ? "bg-lime text-bg" : "border border-line bg-bg/70 text-ink backdrop-blur hover:border-lime hover:text-lime"}`}>
            <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.4"><rect x="2" y="2" width="12" height="12" rx="1.5" /><path d="M2 6h12M2 10h12M6 2v12M10 2v12" /></svg>
            {t("Pamje X-Ray", "X-ray view")}
          </button>
          <Link href="/treg" className="btn-primary">{t("Eksploro tregun", "Explore Marketplace")}</Link>
        </div>
      )}

      {phase === "inside" && selected && hotspotById(selected) && (
        <MaterialPanel key={selected} hotspot={hotspotById(selected)!} xray={xray} onXray={setXray} onClose={() => setSelected(null)} />
      )}

      {/* Welcome: says what ECONERA is, never blocks the marketplace. */}
      <div className={`absolute inset-0 z-30 grid place-items-center overflow-hidden transition-opacity duration-700 ${phase === "welcome" || phase === "boot" ? "opacity-100" : "pointer-events-none opacity-0"}`} aria-hidden={phase !== "welcome"} inert={phase !== "welcome"}>
        <div aria-hidden className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_38%,rgba(12,58,50,0.55),rgba(3,22,19,0.94)_62%)]" />
        <div aria-hidden className="xp-grid absolute inset-0 opacity-[0.07]" />
        <div aria-hidden className="xp-glow absolute top-[22%] left-1/2 h-64 w-[38rem] max-w-[90vw] -translate-x-1/2 rounded-full bg-[#c8f169]/10 blur-3xl" />
        {phase === "welcome" && (
          <div className="relative flex w-full max-w-2xl flex-col items-center px-6 pt-16 text-center">
            <LogoDraw className="w-full max-w-[19rem]" />
            <p className="mt-5 text-[11px] font-medium tracking-[0.42em] text-ink-2">CONSTRUCTION INTELLIGENCE</p>
            <h1 className="display xp-rise mt-10 text-[clamp(2.2rem,5.4vw,4rem)] leading-[1.02] text-ink">{t("E ardhmja ndërtohet ndryshe.", "The future is built differently.")}</h1>
            <p className="xp-rise mt-4 max-w-md text-base text-ink-2 [animation-delay:.12s] sm:text-lg">{t("Një platformë inteligjente. Mundësi pa fund për ndërtimin qarkullues.", "One intelligent platform. Endless possibilities for circular construction.")}</p>
            <div className="xp-rise mt-9 flex flex-col items-center gap-4 [animation-delay:.24s]">
              <button type="button" autoFocus onClick={start} className="btn-primary h-13 px-9 text-base">{t("Eksploro ECONERA", "Explore ECONERA")} <span aria-hidden>→</span></button>
              <Link href="/treg" onClick={remember} className="text-sm text-ink-2 underline-offset-4 hover:text-ink hover:underline">{t("Kalo hyrjen · Shko te tregu", "Skip intro · Go to Marketplace")}</Link>
              <SoundToggle on={sound} onChange={setSound} labelled />
            </div>
            <ul className="mt-14 hidden flex-wrap justify-center sm:flex gap-x-6 gap-y-2 border-t border-line pt-5 text-[11px] tracking-[0.18em] text-ink-2">
              <li>{t("EKONOMI QARKULLUESE", "CIRCULAR ECONOMY")}</li><li>{t("ME AI", "AI POWERED")}</li><li>{t("TREG MATERIALESH", "MATERIALS MARKETPLACE")}</li>
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}

function SoundToggle({ on, onChange, labelled = false }: { on: boolean; onChange: (on: boolean) => void; labelled?: boolean }) {
  const { t } = useLang();
  return (
    <button type="button" aria-pressed={on} onClick={() => onChange(!on)} className={labelled ? "inline-flex items-center gap-2 text-xs text-ink-2 hover:text-ink" : "btn-ghost size-11 px-0"} aria-label={labelled ? undefined : on ? t("Fik tingullin", "Mute") : t("Ndiz tingullin", "Unmute")}>
      <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 7h3l4-3v10l-4-3H3z" />
        {on ? <path d="M12.5 6.5a3.5 3.5 0 0 1 0 5M14.5 4.5a6.5 6.5 0 0 1 0 9" /> : <path d="M13 7l4 4M17 7l-4 4" />}
      </svg>
      {labelled && <span>{on ? t("Tingulli: ndezur", "Sound: on") : t("Tingulli: fikur", "Sound: off")}</span>}
    </button>
  );
}
