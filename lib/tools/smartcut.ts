/**
 * SmartCut: deterministic 2D cutting optimisation for rectangular pieces on rectangular sheets and offcuts.
 * Packing uses MaxRects (best short-side fit) with kerf, rotation, grain direction and defect areas.
 * Sheet choice tries several orderings of the available stock and keeps the cheapest valid plan.
 * No language model is involved in any geometric calculation.
 */

export type Rect = { x: number; y: number; w: number; h: number };

export type PieceSpec = { id: string; label: string; length: number; width: number; quantity: number; /** Grain must run along the length. */ grain?: boolean };

export type Stock = {
  id: string;
  title: string;
  material: string;
  length: number;
  width: number;
  thickness: number;
  quantity: number;
  priceLek: number;
  /** Price of the same area bought new, if known. */
  newPriceLek?: number;
  sellerName?: string;
  city?: string;
  source?: "live" | "demo";
  defects?: Rect[];
  href?: string;
};

export type Settings = {
  kerf: number;
  allowRotation: boolean;
  /** Leftovers with both sides at least this size count as reusable. */
  minLeftover: number;
  /** Trim along each sheet edge (damaged factory edges). */
  edgeTrim: number;
};

export const DEFAULT_SETTINGS: Settings = { kerf: 3, allowRotation: true, minLeftover: 150, edgeTrim: 0 };

export type Placement = { pieceId: string; label: string; x: number; y: number; w: number; h: number; rotated: boolean; index: number };

export type SheetLayout = {
  stock: Stock;
  copy: number;
  placements: Placement[];
  usedArea: number;
  utilization: number;
  leftovers: Rect[];
  cuts: { x1: number; y1: number; x2: number; y2: number }[];
};

export type CutPlan = {
  sheets: SheetLayout[];
  unplaced: { pieceId: string; label: string; length: number; width: number; reason: string }[];
  costLek: number;
  newCostLek?: number;
  savingLek?: number;
  pieceArea: number;
  stockArea: number;
  utilization: number;
  wasteArea: number;
  reusableLeftoverArea: number;
  strategy: string;
};

type Item = { pieceId: string; label: string; w: number; h: number; grain: boolean; index: number };

/** One sheet's free-space bookkeeping (MaxRects). Coordinates are in the sheet's own frame. */
class MaxRects {
  free: Rect[];
  constructor(public W: number, public H: number, blocked: Rect[] = []) {
    this.free = [{ x: 0, y: 0, w: W, h: H }];
    for (const b of blocked) this.occupy(b);
  }

  /** Best short-side fit. Returns the spot for a w×h box (already including kerf), or null. */
  find(w: number, h: number): Rect | null {
    let best: Rect | null = null, bestShort = Infinity, bestLong = Infinity;
    for (const f of this.free) {
      if (w <= f.w && h <= f.h) {
        const short = Math.min(f.w - w, f.h - h), long = Math.max(f.w - w, f.h - h);
        if (short < bestShort || (short === bestShort && long < bestLong)) { best = { x: f.x, y: f.y, w, h }; bestShort = short; bestLong = long; }
      }
    }
    return best;
  }

  occupy(r: Rect) {
    const next: Rect[] = [];
    for (const f of this.free) {
      if (r.x >= f.x + f.w || r.x + r.w <= f.x || r.y >= f.y + f.h || r.y + r.h <= f.y) { next.push(f); continue; }
      if (r.x > f.x) next.push({ x: f.x, y: f.y, w: r.x - f.x, h: f.h });
      if (r.x + r.w < f.x + f.w) next.push({ x: r.x + r.w, y: f.y, w: f.x + f.w - (r.x + r.w), h: f.h });
      if (r.y > f.y) next.push({ x: f.x, y: f.y, w: f.w, h: r.y - f.y });
      if (r.y + r.h < f.y + f.h) next.push({ x: f.x, y: r.y + r.h, w: f.w, h: f.y + f.h - (r.y + r.h) });
    }
    // Drop rectangles contained in another.
    this.free = next.filter((a, i) => a.w > 0 && a.h > 0 && !next.some((b, j) => j !== i && a.x >= b.x && a.y >= b.y && a.x + a.w <= b.x + b.w && a.y + a.h <= b.y + b.h && (j < i || a.w !== b.w || a.h !== b.h || a.x !== b.x || a.y !== b.y)));
  }
}

function expand(pieces: PieceSpec[]): Item[] {
  const items: Item[] = [];
  let index = 1;
  for (const p of pieces) for (let i = 0; i < p.quantity; i++) items.push({ pieceId: p.id, label: p.quantity > 1 ? `${p.label}${i + 1}` : p.label, w: p.length, h: p.width, grain: Boolean(p.grain), index: index++ });
  return items.sort((a, b) => b.w * b.h - a.w * a.h || Math.max(b.w, b.h) - Math.max(a.w, a.h));
}

/** Packs items into one sheet. Sheet length runs along x; grain pieces keep their length along x. */
function packSheet(stock: Stock, copy: number, items: Item[], s: Settings) {
  const trim = s.edgeTrim;
  // Kerf: each piece reserves kerf on its right/bottom; the usable sheet gains one kerf so the last piece can touch the edge.
  const W = stock.length - 2 * trim + s.kerf, H = stock.width - 2 * trim + s.kerf;
  const blocked = (stock.defects ?? []).map((d) => ({ x: Math.max(0, d.x - trim - s.kerf), y: Math.max(0, d.y - trim - s.kerf), w: d.w + 2 * s.kerf, h: d.h + 2 * s.kerf }));
  const bin = new MaxRects(W, H, blocked);
  const placements: Placement[] = [];
  const rest: Item[] = [];
  for (const it of items) {
    const options: [number, number, boolean][] = [[it.w, it.h, false]];
    if (s.allowRotation && !it.grain && it.w !== it.h) options.push([it.h, it.w, true]);
    let chosen: { r: Rect; rotated: boolean } | null = null, score = Infinity;
    for (const [w, h, rotated] of options) {
      const r = bin.find(w + s.kerf, h + s.kerf);
      if (r) { const sc = r.y * 100000 + r.x; if (sc < score) { score = sc; chosen = { r, rotated }; } }
    }
    if (!chosen) { rest.push(it); continue; }
    bin.occupy(chosen.r);
    const w = chosen.rotated ? it.h : it.w, h = chosen.rotated ? it.w : it.h;
    placements.push({ pieceId: it.pieceId, label: it.label, x: chosen.r.x + trim, y: chosen.r.y + trim, w, h, rotated: chosen.rotated, index: it.index });
  }
  const usedArea = placements.reduce((a, p) => a + p.w * p.h, 0);
  const leftovers = bin.free
    .map((f) => ({ x: f.x + trim, y: f.y + trim, w: Math.min(f.w, stock.length - trim - (f.x + trim)), h: Math.min(f.h, stock.width - trim - (f.y + trim)) }))
    .filter((f) => f.w >= s.minLeftover && f.h >= s.minLeftover);
  const cuts = placements.flatMap((p) => [
    { x1: p.x, y1: p.y + p.h, x2: p.x + p.w, y2: p.y + p.h },
    { x1: p.x + p.w, y1: p.y, x2: p.x + p.w, y2: p.y + p.h },
  ]).filter((c) => (c.x1 === c.x2 ? c.x1 < stock.length - trim : c.y1 < stock.width - trim));
  const layout: SheetLayout = { stock, copy, placements, usedArea, utilization: usedArea / (stock.length * stock.width), leftovers: largestDisjoint(leftovers), cuts };
  return { layout, rest };
}

/** Free rectangles overlap; for display and reuse figures keep a disjoint set, largest first. */
function largestDisjoint(rects: Rect[]): Rect[] {
  const out: Rect[] = [];
  for (const r of [...rects].sort((a, b) => b.w * b.h - a.w * a.h)) {
    if (!out.some((o) => r.x < o.x + o.w && r.x + r.w > o.x && r.y < o.y + o.h && r.y + r.h > o.y)) out.push(r);
  }
  return out;
}

function fitsAnywhere(it: Item, stock: Stock, s: Settings) {
  const L = stock.length - 2 * s.edgeTrim, Wd = stock.width - 2 * s.edgeTrim;
  return (it.w <= L && it.h <= Wd) || (s.allowRotation && !it.grain && it.h <= L && it.w <= Wd);
}

type Unit = { stock: Stock; copy: number };

function runStrategy(name: string, units: Unit[], items: Item[], s: Settings, newPricePerM2?: number): CutPlan {
  let pending = [...items];
  const sheets: SheetLayout[] = [];
  for (const u of units) {
    if (!pending.length) break;
    if (!pending.some((it) => fitsAnywhere(it, u.stock, s))) continue;
    const { layout, rest } = packSheet(u.stock, u.copy, pending, s);
    if (layout.placements.length) { sheets.push(layout); pending = rest; }
  }
  // Drop sheets whose pieces could all move to cheaper sheets already used: handled by trying multiple orderings.
  const costLek = sheets.reduce((a, l) => a + l.stock.priceLek, 0);
  const pieceArea = sheets.reduce((a, l) => a + l.usedArea, 0);
  const stockArea = sheets.reduce((a, l) => a + l.stock.length * l.stock.width, 0);
  const reusableLeftoverArea = sheets.reduce((a, l) => a + l.leftovers.reduce((b, r) => b + r.w * r.h, 0), 0);
  const newCostLek = newPricePerM2 !== undefined ? newSheetCost(items, s, newPricePerM2) : undefined;
  return {
    sheets,
    unplaced: pending.map((it) => ({ pieceId: it.pieceId, label: it.label, length: it.w, width: it.h, reason: "Nuk gjendet copëz ose fletë e mjaftueshme me këtë trashësi" })),
    costLek, newCostLek, savingLek: newCostLek !== undefined && !pending.length ? Math.max(0, newCostLek - costLek) : undefined,
    pieceArea, stockArea, utilization: stockArea ? pieceArea / stockArea : 0, wasteArea: stockArea - pieceArea - reusableLeftoverArea,
    reusableLeftoverArea, strategy: name,
  };
}

/** Standard new sheet used for the comparison: 2800 × 2070 mm, the common panel size in Albanian depots. */
export const NEW_SHEET = { length: 2800, width: 2070 };

/** What the same pieces would cost cut from whole new sheets: you pay for full sheets, not for piece area. */
function newSheetCost(items: Item[], s: Settings, pricePerM2: number) {
  const sheetPrice = Math.round((NEW_SHEET.length * NEW_SHEET.width / 1e6) * pricePerM2);
  let pending = [...items], count = 0;
  while (pending.length && count < 50) {
    const st: Stock = { id: "new", title: "new", material: "", length: NEW_SHEET.length, width: NEW_SHEET.width, thickness: 0, quantity: 1, priceLek: sheetPrice };
    if (!pending.some((it) => fitsAnywhere(it, st, s))) break;
    const { rest } = packSheet(st, count, pending, s);
    if (rest.length === pending.length) break;
    pending = rest; count++;
  }
  return count * sheetPrice;
}

export function optimise(pieces: PieceSpec[], stock: Stock[], settings: Partial<Settings> = {}, newPricePerM2?: number): CutPlan {
  const s = { ...DEFAULT_SETTINGS, ...settings };
  const items = expand(pieces.filter((p) => p.length > 0 && p.width > 0 && p.quantity > 0));
  const units: Unit[] = stock.flatMap((st) => Array.from({ length: Math.max(0, Math.floor(st.quantity)) }, (_, copy) => ({ stock: st, copy })));
  const area = (u: Unit) => u.stock.length * u.stock.width;
  const perArea = (u: Unit) => u.stock.priceLek / area(u);
  const orders: [string, Unit[]][] = [
    ["Më e lira për m²", [...units].sort((a, b) => perArea(a) - perArea(b))],
    ["Copëzat e mëdha së pari", [...units].sort((a, b) => area(b) - area(a))],
    ["Copëzat e vogla së pari", [...units].sort((a, b) => area(a) - area(b))],
    ["Çmimi më i ulët për copë", [...units].sort((a, b) => a.stock.priceLek - b.stock.priceLek)],
  ];
  const plans = orders.map(([name, order]) => prune(runStrategy(name, order, items, s, newPricePerM2), items, s, newPricePerM2));
  // Fewest unplaced pieces first, then lowest cost, then least waste.
  return plans.sort((a, b) => a.unplaced.length - b.unplaced.length || a.costLek - b.costLek || a.wasteArea - b.wasteArea)[0];
}

/** Tries to drop each sheet in turn and repack: removes sheets that are not needed. */
function prune(plan: CutPlan, items: Item[], s: Settings, newPricePerM2?: number): CutPlan {
  let best = plan;
  for (let i = best.sheets.length - 1; i >= 0; i--) {
    const units = best.sheets.filter((_, j) => j !== i).map((l) => ({ stock: l.stock, copy: l.copy }));
    const trial = runStrategy(best.strategy, units, items, s, newPricePerM2);
    if (trial.unplaced.length <= best.unplaced.length && trial.costLek <= best.costLek) best = trial;
  }
  return best;
}

/** Geometry check used by tests and as a safety net before showing a plan. */
export function validate(plan: CutPlan, kerf: number) {
  const errors: string[] = [];
  for (const sh of plan.sheets) {
    for (const p of sh.placements) {
      if (p.x < 0 || p.y < 0 || p.x + p.w > sh.stock.length + 1e-6 || p.y + p.h > sh.stock.width + 1e-6) errors.push(`${p.label} del jashtë fletës`);
      for (const d of sh.stock.defects ?? []) if (p.x < d.x + d.w && p.x + p.w > d.x && p.y < d.y + d.h && p.y + p.h > d.y) errors.push(`${p.label} prek defektin`);
    }
    for (let i = 0; i < sh.placements.length; i++) for (let j = i + 1; j < sh.placements.length; j++) {
      const a = sh.placements[i], b = sh.placements[j];
      if (a.x < b.x + b.w + kerf - 1e-6 && a.x + a.w + kerf > b.x + 1e-6 && a.y < b.y + b.h + kerf - 1e-6 && a.y + a.h + kerf > b.y + 1e-6) errors.push(`${a.label} dhe ${b.label} mbivendosen ose s'kanë hapësirë sharre`);
    }
  }
  return errors;
}

/** Reference price of new sheet material per m², lekë, for the savings comparison (estimate, editable later). */
export const NEW_PRICE_PER_M2: Record<string, number> = {
  MDF: 1100, "Kompensatë": 2400, OSB: 850, Laminat: 1650, Granit: 14000, Mermer: 17500, Xham: 5100, Metal: 8200,
};
export const MATERIALS = Object.keys(NEW_PRICE_PER_M2);
