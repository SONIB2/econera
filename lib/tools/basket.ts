/**
 * Smart Basket: turns a list of material needs into purchasing plans from real listings.
 * Deterministic and explainable: every number comes from a listing, a stated assumption or simple arithmetic.
 */
import { CATEGORIES, CITIES, type City } from "@/lib/market";
import { co2Factors } from "@/lib/demo";
import { distanceKm, EUR_TO_LEK, type Listing, type Point } from "./inventory";

export type Requirement = {
  id: string;
  text: string;
  category?: string;
  quantity: number;
  unit?: string;
  color?: string;
  words: string[];
};

export type Mode = "budget" | "eco" | "balanced";

export type Assumptions = {
  /** Fixed cost per seller pickup/delivery trip, lekë. */
  tripBaseLek: number;
  /** Per km, one way, lekë. */
  perKmLek: number;
};
export const DEFAULT_ASSUMPTIONS: Assumptions = { tripBaseLek: 1500, perKmLek: 60 };

export type Line = { requirementId: string; listing: Listing; take: number; costLek: number; distanceKm: number; note?: string };

export type Plan = {
  mode: Mode;
  lines: Line[];
  missing: { requirementId: string; quantity: number; unit?: string; reason: string }[];
  materialLek: number;
  transportLek: number;
  totalLek: number;
  budgetLek?: number;
  remainingLek?: number;
  referenceLek: number;
  savingLek: number;
  reuseShare: number;
  co2AvoidedKg: number;
  sellers: number;
  usesDemo: boolean;
};

const UNIT_WORDS: [RegExp, string][] = [
  [/m²|m2|metra katror|square met|sq ?m|sqm/i, "m²"],
  [/m³|m3|kub/i, "m³"],
  [/kovë|kova|kove|bucket|litra|litër|\bl\b/i, "kovë"],
  [/thes|thasë|bag/i, "thes"],
  [/\bton\b|tonë/i, "ton"],
  [/kuti|box/i, "kuti"],
  [/copë|cope|copa|pieces?|pcs|\bx\b/i, "copë"],
  [/\bm\b|metra|metër|meters?/i, "m"],
];

const COLORS = ["e bardhë", "bardh", "bezhë", "bezh", "gri", "e zezë", "arre", "lis", "white", "beige", "grey", "gray", "oak", "black"];
const COLOR_NORMAL: Record<string, string> = { bardh: "e bardhë", white: "e bardhë", bezh: "bezhë", beige: "bezhë", grey: "gri", gray: "gri", black: "e zezë", oak: "lis" };

const NUMBER_WORDS: Record<string, number> = { një: 1, nje: 1, dy: 2, tre: 3, tri: 3, katër: 4, kater: 4, pesë: 5, pese: 5, gjashtë: 6, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6 };

let seq = 0;
const newId = () => `r${Date.now().toString(36)}${(seq++).toString(36)}`;

/** Budget mentioned anywhere in the text, converted to lekë ("buxhet 1500 euro", "max budget €1,500", "200 000 lekë"). */
export function parseBudget(text: string): number | undefined {
  const m = text.match(/(?:buxhet\w*|budget|maksimum|max\w*|deri në|under|nën)[^\d€]{0,25}(€\s*)?(\d[\d.,\s]*)\s*(€|euro|eur|lek\w*|l\b|all)?/i);
  if (!m) return undefined;
  const value = Number(m[2].replace(/[\s,]/g, "").replace(/\.(?=\d{3}\b)/g, ""));
  if (!value) return undefined;
  const euro = Boolean(m[1]) || /€|euro|eur/i.test(m[3] ?? "");
  return Math.round(euro ? value * EUR_TO_LEK : value);
}

/** Splits free text ("45 m² parket lisi, 20 m² pllaka bezhë dhe tri dyer") into requirements. */
export function parseRequirements(text: string): Requirement[] {
  const cleaned = text.replace(/(?:buxhet\w*|budget|maksimum|max\w*)[^,.;\n]*/gi, " ");
  const parts = cleaned.replace(/\b(më duhen|me duhen|më duhet|kam nevojë për|kam nevoje per|dua|i need|we need|i want|need)\b/gi, " ").split(/[,;\n]+|\s+(?:dhe|and|edhe|plus)\s+/i).map((p) => p.trim()).filter((p) => p.length > 2);
  const out: Requirement[] = [];
  for (const part of parts) {
    const lower = part.toLowerCase();
    const category = CATEGORIES.find((c) => c.words.some((w) => lower.includes(w)))?.id;
    if (!category) continue;
    const num = lower.match(/(\d+(?:[.,]\d+)?)/);
    const word = Object.keys(NUMBER_WORDS).find((w) => new RegExp(`(^|\\s)${w}(\\s|$)`).test(lower));
    const quantity = num ? Number(num[1].replace(",", ".")) : word ? NUMBER_WORDS[word] : 1;
    const unit = UNIT_WORDS.find(([re]) => re.test(part))?.[1];
    const colorWord = COLORS.find((c) => lower.includes(c));
    const color = colorWord ? COLOR_NORMAL[colorWord] ?? colorWord : undefined;
    const words = lower.replace(/\d+/g, " ").split(/[^\p{L}]+/u).filter((w) => w.length > 3);
    out.push({ id: newId(), text: part.replace(/^(of|me|për)\s+/i, "").replace(/[.]+$/, "").trim(), category, quantity, unit, color, words });
  }
  return out;
}

/** Reads a CSV or pasted table with columns like material;sasia;njësia (header optional). */
export function parseCsv(text: string): Requirement[] {
  const rows = text.split(/\r?\n/).map((r) => r.split(/[;,\t]/).map((c) => c.trim())).filter((r) => r.some(Boolean));
  if (!rows.length) return [];
  const header = rows[0].map((h) => h.toLowerCase());
  const hasHeader = header.some((h) => /material|artikull|item|pershkrim|përshkrim|description/.test(h));
  const col = (re: RegExp, fallback: number) => { const i = header.findIndex((h) => re.test(h)); return hasHeader && i >= 0 ? i : fallback; };
  const iName = col(/material|artikull|item|pershkrim|përshkrim|description/, 0);
  const iQty = col(/sasi|qty|quantity|sasia/, 1);
  const iUnit = col(/njësi|njesi|unit/, 2);
  return (hasHeader ? rows.slice(1) : rows).flatMap((r) => {
    const line = `${r[iQty] ?? ""} ${r[iUnit] ?? ""} ${r[iName] ?? ""}`.trim();
    return parseRequirements(line);
  });
}

function unitCompatible(req: Requirement, listing: Listing) {
  return !req.unit || req.unit === listing.unit;
}

/** How well a listing fits a requirement, 0–1, from words and colour; category and unit must already match. */
export function fit(req: Requirement, listing: Listing) {
  const title = listing.title.toLowerCase();
  const wordHits = req.words.filter((w) => title.includes(w.slice(0, 5))).length;
  const colour = req.color ? (listing.color === req.color || title.includes(req.color.slice(0, 4)) ? 1 : 0) : 0.5;
  return Math.min(1, 0.45 + wordHits * 0.12 + colour * 0.3);
}

export function candidatesFor(req: Requirement, listings: Listing[]) {
  return listings.filter((l) => l.category === req.category && l.quantity > 0 && unitCompatible(req, l));
}

const isReuse = (l: Listing) => l.condition === "riperdorur" || l.condition === "teprice";

function score(mode: Mode, req: Requirement, l: Listing, from: Point, maxPrice: number) {
  const d = distanceKm(from, l.point);
  const price = l.priceLek / maxPrice; // 0..1
  const near = Math.min(1, d / 150);
  const reuse = l.condition === "riperdorur" ? 1 : l.condition === "teprice" ? 0.7 : 0;
  const f = fit(req, l);
  if (mode === "budget") return price * 0.8 + near * 0.2 - f * 0.05;
  if (mode === "eco") return -reuse * 0.6 + price * 0.2 + near * 0.15 - f * 0.1;
  return price * 0.4 + near * 0.25 - reuse * 0.2 - f * 0.25;
}

export type PlanInput = {
  requirements: Requirement[];
  listings: Listing[];
  from?: Point;
  budgetLek?: number;
  assumptions?: Assumptions;
  /** Listing chosen by the user for a requirement; used first when it still has stock. */
  pinned?: Record<string, string>;
  /** Listings the user removed. */
  excluded?: string[];
};

export function buildPlan(mode: Mode, input: PlanInput): Plan {
  const from = input.from ?? CITIES["Tiranë"];
  const a = input.assumptions ?? DEFAULT_ASSUMPTIONS;
  const left = new Map(input.listings.map((l) => [l.id, l.quantity]));
  const excluded = new Set(input.excluded ?? []);
  const lines: Line[] = [];
  const missing: Plan["missing"] = [];

  for (const req of input.requirements) {
    if (!req.category) { missing.push({ requirementId: req.id, quantity: req.quantity, unit: req.unit, reason: "Materiali nuk u njoh" }); continue; }
    const pool = candidatesFor(req, input.listings).filter((l) => !excluded.has(l.id));
    if (!pool.length) { missing.push({ requirementId: req.id, quantity: req.quantity, unit: req.unit, reason: "Nuk ka stok të përshtatshëm në treg" }); continue; }
    const maxPrice = Math.max(...pool.map((l) => l.priceLek), 1);
    const pin = input.pinned?.[req.id];
    const ordered = [...pool].sort((x, y) => (x.id === pin ? -1 : y.id === pin ? 1 : score(mode, req, x, from, maxPrice) - score(mode, req, y, from, maxPrice)));
    // Prefer one seller that covers everything for this need when the plan already uses that seller (fewer trips).
    let need = req.quantity;
    for (const l of ordered) {
      if (need <= 0) break;
      const available = left.get(l.id) ?? 0;
      if (available <= 0) continue;
      const take = Math.min(need, available);
      left.set(l.id, available - take);
      need = Math.round((need - take) * 1000) / 1000;
      lines.push({ requirementId: req.id, listing: l, take, costLek: Math.round(take * l.priceLek), distanceKm: distanceKm(from, l.point) });
    }
    if (need > 0) missing.push({ requirementId: req.id, quantity: need, unit: req.unit ?? pool[0].unit, reason: "Stoku i disponueshëm nuk mjafton" });
  }

  return summarise(mode, lines, missing, a, input.budgetLek);
}

export function summarise(mode: Mode, lines: Line[], missing: Plan["missing"], a: Assumptions, budgetLek?: number): Plan {
  const sellers = new Map<string, number>();
  for (const line of lines) {
    const key = `${line.listing.sellerName}|${line.listing.city}`;
    sellers.set(key, Math.max(sellers.get(key) ?? 0, line.distanceKm));
  }
  const transportLek = [...sellers.values()].reduce((sum, km) => sum + a.tripBaseLek + km * a.perKmLek, 0);
  const materialLek = lines.reduce((s, l) => s + l.costLek, 0);
  const referenceLek = lines.reduce((s, l) => s + l.take * (l.listing.marketPriceLek ?? l.listing.priceLek), 0);
  const reuseLek = lines.filter((l) => isReuse(l.listing)).reduce((s, l) => s + l.costLek, 0);
  const co2AvoidedKg = lines.filter((l) => isReuse(l.listing)).reduce((s, l) => {
    const f = co2Factors[l.listing.category];
    const kg = f?.kgPerUnit[l.listing.unit];
    return s + (f && kg ? l.take * kg * f.kgCO2PerKg : 0);
  }, 0);
  const totalLek = Math.round(materialLek + transportLek);
  return {
    mode, lines, missing, materialLek: Math.round(materialLek), transportLek: Math.round(transportLek), totalLek,
    budgetLek, remainingLek: budgetLek !== undefined ? budgetLek - totalLek : undefined,
    referenceLek: Math.round(referenceLek), savingLek: Math.max(0, Math.round(referenceLek - materialLek)),
    reuseShare: materialLek ? reuseLek / materialLek : 0, co2AvoidedKg: Math.round(co2AvoidedKg),
    sellers: sellers.size, usesDemo: lines.some((l) => l.listing.source === "demo"),
  };
}

export function buildPlans(input: PlanInput) {
  return (["budget", "balanced", "eco"] as const).map((mode) => buildPlan(mode, input));
}

export function cityPoint(city: string): Point {
  return CITIES[city as City] ?? CITIES["Tiranë"];
}

/** Plain-text summary for export or reading aloud. */
export function planToCsv(plan: Plan, requirements: Requirement[]) {
  const req = new Map(requirements.map((r) => [r.id, r]));
  const head = "Nevoja;Artikulli;Shitësi;Qyteti;Sasia;Njësia;Çmimi/njësi (L);Kosto (L);Burimi";
  const rows = plan.lines.map((l) => [req.get(l.requirementId)?.text ?? "", l.listing.title, l.listing.sellerName, l.listing.city, l.take, l.listing.unit, l.listing.priceLek, l.costLek, l.listing.source === "demo" ? "demo" : "treg"].join(";"));
  const miss = plan.missing.map((m) => [req.get(m.requirementId)?.text ?? "", "MUNGON", "", "", m.quantity, m.unit ?? "", "", "", m.reason].join(";"));
  const totals = [`;;;;;;Materiale;${plan.materialLek};`, `;;;;;;Transport (vlerësim);${plan.transportLek};`, `;;;;;;Totali;${plan.totalLek};`];
  return [head, ...rows, ...miss, ...totals].join("\n");
}
