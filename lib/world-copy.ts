import { masonryTypes, type MasonryType } from "./masonry";

export const worldCopy = {
  sq: {
    world: "Bota e ndërtimit ECONERA", enter: "Hyr në botën e ndërtimit", skip: "Kalo hyrjen", catalogue: "Shfleto katalogun",
    nav: "Lëvizja në botë", inside: "Brenda shtëpisë", entry: "Te hyrja", back: "Kthehu", workspace: "Hapësira e punës",
    loading: "Po përgatitet bota e ndërtimit…", unavailable: "Pamja 3D nuk u ngarkua.", studio: "Hap studion e muraturës", openCatalogue: "Hap katalogun",
    door: "Hap derën", wall: "Shiko murin e tullave", approaching: "Po afrohemi te hyrja.", opening: "Dera po hapet.",
    entering: "Po hyjmë në shtëpi.", focusing: "Po afrohemi te muri i tullave.", masonry: "Muratura", type: "Tipi i muraturës",
    checks: "Kontrollo para porosisë", stock: "Stoku i publikuar", empty: "Nuk ka stok të publikuar për këtë tip murature.",
    seller: "Shitësi pa emër publik", quote: "Kërko ofertë", quoteFor: "Kërko ofertë për", stockError: "Stoku nuk mund të ngarkohet për momentin.",
    return: "Kthehu në shtëpi", illustrative: "Sipërfaqe ilustruese",
  },
  en: {
    world: "ECONERA construction world", enter: "Enter the construction world", skip: "Skip the entrance", catalogue: "Browse catalogue (SQ)",
    nav: "World navigation", inside: "Inside the house", entry: "Back to the door", back: "Back", workspace: "Workspace (SQ)",
    loading: "Preparing the construction world…", unavailable: "The 3D view could not load.", studio: "Open the masonry studio (SQ)", openCatalogue: "Open catalogue (SQ)",
    door: "Open the door", wall: "Inspect the brick wall", approaching: "Approaching the entrance.", opening: "The door is opening.",
    entering: "Moving inside the house.", focusing: "Moving towards the brick wall.", masonry: "Masonry", type: "Masonry type",
    checks: "Check before ordering", stock: "Published inventory", empty: "There is no published stock for this masonry type.",
    seller: "No public seller name", quote: "Request quotation (SQ)", quoteFor: "Request a quotation in Albanian for", stockError: "Inventory is temporarily unavailable.",
    return: "Back inside", illustrative: "Illustrative surface",
  },
};

const englishMaterials: Record<MasonryType, { name: string; description: string; checks: string[] }> = {
  clay: { name: "Solid clay brick", description: "Solid clay units for exposed masonry or restoration, subject to project specification.", checks: ["Dimensions and tolerances", "Water absorption", "Declared compressive strength"] },
  hollow: { name: "Hollow clay brick", description: "Clay units with internal perforations. Cavity shape and orientation vary by product.", checks: ["Cavity orientation", "Module dimensions", "Thermal and structural documentation"] },
  reclaimed: { name: "Reclaimed brick", description: "Salvaged units vary in colour, size and condition. Review a sample and the provenance of each lot.", checks: ["Lot provenance", "Cracks and mortar residue", "Suitability for intended use"] },
  block: { name: "Concrete masonry block", description: "Concrete units for masonry systems. Composition, mass and geometry vary by manufacturer and model.", checks: ["Module dimensions", "Unit weight and geometry", "Documentation for structural use"] },
};

export const worldMaterials = {
  sq: masonryTypes,
  en: masonryTypes.map(({ id }) => ({ id, ...englishMaterials[id] })),
};

export const englishFulfillment = { pickup: "Collection", delivery: "Delivery available", both: "Collection or delivery" };
export const englishUnit: Record<string, string> = { "copë": "pcs", "ton": "t", "paletë": "pallets" };
