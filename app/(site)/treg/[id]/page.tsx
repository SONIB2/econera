import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Gallery } from "@/components/market/gallery";
import { ProductActions } from "@/components/market/product-actions";
import { convertedText, priceText, ProductCard, unitText } from "@/components/market/product-card";
import { SaveButton } from "@/components/market/save-button";
import { formatNumber } from "@/lib/format";
import { parseRegion, REGION_COOKIE, tr } from "@/lib/lang";
import { getLang } from "@/lib/lang-server";
import { CONDITION_UI, MARKET_CATEGORIES } from "@/lib/market/categories";
import { galleryFor, liveMarket } from "@/lib/market/live";
import { applicationOrigin } from "@/lib/supabase";
import { EUR_TO_LEK, toolCategoryOf } from "@/lib/tools/inventory";
import { DOC_TYPES, INTENDED_USE } from "@/lib/verify/labels";
import { readVerification } from "@/lib/verify/public";

export const dynamic = "force-dynamic";

async function load(id: string) {
  if (!/^[0-9a-f-]{36}$/.test(id)) return null;
  const { items } = await liveMarket();
  const item = items.find((i) => i.id === id);
  if (!item) return null;
  const [photos, ver] = await Promise.all([galleryFor(id), readVerification(id).catch(() => null)]);
  const related = items.filter((i) => i.id !== id && i.category === item.category).slice(0, 4);
  return { item, photos: photos.length ? photos : item.photo ? [item.photo] : [], v: ver?.v ?? null, related };
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const data = await load((await params).id);
  if (!data) return { title: "ECONERA", robots: { index: false } };
  return { title: data.item.title, description: data.item.description.slice(0, 160), alternates: { canonical: `/treg/${data.item.id}` }, openGraph: { title: data.item.title, images: data.photos.slice(0, 1) } };
}

export default async function Product({ params }: { params: Promise<{ id: string }> }) {
  const lang = await getLang();
  const t = (sq: string, en: string) => tr(lang, sq, en);
  const region = parseRegion((await cookies()).get(REGION_COOKIE)?.value);
  const data = await load((await params).id);
  if (!data) notFound();
  const { item, photos, v, related } = data;
  const cat = MARKET_CATEGORIES.find((c) => c.id === item.category);
  const conv = convertedText(item, region, EUR_TO_LEK);
  const unitNote = unitText(item.unit, region);
  const fulfil = { pickup: t("Vetëm marrje në vend", "Pickup only"), delivery: t("Vetëm dorëzim", "Delivery only"), both: t("Marrje ose dorëzim", "Pickup or delivery") }[item.fulfillment];
  const specs: [string, string | null | undefined][] = [
    [t("Kategoria", "Category"), cat?.[lang]], [t("Gjendja", "Condition"), CONDITION_UI[item.condition][lang]], [t("Sasia e disponueshme", "Available quantity"), `${formatNumber(item.quantity, 1)} ${item.unit}`],
    [t("Përmasat", "Dimensions"), item.sheet ? `${item.sheet.length} × ${item.sheet.width} × ${item.sheet.thickness} mm${item.sheet.material ? ` · ${item.sheet.material}` : ""}` : null],
    [t("Prodhuesi", "Manufacturer"), v?.manufacturer], [t("Modeli", "Model"), v?.model_ref], [t("Loti", "Batch / lot"), v?.batch_no], [t("Origjina", "Origin"), v?.origin_country],
    [t("Mosha", "Age"), v?.age_years != null ? `${v.age_years} ${t("vite", "years")}` : null], [t("Përdorimi i synuar", "Intended use"), v ? INTENDED_USE[v.intended_use]?.[lang] : null],
    [t("Vendndodhja", "Location"), item.region], [t("Marrja", "Fulfilment"), fulfil],
  ];
  const origin = applicationOrigin() ?? "https://www.econera.al";
  const jsonLd = { "@context": "https://schema.org", "@type": "Product", name: item.title, description: item.description, image: photos.slice(0, 3), category: cat?.en, sku: v?.passport_code ?? item.id,
    offers: { "@type": "Offer", price: item.unitPrice, priceCurrency: item.currency, availability: "https://schema.org/InStock", itemCondition: item.condition === "reclaimed" ? "https://schema.org/UsedCondition" : "https://schema.org/NewCondition", url: `${origin}/treg/${item.id}` } };

  return (
    <div className="container-x pt-8 pb-28 md:pb-20">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <nav aria-label="Breadcrumb" className="text-sm text-ink-2"><Link href="/treg" className="hover:text-ink">{t("Tregu", "Marketplace")}</Link> / <Link href={`/treg?kategoria=${item.category}`} className="hover:text-ink">{cat?.[lang]}</Link></nav>
      <div className="mt-5 grid gap-10 lg:grid-cols-[1.25fr_1fr]">
        <div className="grid content-start gap-8">
          <Gallery photos={photos} title={item.title} category={item.category} />
          <section aria-labelledby="pershkrimi"><h2 id="pershkrimi" className="text-2xl">{t("Përshkrimi", "Description")}</h2><p className="mt-3 whitespace-pre-line leading-relaxed text-ink-2">{item.description}</p><p className="mt-2 text-xs text-ink-2">{t("Teksti është i shitësit, në gjuhën origjinale.", "Text by the seller, in the original language.")}</p></section>
          <section aria-labelledby="spec"><h2 id="spec" className="text-2xl">{t("Specifikimet", "Specifications")}</h2>
            <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-4 text-sm md:grid-cols-3">{specs.filter(([, x]) => x).map(([k, x]) => <div key={k} className="border-b border-line pb-3"><dt className="text-xs text-ink-2">{k}</dt><dd className="mt-1 font-medium">{x}</dd></div>)}</dl>
            {v?.known_defects && <p className="mt-4 rounded-xl bg-[#fdf6e3] px-4 py-3 text-sm"><span className="font-medium">{t("Defekte të njohura", "Known defects")}:</span> {v.known_defects}</p>}
          </section>
          {v && (
            <section aria-labelledby="verify" className="card p-6">
              <div className="flex flex-wrap items-center justify-between gap-3"><h2 id="verify" className="text-2xl">ECONERA Verify</h2>{v.passport_code && <span className="font-mono text-sm">{v.passport_code}</span>}</div>
              <ul className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
                {[[v.identity_verified || v.business_verified, v.business_verified ? t("Biznes i verifikuar", "Verified business") : t("Identiteti i shitësit", "Seller identity")], [true, t("Listim i shqyrtuar nga njeriu", "Listing reviewed by a person")], [v.documents.length > 0, t("Dokumentet e shqyrtuara", "Documents reviewed")], [Boolean(v.inspection), t("Inspektim fizik", "Physical inspection")]].map(([ok, label]) => <li key={label as string} className="flex items-center gap-2"><span className={`grid size-5 place-items-center rounded-full text-[11px] ${ok ? "bg-lime text-bg" : "bg-bg-2 text-ink-2"}`}>{ok ? "✓" : "–"}</span>{label}{!ok && <span className="text-ink-2">· {t("nuk është kryer", "not performed")}</span>}</li>)}
              </ul>
              {v.documents.length > 0 && <p className="mt-3 text-xs text-ink-2">{v.documents.map((d) => DOC_TYPES[d.type]?.[lang]).join(" · ")}</p>}
              <div className="mt-4 flex flex-wrap gap-3 text-sm"><Link href={`/verifikim/${item.id}`} className="font-medium text-lime underline underline-offset-4">{t("Shiko detajet e verifikimit", "View verification details")}</Link><Link href={`/mbrojtja?material=${item.id}`} className="text-ink-2 underline underline-offset-4">{t("Raporto një problem", "Report a problem")}</Link></div>
            </section>
          )}
        </div>

        <aside className="lg:sticky lg:top-28 lg:self-start">
          <div className="card grid gap-5 p-6">
            <div className="flex items-start justify-between gap-3">
              <div><p className="text-xs font-medium text-lime-dim">{CONDITION_UI[item.condition][lang]} · {cat?.[lang]}</p><h1 className="display mt-2 text-3xl md:text-4xl">{item.title}</h1></div>
              <SaveButton id={item.id} title={item.title} href={`/treg/${item.id}`} large />
            </div>
            <p className="flex flex-wrap items-baseline gap-2"><span className="text-3xl font-semibold tabular-nums">{priceText(item, lang)}</span><span className="text-ink-2">/ {item.unit}</span>{conv && <span className="text-sm text-ink-2">{conv}</span>}{unitNote && <span className="text-xs text-ink-2">{unitNote}</span>}</p>
            <p className="text-sm text-ink-2">{formatNumber(item.quantity, 1)} {item.unit} {t("në dispozicion", "available")} · {item.region} · {fulfil}</p>
            {item.seller && <p className="rounded-xl bg-bg-2 px-4 py-3 text-sm"><span className="text-ink-2">{t("Shitësi", "Seller")}:</span> <span className="font-medium">{item.seller}</span>{(item.verifiedBusiness || item.verifiedIdentity) && <span className="ml-2 text-lime-dim">✓ {t("i verifikuar", "verified")}</span>}</p>}
            <ProductActions p={{ id: item.id, title: item.title, unit: item.unit, unitPrice: item.unitPrice, currency: item.currency, priceLek: item.priceLek, quantity: item.quantity, seller: item.seller, city: item.region, toolCategory: toolCategoryOf(item.dbCategory), sheet: Boolean(item.sheet), fulfillment: item.fulfillment }} />
          </div>
        </aside>
      </div>

      {related.length > 0 && (
        <section className="mt-16" aria-labelledby="ngjashme"><h2 id="ngjashme" className="text-3xl">{t("Materiale të ngjashme", "Related materials")}</h2>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">{related.map((i) => <ProductCard key={i.id} item={i} lang={lang} region={region} rate={EUR_TO_LEK} />)}</div>
        </section>
      )}
      <div className="fixed inset-x-0 bottom-16 z-30 flex items-center justify-between gap-3 border-t border-line bg-card/95 px-4 py-3 backdrop-blur md:hidden">
        <span className="font-semibold tabular-nums">{priceText(item, lang)} <span className="text-sm font-normal text-ink-2">/ {item.unit}</span></span>
        <Link href={`/materiale/${item.id}/oferte`} className="btn-primary">{t("Kërko ofertë", "Request quote")}</Link>
      </div>
    </div>
  );
}
