import Link from "next/link";
import { CONDITION_UI, MARKET_CATEGORIES } from "@/lib/market/categories";
import type { MarketItem } from "@/lib/market/live";
import { formatNumber } from "@/lib/format";
import type { Lang, Region } from "@/lib/lang";
import { regionLabel, unitLabel } from "@/lib/market/i18n";
import { representativePhoto, unsplash } from "@/lib/market/photos";
import { QuickAdd } from "./quick-add";
import { SaveButton } from "./save-button";

export function priceText(item: Pick<MarketItem, "unitPrice" | "currency" | "unit">, lang: Lang) {
  const n = formatNumber(item.unitPrice, item.currency === "EUR" ? 2 : 0);
  return item.currency === "EUR" ? `€${n}` : `${n} ${lang === "en" ? "ALL" : "L"}`;
}

/** Converted price for the visitor's currency. Only EUR ↔ ALL at the configured rate; marked as approximate. */
export function convertedText(item: Pick<MarketItem, "priceLek" | "currency">, region: Region, rate: number) {
  if (region.currency === "EUR" && item.currency === "ALL") return `≈ €${formatNumber(item.priceLek / rate, 2)}`;
  if (region.currency === "ALL" && item.currency === "EUR") return `≈ ${formatNumber(item.priceLek, 0)} L`;
  return null;
}

export function unitText(unit: string, region: Region) {
  if (region.units !== "imperial") return null;
  return unit === "m²" ? "≈ ft² ×10.76" : unit === "m" ? "≈ ft ×3.28" : unit === "m³" ? "≈ ft³ ×35.3" : null;
}

export const displayTitle = (item: Pick<MarketItem, "title" | "titleEn">, lang: Lang) => (lang === "en" && item.titleEn ? item.titleEn : item.title);

export function ProductCard({ item, lang, region, rate, layout = "grid" }: { item: MarketItem; lang: Lang; region: Region; rate: number; layout?: "grid" | "list" }) {
  const t = (sq: string, en: string) => (lang === "en" ? en : sq);
  const href = item.source === "live" ? `/treg/${item.id}` : `/treg/demo/${encodeURIComponent(item.id.replace("demo:", ""))}`;
  const conv = convertedText(item, region, rate);
  const saving = item.referenceLek && item.referenceLek > item.priceLek ? Math.round((1 - item.priceLek / item.referenceLek) * 100) : null;
  const cat = MARKET_CATEGORIES.find((c) => c.id === item.category);
  const title = displayTitle(item, lang);
  const photo = item.photo ?? unsplash(representativePhoto(item.category, item.dbCategory, item.id), 640, 480);
  const pin = <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden><path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11z" /><circle cx="12" cy="10" r="2.2" /></svg>;
  const cube = <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" aria-hidden><path d="m12 3 8 4.5v9L12 21l-8-4.5v-9z" /><path d="m4 7.5 8 4.5 8-4.5M12 12v9" /></svg>;
  return (
    <article className={`group relative overflow-hidden rounded-2xl border border-line bg-card shadow-[0_1px_2px_rgba(12,47,43,0.05),0_10px_28px_-18px_rgba(12,47,43,0.35)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_22px_44px_-24px_rgba(12,47,43,0.5)] ${layout === "list" ? "grid grid-cols-[140px_1fr] sm:grid-cols-[220px_1fr]" : "flex flex-col"}`}>
      <div className={`relative overflow-hidden bg-bg-2 ${layout === "list" ? "h-full min-h-36" : "aspect-[4/3]"}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photo} alt={title} loading="lazy" decoding="async" className="size-full object-cover transition duration-700 group-hover:scale-[1.04]" />
        <span className="absolute top-2.5 left-2.5 rounded-full bg-[#c8f169] px-2.5 py-1 text-[11px] font-semibold text-[#062321] shadow-sm">{CONDITION_UI[item.condition][lang].replace("Material i tepërt", "I tepërt")}</span>
        <span className="absolute top-2 right-2"><SaveButton id={item.id} title={item.title} href={href} /></span>
        {(item.source === "demo" || !item.photo) && (
          <span className="absolute bottom-2 left-2 flex flex-wrap gap-1">
            {item.source === "demo" && <span className="rounded-full bg-black/65 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur">{t("Shembull demo", "Demo example")}</span>}
            {!item.photo && <span className="rounded-full bg-black/45 px-2 py-0.5 text-[10px] text-white backdrop-blur">{t("Foto ilustruese", "Representative photo")}</span>}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <p className="text-xs text-ink-2">{cat?.[lang]}</p>
        <h3 className="mt-0.5 line-clamp-2 min-h-[2.6em] text-[15px] leading-snug font-semibold"><Link href={href} className="after:absolute after:inset-0">{title}</Link></h3>
        <p className="mt-2 flex flex-wrap items-baseline gap-x-1.5"><span className="text-xl font-bold tabular-nums">{priceText(item, lang)}</span><span className="text-sm text-ink-2">/ {unitLabel(item.unit, lang)}</span>{conv && <span className="text-xs text-ink-2">{conv}</span>}</p>
        {saving !== null && saving > 0 && <p className="text-[11px] font-medium text-lime-dim">{t(`${saving}% nën çmimin e ri (referencë)`, `${saving}% below new price (reference)`)}</p>}
        <div className="mt-auto flex flex-wrap items-center justify-between gap-x-3 gap-y-1 pt-3 text-[11px] text-ink-2">
          <span className="inline-flex items-center gap-1">{cube}{formatNumber(item.quantity, 1)} {unitLabel(item.unit, lang, item.quantity !== 1)} {t("në dispozicion", "available")}</span>
          <span className="inline-flex items-center gap-1">{pin}{regionLabel(item.region, lang)}{item.km !== undefined ? ` · ${formatNumber(item.km, 0)} km` : ""}</span>
          {(item.verifiedBusiness || item.verifiedIdentity) && <span className="w-full font-medium text-lime-dim">✓ {item.verifiedBusiness ? t("Biznes i verifikuar", "Verified business") : t("Shitës i verifikuar", "Verified seller")}</span>}
        </div>
        {item.quantity > 0
          ? <QuickAdd item={{ id: item.id, title, unit: unitLabel(item.unit, lang), priceLek: item.priceLek, max: item.quantity, seller: item.seller, city: regionLabel(item.region, lang), demo: item.source === "demo" || undefined }} />
          : <Link href={href} className="relative z-10 mt-3 inline-flex h-10 items-center justify-center rounded-full border border-line text-sm font-semibold hover:border-lime">{t("Kërko ofertë", "Request quote")}</Link>}
      </div>
    </article>
  );
}
