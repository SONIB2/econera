/**
 * Languages. English is the default for new visitors; Albanian is fully supported. The choice lives in the `lang` cookie.
 * Further languages are listed in PLANNED and become selectable only when their translations are complete.
 */
export type Lang = "sq" | "en";
export const LANGS: { id: Lang; label: string; native: string }[] = [{ id: "en", label: "English", native: "English" }, { id: "sq", label: "Albanian", native: "Shqip" }];
export const PLANNED = ["de", "it", "fr", "es", "el", "pt", "nl", "tr", "ar", "zh"] as const;
export const LANG_COOKIE = "lang";
export const REGION_COOKIE = "region";
export const parseLang = (value: string | null | undefined): Lang => (value === "sq" ? "sq" : "en");

/** Region settings, independent from language. */
export type Region = { country: string; currency: "ALL" | "EUR" | "GBP" | "USD"; units: "metric" | "imperial" };
export const REGIONS: { country: string; sq: string; en: string; currency: Region["currency"]; units: Region["units"] }[] = [
  { country: "AL", sq: "Shqipëri", en: "Albania", currency: "ALL", units: "metric" },
  { country: "XK", sq: "Kosovë", en: "Kosovo", currency: "EUR", units: "metric" },
  { country: "MK", sq: "Maqedoni e Veriut", en: "North Macedonia", currency: "EUR", units: "metric" },
  { country: "ME", sq: "Mal i Zi", en: "Montenegro", currency: "EUR", units: "metric" },
  { country: "IT", sq: "Itali", en: "Italy", currency: "EUR", units: "metric" },
  { country: "DE", sq: "Gjermani", en: "Germany", currency: "EUR", units: "metric" },
  { country: "GB", sq: "Mbretëri e Bashkuar", en: "United Kingdom", currency: "GBP", units: "metric" },
  { country: "US", sq: "SHBA", en: "United States", currency: "USD", units: "imperial" },
];
export const DEFAULT_REGION: Region = { country: "AL", currency: "ALL", units: "metric" };
export function parseRegion(value: string | null | undefined): Region {
  try {
    const r = JSON.parse(value ?? "") as Partial<Region>;
    return { country: REGIONS.some((x) => x.country === r.country) ? r.country! : "AL", currency: (["ALL", "EUR", "GBP", "USD"] as const).includes(r.currency as never) ? r.currency! : "ALL", units: r.units === "imperial" ? "imperial" : "metric" };
  } catch { return DEFAULT_REGION; }
}

/** Pick the string for the current language: tr(lang, "Shqip", "English"). */
export const tr = (lang: Lang, sq: string, en: string) => (lang === "en" ? en : sq);

export const NAV: { href: string; sq: string; en: string }[] = [
  { href: "/", sq: "Eksploro", en: "Explore" },
  { href: "/treg", sq: "Tregu", en: "Market" },
  { href: "/ai", sq: "Mjetet AI", en: "AI Tools" },
  { href: "/certifikata", sq: "Certifikata", en: "Certificate" },
  { href: "/furnitore", sq: "Për furnitorët", en: "For suppliers" },
  { href: "/cmimet", sq: "Çmimet", en: "Pricing" },
  { href: "/rreth-nesh", sq: "Rreth nesh", en: "About" },
];

type Item = { href: string; sq: string; en: string };
export const ACCOUNT_LINKS: { group: { sq: string; en: string }; items: Item[] }[] = [
  { group: { sq: "Hyr", en: "Log in" }, items: [
    { href: "/hyr?lloji=bleres", sq: "Si blerës / klient", en: "As a buyer" },
    { href: "/hyr?lloji=furnitor", sq: "Si furnitor / kompani", en: "As a supplier" },
  ] },
  { group: { sq: "Regjistrohu", en: "Sign up" }, items: [
    { href: "/regjistrohu?lloji=bleres", sq: "Blerës, falas", en: "Buyer, free" },
    { href: "/regjistrohu?lloji=furnitor", sq: "Furnitor, nis falas", en: "Supplier, start free" },
  ] },
];
