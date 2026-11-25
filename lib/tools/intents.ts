/**
 * ECONERA Voice: deterministic understanding of common requests, in Albanian and English.
 * Consequential intents (publishing, adding to a basket) always return `needsConfirmation`.
 */
import { CATEGORIES, CITIES } from "@/lib/market";
import { parseBudget, parseRequirements, type Requirement } from "./basket";
import { EUR_TO_LEK } from "./inventory";

export type Intent =
  | { kind: "navigate"; href: string; nameSq: string; nameEn: string }
  | { kind: "search"; requirement: Requirement; maxTotalLek?: number; city?: string }
  | { kind: "basket"; text: string; needsConfirmation: true }
  | { kind: "sell"; draft: SellDraft; missing: (keyof SellDraft)[]; needsConfirmation: true }
  | { kind: "help" }
  | { kind: "unknown" };

export type SellDraft = { category?: string; title?: string; quantity?: number; unit?: string; price?: number; currency?: "EUR" | "ALL"; region?: string; condition?: "unused" | "reusable"; color?: string };

const ROUTES: { words: RegExp; href: string; sq: string; en: string }[] = [
  { words: /shport|basket/i, href: "/ai/shporta", sq: "Smart Basket", en: "Smart Basket" },
  { words: /smart ?cut|prerj|copëz|copez|offcut|cutting/i, href: "/ai/smartcut", sq: "SmartCut", en: "SmartCut" },
  { words: /renovim|rinovim|renovation|dizajn|design/i, href: "/ai/renovim", sq: "AI Renovation", en: "AI Renovation" },
  { words: /projekt|projects?/i, href: "/projektet", sq: "Projektet e mia", en: "My projects" },
  { words: /treg|market/i, href: "/treg", sq: "Tregu", en: "Market" },
  { words: /çmim|cmim|pricing|price list|plan/i, href: "/cmimet", sq: "Çmimet", en: "Pricing" },
  { words: /certifikat|certificate/i, href: "/certifikata", sq: "Certifikata", en: "Certificate" },
  { words: /porosi|orders?/i, href: "/paneli", sq: "Paneli", en: "Dashboard" },
  { words: /listim|inventar|my listings/i, href: "/inventari", sq: "Inventari", en: "Inventory" },
  { words: /kreu|faqja kryesore|home/i, href: "/", sq: "Kreu", en: "Home" },
  { words: /mjete|ai tools|tools/i, href: "/ai", sq: "AI Tools", en: "AI Tools" },
];

const NAV_VERB = /\b(hap|shko|më ço|me co|trego|open|go to|show|take me)\b/i;
const SELL_VERB = /\b(kam|shes|shitje|dua t[ëe] shes|i have|sell|selling|list)\b/i;
const SEARCH_VERB = /\b(gjej|kërko|kerko|më duhen|me duhen|më duhet|dua|a ka|find|search|need|looking for|is there)\b/i;
const BASKET_VERB = /\b(shto|vendos|add|put)\b.*\b(shport|basket)/i;

export function understand(text: string): Intent {
  const t = text.trim();
  if (!t) return { kind: "unknown" };
  if (/^(ndihmë|ndihme|help|çfarë mund|what can)/i.test(t)) return { kind: "help" };
  if (BASKET_VERB.test(t)) return { kind: "basket", text: t.replace(BASKET_VERB, " ").trim(), needsConfirmation: true };

  const category = CATEGORIES.find((c) => c.words.some((w) => t.toLowerCase().includes(w)))?.id;
  if (SELL_VERB.test(t) && category && /\b(shes|shitje|sell|selling|list|çmim|cmim|euro|€|lek)\b/i.test(t)) {
    const draft = sellDraft(t, category);
    const missing = (["quantity", "unit", "price", "region"] as const).filter((k) => draft[k] === undefined);
    return { kind: "sell", draft, missing, needsConfirmation: true };
  }
  const route = ROUTES.find((r) => r.words.test(t));
  if (route && (NAV_VERB.test(t) || !category)) return { kind: "navigate", href: route.href, nameSq: route.sq, nameEn: route.en };
  if (category || SEARCH_VERB.test(t)) {
    const [requirement] = parseRequirements(t);
    if (requirement) {
      const city = (Object.keys(CITIES) as string[]).find((c) => t.toLowerCase().includes(c.toLowerCase().slice(0, 5)) || (c === "Tiranë" && /tirana/i.test(t)));
      return { kind: "search", requirement, maxTotalLek: parseBudget(t), city };
    }
  }
  return { kind: "unknown" };
}

export function sellDraft(text: string, category: string): SellDraft {
  const lower = text.toLowerCase();
  const [req] = parseRequirements(text);
  const priceMatch = lower.match(/(?:për|per|at|me|for)\s*(€\s*)?(\d+(?:[.,]\d+)?)\s*(€|euro|eur|lek\w*|l\b)?/i) ?? lower.match(/(\d+(?:[.,]\d+)?)\s*(€|euro|eur|lekë|lek)\s*(?:për|per|\/)/i);
  let price: number | undefined, currency: "EUR" | "ALL" | undefined;
  if (priceMatch) {
    const num = priceMatch.length > 3 ? priceMatch[2] : priceMatch[1];
    const cur = priceMatch.length > 3 ? `${priceMatch[1] ?? ""}${priceMatch[3] ?? ""}` : priceMatch[2];
    price = Number(String(num).replace(",", "."));
    currency = /€|eur/i.test(cur ?? "") ? "EUR" : /lek|\bl\b/i.test(cur ?? "") ? "ALL" : undefined;
    if (price && price === req?.quantity) price = undefined; // the quantity was read twice
  }
  const region = Object.keys(CITIES).find((c) => lower.includes(c.toLowerCase().slice(0, 5)) || (c === "Tiranë" && lower.includes("tirana")));
  const cat = CATEGORIES.find((c) => c.id === category);
  const title = [cat?.label.split(" ")[0], req?.color].filter(Boolean).join(" ");
  return {
    category, title: title || cat?.label, quantity: req?.quantity, unit: req?.unit, price, currency: currency ?? (price ? "EUR" : undefined),
    region, condition: /ripërdor|rikuper|reclaimed|used|përdorur(?! )/i.test(lower) && !/pa përdorur|unused/i.test(lower) ? "reusable" : "unused", color: req?.color,
  };
}

/** Query string for the listing form (inventory/new) prefill. The seller still reviews and saves. */
export function sellDraftQuery(d: SellDraft) {
  const p = new URLSearchParams();
  if (d.title) p.set("titulli", d.title.length >= 4 ? d.title : `${d.title} material`);
  p.set("pershkrimi", [d.quantity && d.unit ? `${d.quantity} ${d.unit}` : "", d.color ? `ngjyra ${d.color}` : "", d.condition === "reusable" ? "të ripërdorura" : "të papërdorura", "Krijuar me asistentin zanor ECONERA."].filter(Boolean).join(", "));
  if (d.quantity) p.set("sasia", String(d.quantity));
  if (d.unit) p.set("njesia", d.unit);
  if (d.price) p.set("cmimi", String(d.price));
  if (d.currency) p.set("monedha", d.currency);
  if (d.region) p.set("qarku", d.region);
  if (d.condition) p.set("gjendja", d.condition);
  return p.toString();
}

export const toLek = (eur: number) => eur * EUR_TO_LEK;
