import { z } from "zod";
import { masonryTypes, findMasonryType, type MasonryType } from "./masonry";

export const categories = [
  { id: "dru", name: "Dru dhe parket" },
  { id: "qeramike", name: "Pllaka dhe qeramikë" },
  { id: "guri", name: "Gur dhe muraturë" },
  { id: "metal", name: "Metal dhe profile" },
  { id: "dyer", name: "Dyer dhe dritare" },
  { id: "izolim", name: "Izolim dhe panele" },
  { id: "beton", name: "Beton" },
  { id: "xham", name: "Dritare dhe xham" },
  { id: "cati", name: "Çati dhe mbulim" },
] as const;
export const regions = ["Berat", "Dibër", "Durrës", "Elbasan", "Fier", "Gjirokastër", "Korçë", "Kukës", "Lezhë", "Shkodër", "Tiranë", "Vlorë"] as const;
export const units = ["copë", "m", "m²", "m³", "kg", "ton", "paletë"] as const;
export const conditions = { unused: "I papërdorur", reusable: "I ripërdorshëm" } as const;
export const fulfillment = { pickup: "Tërheqje në vend", delivery: "Me dërgesë", both: "Tërheqje ose dërgesë" } as const;
export const currencies = ["ALL", "EUR"] as const;

export const decimal = (places: number) => z.string().trim()
  .regex(new RegExp(`^\\d{1,8}(?:[.,]\\d{1,${places}})?$`))
  .transform((raw) => Number(raw.replace(",", ".")))
  .pipe(z.number().min(0).max(10_000_000));

export const materialCategory = z.enum(categories.map(({ id }) => id));
export const materialInput = z.object({
  title: z.string().trim().min(4).max(100),
  description: z.string().trim().min(12).max(2000),
  category: materialCategory,
  region: z.enum(regions),
  condition: z.enum(["unused", "reusable"]),
  unit: z.enum(units),
  quantity: decimal(3),
  unit_price: decimal(2),
  currency: z.enum(currencies),
  fulfillment: z.enum(["pickup", "delivery", "both"]),
  masonry_type: z.union([z.enum(masonryTypes.map(({ id }) => id)), z.literal("")]).optional().transform((value) => value || null),
  seller_label: z.string().trim().max(80).refine((value) => value.length === 0 || value.length >= 2).optional().transform((value) => value || null),
}).refine((item) => item.category === "guri" || item.masonry_type === null, { path: ["masonry_type"] });
export type MaterialInput = z.output<typeof materialInput>;

/** Optional offcut/sheet dimensions (migration 202611250007). Empty form fields mean "not an offcut". */
export const sheetMaterials = ["MDF", "Kompensatë", "OSB", "Laminat", "Granit", "Mermer", "Xham", "Metal", "Dru"] as const;
const optionalNumber = (max: number) => z.string().trim().optional().transform((v) => (v ? Number(v.replace(",", ".")) : null)).pipe(z.number().positive().max(max).nullable());
export const sheetInput = z.object({
  sheet_material: z.union([z.enum(sheetMaterials), z.literal("")]).optional().transform((v) => v || null),
  color: z.string().trim().max(40).optional().transform((v) => v || null),
  length_mm: optionalNumber(20000), width_mm: optionalNumber(20000), thickness_mm: optionalNumber(500),
}).refine((s) => !s.sheet_material || (s.length_mm && s.width_mm && s.thickness_mm), { path: ["length_mm"] });
export type CatalogueEntry = MaterialInput & { id: string; created_at: string; updated_at: string; masonry_type: MasonryType | null };
export type InventoryEntry = CatalogueEntry & {
  publication: "draft" | "published" | "archived";
  moderation: "unreviewed" | "pending" | "approved" | "rejected";
  revision: number;
};

export const uuid = z.uuid();
export const revision = z.coerce.number().int().min(1).max(2_147_483_647);
const first = (value: string | string[] | undefined) => typeof value === "string" ? value : "";
export type SearchParams = Record<string, string | string[] | undefined>;
export function catalogueFilters(params: SearchParams) {
  const sort = z.enum(["recent", "price_asc", "price_desc"]).safeParse(first(params.sort)).data ?? "recent";
  const currency = z.enum(currencies).safeParse(first(params.currency)).data;
  return {
    q: first(params.q).trim().slice(0, 80),
    category: materialCategory.safeParse(first(params.category)).data,
    masonry: findMasonryType(first(params.masonry))?.id,
    region: z.enum(regions).safeParse(first(params.region)).data,
    condition: z.enum(["unused", "reusable"]).safeParse(first(params.condition)).data,
    unit: z.enum(units).safeParse(first(params.unit)).data,
    minQuantity: decimal(3).safeParse(first(params.minQuantity)).data,
    maxPrice: currency ? decimal(2).safeParse(first(params.maxPrice)).data : undefined,
    currency,
    sort: currency ? sort : "recent" as const,
    page: z.coerce.number().int().min(1).max(1000).safeParse(first(params.page)).data ?? 1,
  };
}
export const categoryName = (id: string) => categories.find((entry) => entry.id === id)?.name ?? id;
export const priceLabel = (value: number, currency: string) => new Intl.NumberFormat("sq-AL", { style: "currency", currency }).format(value);
