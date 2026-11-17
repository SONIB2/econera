import { catalogueFilters, type CatalogueEntry, type SearchParams } from "@/lib/data";
import { publicDatabase } from "@/lib/supabase";

export const pageSize = 12;
export const catalogueColumns = "id,title,description,category,region,condition,unit,quantity,unit_price,currency,fulfillment,created_at,updated_at,masonry_type,seller_label";
export const inventoryColumns = `${catalogueColumns},publication,moderation,revision`;

export async function readCatalogue(params: SearchParams, limit = pageSize) {
  const filters = catalogueFilters(params);
  const db = publicDatabase();
  if (!db) return { kind: "unavailable" as const, filters };
  const offset = (filters.page - 1) * limit;
  let query = db.from("public_catalogue").select(catalogueColumns);
  if (filters.q) {
    const literal = filters.q.replace(/[\\%_*]/g, "\\$&");
    query = query.ilike("title", `%${literal}%`);
  }
  if (filters.category) query = query.eq("category", filters.category);
  if (filters.masonry) query = query.eq("masonry_type", filters.masonry);
  if (filters.region) query = query.eq("region", filters.region);
  if (filters.condition) query = query.eq("condition", filters.condition);
  if (filters.unit) query = query.eq("unit", filters.unit);
  if (filters.currency) query = query.eq("currency", filters.currency);
  if (filters.minQuantity !== undefined) query = query.gte("quantity", filters.minQuantity);
  if (filters.maxPrice !== undefined) query = query.lte("unit_price", filters.maxPrice);
  if (filters.sort !== "recent") query = query.order("unit_price", { ascending: filters.sort === "price_asc" });
  const { data, error } = await query.order("created_at", { ascending: false })
    .order("id").range(offset, offset + limit).returns<CatalogueEntry[]>();
  if (error) return { kind: "error" as const, filters };
  return { kind: "ready" as const, filters, items: data.slice(0, limit), more: data.length > limit };
}

export async function readMaterial(id: string) {
  const db = publicDatabase();
  if (!db) return { kind: "unavailable" as const };
  const { data, error } = await db.from("public_catalogue").select(catalogueColumns)
    .eq("id", id).maybeSingle<CatalogueEntry>();
  if (error) return { kind: "error" as const };
  return data ? { kind: "ready" as const, material: data } : { kind: "missing" as const };
}
