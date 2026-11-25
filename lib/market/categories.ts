/** Browse-by-material categories. `db` lists the listing categories that belong to each one. */
export type MarketCategory = { id: string; sq: string; en: string; db: string[] };

export const MARKET_CATEGORIES: MarketCategory[] = [
  { id: "structural", sq: "Materiale strukturore", en: "Structural materials", db: ["struktura", "metal", "beton"] },
  { id: "wood", sq: "Dru dhe lëndë drusore", en: "Wood & timber", db: ["dru"] },
  { id: "bricks", sq: "Tulla dhe gur", en: "Bricks & stone", db: ["guri"] },
  { id: "roofing", sq: "Çati", en: "Roofing", db: ["cati"] },
  { id: "facade", sq: "Fasadë", en: "Facade", db: ["fasade"] },
  { id: "insulation", sq: "Izolim", en: "Insulation", db: ["izolim"] },
  { id: "plumbing", sq: "Hidraulikë dhe sanitari", en: "Plumbing", db: ["hidraulike", "sanitari"] },
  { id: "electrical", sq: "Elektrike", en: "Electrical", db: ["elektrike"] },
  { id: "hvac", sq: "Ngrohje dhe ventilim", en: "HVAC", db: ["hvac"] },
  { id: "tiles", sq: "Pllaka dhe dysheme", en: "Tiles & flooring", db: ["qeramike"] },
  { id: "drywall", sq: "Gipskarton dhe suva", en: "Drywall", db: ["suva"] },
  { id: "windows", sq: "Dritare dhe dyer", en: "Windows & doors", db: ["dyer", "xham"] },
  { id: "paint", sq: "Bojë dhe përfundime", en: "Paint & finishes", db: ["boje"] },
  { id: "outdoor", sq: "Punime të jashtme", en: "Outdoor works", db: ["jashte"] },
  { id: "tools", sq: "Vegla dhe pajisje", en: "Tools & equipment", db: ["vegla"] },
  { id: "furniture", sq: "Mobilie dhe interier", en: "Furniture & interiors", db: ["mobilje"] },
  { id: "offcuts", sq: "Copa të mbetura materialesh", en: "Material offcuts", db: [] },
];

export function uiCategoryOf(db: string) {
  return MARKET_CATEGORIES.find((c) => c.db.includes(db))?.id ?? "structural";
}

export const CONDITION_UI = {
  surplus: { sq: "Material i tepërt", en: "Surplus" },
  reclaimed: { sq: "I rikuperuar", en: "Reclaimed" },
  offcut: { sq: "Copë e mbetur", en: "Offcut" },
} as const;
