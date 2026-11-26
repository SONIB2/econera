import "server-only";
import { publicDatabase, supabaseSettings } from "@/lib/supabase";

export type Partner = { id: string; name: string; category: string; description_sq: string | null; description_en: string | null; website: string | null; logo: string | null };

export const PARTNER_CATEGORY: Record<string, { sq: string; en: string }> = {
  supplier: { sq: "Furnitor", en: "Supplier" }, manufacturer: { sq: "Prodhues", en: "Manufacturer" }, construction: { sq: "Kompani ndërtimi", en: "Construction company" },
  architecture: { sq: "Arkitekturë dhe dizajn", en: "Architecture & design" }, logistics: { sq: "Logjistikë", en: "Logistics" },
  institution: { sq: "Institucion", en: "Institution" }, other: { sq: "Tjetër", en: "Other" },
};

export const logoUrl = (path: string | null) => {
  const s = supabaseSettings();
  return path && s ? `${s.url}/storage/v1/object/public/partner-logos/${encodeURIComponent(path)}` : null;
};

/** Published partners only (Row Level Security hides drafts from visitors). Empty when the table is not deployed yet. */
export async function publishedPartners(): Promise<Partner[]> {
  const db = publicDatabase();
  if (!db) return [];
  const { data, error } = await db.from("partners").select("id,name,category,description_sq,description_en,website,logo_path").eq("published", true).order("name");
  if (error || !data) return [];
  return data.map((p) => ({ ...p, logo: logoUrl(p.logo_path) }));
}
