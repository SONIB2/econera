import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { Suspense } from "react";
import { CategoryIcon } from "@/components/market/category-icons";
import { FilterDrawer, SortSelect } from "@/components/market/market-controls";
import { ProductCard } from "@/components/market/product-card";
import { MaterialSlabs } from "@/components/home/material-slabs";
import { RegionMenu } from "@/components/site/header-controls";
import { TOOL_PHOTO, unsplash } from "@/lib/market/photos";
import { SearchBar } from "@/components/market/search-bar";
import { ALBANIA, project } from "@/lib/albania-map";
import { parseRegion, REGION_COOKIE, REGIONS as COUNTRIES, tr } from "@/lib/lang";
import { getLang } from "@/lib/lang-server";
import { CONDITION_UI, MARKET_CATEGORIES } from "@/lib/market/categories";
import { interpret } from "@/lib/market/interpret";
import { applyFilters, demoMarket, liveMarket, SORTS, type Filters, type MarketItem } from "@/lib/market/live";
import { EUR_TO_LEK, REGIONS } from "@/lib/tools/inventory";

export const dynamic = "force-dynamic";
const PAGE = 24;
type SP = Record<string, string | string[] | undefined>;

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getLang();
  return { title: tr(lang, "Tregu i materialeve", "Marketplace"), description: tr(lang, "Materiale ndërtimi me jetë të dytë: stok i tepërt, të rikuperuara dhe copa, nga shitës të shqyrtuar.", "Construction materials with a second life: surplus, reclaimed and offcuts, from reviewed sellers.") };
}

export default async function Marketplace({ searchParams }: { searchParams: Promise<SP> }) {
  const lang = await getLang();
  const t = (sq: string, en: string) => tr(lang, sq, en);
  const region = parseRegion((await cookies()).get(REGION_COOKIE)?.value);
  const sp = await searchParams;
  const one = (k: string) => { const v = sp[k]; return (Array.isArray(v) ? v[0] : v) ?? ""; };
  const many = (k: string) => { const v = sp[k]; return (Array.isArray(v) ? v : v ? [v] : []).filter(Boolean); };
  const num = (k: string) => { const n = Number(one(k)); return one(k) !== "" && Number.isFinite(n) && n >= 0 ? n : undefined; };

  const q = one("q").slice(0, 160);
  const nl = interpret(q);
  const filters: Filters = {
    q: nl.category ? nl.words : q, rankOnly: Boolean(nl.category),
    category: MARKET_CATEGORIES.some((c) => c.id === one("kategoria")) ? one("kategoria") : nl.category,
    region: one("rajoni") in REGIONS ? one("rajoni") : undefined,
    near: one("afer") in REGIONS ? one("afer") : nl.near,
    radius: num("km") ?? nl.radius,
    condition: many("gjendja").filter((c) => c in CONDITION_UI),
    minPrice: num("min"), maxPrice: num("max") ?? nl.maxUnitLek, minQty: num("sasia") ?? nl.minQty, unit: one("njesia") || nl.unit,
    verified: one("verifikuar") === "1", delivery: one("dorezim") === "1", pickup: one("marrje") === "1",
    sort: (SORTS as readonly string[]).includes(one("rendit")) ? one("rendit") : (one("afer") || nl.near) ? "distance" : "relevance",
  };
  const view = ["list", "map"].includes(one("pamja")) ? one("pamja") : "grid";
  const page = Math.max(1, num("faqe") ?? 1);

  const { items: live, connected } = await liveMarket();
  const results = applyFilters(live, filters);
  const showDemo = results.length === 0;
  const condCount = new Map<string, number>();
  for (const i of applyFilters(live, { ...filters, condition: [] })) condCount.set(i.condition, (condCount.get(i.condition) ?? 0) + 1);
  const demo = showDemo ? applyFilters(demoMarket(), filters).slice(0, 8) : [];
  const shown = results.slice((page - 1) * PAGE, page * PAGE);

  const params = new URLSearchParams(Object.entries(sp).flatMap(([k, v]) => (Array.isArray(v) ? v.map((x) => [k, x]) : v ? [[k, v]] : [])) as [string, string][]);
  const without = (k: string, v?: string) => { const p = new URLSearchParams(params); if (v) { const rest = p.getAll(k).filter((x) => x !== v); p.delete(k); rest.forEach((x) => p.append(k, x)); } else p.delete(k); p.delete("faqe"); return `/treg?${p}`; };
  const withParam = (k: string, v: string) => { const p = new URLSearchParams(params); p.set(k, v); p.delete("faqe"); return `/treg?${p}`; };
  const chips: [string, string][] = [];
  if (q) chips.push([`“${q}”`, without("q")]);
  if (filters.category) chips.push([MARKET_CATEGORIES.find((c) => c.id === filters.category)![lang], one("kategoria") ? without("kategoria") : without("q")]);
  if (filters.near) chips.push([`${t("Afër", "Near")} ${filters.near}${filters.radius ? ` · ${filters.radius} km` : ""}`, one("afer") ? without("afer") : without("q")]);
  if (filters.region) chips.push([filters.region, without("rajoni")]);
  for (const c of filters.condition ?? []) chips.push([CONDITION_UI[c as keyof typeof CONDITION_UI][lang], without("gjendja", c)]);
  if (filters.maxPrice !== undefined) chips.push([`≤ ${filters.maxPrice.toLocaleString("en")} L/${t("njësi", "unit")}`, one("max") ? without("max") : without("q")]);
  if (filters.minQty !== undefined) chips.push([`≥ ${filters.minQty} ${filters.unit ?? ""}`, one("sasia") ? without("sasia") : without("q")]);
  if (filters.verified) chips.push([t("Shitës të verifikuar", "Verified sellers"), without("verifikuar")]);
  if (filters.delivery) chips.push([t("Me dorëzim", "Delivery"), without("dorezim")]);
  if (filters.pickup) chips.push([t("Marrje në vend", "Pickup"), without("marrje")]);
  const sortLabels: Record<string, string> = { relevance: t("Më të përshtatshmet", "Relevance"), newest: t("Më të rejat", "Newest"), price_asc: t("Çmimi më i ulët", "Lowest price"), price_desc: t("Çmimi më i lartë", "Highest price"), distance: t("Më afër", "Distance"), quantity: t("Sasia më e madhe", "Availability"), value: t("Vlera më e mirë", "Best value") };
  const box = "w-full rounded-xl border border-line bg-card px-3 py-2.5 text-sm";
  const check = "size-4 rounded accent-[var(--color-lime)]";
  const toggle = "relative h-5 w-9 shrink-0 cursor-pointer appearance-none rounded-full bg-line transition before:absolute before:top-0.5 before:left-0.5 before:size-4 before:rounded-full before:bg-white before:shadow before:transition before:content-[''] checked:bg-lime checked:before:translate-x-4 focus-visible:outline-2 focus-visible:outline-lime";

  const filtersForm = (
    <form action="/treg" className="grid gap-5 text-sm">
      {q && <input type="hidden" name="q" value={q} />}
      <input type="hidden" name="pamja" value={view} />
      <Group title={t("Kategoria", "Category")}><select name="kategoria" aria-label={t("Kategoria", "Category")} defaultValue={one("kategoria")} className={box}><option value="">{t("Të gjitha kategoritë", "All categories")}</option>{MARKET_CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c[lang]}</option>)}</select></Group>
      <Group title={t("Gjendja", "Condition")}>{(Object.keys(CONDITION_UI) as (keyof typeof CONDITION_UI)[]).map((c) => <label key={c} className="flex items-center gap-2.5"><input type="checkbox" name="gjendja" value={c} defaultChecked={filters.condition?.includes(c)} className={check} /><span className="flex-1">{CONDITION_UI[c][lang]}</span>{connected && <span className="text-xs text-ink-2 tabular-nums">({condCount.get(c) ?? 0})</span>}</label>)}</Group>
      <Group title={t("Çmimi për njësi (lekë)", "Price per unit (ALL)")}><div className="grid grid-cols-2 gap-2"><input name="min" inputMode="numeric" defaultValue={one("min")} placeholder="Min" aria-label={t("Çmimi minimal", "Minimum price")} className={box} /><input name="max" inputMode="numeric" defaultValue={one("max")} placeholder="Max" aria-label={t("Çmimi maksimal", "Maximum price")} className={box} /></div></Group>
      <Group title={t("Vendndodhja", "Location")}>
        <select name="rajoni" defaultValue={one("rajoni")} aria-label={t("Qarku", "Region")} className={box}><option value="">{t("Çdo qark", "Any region")}</option>{Object.keys(REGIONS).map((r) => <option key={r}>{r}</option>)}</select>
        <div className="grid grid-cols-[1fr_84px] gap-2"><select name="afer" defaultValue={one("afer")} aria-label={t("Distanca nga", "Distance from")} className={box}><option value="">{t("Distanca nga…", "Distance from…")}</option>{Object.keys(REGIONS).map((r) => <option key={r}>{r}</option>)}</select><input name="km" inputMode="numeric" defaultValue={one("km")} placeholder="km" aria-label="km" className={box} /></div>
      </Group>
      <Group title={t("Sasia e disponueshme", "Available quantity")}><div className="grid grid-cols-[1fr_84px] gap-2"><input name="sasia" inputMode="decimal" defaultValue={one("sasia")} placeholder={t("të paktën", "at least")} aria-label={t("Sasia minimale", "Minimum quantity")} className={box} /><select name="njesia" defaultValue={one("njesia")} aria-label={t("Njësia", "Unit")} className={box}><option value="">—</option>{["m²", "copë", "m", "m³", "kg", "ton", "paletë", "thes"].map((u) => <option key={u}>{u}</option>)}</select></div></Group>
      <fieldset className="grid gap-3 border-t border-line pt-4">
        <legend className="sr-only">{t("Shitësi dhe marrja", "Seller and fulfilment")}</legend>
        <label className="flex items-center justify-between gap-3">{t("Vetëm shitës të verifikuar", "Verified sellers only")}<input type="checkbox" name="verifikuar" value="1" defaultChecked={filters.verified} className={toggle} /></label>
        <label className="flex items-center justify-between gap-3">{t("Me dorëzim", "Delivery available")}<input type="checkbox" name="dorezim" value="1" defaultChecked={filters.delivery} className={toggle} /></label>
        <label className="flex items-center justify-between gap-3">{t("Marrje në vend", "Pickup available")}<input type="checkbox" name="marrje" value="1" defaultChecked={filters.pickup} className={toggle} /></label>
      </fieldset>
      <button className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#0f4a43] font-semibold text-white transition hover:bg-[#0c3a35] dark:bg-[#c8f169] dark:text-[#062321]">
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden><path d="M4 6h16M7 12h10M10 18h4" /></svg>{t("Apliko filtrat", "Apply filters")}
      </button>
    </form>
  );
  const c = COUNTRIES.find((x) => x.country === region.country);
  const local = region.country === "AL" || region.country === "XK";
  const regionText = c ? (local ? t(`Tregu për ${c.sq}: shitës në Shqipëri dhe Kosovë`, `Marketplace for ${c.en}: sellers in Albania and Kosovo`) : t(`${c.sq}: ende pa shitës vendas · po shfaqen listimet nga Shqipëria`, `${c.en}: no local sellers yet · showing listings from Albania`)) : "";
  const trust = [
    [t("Shitës të shqyrtuar", "Verified sellers"), t("Të shqyrtuar nga ECONERA", "Reviewed by ECONERA"), "M12 3.5 19 6v5.5c0 4.2-2.9 7.4-7 9-4.1-1.6-7-4.8-7-9V6zM9 12l2.2 2.2L15.5 10"],
    [t("Ndërtim qarkullues", "Circular construction"), t("Jetë e dytë për materialet", "Give materials a second life"), "M5 19c0-8 5-13 15-14-1 10-6 15-14 15M5 19 13 11"],
    [t("Kosto më të ulëta", "Lower costs"), t("Alternativa të përballueshme", "Discover affordable alternatives"), "m12 3 8 4.5v9L12 21l-8-4.5v-9zM4 7.5l8 4.5 8-4.5M12 12v9"],
    [t("Më pak mbetje", "Less waste"), t("Mbështet ripërdorimin", "Support material reuse"), "M7 18H4.5l3-5.2M17 6h2.5l-3 5.2M12 3.5l2.6 4.5M9.4 8 12 3.5M20 16l-2.6 4.5h-5M4 16l2.6 4.5"],
  ];
  const viewIcon = { grid: "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z", list: "M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01", map: "M9 4 3 6.5v13.5L9 17.5l6 2.5 6-2.5V4l-6 2.5zM9 4v13.5M15 6.5V20" };

  return (
    <>
      {/* Dark architectural hero: headline, region, material composition, search, visual categories, trust strip. */}
      <section aria-labelledby="treg-title" className="theme-dark relative -mt-[76px] overflow-hidden bg-[#062321] pt-[76px] text-ink">
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_55%_70%_at_72%_30%,rgba(200,243,109,0.13),transparent_70%),radial-gradient(ellipse_80%_60%_at_10%_0%,rgba(13,74,64,0.6),transparent_70%)]" />
        <div className="container-x relative">
          <nav aria-label="Breadcrumb" className="pt-5 text-xs text-white/60"><Link href="/" className="hover:text-white">{t("Kreu", "Home")}</Link> <span aria-hidden>›</span> {t("Tregu", "Marketplace")}</nav>
          <div className="grid items-center gap-2 md:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
            <div className="relative z-10 py-6 md:py-10">
              <p className="text-[11px] font-semibold tracking-[0.3em] text-[#c8f169]">{t("TREGU I MATERIALEVE", "MATERIALS MARKETPLACE")}</p>
              <h1 id="treg-title" className="display mt-3 text-[clamp(2.1rem,3.7vw,3.3rem)] leading-[1.04] text-white">{t("Zbulo materiale me ", "Discover materials with a ")}<span className="text-[#c8f169]">{t("jetë të dytë.", "second life.")}</span></h1>
              <p className="mt-4 max-w-md text-white/75">{t("Stok i tepërt, materiale të rikuperuara dhe copa nga shitës të shqyrtuar nga ECONERA.", "Surplus stock, reclaimed materials and offcuts from sellers reviewed by ECONERA.")}</p>
              {c && <div className="mt-5"><RegionMenu pill={regionText} /></div>}
            </div>
            <div className="relative min-w-0 overflow-hidden max-md:hidden [&_.ms-row]:[--w:clamp(52px,6.2vw,108px)]">
              <MaterialSlabs lang={lang} />
              <p className="absolute right-4 bottom-2 flex items-center gap-2 rounded-full border border-white/15 bg-black/30 px-4 py-2 text-xs text-white/85 backdrop-blur">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#c8f169" strokeWidth="1.7" strokeLinecap="round" aria-hidden><path d="M7 18H4.5l3-5.2M17 6h2.5l-3 5.2M12 3.5l2.6 4.5M9.4 8 12 3.5M20 16l-2.6 4.5h-5M4 16l2.6 4.5" /></svg>
                {t("Ripërdor · Ul mbetjet · Ndërto më zgjuar", "Reuse · Reduce waste · Build smarter")}
              </p>
            </div>
          </div>

          <div className="relative z-10 [&_form]:border-white/10 [&_form]:bg-white [&_form]:text-[#0c2f2b] [&_input]:text-[#0c2f2b] [&_select]:bg-[#eef3f0] [&_select]:text-[#0c2f2b]">
            <Suspense><SearchBar big hint={t("Kërko materiale, furnitorë ose përshkruaj projektin… p.sh. “40 m² parket lisi nën 600 € afër Tiranës”", "Search materials, suppliers or describe your project… e.g. “40 m² oak flooring under €600 near Tirana”")} /></Suspense>
          </div>

          <nav aria-label={t("Kategoritë", "Categories")} className="-mx-5 mt-5 flex gap-2.5 overflow-x-auto px-5 pb-2 [scrollbar-width:thin] sm:-mx-8 sm:px-8">
            {[{ id: "all", label: t("Të gjitha", "All"), href: without("kategoria"), on: !filters.category }, ...MARKET_CATEGORIES.map((m) => ({ id: m.id, label: m[lang], href: withParam("kategoria", m.id), on: filters.category === m.id }))].map((m) => (
              <Link key={m.id} href={m.href} aria-current={m.on ? "page" : undefined}
                className={`flex w-[92px] shrink-0 flex-col items-center gap-1 rounded-2xl border px-1.5 pt-2 pb-2.5 text-center text-[11px] leading-tight transition ${m.on ? "border-[#c8f169] bg-[#c8f169]/10 text-[#c8f169]" : "border-white/10 bg-white/[0.04] text-white/85 hover:border-[#c8f169]/50"}`}>
                <CategoryIcon id={m.id} className={`h-11 w-16 ${m.id === "all" ? "text-[#c8f169]" : ""}`} />
                <span className="line-clamp-2">{m.label}</span>
              </Link>
            ))}
          </nav>

          <ul className="grid grid-cols-2 gap-y-4 py-6 md:grid-cols-4 md:divide-x md:divide-white/10">
            {trust.map(([a, b2, d]) => (
              <li key={a} className="flex items-center gap-3 md:px-5 md:first:pl-0">
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#c8f169" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="shrink-0"><path d={d} /></svg>
                <span><span className="block text-sm font-semibold text-white">{a}</span><span className="block text-xs text-white/65">{b2}</span></span>
              </li>
            ))}
          </ul>
        </div>
      </section>

    <div className="container-x pt-8 pb-16">
      {nl.category && <p className="mb-3 text-xs text-ink-2">{t("E kuptuam kërkesën tënde si filtra; mund t'i heqësh më poshtë.", "We read your request as filters; remove any of them below.")}</p>}
      <div className="mt-6 grid gap-8 lg:grid-cols-[260px_1fr]">
        <aside className="hidden lg:block"><div className="sticky top-24 rounded-2xl border border-line bg-card p-5 shadow-[0_10px_30px_-22px_rgba(12,47,43,0.4)]"><div className="mb-4 flex items-center justify-between"><p className="text-lg font-semibold">{t("Filtro rezultatet", "Filter results")}</p><Link href="/treg" className="text-sm font-medium text-lime-dim hover:underline">{t("Pastro", "Clear all")}</Link></div>{filtersForm}</div></aside>
        <div className="min-w-0">
          <div className="sticky top-[76px] z-20 -mx-5 flex flex-wrap items-center justify-between gap-3 bg-bg/90 px-5 py-2 backdrop-blur sm:-mx-8 sm:px-8 lg:static lg:mx-0 lg:bg-transparent lg:px-0 lg:py-0 lg:backdrop-blur-none">
            <div className="flex items-center gap-3">
              <FilterDrawer count={chips.length}>{filtersForm}</FilterDrawer>
              <p className="text-sm text-ink-2" aria-live="polite"><span className="font-semibold text-ink tabular-nums">{results.length}</span> {t(results.length === 1 ? "listim" : "listime", results.length === 1 ? "listing" : "listings")}</p>
            </div>
            <div className="flex items-center gap-2">
              <form action="/treg" className="flex items-center gap-2">
                {[...params.entries()].filter(([k]) => k !== "rendit" && k !== "faqe").map(([k, v], i) => <input key={`${k}${i}`} type="hidden" name={k} value={v} />)}
                <SortSelect key={filters.sort} name="rendit" value={filters.sort ?? "relevance"} label={t("Rendit sipas:", "Sort by:")} options={SORTS.map((s) => [s, sortLabels[s]])} />
                <noscript><button className="btn-ghost h-9 min-h-9 px-3 text-xs">{t("Rendit", "Sort")}</button></noscript>
              </form>
              <div className="flex gap-1" role="group" aria-label={t("Pamja", "View")}>
                {(["grid", "list", "map"] as const).map((v) => (
                  <Link key={v} href={withParam("pamja", v)} aria-current={view === v ? "true" : undefined} aria-label={v === "grid" ? t("Rrjetë", "Grid") : v === "list" ? t("Listë", "List") : t("Hartë", "Map")}
                    className={`grid size-9 place-items-center rounded-xl transition ${view === v ? "bg-[#0f4a43] text-white dark:bg-[#c8f169] dark:text-[#062321]" : "text-ink-2 hover:bg-bg-2"}`}>
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d={viewIcon[v]} /></svg>
                  </Link>
                ))}
              </div>
            </div>
          </div>
          {chips.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {chips.map(([label, href]) => <Link key={label + href} href={href} className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1.5 text-xs font-medium text-lime">{label}<span aria-hidden>✕</span><span className="sr-only">{t("hiq", "remove")}</span></Link>)}
              <Link href="/treg" className="rounded-full px-3 py-1.5 text-xs text-ink-2 underline">{t("Pastro të gjitha", "Clear all")}</Link>
            </div>
          )}

          {!connected && <p className="mt-6 rounded-xl border border-[#ecd29a] bg-[#fdf6e3] px-4 py-3 text-sm">{t("Tregu live nuk është i lidhur në këtë mjedis.", "The live marketplace is not connected in this environment.")}</p>}

          {view === "map" ? <MarketMap items={results} lang={lang} /> : (
            <div className={`mt-5 grid gap-4 ${view === "list" ? "" : "grid-cols-1 min-[480px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4"}`}>
              {shown.map((i) => <ProductCard key={i.id} item={i} lang={lang} region={region} rate={EUR_TO_LEK} layout={view as "grid" | "list"} />)}
            </div>
          )}
          {results.length > page * PAGE && view !== "map" && <div className="mt-8 flex justify-center"><Link href={withParam("faqe", String(page + 1))} className="btn-ghost">{t("Shfaq më shumë", "Load more")}</Link></div>}

          {showDemo && (
            <section className="mt-6 grid gap-4" aria-labelledby="demo">
              <div className="rounded-2xl border border-dashed border-line bg-card p-6">
                <h2 id="demo" className="text-2xl">{connected && live.length ? t("Asnjë listim nuk përputhet me filtrat.", "No listings match these filters.") : t("Tregu po mbushet me listimet e para.", "The marketplace is receiving its first listings.")}</h2>
                <p className="mt-2 text-ink-2">{t("Çdo listim real publikohet vetëm pasi e shqyrton ECONERA. Bëhu ndër furnitorët e parë që u japin materialeve të tepërta një jetë të dytë.", "Every real listing is published only after review by ECONERA. Be among the first suppliers to give surplus materials a second life.")}</p>
                <p className="mt-1 text-sm text-ink-2">{t("Më poshtë janë shembuj demo: mund t’i provosh në shportë, por nuk numërohen si listime dhe nuk u dërgohen shitësve.", "Below are demo examples: you can try them in the cart, but they are not counted as listings and are never sent to sellers.")}</p>
                <div className="mt-4 flex flex-wrap gap-2"><Link href="/shit" className="btn-primary">{t("Shit materialet e tua", "Sell your materials")} <span aria-hidden>→</span></Link>{chips.length > 0 && <Link href="/treg" className="btn-ghost">{t("Pastro filtrat", "Clear filters")}</Link>}</div>
              </div>
              {demo.length > 0 && <div className="grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">{demo.map((i) => <ProductCard key={i.id} item={i} lang={lang} region={region} rate={EUR_TO_LEK} />)}</div>}
            </section>
          )}
        </div>
      </div>

      {/* Seller acquisition banner */}
      <section aria-labelledby="sell-banner" className="theme-dark relative mt-16 grid overflow-hidden rounded-[1.75rem] bg-[#062321] text-ink md:grid-cols-[0.9fr_1.6fr]">
        <div className="relative min-h-40 md:min-h-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={unsplash(TOOL_PHOTO.business, 720, 480)} alt="" loading="lazy" className="absolute inset-0 size-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#062321] max-md:bg-gradient-to-b" />
        </div>
        <div className="relative flex flex-col gap-5 p-7 md:flex-row md:items-center md:justify-between md:p-10">
          <div>
            <p className="text-[11px] font-semibold tracking-[0.3em] text-[#c8f169]">{t("SHIT NË ECONERA", "SELL ON ECONERA")}</p>
            <h2 id="sell-banner" className="mt-2 text-2xl text-white md:text-3xl">{t("Ke materiale për të shitur?", "Have materials to sell?")}</h2>
            <p className="mt-1.5 text-white/75">{t("Ktheji tepricat, copat ose materialet e rikuperuara në vlerë.", "Turn surplus, offcuts or reclaimed materials into value.")}</p>
          </div>
          <Link href="/shit" className="inline-flex h-12 shrink-0 items-center gap-2 self-start rounded-full border border-[#c8f169] px-6 font-semibold text-[#c8f169] transition hover:bg-[#c8f169] hover:text-[#062321] md:self-auto">{t("Shit materiale në ECONERA", "Sell materials on ECONERA")} <span aria-hidden>→</span></Link>
        </div>
      </section>
    </div>
    </>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return <fieldset className="grid gap-2"><legend className="mb-1 text-sm font-semibold text-ink">{title}</legend>{children}</fieldset>;
}

function MarketMap({ items, lang }: { items: MarketItem[]; lang: "sq" | "en" }) {
  const byRegion = new Map<string, number>();
  for (const i of items) byRegion.set(i.region, (byRegion.get(i.region) ?? 0) + 1);
  return (
    <figure className="mt-6 grid gap-6 rounded-card border border-line bg-card p-5 md:grid-cols-[minmax(0,320px)_1fr]">
      <svg viewBox={`-20 -10 ${ALBANIA.width + 40} ${ALBANIA.height + 20}`} className="max-h-[70vh] w-full" role="img" aria-label={lang === "en" ? "Map of listings by region" : "Harta e listimeve sipas qarkut"}>
        <path d={ALBANIA.path} fill="var(--color-bg-2)" stroke="var(--color-ink-2)" strokeWidth="1.2" />
        {Object.entries(REGIONS).map(([name, p]) => {
          const [x, y] = project(p.lng, p.lat); const n = byRegion.get(name) ?? 0;
          return <g key={name}>{n > 0 && <circle cx={x} cy={y} r={8 + Math.min(18, n * 2)} fill="var(--color-lime)" fillOpacity=".25" />}<circle cx={x} cy={y} r={n ? 6 : 3} fill={n ? "var(--color-lime)" : "var(--color-line)"} /><text x={x + 10} y={y + 4} fontSize="14" className="fill-ink">{name}{n ? ` · ${n}` : ""}</text></g>;
        })}
      </svg>
      <ul className="grid content-start gap-2 text-sm">{[...byRegion.entries()].sort((a, b) => b[1] - a[1]).map(([r, n]) => <li key={r}><Link href={`/treg?rajoni=${encodeURIComponent(r)}`} className="flex justify-between rounded-lg border border-line px-3 py-2 hover:border-lime"><span>{r}</span><span className="font-semibold">{n}</span></Link></li>)}{!byRegion.size && <li className="text-ink-2">{lang === "en" ? "No listings to show on the map." : "Asnjë listim për hartën."}</li>}</ul>
      <figcaption className="text-xs text-ink-2 md:col-span-2">{lang === "en" ? "Listings shown at the centre of their region. Map: Natural Earth (public domain)." : "Listimet shfaqen në qendër të qarkut. Harta: Natural Earth (domen publik)."}</figcaption>
    </figure>
  );
}
