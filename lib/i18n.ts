export const locales = ["sq", "en"] as const;
export type Locale = typeof locales[number];
export const defaultLocale: Locale = "sq";

export function isLocale(value: string): value is Locale {
  return locales.some((locale) => locale === value);
}

export function otherLocale(locale: Locale): Locale {
  return locale === "sq" ? "en" : "sq";
}

export function formatMoney(value: number, locale: Locale) {
  return new Intl.NumberFormat(locale === "sq" ? "sq-AL" : "en-GB", { style: "currency", currency: "ALL" }).format(value);
}
