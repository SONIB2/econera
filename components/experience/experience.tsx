"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useLang } from "@/components/lang-provider";
import { HOTSPOTS, hotspotById, hotspotLabel } from "@/lib/interior";
import { LogoDraw } from "./logo-draw";
import { PRODUCT_LEVEL, ProductSpots, type Level, type ProductId } from "./model";
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
  marketplace: { sq: "Eksploro materialet", en: "Explore materials" }, verify: { sq: "Materiale të besueshme", en: "Trusted materials" },
  basket: { sq: "Planifiko blerjet", en: "Plan your purchases" }, renovation: { sq: "Dizajno hapësirën", en: "Design your space" },
  smartcut: { sq: "Optimizo materialet", en: "Optimize materials" }, voice: { sq: "Asistent AI i aksesueshëm", en: "Accessible AI assistant" }, sell: { sq: "Listo produktet e tua", en: "List your products" },
};

// The hero walks through the floors one by one; the matching floor lights up in the model.
const TOUR: ProductId[] = ["marketplace", "basket", "renovation", "smartcut"];
const TOUR_TEXT: Record<string, { sq: string; en: string }> = {
  marketplace: { sq: "Materiale të tepërta, të rikuperuara dhe copa, gati për projektin tjetër.", en: "Surplus, reclaimed and offcut materials, ready for the next project." },
  basket: { sq: "Shkruaj listën e projektit. AI gjen shitësit realë brenda buxhetit.", en: "Write your project list. AI finds real sellers within your budget." },
  renovation: { sq: "Ngarko foton e dhomës dhe shihe me materiale që ekzistojnë në treg.", en: "Upload a room photo and see it with materials that exist on the market." },
  smartcut: { sq: "Fut prerjet që të duhen. Gjej copat që i mbulojnë para se të blesh pllakë të re.", en: "Enter your cuts. Find offcuts that cover them before buying a new sheet." },
};

function Reveal({ text, delay }: { text: string; delay: number }) {
  return <>{text.split("").map((ch, i) => <span key={i} className="xp-char" style={{ animationDelay: `${delay + i * 0.028}s` }}>{ch === " " ? "\u00a0" : ch}</span>)}</>;
}

export function Experience() {
  const { lang, t } = useLang();
  const router = useRouter();
  const reducedMotion = useMedia("(prefers-reduced-motion: reduce)");
  const small = useMedia("(max-width: 767px)");
  const wide = useMedia("(min-width: 1024px)");
  const webgl = useSyncExternalStore(subscribeNever, hasWebGL, () => true);
  const lowPower = small;

  const [phase, setPhase] = useState<Phase>("boot");
  const [hovered, setHovered] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [xray, setXray] = useState(false);
  const [product, setProduct] = useState<ProductId | null>(null);
  const [exploded, setExploded] = useState(true);
  const [paused, setPaused] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [resetKey, setResetKey] = useState(0);
  const [hotLevel, setHotLevel] = useState<Level | null>(null);
  const [hotSpot, setHotSpot] = useState<ProductId | null>(null);
  const spotRefs = useRef<Partial<Record<ProductId, HTMLElement | null>>>({});
  const bubbleRef = useRef<HTMLDivElement>(null);
  const placeBubble = useCallback((x: number, y: number, visible: boolean) => {
    const el = bubbleRef.current;
    if (!el) return;
    el.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0)`;
    el.style.opacity = visible ? "1" : "0";
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
  const start = () => { remember(); setProduct(null); setExploded(true); setPhase("outside"); };

  const exit = useCallback(() => { setSelected(null); setHovered(null); setXray(false); setPhase("exiting"); }, []);

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
      <div className={`absolute inset-0 ${exterior ? "max-md:bottom-[48%] max-md:top-28" : ""}`}>
        {phase !== "boot" && <Scene phase={phase} lowPower={lowPower} reducedMotion={reducedMotion} onReady={noop} onIntroDone={onIntroDone} onDoor={onDoor} onEntered={onEntered} onExited={onExited} onFade={onFade} hovered={hovered} selected={selected} xray={xray} onHover={setHovered} onSelect={setSelected}
          exploded={exploded} paused={paused} zoom={zoom} resetKey={resetKey} highlight={highlight} onHotLevel={setHotLevel} placeSpot={placeSpot} placeBubble={placeBubble} wide={wide} onProduct={onProduct} />}
        {/* Speech bubble that follows the robot's head (welcome and intro only). */}
        <div ref={bubbleRef} aria-live="polite" className="pointer-events-none absolute max-sm:hidden top-0 left-0 z-40 opacity-0 transition-opacity duration-500">
          <div className="xp-bubble ml-14 -mt-36 w-max max-w-[16rem] rounded-2xl rounded-bl-sm border border-[#c8f169]/40 bg-[#04211d]/85 px-4 py-3 text-sm leading-snug text-white shadow-[0_10px_40px_-10px_rgba(200,241,105,0.35)] backdrop-blur-md sm:max-w-xs">
            {phase === "intro"
              ? <><span className="block text-[11px] font-semibold text-[#c8f169]">ECONERA</span>{t("Shiko si çdo material gjen vendin e vet.", "Watch every material find its place.")}</>
              : <><span className="block text-[11px] font-semibold text-[#c8f169]">{t("Përshëndetje, jam ECONERA", "Hi, I'm ECONERA")}</span>{t("Asistenti yt për ndërtimin qarkullues. Ta ndërtoj para syve të tu?", "Your assistant for circular construction. Shall I build it in front of you?")}</>}
          </div>
        </div>
        {phase !== "boot" && <ProductSpots refs={spotRefs} visible={phase === "outside"} labels={labels} onSelect={onProduct} onHover={setHotSpot} active={product} hot={highlight} />}
      </div>
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_60%_45%,transparent_40%,rgba(3,24,21,0.72))]" />
      {phase === "outside" && <div aria-hidden="true" className="xp-fade-in pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(3,24,21,0.85)_0%,rgba(3,24,21,0.35)_42%,transparent_62%),linear-gradient(0deg,rgba(3,24,21,0.75),transparent_38%)]" />}
      <div ref={fadeRef} aria-hidden="true" className="pointer-events-none absolute inset-0 bg-bg opacity-0" />

      {phase === "intro" && (
        <div className="xp-fade-in absolute inset-x-0 bottom-28 z-20 flex justify-center sm:bottom-10"><button type="button" onClick={() => setPhase("outside")} className="rounded-full border border-line bg-bg/70 px-5 py-2.5 text-sm text-ink backdrop-blur hover:border-lime">{t("Kalo animacionin", "Skip animation")}</button></div>
      )}
      {phase === "outside" && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 px-5 pb-28 sm:px-8 sm:pb-12">
          <div className="mx-auto w-full max-w-7xl">
            <div className="pointer-events-auto max-w-2xl">
              <h1 aria-label={t("Çdo material ka një të ardhme.", "Every material has a future.")} className="display text-white text-[clamp(2.6rem,7.4vw,6.2rem)] leading-[0.92] tracking-[-0.035em]">
                {(lang === "en" ? ["Every material", "has a future."] : ["Çdo material", "ka një të ardhme."]).map((line, i) => <span key={line} aria-hidden className="relative block whitespace-nowrap"><Reveal text={line} delay={0.15 + i * 0.4} /><span className="xp-glint absolute inset-0" style={{ animationDelay: `${2.2 + i * 0.25}s` }}>{line}</span></span>)}
              </h1>

              <button type="button" onClick={() => onProduct(tourId)} onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}
                className="xp-rise-soft group mt-7 flex w-full max-w-xl items-stretch gap-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left backdrop-blur-md transition hover:border-[#c8f169]/50 sm:p-5 [animation-delay:1.1s]">
                <span className="xp-num grid min-w-[4.5rem] place-items-center display text-5xl font-semibold leading-none sm:text-6xl">{String(tour + 1).padStart(2, "0")}</span>
                <span key={tourId} className="xp-swap flex min-w-0 flex-1 flex-col justify-center">
                  <span className="flex items-center gap-2 text-base font-semibold text-white sm:text-lg"><span className="size-2 rounded-full bg-[#c8f169] shadow-[0_0_12px_2px_rgba(200,241,105,.7)]" />{PRODUCTS[tourId].name}<span aria-hidden className="ml-auto text-[#c8f169] transition group-hover:translate-x-1">→</span></span>
                  <span className="mt-1 text-sm leading-snug text-ink-2">{TOUR_TEXT[tourId][lang]}</span>
                  <span className="mt-3 flex gap-1.5" aria-hidden>{TOUR.map((id, i) => <span key={id} className="relative h-[3px] flex-1 overflow-hidden rounded-full bg-white/10">{i < tour && <span className="absolute inset-0 bg-[#c8f169]/60" />}{i === tour && <span key={`${tour}-${paused}`} className={`absolute inset-y-0 left-0 bg-[#c8f169] ${touring ? "xp-progress" : "w-full"}`} />}</span>)}</span>
                </span>
              </button>

              <div className="xp-rise-soft mt-6 flex flex-wrap gap-2 [animation-delay:1.3s]">
                <Link href="/treg" className="btn-primary h-12 px-6 text-base">{t("Eksploro tregun", "Explore Marketplace")}</Link>
                <Link href="/shit" className="btn-ghost h-12 bg-bg/60 px-6 text-base backdrop-blur">{t("Shit materiale", "Sell Materials")}</Link>
              </div>
              <div className="xp-rise-soft mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-ink-2 [animation-delay:1.45s]">
                <Link href="/ai" className="font-medium text-lime underline-offset-4 hover:underline">{t("Zbulo mjetet AI", "Discover AI Tools")}</Link>
                <button type="button" onClick={onDoor} className="underline-offset-4 hover:text-ink hover:underline">{t("Hyr në interier", "Step inside")}</button>
                <button type="button" onClick={() => { setProduct(null); setPhase("welcome"); }} className="underline-offset-4 hover:text-ink hover:underline">{t("Rishiko hyrjen", "Replay intro")}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {phase === "outside" && (
        <div className="xp-fade-in absolute top-20 right-3 z-30 flex max-w-[calc(100vw-1.5rem)] flex-col items-end gap-2 sm:top-24 sm:right-8">
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
            <button type="button" onClick={() => { setZoom(1); setExploded(true); setResetKey((k) => k + 1); }} className={tool} aria-label={t("Rikthe kamerën", "Reset camera")}>
              <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden><path d="M2.5 8a5.5 5.5 0 1 0 1.7-4M2.5 2.5v3h3" strokeLinecap="round" /></svg>
            </button>
          </div>
          <p className="hidden text-[11px] text-ink-2 sm:block">{t("Çdo kat është një produkt · tërhiq për ta rrotulluar", "Each floor is a product · drag to rotate")}</p>
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

      {/* Welcome: the robot greets the visitor in front of the blueprint; the marketplace is always one click away. */}
      <div className={`pointer-events-none absolute inset-0 z-30 transition-opacity duration-700 ${phase === "welcome" || phase === "boot" ? "opacity-100" : "opacity-0"}`} aria-hidden={phase !== "welcome"} inert={phase !== "welcome"}>
        <div aria-hidden className="absolute inset-0 bg-[radial-gradient(ellipse_at_65%_45%,transparent_25%,rgba(3,22,19,0.85)_75%)] max-lg:bg-[linear-gradient(0deg,rgba(3,22,19,0.95)_35%,transparent_70%)] lg:bg-[linear-gradient(90deg,rgba(3,22,19,0.95)_0%,rgba(3,22,19,0.6)_40%,transparent_65%)]" />
        <div aria-hidden className="xp-grid absolute inset-0 opacity-[0.05]" />
        {phase === "welcome" && (
          <div className="pointer-events-auto absolute inset-x-0 bottom-0 px-5 pb-28 sm:px-8 lg:top-0 lg:flex lg:items-center lg:pb-0" style={{ animation: reducedMotion ? undefined : "xp-fade 1s cubic-bezier(.16,1,.3,1) 2.4s both" }}>
            <div className="mx-auto w-full max-w-7xl">
              <div className="max-w-xl">
                <LogoDraw className="w-full max-w-[15rem] max-sm:hidden" />
                <p className="mt-4 text-[11px] font-medium tracking-[0.42em] text-ink-2 max-sm:hidden">CONSTRUCTION INTELLIGENCE</p>
                <h1 className="display mt-6 text-[clamp(2.3rem,5.6vw,4.6rem)] leading-[0.98] text-ink sm:mt-8">{(lang === "en" ? ["The future is", "built differently."] : ["E ardhmja", "ndërtohet ndryshe."]).map((line, i) => <span key={line} className="block overflow-hidden pb-[0.08em]"><span className="xp-line block" style={{ animationDelay: `${2.5 + i * 0.14}s` }}>{line}</span></span>)}</h1>
                <p className="xp-rise-soft mt-4 max-w-md text-base text-ink-2 sm:text-lg">{t("Një platformë inteligjente. Mundësi pa fund për ndërtimin qarkullues.", "One intelligent platform. Endless possibilities for circular construction.")}</p>
                <div className="xp-rise-soft mt-7 flex flex-wrap items-center gap-x-5 gap-y-3 [animation-delay:.7s]">
                  <button type="button" autoFocus onClick={start} className="btn-primary h-13 px-8 text-base">{t("Eksploro ECONERA", "Explore ECONERA")} <span aria-hidden>→</span></button>
                  <Link href="/treg" onClick={remember} className="text-sm text-ink-2 underline-offset-4 hover:text-ink hover:underline">{t("Kalo hyrjen · Shko te tregu", "Skip intro · Go to Marketplace")}</Link>
                </div>
                <ul className="mt-10 hidden flex-wrap gap-x-6 gap-y-2 border-t border-line pt-4 text-[11px] tracking-[0.18em] text-ink-2 sm:flex">
                  <li>{t("EKONOMI QARKULLUESE", "CIRCULAR ECONOMY")}</li><li>{t("ME AI", "AI POWERED")}</li><li>{t("TREG MATERIALESH", "MATERIALS MARKETPLACE")}</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

