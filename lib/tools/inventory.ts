/**
 * One inventory for the AI tools. Real listings come from Supabase (`public_catalogue`, approved and published,
 * quantity > 0). Demo listings are kept only so the tools can be tried before the pilot has real stock, and every
 * one carries `source: "demo"` so the UI can label it. Nothing here invents availability for a live listing.
 */
import { conditionOf, type Condition } from "@/lib/market";
import { stock, suppliers } from "@/lib/demo";
import offcutData from "@/data/demo/offcuts.json";

export type Point = { lat: number; lng: number };

export type Listing = {
  id: string;
  source: "live" | "demo";
  title: string;
  category: string;
  unit: string;
  quantity: number;
  /** Unit price converted to lekë. */
  priceLek: number;
  /** Reference price for the same item new, when known. Live listings have none yet. */
  marketPriceLek?: number;
  condition: Condition;
  color?: string;
  sellerName: string;
  city: string;
  point: Point;
  fulfillment: "pickup" | "delivery" | "both";
  /** Sheet or offcut size in millimetres, for SmartCut. */
  sheet?: { lengthMm: number; widthMm: number; thicknessMm: number; material: string; defects?: { x: number; y: number; w: number; h: number }[] };
  href?: string;
};

/** Region centroids (approximate) so live listings, which store a region only, can get a distance. */
export const REGIONS: Record<string, Point> = {
  Berat: { lat: 40.7058, lng: 19.9522 }, "Dibër": { lat: 41.6852, lng: 20.4296 }, "Durrës": { lat: 41.3231, lng: 19.4414 },
  Elbasan: { lat: 41.1125, lng: 20.0822 }, Fier: { lat: 40.7239, lng: 19.5561 }, "Gjirokastër": { lat: 40.0758, lng: 20.1389 },
  "Korçë": { lat: 40.6186, lng: 20.7808 }, "Kukës": { lat: 42.0769, lng: 20.4219 }, "Lezhë": { lat: 41.7836, lng: 19.6436 },
  "Shkodër": { lat: 42.0683, lng: 19.5126 }, "Tiranë": { lat: 41.3275, lng: 19.8189 }, "Vlorë": { lat: 40.4661, lng: 19.4914 },
};

/** Live categories (legacy inventory) mapped to the tool categories. */
const LIVE_CATEGORY: Record<string, string> = { dru: "parket", qeramike: "pllaka", guri: "tulla", metal: "hekur", dyer: "dyer", izolim: "izolim" };

/** Conversion used only to compare EUR listings with lekë; configurable, shown as an estimate in the UI. */
export const EUR_TO_LEK = Number(process.env.NEXT_PUBLIC_EUR_TO_LEK ?? 100);

const supplierById = new Map(suppliers.map((s) => [s.id, s]));

export function demoListings(): Listing[] {
  const items: Listing[] = stock.map((item) => {
    const s = supplierById.get(item.supplierId)!;
    return {
      id: `demo:${item.id}`, source: "demo", title: item.title, category: item.category, unit: item.unit, quantity: item.quantity,
      priceLek: item.priceLek, marketPriceLek: item.marketPriceLek, condition: conditionOf(item.condition), color: item.color,
      sellerName: s.name, city: s.city, point: { lat: s.lat, lng: s.lng }, fulfillment: "both",
    };
  });
  const offcuts: Listing[] = (offcutData as OffcutRecord[]).map((o) => {
    const s = supplierById.get(o.supplierId)!;
    return {
      id: `demo:${o.id}`, source: "demo", title: o.title, category: "copeza", unit: "copë", quantity: o.quantity,
      priceLek: o.priceLek, marketPriceLek: o.newPriceLek, condition: o.reused ? "riperdorur" : "teprice", color: o.color,
      sellerName: s.name, city: s.city, point: { lat: s.lat, lng: s.lng }, fulfillment: "both",
      sheet: { lengthMm: o.lengthMm, widthMm: o.widthMm, thicknessMm: o.thicknessMm, material: o.material, defects: o.defects },
    };
  });
  return [...items, ...offcuts];
}

type OffcutRecord = {
  id: string; title: string; material: string; lengthMm: number; widthMm: number; thicknessMm: number; color?: string;
  quantity: number; priceLek: number; newPriceLek: number; reused?: boolean; supplierId: string;
  defects?: { x: number; y: number; w: number; h: number }[];
};

export type LiveRow = {
  id: string; title: string; category: string; region: string; condition: "unused" | "reusable"; unit: string;
  quantity: number | string; unit_price: number | string; currency: "ALL" | "EUR"; fulfillment: Listing["fulfillment"]; seller_label: string | null;
  length_mm?: number | null; width_mm?: number | null; thickness_mm?: number | null; sheet_material?: string | null; color?: string | null;
};

export function fromLive(row: LiveRow): Listing {
  const price = Number(row.unit_price) * (row.currency === "EUR" ? EUR_TO_LEK : 1);
  const sheet = row.length_mm && row.width_mm && row.thickness_mm
    ? { lengthMm: Number(row.length_mm), widthMm: Number(row.width_mm), thicknessMm: Number(row.thickness_mm), material: row.sheet_material ?? "dru" }
    : undefined;
  return {
    id: `live:${row.id}`, source: "live", title: row.title, category: sheet ? "copeza" : LIVE_CATEGORY[row.category] ?? row.category,
    unit: row.unit, quantity: Number(row.quantity), priceLek: Math.round(price * 100) / 100,
    condition: row.condition === "reusable" ? "riperdorur" : "teprice", color: row.color ?? undefined,
    sellerName: row.seller_label ?? "Shitës i verifikuar", city: row.region, point: REGIONS[row.region] ?? REGIONS["Tiranë"],
    fulfillment: row.fulfillment, sheet, href: `/materiale/${row.id}`,
  };
}

export function distanceKm(a: Point, b: Point) {
  const rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad, dLng = (b.lng - a.lng) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
  return Math.round(6371 * 2 * Math.asin(Math.sqrt(h)) * 10) / 10;
}
