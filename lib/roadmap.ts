// ECONERA product ecosystem: what exists today and where the platform is heading.
// Honesty rules for this file:
//  - "available" and "beta" only for tools that work on the site today.
//  - "development" only when development has started AND a release plan is confirmed. Nothing qualifies yet.
//  - Everything conceptual is "planned" (next in line) or "future" (longer-term vision); no release promises.

export type RoadmapStatus = "available" | "beta" | "development" | "planned" | "future";
export type StageId = "circular" | "intelligence" | "operations" | "enterprise";
type Text = { sq: string; en: string };

export type RoadmapProduct = {
  id: string;
  name: string;
  stage: StageId;
  status: RoadmapStatus;
  text: Text;
  href?: string;
};

export const STATUS: Record<RoadmapStatus, { label: Text; meaning: Text }> = {
  available: {
    label: { sq: "I disponueshëm", en: "Available" },
    meaning: { sq: "Funksionon sot në econera.al gjatë fazës pilot.", en: "Works today on econera.al during the pilot." },
  },
  beta: {
    label: { sq: "Beta", en: "Beta" },
    meaning: { sq: "Mund ta provoni, por disa funksione janë ende të kufizuara.", en: "You can try it; some features are still limited." },
  },
  development: {
    label: { sq: "Në zhvillim", en: "In development" },
    meaning: { sq: "Zhvillimi ka nisur dhe ka një plan publikimi të konfirmuar. Aktualisht asnjë produkt.", en: "Development has started and a release plan is confirmed. No products at the moment." },
  },
  planned: {
    label: { sq: "I planifikuar", en: "Planned" },
    meaning: { sq: "Pjesë e hapit të ardhshëm. Ende pa datë publikimi.", en: "Part of the next stage. No release date yet." },
  },
  future: {
    label: { sq: "Zhvillim i ardhshëm", en: "Future development" },
    meaning: { sq: "Pjesë e vizionit afatgjatë. Do të përcaktohet bashkë me përdoruesit.", en: "Part of the long-term vision. To be shaped together with users." },
  },
};

export const STAGES: { id: StageId; title: Text; text: Text }[] = [
  {
    id: "circular",
    title: { sq: "Ndërtim qarkullues", en: "Circular Construction" },
    text: { sq: "Materialet mbeten në përdorim: blini, shisni, verifikoni dhe projektoni me atë që ekziston.", en: "Materials stay in use: buy, sell, verify and design with what already exists." },
  },
  {
    id: "intelligence",
    title: { sq: "Inteligjencë biznesi", en: "Business Intelligence" },
    text: { sq: "Vendime më të mira para se të nisë puna: tendera, kosto, çmime dhe dokumente.", en: "Better decisions before work starts: tenders, costs, prices and documents." },
  },
  {
    id: "operations",
    title: { sq: "Operacionet e ndërtimit", en: "Construction Operations" },
    text: { sq: "Drejtimi i projekteve në kantier: punimet, transporti dhe financat.", en: "Running projects on site: the work, the transport and the money." },
  },
  {
    id: "enterprise",
    title: { sq: "Ekosistem për ndërmarrjet", en: "Enterprise Ecosystem" },
    text: { sq: "I lidhur me sistemet dhe partnerët me të cilët kompanitë punojnë tashmë.", en: "Connected to the systems and partners companies already work with." },
  },
];

export const PRODUCTS: RoadmapProduct[] = [
  // 1. Circular construction: the platform as it exists today.
  { id: "marketplace", name: "ECONERA Marketplace", stage: "circular", status: "available", href: "/treg",
    text: { sq: "Shitblerje materialesh ndërtimi të tepërta dhe të rikuperuara.", en: "Buy and sell surplus and reclaimed construction materials." } },
  { id: "passport", name: "Material Passport", stage: "circular", status: "available", href: "/verify",
    text: { sq: "Listime të shqyrtuara nga njerëz, me kod publik verifikimi.", en: "Listings reviewed by people, with a public verification code." } },
  { id: "basket", name: "Smart Basket", stage: "circular", status: "available", href: "/ai/shporta",
    text: { sq: "Lista e plotë e materialeve, sipas buxhetit tuaj.", en: "A complete material list, matched to your budget." } },
  { id: "smartcut", name: "SmartCut", stage: "circular", status: "available", href: "/ai/smartcut",
    text: { sq: "Plane prerjeje që përdorin fillimisht mbetjet dhe stokun e tepërt.", en: "Cutting plans that use offcuts and surplus stock first." } },
  { id: "renovation", name: "AI Renovation", stage: "circular", status: "beta", href: "/ai/renovim",
    text: { sq: "Ridizenjoni një dhomë dhe merrni materialet që i duhen.", en: "Redesign a room and get the materials it needs." } },
  { id: "voice", name: "ECONERA Voice", stage: "circular", status: "beta", href: "/ai",
    text: { sq: "Kërkoni materiale duke folur, në shqip ose anglisht.", en: "Search for materials by speaking, in Albanian or English." } },
  { id: "smart-inventory", name: "ECONERA Smart Inventory", stage: "circular", status: "planned",
    text: { sq: "Stoku i depove dhe kantiereve në një vend; tepricat listohen me një hap.", en: "Stock across warehouses and sites in one place; list surplus in one step." } },
  { id: "carbon", name: "ECONERA Carbon Intelligence", stage: "circular", status: "planned",
    text: { sq: "Vlerësim i karbonit të trupëzuar dhe i kursimit nga materialet e ripërdorura.", en: "Embodied-carbon estimates and the savings from reused materials." } },

  // 2. Business intelligence.
  { id: "tender", name: "ECONERA Tender Intelligence", stage: "intelligence", status: "planned",
    text: { sq: "Gjeni tenderat publikë që përputhen me kapacitetin dhe materialet tuaja.", en: "Find public tenders that match your capacity and materials." } },
  { id: "estimator", name: "ECONERA Cost Estimator", stage: "intelligence", status: "planned",
    text: { sq: "Sasi dhe intervale kostoje nga planimetritë dhe specifikimet.", en: "Quantities and cost ranges from drawings and specifications." } },
  { id: "market-intel", name: "ECONERA Market Intelligence", stage: "intelligence", status: "planned",
    text: { sq: "Trendet e çmimeve dhe disponueshmërisë së materialeve në Shqipëri.", en: "Price and availability trends for materials across Albania." } },
  { id: "document-ai", name: "ECONERA Document AI", stage: "intelligence", status: "planned",
    text: { sq: "Certifikata, fatura dhe deklarata performance, të lexuara në të dhëna të strukturuara.", en: "Certificates, invoices and performance declarations, read into structured data." } },

  // 3. Construction operations.
  { id: "project", name: "ECONERA Project Management", stage: "operations", status: "future",
    text: { sq: "Grafiku, detyrat dhe materialet e çdo kantieri në një vend.", en: "Schedules, tasks and materials for every site in one place." } },
  { id: "logistics", name: "ECONERA Smart Logistics", stage: "operations", status: "future",
    text: { sq: "Planifikimi i dorëzimeve dhe i grumbullimit të materialeve mes kantiereve.", en: "Planning deliveries and material collection between sites." } },
  { id: "finance", name: "ECONERA Finance", stage: "operations", status: "future",
    text: { sq: "Faturim, afate pagese dhe buxhete projektesh për bizneset e ndërtimit.", en: "Invoicing, payment terms and project budgets for construction businesses." } },

  // 4. Enterprise ecosystem.
  { id: "partners", name: "Partner Network", stage: "enterprise", status: "available", href: "/partneret",
    text: { sq: "Furnitorë, prodhues dhe institucione që bashkëpunojnë me ECONERA.", en: "Suppliers, manufacturers and institutions working with ECONERA." } },
  { id: "erp", name: "ECONERA ERP Connect", stage: "enterprise", status: "future",
    text: { sq: "Sinkronizim i stokut, porosive dhe faturave me ERP-në dhe kontabilitetin ekzistues.", en: "Syncing stock, orders and invoices with existing ERP and accounting software." } },
];

/** The ten upcoming products, in the order shown on the homepage. */
export const UPCOMING_ORDER = ["smart-inventory", "tender", "finance", "estimator", "project", "logistics", "carbon", "document-ai", "market-intel", "erp"];
export const UPCOMING = UPCOMING_ORDER.map((id) => PRODUCTS.find((p) => p.id === id)!);

/** Products a visitor can register interest in (not yet available). */
export const INTEREST_OPTIONS = PRODUCTS.filter((p) => p.status !== "available" && p.status !== "beta");
export const shortName = (name: string) => name.replace(/^ECONERA /, "");
