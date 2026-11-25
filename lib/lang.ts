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
export type CountryGroup = "balkans" | "eu" | "other";
/**
 * Countries in the region selector. Choosing one sets the language (Albanian for Albania and Kosovo,
 * English elsewhere until that country's language is validated), currency and measurement system.
 * `local` names the country's own language, shown as "coming soon" where it is not yet available.
 */
export const REGIONS: { country: string; group: CountryGroup; sq: string; en: string; currency: Region["currency"]; units: Region["units"]; lang: Lang; local?: string }[] = [
  { country: "AL", group: "balkans", sq: "Shqipëri", en: "Albania", currency: "ALL", units: "metric", lang: "sq" },
  { country: "XK", group: "balkans", sq: "Kosovë", en: "Kosovo", currency: "EUR", units: "metric", lang: "sq" },
  { country: "MK", group: "balkans", sq: "Maqedoni e Veriut", en: "North Macedonia", currency: "EUR", units: "metric", lang: "en", local: "Македонски" },
  { country: "ME", group: "balkans", sq: "Mal i Zi", en: "Montenegro", currency: "EUR", units: "metric", lang: "en", local: "Crnogorski" },
  { country: "RS", group: "balkans", sq: "Serbi", en: "Serbia", currency: "EUR", units: "metric", lang: "en", local: "Srpski" },
  { country: "BA", group: "balkans", sq: "Bosnjë dhe Hercegovinë", en: "Bosnia and Herzegovina", currency: "EUR", units: "metric", lang: "en", local: "Bosanski" },
  { country: "GR", group: "balkans", sq: "Greqi", en: "Greece", currency: "EUR", units: "metric", lang: "en", local: "Ελληνικά" },
  { country: "HR", group: "balkans", sq: "Kroaci", en: "Croatia", currency: "EUR", units: "metric", lang: "en", local: "Hrvatski" },
  { country: "SI", group: "balkans", sq: "Slloveni", en: "Slovenia", currency: "EUR", units: "metric", lang: "en", local: "Slovenščina" },
  { country: "BG", group: "balkans", sq: "Bullgari", en: "Bulgaria", currency: "EUR", units: "metric", lang: "en", local: "Български" },
  { country: "RO", group: "balkans", sq: "Rumani", en: "Romania", currency: "EUR", units: "metric", lang: "en", local: "Română" },
  { country: "DE", group: "eu", sq: "Gjermani", en: "Germany", currency: "EUR", units: "metric", lang: "en", local: "Deutsch" },
  { country: "IT", group: "eu", sq: "Itali", en: "Italy", currency: "EUR", units: "metric", lang: "en", local: "Italiano" },
  { country: "FR", group: "eu", sq: "Francë", en: "France", currency: "EUR", units: "metric", lang: "en", local: "Français" },
  { country: "ES", group: "eu", sq: "Spanjë", en: "Spain", currency: "EUR", units: "metric", lang: "en", local: "Español" },
  { country: "NL", group: "eu", sq: "Holandë", en: "Netherlands", currency: "EUR", units: "metric", lang: "en", local: "Nederlands" },
  { country: "BE", group: "eu", sq: "Belgjikë", en: "Belgium", currency: "EUR", units: "metric", lang: "en", local: "Nederlands / Français" },
  { country: "AT", group: "eu", sq: "Austri", en: "Austria", currency: "EUR", units: "metric", lang: "en", local: "Deutsch" },
  { country: "PT", group: "eu", sq: "Portugali", en: "Portugal", currency: "EUR", units: "metric", lang: "en", local: "Português" },
  { country: "IE", group: "eu", sq: "Irlandë", en: "Ireland", currency: "EUR", units: "metric", lang: "en" },
  { country: "PL", group: "eu", sq: "Poloni", en: "Poland", currency: "EUR", units: "metric", lang: "en", local: "Polski" },
  { country: "SE", group: "eu", sq: "Suedi", en: "Sweden", currency: "EUR", units: "metric", lang: "en", local: "Svenska" },
  { country: "GB", group: "other", sq: "Mbretëri e Bashkuar", en: "United Kingdom", currency: "GBP", units: "metric", lang: "en" },
  { country: "CH", group: "other", sq: "Zvicër", en: "Switzerland", currency: "EUR", units: "metric", lang: "en", local: "Deutsch / Français / Italiano" },
  { country: "US", group: "other", sq: "SHBA", en: "United States", currency: "USD", units: "imperial", lang: "en" },
  { country: "CA", group: "other", sq: "Kanada", en: "Canada", currency: "USD", units: "metric", lang: "en", local: "Français" },
];
export const COUNTRY_GROUPS: { id: CountryGroup; sq: string; en: string }[] = [
  { id: "balkans", sq: "Ballkani", en: "Balkans" }, { id: "eu", sq: "Bashkimi Evropian", en: "European Union" }, { id: "other", sq: "Evropë tjetër dhe Amerika e Veriut", en: "Rest of Europe & North America" },
];
export const flagUrl = (country: string) => `https://flagcdn.com/w40/${country.toLowerCase()}.png`;
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
