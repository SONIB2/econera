"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { AccountMenu } from "@/components/account-menu";
import { LangToggle, useLang } from "@/components/lang-provider";
import { ACCOUNT_LINKS, NAV } from "@/lib/lang";
import { HOTSPOTS, hotspotById, hotspotLabel } from "@/lib/interior";
import { createAmbient } from "./ambient";
import { LogoDraw } from "./logo-draw";
import { MaterialPanel } from "./material-panel";
import type { Phase } from "./scene";
import { StaticFallback } from "./static-fallback";
import "./experience.css";

const Scene = dynamic(() => import("./scene"), { ssr: false });

const PARTICLES = Array.from({ length: 36 }, (_, i) => {
  const a = (i * 137.508 * Math.PI) / 180;
  const r = 34 + ((i * 53) % 40);
  return {
    // Rounded so server and browser render identical strings.
    x: `${(Math.cos(a) * r).toFixed(2)}vmax`, y: `${(Math.sin(a) * r * 0.7).toFixed(2)}vmax`,
    tx: `${-150 + ((i * 29) % 300)}px`, ty: `${-18 + ((i * 7) % 36)}px`,
    delay: `${(i % 12) * 0.07}s`, d: `${1.5 + (i % 5) * 0.12}s`,
  };
});

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

export function Experience() {
  const { lang, t } = useLang();
  const reducedMotion = useMedia("(prefers-reduced-motion: reduce)");
  const small = useMedia("(max-width: 767px)");
  const webgl = useSyncExternalStore(subscribeNever, hasWebGL, () => true);
  const lowPower = small;

  const [phase, setPhase] = useState<Phase>("loading");
  const [sceneReady, setSceneReady] = useState(false);
  const [progress, setProgress] = useState(0);
  const [sound, setSound] = useState(false);
  const [menu, setMenu] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [xray, setXray] = useState(false);
  const fadeRef = useRef<HTMLDivElement>(null);
  const ambient = useMemo(() => (typeof window === "undefined" ? null : createAmbient()), []);

  // Loading progress: real readiness gates the last 15%, so the counter never lies about being done.
  useEffect(() => {
    if (phase !== "loading") return;
    let frame = 0;
    const started = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - started) / (reducedMotion ? 300 : 2200));
      const eased = 1 - Math.pow(1 - t, 3);
      const value = Math.round(sceneReady ? eased * 100 : Math.min(85, eased * 100));
      setProgress(value);
      if (value >= 100) { setPhase("ready"); return; }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [phase, sceneReady, reducedMotion]);

  const exit = useCallback(() => { setSelected(null); setHovered(null); setXray(false); setPhase("exiting"); }, []);
  useEffect(() => { ambient?.set(sound); }, [ambient, sound]);
  useEffect(() => () => ambient?.dispose(), [ambient]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (menu) setMenu(false);
      else if (selected) setSelected(null);
      else if (phase === "inside") exit();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menu, phase, selected, exit]);

  const onReady = useCallback(() => setSceneReady(true), []);
  const onIntroDone = useCallback(() => setPhase("outside"), []);
  const onDoor = useCallback(() => setPhase("entering"), []);
  const onEntered = useCallback(() => setPhase("inside"), []);
  const onExited = useCallback(() => setPhase("outside"), []);
  const onFade = useCallback((value: number) => { if (fadeRef.current) fadeRef.current.style.opacity = String(value); }, []);

  if (!webgl) return <StaticFallback />;

  const loaderVisible = phase === "loading" || phase === "ready";
  const hud = !loaderVisible;

  return (
    <div className="fixed inset-0 overflow-hidden bg-bg text-ink">
      <h1 className="sr-only">{t("ECONERA: Ndërtimi takon inteligjencën. Tregu online ku materialet e tepërta të ndërtimit gjejnë projektin e radhës, me AI.", "ECONERA: Construction meets intelligence. The online market where surplus construction materials find their next project, with AI.")}</h1>

      <div className="absolute inset-0">
        <Scene phase={phase} lowPower={lowPower} reducedMotion={reducedMotion} onReady={onReady} onIntroDone={onIntroDone} onDoor={onDoor} onEntered={onEntered} onExited={onExited} onFade={onFade} hovered={hovered} selected={selected} xray={xray} onHover={setHovered} onSelect={setSelected} />
      </div>
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(3,24,21,0.7))]" />
      <div ref={fadeRef} aria-hidden="true" className="pointer-events-none absolute inset-0 bg-bg opacity-0" />

      {/* HUD */}
      <header className={`absolute inset-x-0 top-0 z-20 transition-opacity duration-700 ${hud ? "opacity-100" : "pointer-events-none opacity-0"}`}>
        <div className="flex h-16 items-center justify-between px-5 sm:px-8">
          <Link href="/" aria-label={t("ECONERA, kryefaqja", "ECONERA, home")}><Image src="/brand/logo-dark.svg" alt="" width={481} height={66} className="h-5 w-auto sm:h-6" priority /></Link>
          <div className="flex items-center gap-2">
            <LangToggle />
            <SoundToggle on={sound} onChange={setSound} />
            <Link href="/treg" className="btn-ghost hidden h-11 bg-bg/60 backdrop-blur lg:inline-flex">{t("Tregu", "Market")}</Link>
            <AccountMenu className="hidden md:block" />
            <Link href="/regjistrohu" className="btn-primary hidden h-11 whitespace-nowrap sm:inline-flex">{t("Regjistrohu falas", "Sign up free")}</Link>
            <button type="button" className="btn-ghost size-11 px-0" aria-expanded={menu} aria-controls="xp-menu" aria-label={menu ? t("Mbyll menunë", "Close menu") : t("Hap menunë", "Open menu")} onClick={() => setMenu((v) => !v)}>
              <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">{menu ? <path d="M4 4l10 10M14 4L4 14" /> : <path d="M2 6h14M2 12h14" />}</svg>
            </button>
          </div>
        </div>
      </header>

      <nav id="xp-menu" aria-label={t("Menuja", "Menu")} hidden={!menu} className="absolute top-16 right-4 z-30 w-[min(20rem,calc(100vw-2rem))] rounded-card border border-line bg-bg/90 p-3 backdrop-blur-md xp-fade-in">
        <ul className="grid">
          {NAV.filter((item) => item.href !== "/").map((item) => (
            <li key={item.href}><Link href={item.href} className="block rounded-xl px-4 py-3 text-ink-2 hover:bg-card hover:text-ink">{item[lang]}</Link></li>
          ))}
        </ul>
        <div className="mt-2 grid gap-2 border-t border-line pt-3">
          {ACCOUNT_LINKS.map((g) => (
            <div key={g.group.sq}>
              <p className="px-4 pb-1 text-[11px] font-semibold tracking-[0.18em] text-lime uppercase">{g.group[lang]}</p>
              {g.items.map((i) => <Link key={i.href} href={i.href} className="block rounded-xl px-4 py-2.5 text-sm text-ink hover:bg-card">{i[lang]}</Link>)}
            </div>
          ))}
        </div>
      </nav>

      <div className={`absolute inset-x-0 bottom-0 z-20 flex justify-center px-5 pb-8 transition-opacity duration-700 ${hud ? "opacity-100" : "pointer-events-none opacity-0"}`}>
        {phase === "outside" && (
          <div className="xp-fade-in flex flex-col items-center gap-4 text-center">
            <p className="text-sm text-ink-2"><span className="hidden sm:inline">{t("Kliko derën për të hyrë", "Click the door to enter")}</span><span className="sm:hidden">{t("Prek butonin për të hyrë", "Tap the button to enter")}</span></p>
            <div className="flex flex-wrap justify-center gap-2">
              <button type="button" className="btn-primary" onClick={onDoor}>{t("Hyr në ndërtesë", "Enter the building")}</button>
              <Link href="/treg" className="btn-ghost bg-bg/60 backdrop-blur">{t("Shiko tregun", "Browse the market")}</Link>
            </div>
          </div>
        )}
        {phase === "inside" && !selected && (
          <div className="xp-fade-in flex w-full max-w-4xl flex-col items-center gap-3">
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
        )}
      </div>

      {phase === "inside" && (
        <div className="xp-fade-in absolute top-20 left-5 z-20 flex flex-col gap-2 sm:left-8">
          <button type="button" className="btn-ghost bg-bg/70 backdrop-blur" onClick={exit}>{t("← Kthehu jashtë", "← Back outside")}</button>
          <button type="button" aria-pressed={xray} onClick={() => setXray((v) => !v)} className={`btn ${xray ? "bg-lime text-bg" : "border border-line bg-bg/70 text-ink backdrop-blur hover:border-lime hover:text-lime"}`}>
            <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.4"><rect x="2" y="2" width="12" height="12" rx="1.5" /><path d="M2 6h12M2 10h12M6 2v12M10 2v12" /></svg>
            Pamje X-Ray
          </button>
        </div>
      )}

      {phase === "inside" && selected && hotspotById(selected) && (
        <MaterialPanel key={selected} hotspot={hotspotById(selected)!} xray={xray} onXray={setXray} onClose={() => setSelected(null)} />
      )}

      {/* Loader */}
      <div className={`absolute inset-0 z-40 grid place-items-center bg-[#041e1b] transition-opacity duration-1000 ${loaderVisible ? "opacity-100" : "pointer-events-none opacity-0"}`} aria-hidden={!loaderVisible}>
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          {PARTICLES.map((p, i) => (
            <span key={i} className="ld-particle" style={{ "--x": p.x, "--y": p.y, "--tx": p.tx, "--ty": p.ty, "--delay": p.delay, "--d": p.d } as React.CSSProperties} />
          ))}
        </div>
        <div className="relative flex w-full max-w-xl flex-col items-center px-8 text-center">
          <LogoDraw className="w-full max-w-md" />
          <p className="mt-6 text-[11px] font-medium tracking-[0.4em] text-ink-2 uppercase">Construction intelligence</p>
          <p className="display mt-8 text-2xl text-ink sm:text-3xl">{t("Ndërtimi takon inteligjencën.", "Construction meets intelligence.")}</p>
          <div className="mt-10 h-24">
            {phase === "loading" ? (
              <div className="flex flex-col items-center gap-3" role="status" aria-live="polite">
                <span className="font-mono text-sm tabular-nums text-lime">{String(progress).padStart(3, "0")}%</span>
                <span className="block h-px w-48 overflow-hidden bg-line"><span className="block h-full bg-lime transition-[width] duration-150" style={{ width: `${progress}%` }} /></span>
                <span className="sr-only">{t("Duke ngarkuar ndërtesën", "Loading the building")}</span>
              </div>
            ) : (
              <div className="xp-fade-in flex flex-col items-center gap-4">
                <button type="button" autoFocus className="btn-primary h-12 px-10 text-base" onClick={() => setPhase("intro")}>{t("Hyr", "Enter")}</button>
                <SoundToggle on={sound} onChange={setSound} labelled />
              </div>
            )}
          </div>
        </div>
        <Link href="/treg" className="absolute bottom-6 text-xs text-ink-2 underline-offset-4 hover:text-ink hover:underline">{t("Vazhdo pa 3D", "Continue without 3D")}</Link>
      </div>
    </div>
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
