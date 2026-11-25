/**
 * AI Renovation: room model, design styles and material estimation.
 * Quantities are deterministic formulas from confirmed measurements, with stated waste factors that the user can edit.
 * They are planning estimates, not certified architectural or engineering calculations.
 */
import type { Requirement } from "./basket";

export type RoomType = "ndenje" | "kuzhine" | "banjo" | "dhome-gjumi" | "zyre" | "ballkon" | "komercial";
export type StyleId = "skandinav" | "minimalist" | "modern" | "fermë" | "industrial" | "japandi" | "mesdhetar" | "luksoz" | "bashkekohor" | "klasik";
export type Preference = "e-re" | "teprice" | "riperdorur" | "perzier";
export type FloorKind = "parket" | "pllaka";

export type Room = {
  type: RoomType;
  lengthM: number;
  widthM: number;
  heightM: number;
  doors: number;
  windows: number;
  scope: { floor: boolean; walls: boolean; ceiling: boolean; wallTiles: boolean; doors: boolean; fixtures: boolean };
  floor: FloorKind;
};

export type Brief = {
  propertyType: "apartament" | "shtepi" | "zyre" | "dyqan";
  style: StyleId;
  budgetEur?: number;
  colors: string;
  preference: Preference;
  city: string;
  sustainability: "larte" | "mesatare" | "e-ulet";
  keepLayout: boolean;
};

export const ROOM_TYPES: { id: RoomType; sq: string; en: string }[] = [
  { id: "ndenje", sq: "Dhomë ndenjeje", en: "Living room" }, { id: "kuzhine", sq: "Kuzhinë", en: "Kitchen" },
  { id: "banjo", sq: "Banjo", en: "Bathroom" }, { id: "dhome-gjumi", sq: "Dhomë gjumi", en: "Bedroom" },
  { id: "zyre", sq: "Zyrë", en: "Office" }, { id: "ballkon", sq: "Ballkon", en: "Balcony" }, { id: "komercial", sq: "Ambient komercial", en: "Commercial space" },
];

export type Style = { id: StyleId; sq: string; en: string; palette: string[]; floor: FloorKind; wall: string; wood: string; notesSq: string; notesEn: string };

export const STYLES: Style[] = [
  { id: "skandinav", sq: "Skandinav", en: "Scandinavian", palette: ["#f4f1ea", "#d9d4c7", "#b8a58a", "#6f7d6a", "#2f3a35"], floor: "parket", wall: "e bardhë", wood: "lis i çelët", notesSq: "Dru i çelët, mure të bardha, tekstile natyrale.", notesEn: "Light wood, white walls, natural textiles." },
  { id: "minimalist", sq: "Minimalist", en: "Minimalist", palette: ["#f7f7f5", "#e3e2de", "#bdbab3", "#7a7873", "#262626"], floor: "pllaka", wall: "e bardhë", wood: "ahu", notesSq: "Pak objekte, sipërfaqe të qeta, ngjyra neutrale.", notesEn: "Few objects, calm surfaces, neutral colours." },
  { id: "modern", sq: "Modern", en: "Modern", palette: ["#f2f2f0", "#cfd3d1", "#8b9693", "#3e4a48", "#1d2322"], floor: "pllaka", wall: "gri", wood: "arre", notesSq: "Linja të pastra, kontrast i butë, metal i zi.", notesEn: "Clean lines, soft contrast, black metal." },
  { id: "fermë", sq: "Fermë", en: "Farmhouse", palette: ["#f3ede2", "#e0d2b8", "#b08d63", "#7b6a52", "#3b3126"], floor: "parket", wall: "bezhë", wood: "lis i rikuperuar", notesSq: "Dru i ripërdorur, tone të ngrohta, detaje rustike.", notesEn: "Reclaimed wood, warm tones, rustic details." },
  { id: "industrial", sq: "Industrial", en: "Industrial", palette: ["#e8e6e1", "#a9a39a", "#6d6760", "#3a3633", "#1c1a19"], floor: "pllaka", wall: "gri", wood: "dru i errët", notesSq: "Tulla e dukshme, beton, metal dhe dru i vjetër.", notesEn: "Exposed brick, concrete, metal and old wood." },
  { id: "japandi", sq: "Japandi", en: "Japandi", palette: ["#efe9df", "#d8cdbb", "#a89377", "#5e5a4f", "#2b2a26"], floor: "parket", wall: "bezhë", wood: "lis", notesSq: "Qetësi japoneze me ngrohtësi skandinave.", notesEn: "Japanese calm with Scandinavian warmth." },
  { id: "mesdhetar", sq: "Mesdhetar", en: "Mediterranean", palette: ["#f7f2e8", "#e8d3b0", "#c98f5a", "#3f7b8c", "#23424b"], floor: "pllaka", wall: "e bardhë", wood: "ullinj", notesSq: "Mure të bardha, terrakotë, blu deti.", notesEn: "White walls, terracotta, sea blue." },
  { id: "luksoz", sq: "Luksoz", en: "Luxury", palette: ["#f4f0ea", "#d6c7ad", "#a6865a", "#4a3f35", "#151312"], floor: "pllaka", wall: "bezhë", wood: "arre", notesSq: "Mermer, tone ari të butë, materiale të rënda.", notesEn: "Marble, soft gold tones, heavy materials." },
  { id: "bashkekohor", sq: "Bashkëkohor", en: "Contemporary", palette: ["#f5f5f2", "#d4d8d4", "#9aa7a1", "#4d5c57", "#202826"], floor: "parket", wall: "gri", wood: "lis", notesSq: "Forma të buta, ngjyra natyrore, dritë e madhe.", notesEn: "Soft forms, natural colours, plenty of light." },
  { id: "klasik", sq: "Klasik", en: "Classic", palette: ["#f6f1e7", "#e3d5bd", "#b89a6e", "#6c5a45", "#2f261d"], floor: "parket", wall: "bezhë", wood: "lis i errët", notesSq: "Profile, simetri, dru i ngrohtë.", notesEn: "Mouldings, symmetry, warm wood." },
];

export type Assumption = { key: string; sq: string; en: string; value: number; unit: string };

export const DEFAULT_ASSUMPTIONS: Assumption[] = [
  { key: "wasteFloor", sq: "Humbje parketi/pllake në vendosje", en: "Flooring installation waste", value: 10, unit: "%" },
  { key: "wasteTiles", sq: "Humbje pllakash muri", en: "Wall tile waste", value: 12, unit: "%" },
  { key: "doorArea", sq: "Sipërfaqja e një dere", en: "Area of one door", value: 1.9, unit: "m²" },
  { key: "windowArea", sq: "Sipërfaqja e një dritareje", en: "Area of one window", value: 1.6, unit: "m²" },
  { key: "coats", sq: "Shtresa boje", en: "Paint coats", value: 2, unit: "" },
  { key: "coverage", sq: "Mbulim i bojës", en: "Paint coverage", value: 10, unit: "m²/L" },
  { key: "bucket", sq: "Madhësia e kovës", en: "Bucket size", value: 15, unit: "L" },
  { key: "tileHeight", sq: "Lartësia e pllakave në banjo", en: "Bathroom tile height", value: 2.1, unit: "m" },
];

export type EstimateLine = { key: string; category: string; sq: string; en: string; quantity: number; unit: string; basisSq: string; basisEn: string; color?: string };

const round = (n: number, step = 0.1) => Math.round(n / step) * step;

export function estimate(room: Room, style: Style, assumptions: Assumption[] = DEFAULT_ASSUMPTIONS): EstimateLine[] {
  const a = Object.fromEntries(assumptions.map((x) => [x.key, x.value])) as Record<string, number>;
  const floorArea = room.lengthM * room.widthM;
  const perimeter = 2 * (room.lengthM + room.widthM);
  const openings = room.doors * a.doorArea + room.windows * a.windowArea;
  const wallArea = Math.max(0, perimeter * room.heightM - openings);
  const lines: EstimateLine[] = [];
  const wet = room.type === "banjo" || room.type === "kuzhine";

  if (room.scope.floor) {
    const kind: FloorKind = room.type === "banjo" || room.type === "ballkon" ? "pllaka" : room.floor;
    const qty = round(floorArea * (1 + a.wasteFloor / 100));
    lines.push({ key: "floor", category: kind, sq: kind === "parket" ? `Parket ${style.wood}` : "Pllaka dyshemeje", en: kind === "parket" ? `Parquet, ${style.wood}` : "Floor tiles", quantity: qty, unit: "m²",
      basisSq: `${formatM(floorArea)} m² dysheme + ${a.wasteFloor}% humbje`, basisEn: `${formatM(floorArea)} m² floor + ${a.wasteFloor}% waste`, color: kind === "parket" ? undefined : style.wall });
  }
  if (room.scope.wallTiles && wet) {
    const tiled = room.type === "banjo" ? Math.max(0, perimeter * a.tileHeight - room.doors * a.doorArea) : Math.min(perimeter, 3.6) * 0.6;
    lines.push({ key: "wallTiles", category: "pllaka", sq: room.type === "banjo" ? "Pllaka banjoje për muret" : "Pllaka mbi banakun e kuzhinës", en: room.type === "banjo" ? "Bathroom wall tiles" : "Kitchen backsplash tiles", quantity: round(tiled * (1 + a.wasteTiles / 100)), unit: "m²",
      basisSq: room.type === "banjo" ? `perimetri ${formatM(perimeter)} m × ${a.tileHeight} m − dera, + ${a.wasteTiles}%` : `deri në 3.6 m × 0.6 m, + ${a.wasteTiles}%`,
      basisEn: room.type === "banjo" ? `perimeter ${formatM(perimeter)} m × ${a.tileHeight} m − door, + ${a.wasteTiles}%` : `up to 3.6 m × 0.6 m, + ${a.wasteTiles}%`, color: style.wall });
  }
  if (room.scope.walls || room.scope.ceiling) {
    const tiledWalls = room.type === "banjo" && room.scope.wallTiles ? Math.min(wallArea, perimeter * a.tileHeight) : 0;
    const area = (room.scope.walls ? wallArea - tiledWalls : 0) + (room.scope.ceiling ? floorArea : 0);
    const litres = (area * a.coats) / a.coverage;
    lines.push({ key: "paint", category: "boje", sq: `Bojë ${style.wall}`, en: `Paint, ${style.wall}`, quantity: Math.max(1, Math.ceil(litres / a.bucket)), unit: "kovë",
      basisSq: `${formatM(area)} m² × ${a.coats} shtresa ÷ ${a.coverage} m²/L = ${formatM(litres)} L, kova ${a.bucket} L`, basisEn: `${formatM(area)} m² × ${a.coats} coats ÷ ${a.coverage} m²/L = ${formatM(litres)} L, ${a.bucket} L buckets`, color: style.wall });
  }
  if (room.scope.doors && room.doors > 0) {
    lines.push({ key: "doors", category: "dyer", sq: "Derë e brendshme", en: "Interior door", quantity: room.doors, unit: "copë", basisSq: "sipas numrit të dyerve", basisEn: "by number of doors" });
  }
  if (room.scope.fixtures && room.type === "banjo") {
    lines.push({ key: "fixtures", category: "sanitari", sq: "WC, lavaman dhe dush", en: "WC, washbasin and shower", quantity: 3, unit: "copë", basisSq: "set bazë banjoje", basisEn: "basic bathroom set" });
  }
  return lines;
}

function formatM(n: number) {
  return (Math.round(n * 10) / 10).toString();
}

/** Turns estimate lines (after the user's edits) into Smart Basket requirements. */
export function toRequirements(lines: EstimateLine[]): Requirement[] {
  return lines.filter((l) => l.quantity > 0).map((l) => ({
    id: `ren-${l.key}`, text: l.sq, category: l.category, quantity: l.quantity, unit: l.unit, color: l.color,
    words: l.sq.toLowerCase().split(/[^\p{L}]+/u).filter((w) => w.length > 3),
  }));
}

/** Prompt for an image model: keeps layout, swaps finishes. Used only when an image provider is configured. */
export function designPrompt(room: Room, style: Style, brief: Brief, materials: string[]) {
  return [
    `Photorealistic interior renovation concept of a ${ROOM_TYPES.find((r) => r.id === room.type)?.en.toLowerCase() ?? "room"}, ${style.en} style.`,
    brief.keepLayout ? "Keep the exact room layout, walls, windows, doors and camera angle of the input photo." : "Layout may change.",
    `Finishes: ${materials.join(", ")}.`,
    brief.colors ? `Colour preferences: ${brief.colors}.` : "",
    `Palette: ${style.palette.join(", ")}.`,
    "Realistic materials, natural light, no people, no text.",
  ].filter(Boolean).join(" ");
}
