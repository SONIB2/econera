import "server-only";
import { publicDatabase } from "@/lib/supabase";
import { demoListings, fromLive, type Listing } from "./inventory";

type LiveRow = Parameters<typeof fromLive>[0];

/** Loads live listings when Supabase is configured. Offcut columns are read only if their migration has been applied. */
export async function liveListings(): Promise<{ listings: Listing[]; connected: boolean }> {
  const db = publicDatabase();
  if (!db) return { listings: [], connected: false };
  const base = "id,title,category,region,condition,unit,quantity,unit_price,currency,fulfillment,seller_label";
  const withSheets = await db.from("public_catalogue").select(`${base},length_mm,width_mm,thickness_mm,sheet_material,color`).limit(500);
  const result = withSheets.error ? await db.from("public_catalogue").select(base).limit(500) : withSheets;
  if (result.error) return { listings: [], connected: false };
  return { listings: (result.data as unknown as LiveRow[]).map(fromLive), connected: true };
}

export type InventorySnapshot = { listings: Listing[]; live: number; demo: number; connected: boolean };

/** Live listings first; demo listings are added so the tools stay usable, always labelled as demo. */
export async function loadInventory({ includeDemo = true } = {}): Promise<InventorySnapshot> {
  const live = await liveListings().catch(() => ({ listings: [], connected: false }));
  const demo = includeDemo ? demoListings() : [];
  return { listings: [...live.listings, ...demo], live: live.listings.length, demo: demo.length, connected: live.connected };
}

