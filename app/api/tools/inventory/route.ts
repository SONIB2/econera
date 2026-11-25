import { NextResponse } from "next/server";
import { loadInventory } from "@/lib/tools/inventory-server";

export const revalidate = 60;

/** Public, approved listings only (plus labelled demo examples). No seller contact data. */
export async function GET() {
  const inventory = await loadInventory();
  return NextResponse.json(inventory, { headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" } });
}
