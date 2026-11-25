/** Two-language UI (shqip default, English). The choice lives in the `lang` cookie. */
export type Lang = "sq" | "en";
export const LANG_COOKIE = "lang";
export const parseLang = (value: string | null | undefined): Lang => (value === "en" ? "en" : "sq");

/** Pick the string for the current language: tr(lang, "Shqip", "English"). */
export const tr = (lang: Lang, sq: string, en: string) => (lang === "en" ? en : sq);

export const NAV: { href: string; sq: string; en: string }[] = [
  { href: "/", sq: "Eksploro", en: "Explore" },
  { href: "/treg", sq: "Tregu", en: "Market" },
  { href: "/ai", sq: "AI", en: "AI" },
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
