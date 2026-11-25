import "server-only";
import { DEMO_TITLE_EN } from "./i18n";
import { createClient } from "@supabase/supabase-js";
import { publicDatabase } from "@/lib/supabase";
import { demoListings, distanceKm, EUR_TO_LEK, REGIONS } from "@/lib/tools/inventory";
import { MARKET_CATEGORIES, uiCategoryOf } from "./categories";

/**
 * Marketplace data. Live listings come only from `public_catalogue` (approved, published, in stock) and their
 * public verification record. Demo examples are returned separately and are never mixed into live results.
 */
export type MarketItem = {
  id: string;
  source: "live" | "demo";
  title: string;
  /** English name, only for ECONERA's own demo text (seller text is never machine-translated). */
  titleEn?: string;
  description: string;
  dbCategory: string;
  category: string;
  region: string;
  condition: "surplus" | "reclaimed" | "offcut";
  unit: string;
  quantity: number;
  unitPrice: number;
  currency: "ALL" | "EUR";
  priceLek: number;
  referenceLek?: number;
  fulfillment: "pickup" | "delivery" | "both";
  seller: string;
  verifiedBusiness: boolean;
  verifiedIdentity: boolean;
  passport?: string | null;
  photo?: string | null;
  sheet?: { length: number; width: number; thickness: number; material: string } | null;
  createdAt: string;
  km?: number;
};

type Row = {
  id: string; title: string; description: string; category: string; region: string; condition: "unused" | "reusable"; unit: string;
  quantity: number | string; unit_price: number | string; currency: "ALL" | "EUR"; fulfillment: MarketItem["fulfillment"]; seller_label: string | null;
  created_at: string; length_mm?: number | null; width_mm?: number | null; thickness_mm?: number | null; sheet_material?: string | null;
};

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.SUPABASE_SECRET_KEY;
  return url && key ? createClient(url, key, { auth: { persistSession: false } }) : null;
}

/** First accepted photo per approved listing, as a 1-hour signed URL. Needs SUPABASE_SECRET_KEY; otherwise no photos. */
async function photosFor(ids: string[]): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  const admin = adminClient();
  if (!admin || !ids.length) return out;
  const { data } = await admin.from("verification_documents").select("subject_id,storage_path,created_at")
    .eq("subject_type", "material").eq("doc_type", "photo").eq("review_status", "accepted").in("subject_id", ids).order("created_at");
  const first = new Map<string, string>();
  for (const d of data ?? []) if (!first.has(d.subject_id)) first.set(d.subject_id, d.storage_path);
  if (!first.size) return out;
  const { data: signed } = await admin.storage.from("verify-docs").createSignedUrls([...first.values()], 3600);
  const byPath = new Map((signed ?? []).filter((s) => s.signedUrl).map((s) => [s.path, s.signedUrl]));
  for (const [id, path] of first) { const u = byPath.get(path); if (u) out.set(id, u); }
  return out;
}

/** All photos of one approved listing (product page gallery). */
export async function galleryFor(id: string): Promise<string[]> {
  const admin = adminClient();
  if (!admin) return [];
  const { data: listed } = await admin.from("public_catalogue").select("id").eq("id", id).maybeSingle();
  if (!listed) return [];
  const { data } = await admin.from("verification_documents").select("storage_path").eq("subject_type", "material").eq("subject_id", id).eq("doc_type", "photo").eq("review_status", "accepted").order("created_at");
  if (!data?.length) return [];
  const { data: signed } = await admin.storage.from("verify-docs").createSignedUrls(data.map((d) => d.storage_path), 3600);
  return (signed ?? []).map((s) => s.signedUrl).filter(Boolean) as string[];
}

export async function liveMarket(): Promise<{ items: MarketItem[]; connected: boolean }> {
  const db = publicDatabase();
  if (!db) return { items: [], connected: false };
  const base = "id,title,description,category,region,condition,unit,quantity,unit_price,currency,fulfillment,seller_label,created_at";
  let res = await db.from("public_catalogue").select(`${base},length_mm,width_mm,thickness_mm,sheet_material`).order("created_at", { ascending: false }).limit(1000);
  if (res.error) res = await db.from("public_catalogue").select(base).order("created_at", { ascending: false }).limit(1000) as typeof res;
  if (res.error) return { items: [], connected: false };
  const rows = (res.data ?? []) as Row[];
  const ids = rows.map((r) => r.id);
  const [{ data: verify }, photos] = await Promise.all([
    ids.length ? db.from("public_verification").select("material_id,passport_code,business_verified,identity_verified,business_name").in("material_id", ids) : Promise.resolve({ data: [] as never[] }),
    photosFor(ids),
  ]);
  const v = new Map((verify ?? []).map((x: { material_id: string; passport_code: string | null; business_verified: boolean | null; identity_verified: boolean | null; business_name: string | null }) => [x.material_id, x]));
  const items = rows.map((r): MarketItem => {
    const price = Number(r.unit_price);
    const sheet = r.length_mm && r.width_mm && r.thickness_mm ? { length: Number(r.length_mm), width: Number(r.width_mm), thickness: Number(r.thickness_mm), material: r.sheet_material ?? "" } : null;
    const ver = v.get(r.id);
    return {
      id: r.id, source: "live", title: r.title, description: r.description, dbCategory: r.category, category: sheet ? "offcuts" : uiCategoryOf(r.category),
      region: r.region, condition: sheet ? "offcut" : r.condition === "reusable" ? "reclaimed" : "surplus", unit: r.unit, quantity: Number(r.quantity),
      unitPrice: price, currency: r.currency, priceLek: r.currency === "EUR" ? price * EUR_TO_LEK : price, fulfillment: r.fulfillment,
      seller: ver?.business_name ?? r.seller_label ?? "", verifiedBusiness: Boolean(ver?.business_verified), verifiedIdentity: Boolean(ver?.identity_verified),
      passport: ver?.passport_code ?? null, photo: photos.get(r.id) ?? null, sheet, createdAt: r.created_at,
    };
  });
  return { items, connected: true };
}

/** Demo examples (clearly labelled in the UI, never orderable). */
export function demoMarket(): MarketItem[] {
  const toUi: Record<string, string> = { tulla: "bricks", cimento: "structural", hekur: "structural", agregat: "outdoor", suva: "drywall", pllaka: "tiles", parket: "wood", dritare: "windows", dyer: "windows", boje: "paint", sanitari: "plumbing", elektrike: "electrical", hidraulike: "plumbing", izolim: "insulation", cati: "roofing", copeza: "offcuts" };
  return demoListings().map((l) => ({
    id: l.id, source: "demo", title: l.title, titleEn: DEMO_TITLE_EN[l.id.replace("demo:", "")], description: "", dbCategory: l.category, category: toUi[l.category] ?? "structural", region: l.city,
    condition: l.sheet ? "offcut" : l.condition === "riperdorur" ? "reclaimed" : "surplus", unit: l.unit, quantity: l.quantity, unitPrice: l.priceLek, currency: "ALL",
    priceLek: l.priceLek, referenceLek: l.marketPriceLek, fulfillment: l.fulfillment, seller: l.sellerName, verifiedBusiness: false, verifiedIdentity: false,
    sheet: l.sheet ? { length: l.sheet.lengthMm, width: l.sheet.widthMm, thickness: l.sheet.thicknessMm, material: l.sheet.material } : null, createdAt: "2026-11-01T00:00:00Z",
  }));
}

export type Filters = {
  q?: string; category?: string; region?: string; near?: string; radius?: number; condition?: string[]; minPrice?: number; maxPrice?: number;
  minQty?: number; unit?: string; verified?: boolean; delivery?: boolean; pickup?: boolean; sort?: string; page?: number;
  /** Use the words for ranking only (when a category was already understood from the query). */
  rankOnly?: boolean;
};

export const SORTS = ["relevance", "newest", "price_asc", "price_desc", "distance", "quantity", "value"] as const;

export function applyFilters(items: MarketItem[], f: Filters) {
  const words = (f.q ?? "").toLowerCase().split(/[^\p{L}\p{N}]+/u).filter((w) => w.length > 2);
  const from = f.near ? REGIONS[f.near] : undefined;
  let out = items.map((i) => ({ ...i, km: from ? distanceKm(from, REGIONS[i.region] ?? REGIONS["Tiranë"]) : undefined, score: 0 }));
  if (words.length) {
    out = out.map((i) => {
      const hay = `${i.title} ${i.titleEn ?? ""} ${i.description} ${i.seller} ${i.region} ${i.dbCategory} ${MARKET_CATEGORIES.find((c) => c.id === i.category)?.en ?? ""} ${MARKET_CATEGORIES.find((c) => c.id === i.category)?.sq ?? ""}`.toLowerCase();
      return { ...i, score: words.filter((w) => hay.includes(w.slice(0, Math.max(4, w.length - 2)))).length };
    }).filter((i) => f.rankOnly || i.score > 0);
  }
  if (f.category) out = out.filter((i) => i.category === f.category);
  if (f.region) out = out.filter((i) => i.region === f.region);
  if (from && f.radius) out = out.filter((i) => (i.km ?? 0) <= f.radius!);
  if (f.condition?.length) out = out.filter((i) => f.condition!.includes(i.condition));
  if (f.minPrice !== undefined) out = out.filter((i) => i.priceLek >= f.minPrice!);
  if (f.maxPrice !== undefined) out = out.filter((i) => i.priceLek <= f.maxPrice!);
  if (f.minQty !== undefined) out = out.filter((i) => i.quantity >= f.minQty!);
  if (f.unit) out = out.filter((i) => i.unit === f.unit);
  if (f.verified) out = out.filter((i) => i.verifiedBusiness || i.verifiedIdentity);
  if (f.delivery) out = out.filter((i) => i.fulfillment !== "pickup");
  if (f.pickup) out = out.filter((i) => i.fulfillment !== "delivery");
  const cmp: Record<string, (a: typeof out[number], b: typeof out[number]) => number> = {
    relevance: (a, b) => b.score - a.score || b.createdAt.localeCompare(a.createdAt),
    newest: (a, b) => b.createdAt.localeCompare(a.createdAt),
    price_asc: (a, b) => a.priceLek - b.priceLek,
    price_desc: (a, b) => b.priceLek - a.priceLek,
    distance: (a, b) => (a.km ?? 0) - (b.km ?? 0),
    quantity: (a, b) => b.quantity - a.quantity,
    value: (a, b) => (b.referenceLek ? 1 - b.priceLek / b.referenceLek : 0) - (a.referenceLek ? 1 - a.priceLek / a.referenceLek : 0) || a.priceLek - b.priceLek,
  };
  return out.sort(cmp[f.sort ?? "relevance"] ?? cmp.relevance);
}

export function countByCategory(items: MarketItem[]) {
  const m = new Map<string, number>();
  for (const i of items) m.set(i.category, (m.get(i.category) ?? 0) + 1);
  return m;
}
