import Link from "next/link";
import { Suspense } from "react";
import { CategoryArt } from "@/components/market/category-art";
import { ProductCard } from "@/components/market/product-card";
import { SearchBar } from "@/components/market/search-bar";
import { BasketVisual, CutVisual, RenovationVisual, VoiceVisual } from "@/components/tools/visuals";
import { tr, type Lang, type Region } from "@/lib/lang";
import { MARKET_CATEGORIES } from "@/lib/market/categories";
import { applyFilters, countByCategory, type MarketItem } from "@/lib/market/live";
import { EUR_TO_LEK } from "@/lib/tools/inventory";

const FEATURED = ["structural", "wood", "bricks", "tiles", "insulation", "windows", "plumbing", "electrical", "roofing", "drywall", "paint", "offcuts"];

/** Homepage below the 3D hero. Every number shown is counted from approved live listings. */
export function HomeSections({ lang, region, items }: { lang: Lang; region: Region; items: MarketItem[] }) {
  const t = (sq: string, en: string) => tr(lang, sq, en);
  const counts = countByCategory(items);
  const fresh = applyFilters(items, { sort: "newest" }).slice(0, 8);
  const offcuts = items.filter((i) => i.sheet || i.category === "offcuts").slice(0, 4);
  const examples = lang === "en"
    ? ["40 m² porcelain tiles near Tirana", "OSB offcuts 18 mm", "reclaimed bricks under 30 L", "mineral wool insulation"]
    : ["40 m² pllaka porcelani afër Tiranës", "copa OSB 18 mm", "tulla të rikuperuara nën 30 L", "izolim lesh mineral"];
  const tools = [
    { href: "/ai/renovim", name: "AI Renovation", text: t("Ngarko një foto të dhomës dhe shiko si duket me materiale që ekzistojnë në treg.", "Upload a room photo and see it with materials that exist on the marketplace."), visual: <RenovationVisual /> },
    { href: "/ai/shporta", name: "Smart Basket", text: t("Shkruaj listën e projektit; merr kombinimin më të mirë nga shitës realë brenda buxhetit.", "Write your project list; get the best combination from real sellers within budget."), visual: <BasketVisual /> },
    { href: "/ai/smartcut", name: "SmartCut", text: t("Fut prerjet që të duhen; gjej copat e mbetura që i mbulojnë para se të blesh panel të ri.", "Enter the cuts you need; find offcuts that cover them before buying a new sheet."), visual: <CutVisual /> },
    { href: "/ai", name: "ECONERA Voice", text: t("Kërko, listo dhe menaxho materialet me zë, në shqip ose anglisht.", "Search, list and manage materials by voice, in Albanian or English."), visual: <VoiceVisual /> },
  ];
  const journey = [
    [t("Zbulo", "Discover"), t("Kërko me fjalë të thjeshta ose me zë.", "Search in plain words or by voice.")],
    [t("Dizajno", "Design"), t("Vizualizo hapësirën me AI Renovation.", "Visualise the space with AI Renovation.")],
    [t("Përputh", "Match"), t("Smart Basket gjen shitësit që kanë sasinë.", "Smart Basket finds sellers who have the quantity.")],
    [t("Optimizo", "Optimize"), t("SmartCut ul mbetjet para prerjes.", "SmartCut reduces waste before cutting.")],
    [t("Bli", "Purchase"), t("Kërko oferta dhe konfirmo me shitësin.", "Request quotes and confirm with the seller.")],
    [t("Ripërdor", "Reuse"), t("Ajo që të tepron, e liston për projektin tjetër.", "What's left over, you list for the next project.")],
  ];

  return (
    <div className="bg-bg">
      <section aria-labelledby="kerko" className="container-x -mt-px py-16 md:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <h2 id="kerko" className="text-3xl md:text-5xl">{t("Çfarë po ndërton?", "What are you building?")}</h2>
          <p className="mt-3 text-ink-2">{t("Shkruaj si flet. E kthejmë kërkesën në filtra që mund t'i ndryshosh.", "Type the way you talk. We turn it into filters you can adjust.")}</p>
          <div className="mt-7 text-left"><Suspense><SearchBar big /></Suspense></div>
          <ul className="mt-4 flex flex-wrap justify-center gap-2">{examples.map((e) => <li key={e}><Link href={`/treg?q=${encodeURIComponent(e)}`} className="rounded-full border border-line bg-card px-3.5 py-1.5 text-sm text-ink-2 hover:border-lime hover:text-ink">{e}</Link></li>)}</ul>
        </div>
      </section>

      <section aria-labelledby="kategorite" className="container-x pb-20">
        <div className="flex flex-wrap items-end justify-between gap-3"><h2 id="kategorite" className="text-3xl md:text-4xl">{t("Shfleto sipas materialit", "Browse by material")}</h2><Link href="/treg" className="text-sm font-medium text-lime underline-offset-4 hover:underline">{t("Të gjitha kategoritë", "All categories")}</Link></div>
        <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {FEATURED.map((id) => { const c = MARKET_CATEGORIES.find((x) => x.id === id)!; const n = counts.get(id) ?? 0; return (
            <li key={id}><Link href={`/treg?kategoria=${id}`} className="group block overflow-hidden rounded-2xl border border-line bg-card transition hover:border-lime">
              <div className="aspect-[4/3] overflow-hidden"><CategoryArt id={id} className="transition duration-500 group-hover:scale-105" /></div>
              <div className="px-3.5 py-3"><p className="text-sm font-semibold leading-snug">{c[lang]}</p><p className="mt-0.5 text-xs text-ink-2">{n ? t(`${n} ${n === 1 ? "listim" : "listime"}`, `${n} listing${n === 1 ? "" : "s"}`) : t("Ende pa listime", "No listings yet")}</p></div>
            </Link></li>
          ); })}
        </ul>
      </section>

      <section aria-labelledby="te-rejat" className="container-x pb-20">
        <div className="flex flex-wrap items-end justify-between gap-3"><h2 id="te-rejat" className="text-3xl md:text-4xl">{t("Të rejat në treg", "New on the marketplace")}</h2>{fresh.length > 0 && <Link href="/treg?rendit=newest" className="text-sm font-medium text-lime underline-offset-4 hover:underline">{t("Shiko të gjitha", "View all")}</Link>}</div>
        {fresh.length ? (
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{fresh.map((i) => <ProductCard key={i.id} item={i} lang={lang} region={region} rate={EUR_TO_LEK} />)}</div>
        ) : (
          <div className="mt-6 grid gap-4 rounded-card border border-dashed border-line p-8 md:grid-cols-[1fr_auto] md:items-center">
            <div><p className="text-xl font-semibold">{t("Listimet e para janë në shqyrtim.", "The first listings are being reviewed.")}</p><p className="mt-1 text-ink-2">{t("Çdo listim publikohet vetëm pasi e kontrollon një person nga ECONERA. Bëhu ndër të parët.", "Every listing goes live only after a person at ECONERA checks it. Be one of the first.")}</p></div>
            <Link href="/shit" className="btn-primary">{t("Listo materialin tënd", "List your material")}</Link>
          </div>
        )}
        {offcuts.length > 0 && <><h3 className="mt-12 text-2xl">{t("Copa gati për SmartCut", "Offcuts ready for SmartCut")}</h3><div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{offcuts.map((i) => <ProductCard key={i.id} item={i} lang={lang} region={region} rate={EUR_TO_LEK} />)}</div></>}
      </section>

      <section aria-labelledby="ai" className="theme-dark bg-bg py-20 text-ink">
        <div className="container-x">
          <div className="max-w-2xl"><h2 id="ai" className="text-3xl md:text-5xl">{t("Më shumë se një treg. Një mënyrë më e zgjuar për të ndërtuar.", "More than a marketplace. A smarter way to build.")}</h2><p className="mt-3 text-ink-2">{t("Çdo sugjerim lidhet me listime që ekzistojnë. AI ndihmon; vendimet i merr ti dhe shitësi.", "Every suggestion links to listings that exist. AI assists; you and the seller decide.")}</p></div>
          <ul className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">{tools.map((tool) => (
            <li key={tool.name}><Link href={tool.href} className="group flex h-full flex-col overflow-hidden rounded-card border border-line bg-card transition hover:border-lime">
              <div className="aspect-[16/10] overflow-hidden bg-bg-2">{tool.visual}</div>
              <div className="flex flex-1 flex-col p-5"><p className="text-lg font-semibold">{tool.name}</p><p className="mt-2 flex-1 text-sm text-ink-2">{tool.text}</p><span className="mt-4 text-sm font-medium text-lime">{t("Hap mjetin", "Open tool")}</span></div>
            </Link></li>
          ))}</ul>
        </div>
      </section>

      <section aria-labelledby="rruga" className="container-x py-20">
        <h2 id="rruga" className="max-w-2xl text-3xl md:text-4xl">{t("Nga ideja te materiali i ripërdorur.", "From idea to reused material.")}</h2>
        <ol className="mt-10 grid gap-px overflow-hidden rounded-card border border-line bg-line sm:grid-cols-2 lg:grid-cols-6">
          {journey.map(([name, text], i) => <li key={name} className="bg-card p-5"><span className="text-xs font-semibold text-lime-dim tabular-nums">{i + 1}</span><p className="mt-2 text-lg font-semibold">{name}</p><p className="mt-1 text-sm text-ink-2">{text}</p></li>)}
        </ol>
      </section>

      <section aria-labelledby="shit" className="container-x pb-20">
        <div className="grid gap-8 overflow-hidden rounded-[2rem] bg-accent p-8 md:grid-cols-[1.2fr_1fr] md:p-14">
          <div>
            <h2 id="shit" className="text-3xl text-[#0c2f2b] md:text-5xl">{t("Teprica jote është projekti i dikujt tjetër.", "Your surplus is someone else's next project.")}</h2>
            <p className="mt-4 max-w-lg text-[#335a52]">{t("Paletat që mbetën nga kantieri, copat e panelit, dyert e çmontuara: listoji në gjashtë hapa. Ne i shqyrtojmë, blerësit të gjejnë.", "Pallets left from the site, panel offcuts, removed doors: list them in six steps. We review them, buyers find you.")}</p>
            <div className="mt-7 flex flex-wrap gap-2"><Link href="/shit" className="inline-flex h-12 items-center rounded-full bg-[#0f4a43] px-6 font-semibold text-white hover:bg-[#0c2f2b]">{t("Fillo të shesësh", "Start selling")}</Link><Link href="/cmimet" className="inline-flex h-12 items-center rounded-full border border-[#0f4a43]/30 px-6 font-medium text-[#0f4a43] hover:border-[#0f4a43]">{t("Planet për furnitorë", "Supplier plans")}</Link></div>
          </div>
          <ul className="grid content-center gap-3 text-[#0c2f2b]">
            {[[t("Falas për blerësit", "Free for buyers"), t("Kërkimi, shporta dhe kërkesat për ofertë nuk kushtojnë.", "Search, cart and quote requests cost nothing.")], [t("Shqyrtim njerëzor", "Human review"), t("Çdo listim kontrollohet para publikimit.", "Every listing is checked before it goes live.")], [t("Import me CSV / Excel", "CSV / Excel import"), t("Ngarko gjithë stokun njëherësh.", "Upload your whole stock at once.")]].map(([a, b]) => <li key={a} className="rounded-2xl bg-white/70 px-5 py-4"><p className="font-semibold">{a}</p><p className="text-sm text-[#335a52]">{b}</p></li>)}
          </ul>
        </div>
      </section>

      <section aria-labelledby="biznes" className="container-x pb-20">
        <div className="grid gap-10 md:grid-cols-[1fr_1.4fr]">
          <div><h2 id="biznes" className="text-3xl md:text-4xl">{t("Për kompanitë e ndërtimit", "For construction businesses")}</h2><p className="mt-3 text-ink-2">{t("Kontraktorë, depo, prodhues dhe zhvillues: shit stokun që nuk lëviz dhe gjej materiale për projektin tjetër.", "Contractors, warehouses, manufacturers and developers: move idle stock and source materials for the next job.")}</p><Link href="/biznes" className="btn-primary mt-6">{t("Zgjidhjet për biznes", "Business solutions")}</Link></div>
          <ul className="grid gap-3 sm:grid-cols-2">
            {[[t("Kontraktorë", "Contractors"), t("Lista e projektit → Smart Basket → oferta nga disa shitës.", "Project list → Smart Basket → quotes from several sellers.")], [t("Depo dhe tregtarë", "Warehouses & traders"), t("Import i stokut, profil i verifikuar biznesi, pasaporta e produktit.", "Stock import, verified business profile, product passport.")], [t("Prodhues", "Manufacturers"), t("Lote të mbetura dhe copa me përmasa të sakta për SmartCut.", "Leftover batches and offcuts with exact dimensions for SmartCut.")], [t("Zhvillues dhe arkitektë", "Developers & architects"), t("AI Renovation për koncepte me materiale që ekzistojnë.", "AI Renovation for concepts with materials that exist.")]].map(([a, b]) => <li key={a} className="card p-5"><p className="font-semibold">{a}</p><p className="mt-1 text-sm text-ink-2">{b}</p></li>)}
          </ul>
        </div>
      </section>

      <section aria-labelledby="besimi" className="container-x pb-24">
        <div className="card grid gap-8 p-8 md:grid-cols-[1fr_1.4fr] md:p-12">
          <div><h2 id="besimi" className="text-3xl md:text-4xl">{t("Besim që mund ta kontrollosh.", "Trust you can check.")}</h2><p className="mt-3 text-ink-2">{t("ECONERA Verify: njerëz, jo vetëm algoritme, vendosin çfarë publikohet.", "ECONERA Verify: people, not just algorithms, decide what gets published.")}</p></div>
          <ul className="grid gap-4 sm:grid-cols-2">
            {[[t("Shitës të verifikuar", "Verified sellers"), t("Identiteti ose NIPT-i kontrollohet me dokumente.", "Identity or business registration checked against documents."), "/verifikimi"], [t("Dokumente teknike", "Technical documents"), t("Fletë teknike, CE, DoP: shqyrtohen dhe shënohen në listim.", "Datasheets, CE, DoP: reviewed and shown on the listing."), "/verifikimi"], [t("Pasaporta e produktit", "Product passport"), t("Kod publik që tregon çfarë u kontrollua dhe kur.", "A public code showing what was checked and when."), "/verifikimi"], [t("Mbrojtja e blerësit", "Buyer protection"), t("Raporto një problem; një person e shqyrton.", "Report a problem; a person reviews it."), "/mbrojtja"]].map(([a, b, href]) => <li key={a}><Link href={href} className="block h-full rounded-2xl border border-line p-5 hover:border-lime"><p className="font-semibold">{a}</p><p className="mt-1 text-sm text-ink-2">{b}</p></Link></li>)}
          </ul>
        </div>
      </section>
    </div>
  );
}
