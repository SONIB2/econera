import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { Suspense } from "react";
import { ProductCard } from "@/components/market/product-card";
import { SearchBar } from "@/components/market/search-bar";
import { ALBANIA, project } from "@/lib/albania-map";
import { flagUrl, parseRegion, REGION_COOKIE, REGIONS as COUNTRIES, tr } from "@/lib/lang";
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
  const box = "w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm";

  const filtersForm = (
    <form action="/treg" className="grid gap-5 text-sm">
      {q && <input type="hidden" name="q" value={q} />}
      <input type="hidden" name="pamja" value={view} />
      <Group title={t("Kategoria", "Category")}><select name="kategoria" defaultValue={one("kategoria")} className={box}><option value="">{t("Të gjitha", "All")}</option>{MARKET_CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c[lang]}</option>)}</select></Group>
      <Group title={t("Gjendja", "Condition")}>{(Object.keys(CONDITION_UI) as (keyof typeof CONDITION_UI)[]).map((c) => <label key={c} className="flex items-center gap-2"><input type="checkbox" name="gjendja" value={c} defaultChecked={filters.condition?.includes(c)} className="size-4 accent-[var(--color-lime)]" />{CONDITION_UI[c][lang]}</label>)}</Group>
      <Group title={t("Çmimi për njësi (lekë)", "Price per unit (ALL)")}><div className="grid grid-cols-2 gap-2"><input name="min" inputMode="numeric" defaultValue={one("min")} placeholder="min" className={box} /><input name="max" inputMode="numeric" defaultValue={one("max")} placeholder="max" className={box} /></div></Group>
      <Group title={t("Vendndodhja", "Location")}>
        <select name="rajoni" defaultValue={one("rajoni")} className={box}><option value="">{t("Çdo qark", "Any region")}</option>{Object.keys(REGIONS).map((r) => <option key={r}>{r}</option>)}</select>
        <div className="grid grid-cols-[1fr_90px] gap-2"><select name="afer" defaultValue={one("afer")} className={box}><option value="">{t("Distanca nga…", "Distance from…")}</option>{Object.keys(REGIONS).map((r) => <option key={r}>{r}</option>)}</select><input name="km" inputMode="numeric" defaultValue={one("km")} placeholder="km" className={box} /></div>
      </Group>
      <Group title={t("Sasia e disponueshme", "Available quantity")}><div className="grid grid-cols-[1fr_90px] gap-2"><input name="sasia" inputMode="decimal" defaultValue={one("sasia")} placeholder={t("të paktën", "at least")} className={box} /><select name="njesia" defaultValue={one("njesia")} className={box}><option value="">—</option>{["m²", "copë", "m", "m³", "kg", "ton", "paletë"].map((u) => <option key={u}>{u}</option>)}</select></div></Group>
      <Group title={t("Shitësi dhe marrja", "Seller and fulfilment")}>
        <label className="flex items-center gap-2"><input type="checkbox" name="verifikuar" value="1" defaultChecked={filters.verified} className="size-4 accent-[var(--color-lime)]" />{t("Vetëm shitës të verifikuar", "Verified sellers only")}</label>
        <label className="flex items-center gap-2"><input type="checkbox" name="dorezim" value="1" defaultChecked={filters.delivery} className="size-4 accent-[var(--color-lime)]" />{t("Me dorëzim", "Delivery available")}</label>
        <label className="flex items-center gap-2"><input type="checkbox" name="marrje" value="1" defaultChecked={filters.pickup} className="size-4 accent-[var(--color-lime)]" />{t("Marrje në vend", "Pickup available")}</label>
      </Group>
      <div className="flex gap-2"><button className="btn-primary flex-1">{t("Apliko filtrat", "Apply filters")}</button><Link href="/treg" className="btn-ghost">{t("Pastro", "Clear")}</Link></div>
    </form>
  );

  return (
    <div className="container-x pt-10 pb-20 md:pt-14">
      <nav aria-label="Breadcrumb" className="text-sm text-ink-2"><Link href="/" className="hover:text-ink">{t("Kreu", "Home")}</Link> / {t("Tregu", "Marketplace")}</nav>
      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="display text-4xl md:text-6xl">{t("Materiale me jetë të dytë.", "Discover materials with a second life.")}</h1>
          <p className="mt-3 max-w-2xl text-ink-2">{t("Stok i tepërt, materiale të rikuperuara dhe copa nga shitës të shqyrtuar nga ECONERA.", "Surplus stock, reclaimed materials and offcuts from sellers reviewed by ECONERA.")}</p>
        </div>
        <p className="text-sm text-ink-2" aria-live="polite"><span className="text-2xl font-semibold text-ink tabular-nums">{results.length}</span> {t(results.length === 1 ? "listim" : "listime", results.length === 1 ? "listing" : "listings")}</p>
      </div>
      {(() => {
        const c = COUNTRIES.find((x) => x.country === region.country);
        const local = region.country === "AL" || region.country === "XK";
        return c && (
          <p className="mt-5 flex flex-wrap items-center gap-2 text-sm text-ink-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={flagUrl(c.country)} alt="" width={20} height={14} className="h-3.5 w-5 rounded-[2px] object-cover ring-1 ring-black/10" />
            {local
              ? t(`Tregu për ${c.sq}: shitës në Shqipëri dhe Kosovë.`, `Marketplace for ${c.en}: sellers in Albania and Kosovo.`)
              : t(`Ende s'ka shitës në ${c.sq}. Po shfaqen listimet nga Shqipëria; materialet e rënda kushtojnë shumë për t'u transportuar larg, ndaj tregu yt do të mbushet me shitës vendas.`, `No sellers in ${c.en} yet. Showing listings from Albania; heavy materials are costly to ship far, so your market will fill with local sellers.`)}
          </p>
        );
      })()}
      <div className="mt-6"><Suspense><SearchBar /></Suspense></div>
      <nav aria-label={t("Kategoritë", "Categories")} className="mt-4 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
        <Link href={without("kategoria")} className={`shrink-0 rounded-full border px-4 py-2 text-sm ${!filters.category ? "border-ink bg-ink text-bg" : "border-line hover:border-lime"}`}>{t("Të gjitha", "All")}</Link>
        {MARKET_CATEGORIES.map((c) => <Link key={c.id} href={withParam("kategoria", c.id)} className={`shrink-0 rounded-full border px-4 py-2 text-sm ${filters.category === c.id ? "border-ink bg-ink text-bg" : "border-line hover:border-lime"}`}>{c[lang]}</Link>)}
      </nav>
      {nl.category && <p className="mt-3 text-xs text-ink-2">{t("E kuptuam kërkesën tënde si filtra; mund t'i heqësh më poshtë.", "We read your request as filters; remove any of them below.")}</p>}

      <div className="mt-6 grid gap-8 lg:grid-cols-[260px_1fr]">
        <aside className="hidden lg:block">{filtersForm}</aside>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <details className="lg:hidden"><summary className="btn-ghost cursor-pointer list-none">{t("Filtrat", "Filters")}{chips.length ? ` (${chips.length})` : ""}</summary><div className="mt-3 rounded-card border border-line bg-card p-4">{filtersForm}</div></details>
            <div className="flex flex-wrap gap-2">
              {chips.map(([label, href]) => <Link key={label + href} href={href} className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1.5 text-xs font-medium text-lime">{label}<span aria-hidden>✕</span><span className="sr-only">{t("hiq", "remove")}</span></Link>)}
              {chips.length > 0 && <Link href="/treg" className="rounded-full px-3 py-1.5 text-xs text-ink-2 underline">{t("Pastro të gjitha", "Clear all")}</Link>}
            </div>
            <div className="flex items-center gap-2">
              <form action="/treg" className="flex items-center gap-2">
                {[...params.entries()].filter(([k]) => k !== "rendit" && k !== "faqe").map(([k, v], i) => <input key={`${k}${i}`} type="hidden" name={k} value={v} />)}
                <label className="sr-only" htmlFor="rendit">{t("Rendit", "Sort")}</label>
                <select id="rendit" name="rendit" defaultValue={filters.sort} className="rounded-full border border-line bg-card px-3 py-2 text-sm">{SORTS.map((s) => <option key={s} value={s}>{sortLabels[s]}</option>)}</select>
                <button className="btn-ghost h-9 min-h-9 px-3 text-xs">{t("Rendit", "Sort")}</button>
              </form>
              <div className="flex rounded-full border border-line p-0.5" role="group" aria-label={t("Pamja", "View")}>
                {(["grid", "list", "map"] as const).map((v) => <Link key={v} href={withParam("pamja", v)} aria-current={view === v ? "true" : undefined} className={`rounded-full px-3 py-1.5 text-xs font-medium ${view === v ? "bg-ink text-bg" : "text-ink-2"}`}>{v === "grid" ? t("Rrjetë", "Grid") : v === "list" ? t("Listë", "List") : t("Hartë", "Map")}</Link>)}
              </div>
            </div>
          </div>

          {!connected && <p className="mt-6 rounded-xl border border-[#ecd29a] bg-[#fdf6e3] px-4 py-3 text-sm">{t("Tregu live nuk është i lidhur në këtë mjedis.", "The live marketplace is not connected in this environment.")}</p>}

          {view === "map" ? <MarketMap items={results} lang={lang} /> : (
            <div className={`mt-6 grid gap-5 ${view === "list" ? "" : "sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"}`}>
              {shown.map((i) => <ProductCard key={i.id} item={i} lang={lang} region={region} rate={EUR_TO_LEK} layout={view as "grid" | "list"} />)}
            </div>
          )}
          {results.length > page * PAGE && view !== "map" && <div className="mt-8 flex justify-center"><Link href={withParam("faqe", String(page + 1))} className="btn-ghost">{t("Shfaq më shumë", "Load more")}</Link></div>}

          {showDemo && (
            <section className="mt-6 grid gap-4" aria-labelledby="demo">
              <div className="rounded-card border border-dashed border-line p-6">
                <h2 id="demo" className="text-2xl">{connected && live.length ? t("Asnjë listim nuk përputhet me filtrat.", "No listings match these filters.") : t("Tregu po mbushet me listimet e para.", "The marketplace is receiving its first listings.")}</h2>
                <p className="mt-2 text-ink-2">{t("Çdo listim publikohet vetëm pasi shqyrtohet nga ECONERA. Më poshtë janë shembuj demo: mund t’i provosh në shportë, por nuk u dërgohen shitësve.", "Every listing is published only after ECONERA reviews it. Below are demo examples: you can try them in the cart, but they are not sent to sellers.")}</p>
                <div className="mt-4 flex flex-wrap gap-2"><Link href="/shit" className="btn-primary">{t("Shit materiale", "Sell materials")}</Link>{chips.length > 0 && <Link href="/treg" className="btn-ghost">{t("Pastro filtrat", "Clear filters")}</Link>}</div>
              </div>
              {demo.length > 0 && <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">{demo.map((i) => <ProductCard key={i.id} item={i} lang={lang} region={region} rate={EUR_TO_LEK} />)}</div>}
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return <fieldset className="grid gap-2"><legend className="mb-1 text-xs font-semibold text-ink-2">{title}</legend>{children}</fieldset>;
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
