"use client";

/* eslint-disable @next/next/no-html-link-for-pages -- Crossing locale boundaries refreshes the document language. */
import { ArrowLeft, ArrowRight, ScanLine } from "lucide-react";
import Image from "next/image";
import { BrandArtwork } from "./brand";
import { useEffect, useRef, useState } from "react";
import { fulfillment, type CatalogueEntry } from "@/lib/data";
import type { Locale } from "@/lib/i18n";
import { findMasonryType, type MasonryType } from "@/lib/masonry";
import { advanceWorld, worldDestination, type Destination, type WorldAction, type WorldPhase } from "@/lib/world-state";
import type { createWorld } from "@/lib/world-scene";
import { englishFulfillment, englishUnit, worldCopy, worldMaterials } from "@/lib/world-copy";

type WorldEngine = ReturnType<typeof createWorld>;
type Stock = { kind: "ready"; items: CatalogueEntry[] } | { kind: "error" | "unavailable" };
const isTransit = (phase: WorldPhase) => phase === "approaching" || phase === "opening" || phase === "entering" || phase === "focusing";

function worldPath(destination: Destination, locale: Locale, kind?: MasonryType) {
  const query = new URLSearchParams();
  if (destination !== "intro") query.set("scene", destination);
  if (destination === "masonry" && kind) query.set("tipi", kind);
  if (locale === "en") query.set("lang", locale);
  return query.size ? `/bota?${query}` : "/bota";
}

function record(destination: Destination, locale: Locale) {
  const path = worldPath(destination, locale);
  if (window.location.pathname + window.location.search !== path) window.history.pushState(null, "", path);
}

export function ImmersiveWorld({ initial, initialKind, stock, locale }: { initial: Destination; initialKind: MasonryType; stock: Record<MasonryType, Stock>; locale: Locale }) {
  const [phase, setPhase] = useState<WorldPhase>(initial);
  const [status, setStatus] = useState<"loading" | "ready" | "unavailable">("loading");
  const [kind, setKind] = useState<MasonryType>(initialKind);
  const copy = worldCopy[locale];
  const types = worldMaterials[locale];
  const descriptive = types.find((item) => item.id === kind) ?? types[0];
  const result = stock[kind];
  const canvasHost = useRef<HTMLDivElement>(null);
  const engine = useRef<WorldEngine | null>(null);
  const progressControl = useRef<HTMLButtonElement>(null);
  const panelHeading = useRef<HTMLHeadingElement>(null);
  const active = phase !== "intro";
  const back = phase === "masonry" || phase === "focusing" ? "house" :
    phase === "house" || phase === "opening" || phase === "entering" ? "portal" : "intro";
  const alternate = locale === "sq" ? "en" : "sq";
  const destination = isTransit(phase) ? back : worldDestination(phase);
  const languageLink = <a className="world-language" href={worldPath(destination, alternate, kind)} hrefLang={alternate} lang={alternate}>{alternate === "en" ? "English" : "Shqip"}</a>;

  function act(action: WorldAction) {
    setPhase((current) => advanceWorld(current, action));
  }

  function go(destination: Destination) {
    if (phase === "intro") setStatus("loading");
    record(destination, locale);
    setPhase(destination);
  }

  function selectMasonry(next: MasonryType) {
    const url = new URL(window.location.href);
    url.searchParams.set("tipi", next);
    window.history.replaceState(null, "", url);
    setKind(next);
  }

  useEffect(() => {
    const restore = () => {
      const query = new URL(window.location.href).searchParams;
      const next = worldDestination(query.get("scene"));
      if (next === "masonry") setKind(findMasonryType(query.get("tipi"))?.id ?? "clay");
      if (!engine.current) setStatus("loading");
      setPhase(next);
    };
    window.addEventListener("popstate", restore);
    return () => window.removeEventListener("popstate", restore);
  }, []);

  useEffect(() => {
    if (!active) return;
    const escape = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || event.defaultPrevented) return;
      record(back, locale);
      setPhase(back);
    };
    window.addEventListener("keydown", escape);
    return () => window.removeEventListener("keydown", escape);
  }, [active, back, locale]);

  useEffect(() => {
    if (!active) return;
    let live = true;
    import("@/lib/world-scene").then(({ createWorld }) => {
      if (!live || !canvasHost.current) return;
      engine.current = createWorld(canvasHost.current, {
        hit: (target) => setPhase((current) => advanceWorld(current, target === "door" ? "open" : "inspect")),
        unavailable: () => { if (live) setStatus("unavailable"); },
      });
      setStatus("ready");
    }).catch(() => { if (live) setStatus("unavailable"); });
    return () => {
      live = false;
      engine.current?.dispose();
      engine.current = null;
    };
  }, [active]);

  useEffect(() => {
    if (status !== "ready" || !active || !engine.current) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    engine.current.travel(phase, reduced, () => {
      const next = advanceWorld(phase, "arrived");
      if (next === phase) return;
      if (next !== "entering" && !isTransit(next)) record(next as Destination, locale);
      setPhase(next);
    });
  }, [phase, status, active, locale]);

  useEffect(() => {
    if (status === "ready") engine.current?.setMaterial(kind);
  }, [kind, status]);

  useEffect(() => {
    if (status !== "ready" || !active) return;
    if (phase === "masonry") panelHeading.current?.focus();
    if (phase === "portal" || phase === "house") progressControl.current?.focus();
  }, [phase, status, active]);

  const number = new Intl.NumberFormat(locale === "sq" ? "sq-AL" : "en-GB");
  const unit = (value: string) => locale === "en" ? englishUnit[value] ?? value : value;
  return <section className="immersive-world" data-phase={phase} data-renderer={active ? status : "idle"} aria-label={copy.world}>
    <div className="world-canvas" ref={canvasHost} />
    {phase === "approaching" && <div className="world-reveal" aria-hidden />}
    {!active ? <div className="world-intro">
      <span className="world-intro-language">{languageLink}</span>
      <button className="world-mark" type="button" onClick={() => { setStatus("loading"); act("approach"); }}>
        <span className="sr-only">ECONERA</span>
        <BrandArtwork dark className="world-wordmark" />
        <span className="world-tagline" aria-hidden>Construction Intelligence</span>
        <small>{copy.enter} <ArrowRight size={15} aria-hidden /></small>
      </button>
      <div className="world-intro-links">
        <button type="button" onClick={() => go("house")}>{copy.skip}</button>
        <a href="/materiale" hrefLang="sq">{copy.catalogue}</a>
      </div>
    </div> : <>
      <nav className="world-bar" aria-label={copy.nav}>
        <button type="button" className="world-button" onClick={() => go(back)}><ArrowLeft size={17} aria-hidden /> {back === "house" ? copy.inside : back === "portal" ? copy.entry : copy.back}</button>
        <div><Image className="world-nav-symbol" src="/brand/icon.svg" width={44} height={44} alt="" />{languageLink}<a href="/inventari" hrefLang="sq" className="world-button">{copy.workspace}</a></div>
      </nav>
      {status === "loading" && <p className="world-prompt" role="status">{copy.loading}</p>}
      {status === "unavailable" && <div className="world-fallback">
        <h1>{copy.unavailable}</h1>
        <div className="actions"><a className="world-button" href="/materiale/murature" hrefLang="sq">{copy.studio}</a><a className="world-button" href="/materiale" hrefLang="sq">{copy.openCatalogue}</a></div>
      </div>}
      {status === "ready" && phase === "portal" && <div className="world-prompt">
        <button type="button" ref={progressControl} className="world-button world-advance" onFocus={() => engine.current?.highlight("door")} onBlur={() => engine.current?.highlight(null)} onClick={() => act("open")}>{copy.door} <ArrowRight size={19} aria-hidden /></button>
      </div>}
      {status === "ready" && phase === "house" && <div className="world-prompt">
        <button type="button" ref={progressControl} className="world-button world-advance" onFocus={() => engine.current?.highlight("wall")} onBlur={() => engine.current?.highlight(null)} onClick={() => act("inspect")}><ScanLine size={19} aria-hidden /> {copy.wall}</button>
      </div>}
      {status === "ready" && isTransit(phase) && <p className="sr-only" role="status">
        {phase === "approaching" || phase === "opening" || phase === "entering" || phase === "focusing" ? copy[phase] : null}
      </p>}
      {status === "ready" && phase === "masonry" && <aside className="world-material" aria-labelledby="world-material-title">
        <h1 id="world-material-title" ref={panelHeading} tabIndex={-1}>{copy.masonry}</h1>
        <p className="world-surface-note">{copy.illustrative}</p>
        <fieldset>
          <legend>{copy.type}</legend>
          {types.map((item) => <label key={item.id}><input type="radio" name="world-masonry" value={item.id} checked={kind === item.id} onChange={() => selectMasonry(item.id)} /><span>{item.name}</span></label>)}
        </fieldset>
        <section aria-labelledby="world-stock-title" aria-live="polite">
          <h2 id="world-stock-title">{copy.stock}</h2>
          {result.kind === "ready" ? result.items.length === 0 ? <p>{copy.empty}</p> :
          <ul className="world-stock">{result.items.map((item) => <li key={item.id}>
            <a href={`/materiale/${item.id}`} hrefLang="sq">{item.title}</a>
            <span>{item.seller_label || copy.seller} · {item.region}</span>
            <span>{number.format(item.quantity)} {unit(item.unit)} · {new Intl.NumberFormat(number.resolvedOptions().locale, { style: "currency", currency: item.currency }).format(item.unit_price)} / {unit(item.unit)} · {(locale === "sq" ? fulfillment : englishFulfillment)[item.fulfillment]}</span>
            <a href={`/materiale/${item.id}/oferte`} hrefLang="sq" aria-label={`${copy.quoteFor} ${item.title}`}>{copy.quote}</a>
          </li>)}</ul> : <p>{copy.stockError}</p>}
        </section>
        <p>{descriptive.description}</p>
        <h2>{copy.checks}</h2>
        <ul className="world-checks">{descriptive.checks.map((item) => <li key={item}>{item}</li>)}</ul>
        <div className="actions"><a className="world-button" href={`/materiale/murature?tipi=${kind}`} hrefLang="sq">{copy.studio}</a>
          <button type="button" className="world-button" onClick={() => go("house")}>{copy.return}</button></div>
      </aside>}
    </>}
  </section>;
}
