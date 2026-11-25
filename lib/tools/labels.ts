import { CATEGORIES } from "@/lib/market";

const EN: Record<string, string> = {
  tulla: "Bricks and blocks", cimento: "Cement", hekur: "Rebar and steel", agregat: "Sand and aggregate", suva: "Plaster",
  pllaka: "Tiles", parket: "Parquet and flooring", dritare: "Windows", dyer: "Doors", boje: "Paint", sanitari: "Sanitary",
  elektrike: "Electrical", hidraulike: "Plumbing", izolim: "Insulation", cati: "Roofing", copeza: "Material offcuts",
};

export function categoryLabel(id: string | undefined, lang: "sq" | "en") {
  if (!id) return lang === "en" ? "Unrecognised" : "E panjohur";
  if (id === "copeza") return lang === "en" ? EN.copeza : "Copëza materiali";
  return lang === "en" ? EN[id] ?? id : CATEGORIES.find((c) => c.id === id)?.label ?? id;
}

export const TOOL_CATEGORIES = [...CATEGORIES.map((c) => c.id), "copeza"];

export const CONDITION_LABEL = {
  sq: { "e-re": "E re", teprice: "Stok i tepërt", riperdorur: "E ripërdorur" },
  en: { "e-re": "New", teprice: "Surplus", riperdorur: "Reclaimed" },
} as const;

export const MODE_LABEL = {
  sq: { budget: "Më i liri", balanced: "I balancuar", eco: "Më ekologjik" },
  en: { budget: "Budget optimised", balanced: "Balanced", eco: "Eco optimised" },
} as const;

export const MODE_TEXT = {
  sq: { budget: "Kosto totale më e ulët, me transportin e vlerësuar.", balanced: "Çmim, afërsi, përputhje dhe ripërdorim në ekuilibër.", eco: "Sa më shumë materiale të ripërdorura dhe stok të tepërt." },
  en: { budget: "Lowest estimated total, transport included.", balanced: "Price, distance, fit and reuse in balance.", eco: "As much reclaimed and surplus material as practical." },
} as const;
