"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useLang } from "@/components/lang-provider";
import { HOTSPOTS, hotspotById, hotspotLabel } from "@/lib/interior";
import { PRODUCT_LEVEL, ProductSpots, type Level, type ProductId } from "./model";
import { PRODUCTS, ProductPanel } from "./product-panel";
import { MaterialPanel } from "./material-panel";
import type { Phase } from "./scene";
import { StaticFallback } from "./static-fallback";
import { BasketIcon, CutIcon, MarketIcon, RenovationIcon, VerifyIcon, VoiceIcon } from "@/components/site/tool-icons";
import { LogoDraw } from "./logo-draw";
import { WhatsNext, WhatsNextLink } from "@/components/roadmap/whats-next";
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
  marketplace: { sq: "Eksploro materialet", en: "Explore materials" }, verify: { sq: "Materiale të besueshme", en: "Trusted materials" },
  basket: { sq: "Planifiko blerjet", en: "Plan your purchases" }, renovation: { sq: "Dizajno hapësirën", en: "Design your space" },
  smartcut: { sq: "Optimizo materialet", en: "Optimize materials" }, voice: { sq: "Asistent AI i aksesueshëm", en: "Accessible AI assistant" }, sell: { sq: "Listo produktet e tua", en: "List your products" },
};

// Inside the building every ECONERA product has its own zone; the camera flies to the matching part of the room.
const ZONES: { id: ProductId; focus: string; zone: { sq: string; en: string } }[] = [
  { id: "marketplace", focus: "parket", zone: { sq: "Ekspozita e materialeve", en: "Materials gallery" } },
  { id: "renovation", focus: "dritare", zone: { sq: "Studio e dizajnit", en: "Design studio" } },
  { id: "basket", focus: "pllaka", zone: { sq: "Qendra e blerjeve", en: "Procurement desk" } },
  { id: "smartcut", focus: "dyer", zone: { sq: "Punishtja", en: "Workshop" } },
  { id: "verify", focus: "mur", zone: { sq: "Dokumentet dhe besimi", en: "Trust & documents" } },
  { id: "voice", focus: "cati", zone: { sq: "Pika e AI", en: "AI point" } },
];

const ZONE_ICON: Partial<Record<ProductId, (p: { className?: string }) => React.JSX.Element>> = { marketplace: MarketIcon, renovation: RenovationIcon, basket: BasketIcon, smartcut: CutIcon, verify: VerifyIcon, voice: VoiceIcon };

const ic = { width: 22, height: 22, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
const HERO_POINTS = [
  { sq: "Qarkullues", en: "Circular", icon: <svg {...ic}><path d="M7 18H4.5l3-5.2M17 6h2.5l-3 5.2M12 3.5l2.6 4.5M9.4 8 12 3.5M20 16l-2.6 4.5h-5M4 16l2.6 4.5" /></svg> },
  { sq: "Me AI", en: "AI Powered", icon: <svg {...ic}><rect x="6" y="6" width="12" height="12" rx="2" /><rect x="9.5" y="9.5" width="5" height="5" rx="1" /><path d="M9 3v3M15 3v3M9 18v3M15 18v3M3 9h3M3 15h3M18 9h3M18 15h3" /></svg> },
  { sq: "Materiale", en: "Materials", icon: <svg {...ic}><path d="m12 4 8 4-8 4-8-4z" /><path d="m4 12 8 4 8-4" /><path d="m4 16 8 4 8-4" /></svg> },
  { sq: "I qëndrueshëm", en: "Sustainable", icon: <svg {...ic}><path d="M5 19c0-8 5-13 15-14-1 10-6 15-14 15" /><path d="M5 19 13 11" /></svg> },
];

// The hero walks through the floors one by one; the matching floor lights up in the model.
const TOUR: ProductId[] = ["marketplace", "basket", "renovation", "smartcut"];

function Reveal({ text, delay }: { text: string; delay: number }) {
  return <>{text.split("").map((ch, i) => <span key={i} className="xp-char" style={{ animationDelay: `${delay + i * 0.028}s` }}>{ch === " " ? "\u00a0" : ch}</span>)}</>;
}

export function Experience() {
  const { lang, t } = useLang();
  const router = useRouter();
  const reducedMotion = useMedia("(prefers-reduced-motion: reduce)");
  const small = useMedia("(max-width: 767px)");
  const wide = useMedia("(min-width: 768px)");
  const webgl = useSyncExternalStore(subscribeNever, hasWebGL, () => true);
  const lowPower = small;

  const [phase, setPhase] = useState<Phase>("boot");
  const [hovered, setHovered] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [xray, setXray] = useState(false);
  const [product, setProduct] = useState<ProductId | null>(null);
  const [exploded, setExploded] = useState(false);
  const [paused, setPaused] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [resetKey, setResetKey] = useState(0);
  const [hotLevel, setHotLevel] = useState<Level | null>(null);
  const [hotSpot, setHotSpot] = useState<ProductId | null>(null);
  const [zone, setZone] = useState<ProductId | null>(null);
  const spotRefs = useRef<Partial<Record<ProductId, HTMLElement | null>>>({});
  const bubbleRef = useRef<HTMLDivElement>(null);
  const placeBubble = useCallback((x: number, y: number, visible: boolean) => {
    const el = bubbleRef.current;
    if (!el) return;
    el.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0)`;
    el.style.opacity = visible ? "1" : "0";
    // Open towards whichever side has room, so the bubble never covers the headline.
    const side = x + 330 < (el.parentElement?.clientWidth ?? window.innerWidth) ? "right" : "left";
    if (el.dataset.side !== side) el.dataset.side = side;
  }, []);
  const placeSpot = useCallback((id: ProductId, x: number, y: number, visible: boolean) => {
    const el = spotRefs.current[id];
    if (!el) return;
    el.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0)`;
    el.style.visibility = visible ? "" : "hidden";
  }, []);
  const [tour, setTour] = useState(0);
  const touring = phase === "outside" && !paused && !product && !hotSpot && hotLevel === null;
  useEffect(() => {
    if (!touring) return;
    const id = setInterval(() => setTour((i) => (i + 1) % TOUR.length), 4600);
    return () => clearInterval(id);
  }, [touring]);
  const tourId = TOUR[tour];
  const highlight: Level | null = hotLevel ?? (hotSpot ? PRODUCT_LEVEL[hotSpot] : product ? PRODUCT_LEVEL[product] : phase === "outside" ? PRODUCT_LEVEL[tourId] : null);
  const fadeRef = useRef<HTMLDivElement>(null);

  // First visit: welcome screen. Returning visitors land on the finished building, with a replay option.
  useEffect(() => {
    let seen = false;
    try { seen = localStorage.getItem(SEEN) === "1"; } catch { /* storage blocked */ }
    const id = setTimeout(() => setPhase(seen ? "outside" : "welcome"), 0);
    return () => clearTimeout(id);
  }, []);
  const remember = () => { try { localStorage.setItem(SEEN, "1"); } catch { /* ignore */ } };

  const exit = useCallback(() => { setZone(null); setSelected(null); setHovered(null); setXray(false); setPhase("exiting"); }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (product) setProduct(null);
      else if (zone) setZone(null);
      else if (selected) setSelected(null);
      else if (phase === "inside") exit();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, selected, product, zone, exit]);

  const noop = useCallback(() => {}, []);
  const onPickHotspot = useCallback((id: string) => { setZone(null); setSelected(id); }, []);
  const onIntroDone = useCallback(() => { try { localStorage.setItem(SEEN, "1"); } catch { /* ignore */ } setPhase("outside"); }, []);
  const onDoor = useCallback(() => { setProduct(null); setZone(null); setPhase("entering"); }, []);
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
      <div className={`absolute inset-0 ${exterior ? "max-md:bottom-[48%] max-md:top-28" : ""}`}>
        {phase !== "boot" && <Scene phase={phase} focus={zone ? ZONES.find((z) => z.id === zone)!.focus : null} lowPower={lowPower} reducedMotion={reducedMotion} onReady={noop} onIntroDone={onIntroDone} onDoor={onDoor} onEntered={onEntered} onExited={onExited} onFade={onFade} hovered={hovered} selected={selected} xray={xray} onHover={setHovered} onSelect={onPickHotspot}
          exploded={exploded} paused={paused} zoom={zoom} resetKey={resetKey} highlight={highlight} onHotLevel={setHotLevel} placeSpot={placeSpot} placeBubble={placeBubble} wide={wide} onProduct={onProduct} />}
        {/* Speech bubble that follows the robot's head (welcome and intro only). */}
        <div ref={bubbleRef} aria-live="polite" className="group/bubble pointer-events-none absolute max-sm:hidden top-0 left-0 z-40 opacity-0 transition-opacity duration-500" data-side="left">
          <div className="xp-bubble -mt-44 w-max max-w-[17rem] rounded-2xl group-data-[side=left]/bubble:-translate-x-[calc(100%+2rem)] group-data-[side=left]/bubble:rounded-br-sm group-data-[side=right]/bubble:ml-12 group-data-[side=right]/bubble:rounded-bl-sm border border-[#c8f169]/40 bg-[#04211d]/85 px-4 py-3 text-sm leading-snug text-white shadow-[0_10px_40px_-10px_rgba(200,241,105,0.35)] backdrop-blur-md sm:max-w-xs">
            <span className="flex items-start gap-2.5">
              <span aria-hidden className="xp-voice mt-1 flex h-4 items-end gap-[2px]">{[0, 1, 2, 3, 4].map((k) => <i key={k} style={{ animationDelay: `${k * 0.12}s` }} />)}</span>
              <span>
                <span className="block font-semibold text-[#c8f169]">{t("Përshëndetje, jam ECONERA AI.", "Hi, I'm ECONERA AI.")}</span>
                {phase === "inside"
                  ? t("Zgjidh një zonë dhe të çoj atje.", "Pick a zone and I'll take you there.")
                  : t("Të të tregoj çfarë ka brenda?", "Shall I show you what's inside?")}
              </span>
            </span>
          </div>
        </div>
        {phase !== "boot" && <ProductSpots refs={spotRefs} visible={phase === "outside" && exploded} labels={labels} onSelect={onProduct} onHover={setHotSpot} active={product} hot={highlight} />}
      </div>
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_60%_45%,transparent_40%,rgba(3,24,21,0.72))]" />
      {phase === "outside" && <div aria-hidden="true" className="xp-fade-in pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(3,24,21,0.85)_0%,rgba(3,24,21,0.35)_42%,transparent_62%),linear-gradient(0deg,rgba(3,24,21,0.75),transparent_38%)]" />}
      <div ref={fadeRef} aria-hidden="true" className="pointer-events-none absolute inset-0 bg-bg opacity-0" />

      {phase === "intro" && (
        <div className="xp-fade-in absolute inset-x-0 bottom-28 z-20 flex justify-center sm:bottom-10"><button type="button" onClick={() => setPhase("outside")} className="rounded-full border border-line bg-bg/70 px-5 py-2.5 text-sm text-ink backdrop-blur hover:border-lime">{t("Kalo animacionin", "Skip animation")}</button></div>
      )}
      {phase === "outside" && (
        <div className="pointer-events-none absolute inset-0 z-20 flex items-end px-5 pb-24 sm:px-8 sm:pb-16 md:items-center md:pb-0">
          <div className="mx-auto w-full max-w-7xl">
            <div className="pointer-events-auto max-w-[36rem] md:max-w-[46%] lg:pt-10 xl:max-w-[36rem]">
              <p className="xp-rise-soft text-[11px] font-medium tracking-[0.42em] text-white/80 sm:text-xs [animation-delay:.05s]">{t("INTELIGJENCA E", "CONSTRUCTION")} <span className="font-semibold text-[#c8f169]">{t("NDËRTIMIT", "INTELLIGENCE")}</span></p>
              <h1 aria-label={t("E ardhmja ndërtohet ndryshe.", "The future is built differently.")} className="display mt-4 text-[clamp(2.3rem,4.7vw,4.8rem)] leading-[0.98] tracking-[-0.045em] text-white">
                {(lang === "en" ? [["The future is", ""], ["built ", "differently."]] : [["E ardhmja", ""], ["ndërtohet ", "ndryshe."]]).map(([plain, lime], i) => (
                  <span key={i} aria-hidden className="relative block whitespace-nowrap">
                    <Reveal text={plain} delay={0.15 + i * 0.4} />
                    {lime && <span className="text-[#c8f169] [text-shadow:0_0_40px_rgba(200,241,105,.35)]"><Reveal text={lime} delay={0.15 + i * 0.4 + plain.length * 0.028} /></span>}
                  </span>
                ))}
              </h1>
              <p className="xp-rise-soft mt-5 max-w-md text-base text-white/80 sm:text-lg [animation-delay:.9s]">{t("Eksploro arkitekturën, materialet dhe inteligjencën në një platformë për ndërtimin qarkullues.", "Explore architecture, materials and intelligence in one circular construction platform.")}</p>
              <div className="xp-rise-soft mt-7 flex flex-wrap gap-3 [animation-delay:1.1s]">
                <button type="button" onClick={onDoor} className="btn-primary h-13 gap-3 px-7 text-base shadow-[0_0_40px_-8px_rgba(200,241,105,.6)]">
                  <svg width="12" height="14" viewBox="0 0 12 14" fill="currentColor" aria-hidden><path d="M0 0l12 7-12 7z" /></svg>
                  {t("Hyr në ndërtesë", "Enter the building")} <span aria-hidden>→</span>
                </button>
                <Link href="/treg" className="inline-flex h-13 items-center rounded-full border border-white/40 bg-white/[0.03] px-7 text-base font-semibold text-white backdrop-blur transition hover:border-[#c8f169] hover:text-[#c8f169]">{t("Shko te tregu", "Go to Marketplace")}</Link>
              </div>
              <ul className="xp-rise-soft mt-9 hidden max-w-md grid-cols-4 [@media(max-height:820px)]:mt-6 divide-x divide-white/10 sm:grid [animation-delay:1.3s]">
                {HERO_POINTS.map((p) => <li key={p.en} className="flex flex-col items-center gap-2 px-2 text-center text-xs text-white/80"><span className="text-[#c8f169]">{p.icon}</span>{p[lang]}</li>)}
              </ul>
              <div className="xp-rise-soft hidden sm:block [animation-delay:1.4s]"><WhatsNext /></div>
              <div className="xp-rise-soft mt-5 sm:hidden [animation-delay:1.3s]"><WhatsNextLink /></div>
              <div className="xp-rise-soft mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-white/55 [animation-delay:1.45s]">
                <a href="#asistenti" data-open-assistant="" className="underline-offset-4 hover:text-white hover:underline">{t("Fol me ECONERA AI", "Talk to ECONERA AI")}</a>
                <button type="button" onClick={() => { setProduct(null); setPhase("welcome"); }} className="underline-offset-4 hover:text-white hover:underline">{t("Rishiko hyrjen", "Replay intro")}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {phase === "outside" && (
        <div className="xp-fade-in absolute top-24 right-8 z-30 hidden flex-col items-end gap-2 xl:flex">
          <div role="toolbar" aria-label={t("Kontrollet 3D", "3D controls")} className="flex items-center gap-1.5 rounded-full border border-line bg-bg/60 p-1.5 backdrop-blur">
            <details className="relative">
              <summary className={`${tool} w-auto cursor-pointer list-none px-3.5 text-xs font-medium [&::-webkit-details-marker]:hidden`}>{t("Produktet", "Products")}</summary>
              <ul className="absolute top-12 right-0 grid w-56 gap-1 rounded-2xl border border-line bg-bg/95 p-2 shadow-2xl backdrop-blur">
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
          <p className="hidden text-[11px] text-ink-2 sm:block">{t("Çdo kat është një produkt · tërhiq për ta rrotulluar", "Each floor is a product · drag to rotate")}</p>
        </div>
      )}

      {product && phase === "outside" && <ProductPanel key={product} id={product} onClose={() => setProduct(null)} />}

      {phase === "inside" && !selected && !zone && (
        <div className="xp-fade-in absolute inset-x-0 bottom-0 z-20 flex justify-center px-4 pb-36 sm:pb-12">
          <div className="flex w-full max-w-6xl flex-col items-center gap-3">
            <p className="text-[11px] font-semibold tracking-[0.18em] text-lime">{t("ZONAT E ECONERA", "ECONERA ZONES")}</p>
            <ul className="grid w-full grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6" aria-label={t("Zonat e ndërtesës", "Building zones")}>
              {ZONES.map((z) => {
                const Icon = ZONE_ICON[z.id]!;
                return (
                  <li key={z.id}>
                    <button type="button" onClick={() => setZone(z.id)} className="group flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-[#04211d]/75 p-3 text-left backdrop-blur-md transition hover:border-[#c8f169]/60 hover:bg-[#0a3a33]/80">
                      <span className="grid size-9 shrink-0 place-items-center rounded-xl border border-[#c8f169]/30 bg-[#c8f169]/10 text-[#c8f169]"><Icon className="size-[18px]" /></span>
                      <span className="min-w-0"><span className="block text-sm font-semibold leading-tight text-white">{PRODUCTS[z.id].name.replace("ECONERA ", "")}</span><span className="block text-xs leading-tight text-ink-2">{z.zone[lang]}</span></span>
                    </button>
                  </li>
                );
              })}
            </ul>
            <details className="text-xs text-ink-2">
              <summary className="cursor-pointer list-none rounded-full border border-line bg-bg/70 px-3.5 py-1.5 backdrop-blur hover:text-ink [&::-webkit-details-marker]:hidden">{t("Materialet e dhomës", "Room materials")}</summary>
              <ul className="mt-2 flex max-w-[90vw] flex-wrap justify-center gap-2" aria-label={t("Elementet e dhomës", "Room elements")}>
                {HOTSPOTS.map((h) => (
                  <li key={h.id}><button type="button" onClick={() => setSelected(h.id)} className="rounded-full border border-line bg-bg/70 px-3 py-1.5 font-medium text-ink backdrop-blur hover:border-lime">{hotspotLabel(h, lang)}</button></li>
                ))}
              </ul>
            </details>
          </div>
        </div>
      )}

      {phase === "inside" && zone && (
        <>
          <div aria-hidden className="xp-zone-light pointer-events-none absolute inset-0 z-10" />
          <ProductPanel key={zone} id={zone} onClose={() => setZone(null)} />
          <div className="xp-fade-in absolute inset-x-0 bottom-6 z-20 flex justify-center gap-2 px-4 max-md:hidden">
            {ZONES.map((z) => <button key={z.id} type="button" aria-pressed={zone === z.id} onClick={() => setZone(z.id)} className={`rounded-full border px-3.5 py-1.5 text-xs font-medium backdrop-blur transition ${zone === z.id ? "border-[#c8f169] bg-[#c8f169]/15 text-[#c8f169]" : "border-line bg-bg/70 text-ink hover:border-lime"}`}>{PRODUCTS[z.id].name.replace("ECONERA ", "")}</button>)}
          </div>
        </>
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

      {/* Welcome: the robot greets the visitor in front of the blueprint; the marketplace is always one click away. */}
      <div className={`pointer-events-none absolute inset-0 z-30 transition-opacity duration-700 ${phase === "welcome" || phase === "boot" ? "opacity-100" : "opacity-0"}`} aria-hidden={phase !== "welcome"} inert={phase !== "welcome"}>
        <div aria-hidden className="absolute inset-0 bg-[radial-gradient(ellipse_at_60%_45%,transparent_30%,rgba(3,22,19,0.7)_80%)]" />
        <div aria-hidden className="xp-grid absolute inset-0 opacity-[0.05]" />
        {phase === "welcome" && (
          <>
            {/* Scene 1: the identity, alone in the dark, before the building emerges behind it. */}
            <div aria-hidden className="xp-logo-scene absolute inset-0 grid place-items-center">
              <div className="flex flex-col items-center gap-5">
                <LogoDraw className="w-[min(70vw,20rem)]" />
                <p className="text-[11px] font-medium tracking-[0.5em] text-white/70">CONSTRUCTION <span className="text-[#c8f169]">INTELLIGENCE</span></p>
              </div>
            </div>
            <div className="pointer-events-auto absolute inset-x-0 bottom-28 flex justify-center lg:bottom-10">
              <button type="button" onClick={() => { remember(); setPhase("outside"); }} className="rounded-full border border-white/20 bg-black/30 px-5 py-2.5 text-sm text-white/80 backdrop-blur hover:border-[#c8f169] hover:text-white">{t("Kalo hyrjen", "Skip intro")}</button>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

