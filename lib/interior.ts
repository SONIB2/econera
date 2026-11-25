/** The nine clickable elements inside the house. Coordinates are metres in the building's ground floor. */
export type Vec3 = [number, number, number];

export type Layer = { name: string; thicknessCm: number; color: string };
export type Passport = { origin: string; co2: string; certificates: string[]; reuse: string };

export type Hotspot = {
  id: string;
  label: string;
  /** Short line under the title in the side panel. */
  summary: string;
  /** Material families shown as chips. */
  types: string[];
  /** Demo stock categories (data/demo/stock.json) shown in the panel and passed to /treg. */
  categories: string[];
  /** Camera position and target when the element is focused. */
  focus: { position: Vec3; target: Vec3 };
  /** Where the floating label sits. */
  anchor: Vec3;
  /** Cross-section revealed in X-Ray view, outermost first. */
  layers?: Layer[];
  passport: Passport;
};

export const HOTSPOTS: Hotspot[] = [
  {
    id: "mur", label: "Mur", summary: "Muratura mbajtëse dhe ndarëse.",
    types: ["Tulla me vrima", "Tulla e plotë", "Blloqe betoni", "Tulla e rikuperuar"],
    categories: ["tulla", "suva"],
    focus: { position: [-1.95, 1.6, 0.4], target: [-1.95, 1.45, -2.9] },
    anchor: [-1.95, 2.75, -2.7],
    layers: [
      { name: "Suva e brendshme", thicknessCm: 2, color: "#d8d2c4" },
      { name: "Tulla me vrima", thicknessCm: 20, color: "#b8683f" },
      { name: "Izolim EPS", thicknessCm: 5, color: "#e9efe4" },
      { name: "Suva e jashtme", thicknessCm: 2, color: "#9fb0a6" },
    ],
    passport: { origin: "Kantieri Ali Dem 7, Tiranë · stok i tepërt 2026", co2: "≈ 0.21 kg CO₂e/kg (vlerësim ICE v3)", certificates: ["EN 771-1 (deklaratë e prodhuesit)", "Kontroll vizual ECONERA"], reuse: "E ripërdorshme pas pastrimit të llaçit" },
  },
  {
    id: "dritare", label: "Dritare", summary: "Kornizë dhe xham termoizolues.",
    types: ["PVC", "Alumin", "Dru", "Xham dyfish"],
    categories: ["dritare"],
    focus: { position: [-1.1, 1.6, 0.1], target: [-3.9, 1.6, -0.6] },
    anchor: [-3.75, 2.55, -0.6],
    layers: [
      { name: "Xham i brendshëm 4 mm", thicknessCm: 0.4, color: "#bfe3d6" },
      { name: "Hapësirë me argon", thicknessCm: 1.6, color: "#1f3a30" },
      { name: "Xham i jashtëm Low-E 4 mm", thicknessCm: 0.4, color: "#a7d4c4" },
    ],
    passport: { origin: "Depoja Kamëz Stok · porosi e anuluar", co2: "≈ 2.6 kg CO₂e/kg (vlerësim)", certificates: ["EN 14351-1", "Uw ≈ 1.3 W/m²K (deklaruar)"], reuse: "Përdoret si e re, përmasa standarde" },
  },
  {
    id: "parket", label: "Parket", summary: "Dysheme druri dhe laminat.",
    types: ["Lis", "Ah", "Laminat AC4", "Parket i rikuperuar"],
    categories: ["parket"],
    focus: { position: [-1.4, 2.7, 1.3], target: [-1.6, 0, -1.2] },
    anchor: [-2.2, 0.35, -0.4],
    layers: [
      { name: "Parket lisi", thicknessCm: 1.4, color: "#a7774a" },
      { name: "Shtresë akustike", thicknessCm: 0.3, color: "#3d6b2a" },
      { name: "Massetto", thicknessCm: 5, color: "#8a8f86" },
      { name: "Pllakë betoni", thicknessCm: 15, color: "#5f6660" },
    ],
    passport: { origin: "Tepricat Sauk · rikuperuar nga rinovim", co2: "≈ 0.49 kg CO₂e/kg (vlerësim ICE v3)", certificates: ["FSC (sipas furnitorit)"], reuse: "Lëmohet dhe llakohet sërish" },
  },
  {
    id: "pllaka", label: "Pllaka", summary: "Veshje dyshemeje dhe muri.",
    types: ["Qeramikë", "Granit", "Porcelan"],
    categories: ["pllaka"],
    focus: { position: [1.7, 2.5, 1.4], target: [2.6, 0, -1.1] },
    anchor: [2.6, 0.35, -0.2],
    layers: [
      { name: "Pllakë porcelani", thicknessCm: 1, color: "#d9d6cf" },
      { name: "Ngjitës C2", thicknessCm: 0.5, color: "#9fb0a6" },
      { name: "Hidroizolim", thicknessCm: 0.2, color: "#3d6b2a" },
      { name: "Massetto", thicknessCm: 5, color: "#8a8f86" },
    ],
    passport: { origin: "Kantieri Ali Dem 7 · teprica nga projekti", co2: "≈ 0.78 kg CO₂e/kg (vlerësim ICE v3)", certificates: ["EN 14411", "Klasa PEI IV"], reuse: "Kuti të paprekura, gati për përdorim" },
  },
  {
    id: "sanitari", label: "Tualet / Sanitari", summary: "WC, lavaman dhe dush.",
    types: ["WC e pezulluar", "Lavaman", "Kabinë dushi"],
    categories: ["sanitari"],
    focus: { position: [1.9, 1.5, 0.3], target: [3.0, 0.6, -2.5] },
    anchor: [3.2, 1.45, -2.45],
    passport: { origin: "Kombinat Teprica · stok i tepërt", co2: "≈ 1.6 kg CO₂e/kg (vlerësim)", certificates: ["EN 997"], reuse: "E re, në paketim origjinal" },
  },
  {
    id: "dyer", label: "Dyer", summary: "Dyer të brendshme dhe të jashtme.",
    types: ["MDF", "Dru masiv", "E blinduar"],
    categories: ["dyer"],
    focus: { position: [1.3, 1.6, 1.4], target: [3.9, 1.1, 1.6] },
    anchor: [3.75, 2.45, 1.6],
    passport: { origin: "Magazina Lapraka Materiale", co2: "≈ 0.72 kg CO₂e/kg (vlerësim)", certificates: ["EN 14351-2"], reuse: "Pa dëmtime, me menteshat" },
  },
  {
    id: "elektrike", label: "Instalime elektrike", summary: "Kabllo, priza, çelësa dhe panel.",
    types: ["Kabllo NYM", "Priza dhe çelësa", "Panel elektrik"],
    categories: ["elektrike"],
    focus: { position: [0.6, 1.45, -0.5], target: [0.6, 1.0, -2.85] },
    anchor: [0.8, 2.25, -2.7],
    passport: { origin: "Furnitori Vora Ndërtim · bobina të hapura", co2: "≈ 3.8 kg CO₂e/kg (vlerësim)", certificates: ["CE", "HD 60364 (instalim nga elektricist i licencuar)"], reuse: "Kabllot testohen para përdorimit" },
  },
  {
    id: "hidraulike", label: "Hidraulikë", summary: "Tuba furnizimi dhe shkarkimi.",
    types: ["PPR", "PVC shkarkimi", "Rubinete"],
    categories: ["hidraulike"],
    focus: { position: [2.1, 1.25, -0.2], target: [3.6, 0.8, -2.4] },
    anchor: [3.72, 2.0, -1.5],
    passport: { origin: "Depoja Kamëz Stok", co2: "≈ 3.1 kg CO₂e/kg (vlerësim)", certificates: ["EN ISO 15874 (PPR)"], reuse: "Shufra të paprera, të reja" },
  },
  {
    id: "cati", label: "Çati / Izolim", summary: "Izolim termik dhe mbulesa.",
    types: ["EPS", "XPS", "Lesh guri", "Tjegulla", "Membranë bitumi"],
    categories: ["izolim", "cati"],
    focus: { position: [0, 1.25, 1.8], target: [0, 3.2, -1.4] },
    anchor: [0, 2.85, -1.2],
    layers: [
      { name: "Tavan gipsi", thicknessCm: 1.25, color: "#d8d2c4" },
      { name: "Lesh guri", thicknessCm: 10, color: "#c9b27a" },
      { name: "Soletë betoni", thicknessCm: 20, color: "#5f6660" },
      { name: "Membranë bitumi", thicknessCm: 0.4, color: "#2a3b32" },
    ],
    passport: { origin: "Magazina Lapraka Materiale · pako të hapura", co2: "≈ 1.3–3.3 kg CO₂e/kg sipas llojit (vlerësim ICE v3)", certificates: ["EN 13162 (lesh guri)", "Euroklasa A1"], reuse: "Ruajtur thatë, gati për përdorim" },
  },
];

export const INSIDE_VIEW = { position: [0, 1.6, 2.4] as Vec3, target: [0, 1.25, -3] as Vec3 };
export const hotspotById = (id: string | null) => HOTSPOTS.find((h) => h.id === id) ?? null;

const EN: Record<string, { label: string; summary: string }> = {
  mur: { label: "Wall", summary: "Load-bearing and partition masonry." },
  dritare: { label: "Window", summary: "Frame and insulated glazing." },
  parket: { label: "Parquet", summary: "Wooden and laminate flooring." },
  pllaka: { label: "Tiles", summary: "Floor and wall coverings." },
  sanitari: { label: "Toilet / Sanitary", summary: "WC, washbasin and shower." },
  dyer: { label: "Doors", summary: "Interior and exterior doors." },
  elektrike: { label: "Electrical", summary: "Cables, sockets, switches and panel." },
  hidraulike: { label: "Plumbing", summary: "Supply and drain pipes." },
  cati: { label: "Roof / Insulation", summary: "Thermal insulation and roofing." },
};

export function hotspotLabel(h: Hotspot | null | undefined, lang: "sq" | "en") {
  if (!h) return "";
  return lang === "en" ? EN[h.id]?.label ?? h.label : h.label;
}

export function hotspotSummary(h: Hotspot, lang: "sq" | "en") {
  return lang === "en" ? EN[h.id]?.summary ?? h.summary : h.summary;
}
