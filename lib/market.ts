import { matchScore, stock, TIRANA, viewStock, type StockView } from "./demo";

export const CITIES = {
  "Tiranë": { lat: 41.3275, lng: 19.8189 },
  "Durrës": { lat: 41.3231, lng: 19.4414 },
  "Shkodër": { lat: 42.0683, lng: 19.5126 },
  "Vlorë": { lat: 40.4661, lng: 19.4914 },
} as const;
export type City = keyof typeof CITIES;

export const CATEGORIES: { id: string; label: string; words: string[] }[] = [
  { id: "tulla", label: "Tulla dhe blloqe", words: ["tull", "bllok", "brick"] },
  { id: "cimento", label: "Çimento", words: ["çimento", "cimento", "cement"] },
  { id: "hekur", label: "Hekur", words: ["hekur", "armatur"] },
  { id: "agregat", label: "Rërë dhe agregat", words: ["rërë", "rere", "zhavorr", "agregat"] },
  { id: "suva", label: "Suva", words: ["suva", "suvatim", "gips"] },
  { id: "pllaka", label: "Pllaka", words: ["pllak", "granit", "porcelan", "qeramik", "tile", "ceramic"] },
  { id: "parket", label: "Parket", words: ["parket", "parquet", "laminat", "dysheme druri", "flooring", "oak", "lisi"] },
  { id: "dritare", label: "Dritare", words: ["dritar", "xham", "window"] },
  { id: "dyer", label: "Dyer", words: ["derë", "dere", "dyer", "door"] },
  { id: "boje", label: "Bojë", words: ["bojë", "boje", "lyerje", "paint"] },
  { id: "sanitari", label: "Sanitari", words: ["wc", "tualet", "lavaman", "sanitar", "dush"] },
  { id: "elektrike", label: "Elektrike", words: ["kabllo", "kabell", "prizë", "priza", "elektrik", "çelës"] },
  { id: "hidraulike", label: "Hidraulike", words: ["tub", "hidraul", "rubinet", "ppr", "pvc"] },
  { id: "izolim", label: "Izolim", words: ["izolim", "polistirol", "eps", "xps", "lesh guri"] },
  { id: "cati", label: "Çati", words: ["tjegull", "çati", "cati", "membran", "bitum"] },
];

export type Condition = "e-re" | "teprice" | "riperdorur";
export const CONDITIONS: Record<Condition, string> = { "e-re": "E re", teprice: "Stok i tepërt", riperdorur: "E ripërdorur" };

export function conditionOf(text: string): Condition {
  const t = text.toLowerCase();
  if (/ripërdor|rikuper/.test(t)) return "riperdorur";
  if (/tepërt|tepric|anuluar|hapur|ekspozit/.test(t)) return "teprice";
  return "e-re";
}

export type ParsedQuery = { quantity?: number; category?: string; city?: City; words: string[] };

/** Rule-based reading of a request such as "600 tulla me vrima në Tiranë". The AI assistant (Faza F) replaces it when a key is set. */
export function parseQuery(text: string): ParsedQuery {
  const lower = text.toLowerCase();
  const qty = lower.match(/(\d[\d.,\s]*)\s*(copë|cope|copa|m²|m2|m³|m3|m|thes|thasë|ton|t\b|kuti)?/);
  const quantity = qty ? Number(qty[1].replace(/[\s.]/g, "").replace(",", ".")) || undefined : undefined;
  const category = CATEGORIES.find((c) => c.words.some((w) => lower.includes(w)))?.id;
  const city = (Object.keys(CITIES) as City[]).find((c) => lower.includes(c.toLowerCase().slice(0, 5)));
  const words = lower.replace(/\d+/g, " ").split(/[^\p{L}]+/u).filter((w) => w.length > 3);
  return { quantity, category, city, words };
}

export type Offer = StockView & { match: number; condition: Condition };

export function searchStock({ category, city = "Tiranë", condition, words = [], quantity, sort = "match" }: {
  category?: string; city?: City; condition?: Condition; words?: string[]; quantity?: number; sort?: "match" | "price" | "distance";
}): Offer[] {
  const from = CITIES[city] ?? TIRANA;
  const offers = stock
    .filter((item) => !category || item.category === category)
    .map((item) => {
      const view = viewStock(item, from);
      const text = `${item.title} ${item.subtype}`.toLowerCase();
      const bonus = words.filter((w) => text.includes(w.slice(0, 5))).length * 3;
      return { ...view, condition: conditionOf(item.condition), match: Math.min(99, matchScore(view, quantity) + bonus) };
    })
    .filter((o) => !condition || o.condition === condition);
  const by = { match: (a: Offer, b: Offer) => b.match - a.match, price: (a: Offer, b: Offer) => a.priceLek - b.priceLek, distance: (a: Offer, b: Offer) => a.distanceKm - b.distanceKm }[sort];
  return offers.sort(by);
}

/** Greedy cover of a requested quantity from the best-matching offers of one unit. */
export function coverPlan(offers: Offer[], quantity: number) {
  const unit = offers[0]?.unit;
  const picks: { offer: Offer; take: number }[] = [];
  let left = quantity;
  for (const offer of offers) {
    if (left <= 0) break;
    if (offer.unit !== unit) continue;
    const take = Math.min(left, offer.quantity);
    picks.push({ offer, take });
    left -= take;
  }
  const cost = picks.reduce((sum, p) => sum + p.take * p.offer.priceLek, 0);
  const market = picks.reduce((sum, p) => sum + p.take * p.offer.marketPriceLek, 0);
  return { picks, unit, covered: quantity - Math.max(0, left), complete: left <= 0, cost, savingPct: market ? Math.round((1 - cost / market) * 100) : 0 };
}
