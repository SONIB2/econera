import type { Lang } from "@/lib/lang";

/** English names for the demo catalogue (demo text is ECONERA's own, so it is translated; seller text is not). */
export const DEMO_TITLE_EN: Record<string, string> = {
  "tulla-vrima-25x12": "Hollow bricks 25×12", "tulla-plote": "Solid bricks", "tulla-vrima-teprice": "Hollow bricks (surplus stock)", "tulla-rikuperuar": "Reclaimed bricks from demolition",
  "blloqe-betoni-20": "Concrete blocks 20 cm", "blloqe-durres": "Concrete blocks 25 cm", "suva-gelqere": "Lime plaster, 25 kg bags", "suva-gipsi": "Gypsum plaster, 30 kg bags",
  "cimento-42": "Cement 42.5, 50 kg bags", "cimento-shkoder": "Cement 32.5, 50 kg bags", "hekur-12": "Rebar Ø12, B450C", "hekur-10-vlore": "Rebar Ø10, B450C", "rere-lumi": "River sand",
  "pllaka-qeramike-30": "Ceramic tiles 30×60, grey", "pllaka-granit-60": "Granite tiles 60×60", "pllaka-porcelan": "Porcelain tiles 60×120, marble look", "pllaka-banjo": "Bathroom tiles 25×40, white",
  "parket-lisi": "Oak parquet 14 mm", "parket-laminat": "Laminate flooring AC4 8 mm", "parket-rikuperuar": "Reclaimed beech parquet",
  "dritare-pvc-120": "PVC window 120×140, double glazed", "dritare-alu": "Aluminium window 100×120", "dritare-druri": "Timber window 90×120",
  "dyer-brendshme": "Interior MDF door 80×210", "dyer-blinduar": "Security door 90×210", "dyer-druri-rik": "Reclaimed solid timber door",
  "wc-pezull": "Wall-hung toilet with cistern", "lavaman-60": "Ceramic washbasin 60 cm", "dush-xham": "Glass shower enclosure 90×90",
  "kabell-3x2.5": "NYM cable 3×2.5 mm²", "priza-celes": "Sockets and switches, box of 20", "panel-elektrik": "Electrical panel, 12 modules",
  "tub-ppr-25": "PPR pipe Ø25, 4 m bars", "tub-pvc-110": "PVC drain pipe Ø110", "rubinete": "Basin mixer tap",
  "polistirol-5": "EPS polystyrene 5 cm", "lesh-guri": "Stone wool 10 cm", "tjegulla": "Clay roof tiles", "membrane-bitum": "Bitumen membrane 4 mm", "xps-3": "XPS boards 3 cm",
  "boje-bardhe-15l": "White acrylic paint 15 L (surplus stock)", "boje-bezhe-15l": "Beige matt paint 15 L", "pllaka-bezhe-30x30": "Bathroom tiles 30×30, beige", "parket-lisi-rikuperuar": "Reclaimed oak parquet 15 mm",
  "off-mdf18-a": "MDF offcut 18 mm, 1200×800", "off-mdf18-b": "MDF offcut 18 mm, 1650×620", "off-mdf18-c": "MDF offcut 18 mm, 900×450", "off-mdf18-full": "Full MDF sheet 18 mm 2800×2070 (surplus)",
  "off-ply15-a": "Plywood offcut 15 mm, 1500×1000", "off-ply15-b": "Plywood offcut 15 mm, 1000×700", "off-osb12-a": "OSB offcut 12 mm, 2000×900", "off-granit20-a": "Granite offcut 20 mm, 1400×600",
  "off-mermer20-a": "Marble offcut 20 mm, 1100×650", "off-xham8-a": "Glass offcut 8 mm, 1200×700", "off-lam18-a": "Furniture laminate offcut 18 mm, 1800×600, walnut", "off-alu3-a": "Aluminium sheet offcut 3 mm, 1000×500",
};

const UNIT_EN: Record<string, [string, string]> = { "copë": ["pc", "pcs"], thes: ["bag", "bags"], "kovë": ["bucket", "buckets"], kuti: ["box", "boxes"], "paletë": ["pallet", "pallets"], ton: ["t", "t"] };
/** Unit as shown to the reader: Albanian units get English names; m, m², m³, kg stay as they are. */
export function unitLabel(unit: string, lang: Lang, plural = false) {
  if (lang !== "en") return unit;
  const u = UNIT_EN[unit];
  return u ? u[plural ? 1 : 0] : unit;
}

const REGION_EN: Record<string, string> = { "Tiranë": "Tirana", "Durrës": "Durrës", "Shkodër": "Shkodra", "Vlorë": "Vlora", "Korçë": "Korça", "Elbasan": "Elbasan", "Fier": "Fier", "Berat": "Berat", "Gjirokastër": "Gjirokastra", "Kukës": "Kukës", "Lezhë": "Lezha", "Dibër": "Dibra" };
export const regionLabel = (r: string, lang: Lang) => (lang === "en" ? REGION_EN[r] ?? r : r);
