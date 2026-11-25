import { cookies } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Gallery } from "@/components/market/gallery";
import { ProductActions } from "@/components/market/product-actions";
import { priceText } from "@/components/market/product-card";
import { formatNumber } from "@/lib/format";
import { parseRegion, REGION_COOKIE, tr } from "@/lib/lang";
import { getLang } from "@/lib/lang-server";
import { CONDITION_UI, MARKET_CATEGORIES } from "@/lib/market/categories";
import { demoMarket } from "@/lib/market/live";

export const metadata = { robots: { index: false } };

/** Demo example detail: clearly labelled, cannot be ordered. */
export default async function DemoProduct({ params }: { params: Promise<{ slug: string }> }) {
  const lang = await getLang();
  const t = (sq: string, en: string) => tr(lang, sq, en);
  parseRegion((await cookies()).get(REGION_COOKIE)?.value);
  const slug = decodeURIComponent((await params).slug);
  const item = demoMarket().find((i) => i.id === `demo:${slug}`);
  if (!item) notFound();
  const cat = MARKET_CATEGORIES.find((c) => c.id === item.category);
  return (
    <div className="container-x pt-8 pb-20">
      <p role="status" className="rounded-xl border border-[#ecd29a] bg-[#fdf6e3] px-4 py-3 text-sm">{t("Shembull demonstrues: ky listim, shitësi dhe çmimi janë të shpikur për të treguar si funksionon tregu.", "Demo example: this listing, seller and price are invented to show how the marketplace works.")}</p>
      <div className="mt-6 grid gap-10 lg:grid-cols-[1.25fr_1fr]">
        <Gallery photos={[]} title={item.title} category={item.category} />
        <div className="card grid content-start gap-4 p-6">
          <p className="text-xs font-medium text-lime-dim">{CONDITION_UI[item.condition][lang]} · {cat?.[lang]}</p>
          <h1 className="display text-3xl">{item.title}</h1>
          <p className="text-3xl font-semibold">{priceText(item, lang)} <span className="text-base font-normal text-ink-2">/ {item.unit}</span></p>
          <p className="text-sm text-ink-2">{formatNumber(item.quantity, 1)} {item.unit} · {item.region} · {item.seller}</p>
          <ProductActions p={{ id: item.id, title: item.title, unit: item.unit, unitPrice: item.unitPrice, currency: "ALL", priceLek: item.priceLek, quantity: item.quantity, seller: item.seller, city: item.region, toolCategory: item.dbCategory, sheet: Boolean(item.sheet), demo: true, fulfillment: item.fulfillment }} />
          <Link href="/treg" className="text-sm underline">{t("Kthehu te tregu", "Back to marketplace")}</Link>
        </div>
      </div>
    </div>
  );
}
