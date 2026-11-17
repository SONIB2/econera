import co2 from "@/data/demo/co2.json";
import { formatNumber } from "./format";
import stockData from "@/data/demo/stock.json";
import supplierData from "@/data/demo/suppliers.json";

/** All stock, suppliers and prices here are invented demonstration data ("Të dhëna demonstruese"). */
export type Supplier = { id: string; name: string; type: "depo" | "furnitor" | "kantier"; city: string; area: string; lat: number; lng: number };
export type StockItem = {
  id: string; title: string; category: string; subtype: string; quantity: number; unit: string;
  priceLek: number; marketPriceLek: number; condition: string; supplierId: string;
};
export type StockView = StockItem & { supplier: Supplier; distanceKm: number; savingPct: number };

export const suppliers = supplierData as Supplier[];
export const stock = stockData as StockItem[];
export const co2Factors = co2.factors as Record<string, { kgCO2PerKg: number; kgPerUnit: Record<string, number> }>;
export const co2Source = co2._burimi;

/** Default reference point: Skanderbeg Square, Tirana. */
export const TIRANA = { lat: 41.3275, lng: 19.8189 };

export function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad, dLng = (b.lng - a.lng) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
}

const supplierById = new Map(suppliers.map((s) => [s.id, s]));

export function viewStock(item: StockItem, from = TIRANA): StockView {
  const supplier = supplierById.get(item.supplierId)!;
  return {
    ...item,
    supplier,
    distanceKm: Math.round(distanceKm(from, supplier) * 10) / 10,
    savingPct: Math.round((1 - item.priceLek / item.marketPriceLek) * 100),
  };
}

/**
 * Transparent demo "match" score: closer, cheaper and better-stocked offers score higher.
 * It is a heuristic for the demonstration, not a trained model.
 */
export function matchScore(item: StockView, wanted?: number) {
  const distance = Math.max(0, 1 - item.distanceKm / 120);
  const saving = Math.min(1, Math.max(0, item.savingPct / 50));
  const cover = wanted ? Math.min(1, item.quantity / wanted) : 1;
  return Math.round(60 + distance * 22 + saving * 10 + cover * 6);
}

export function stockFor(categories: string[], from = TIRANA, limit = 4) {
  return stock
    .filter((item) => categories.includes(item.category))
    .map((item) => viewStock(item, from))
    .map((item) => ({ ...item, match: matchScore(item) }))
    .sort((a, b) => b.match - a.match)
    .slice(0, limit);
}

export const formatLek = (value: number) => `${formatNumber(value, 0)} L`;
export const formatQty = (value: number) => formatNumber(value, 1);
