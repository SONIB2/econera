import type { Locale } from "./i18n";

export const steps = [
  { id: "world", status: "live", href: "/?scene=portal" },
  { id: "house", status: "prototype", href: "/?scene=house" },
  { id: "material", status: "live", href: "/materiale/murature" },
  { id: "record", status: "live", href: "/materiale" },
  { id: "project", status: "planned" },
  { id: "quote", status: "partial", href: "/inventari/ofertat" },
  { id: "logistics", status: "planned" },
  { id: "order", status: "planned" },
  { id: "passport", status: "planned" },
  { id: "ai", status: "planned" },
] as const;

type StepId = typeof steps[number]["id"];
type Status = typeof steps[number]["status"];
type Copy = {
  shell: Record<"skip" | "nav" | "world" | "catalogue" | "demo" | "signin" | "mission" | "footer" | "a11y" | "home", string>;
  overview: Record<"title" | "description" | "start" | "problemTitle" | "problem" | "technologyTitle" | "technology" | "usersTitle" | "users" | "circularTitle" | "circular" | "accessTitle" | "access" | "roadmap" | "pilot" | "pilotUnavailable", string>;
  tour: Record<"title" | "description" | "fixture" | "index" | "previous" | "next" | "finish" | "open" | "price" | "quantity" | "location" | "total" | "pieces" | "city", string>;
  statuses: Record<Status, string>;
  steps: Record<StepId, readonly [string, string]>;
};

export const showcaseCopy: Record<Locale, Copy> = {
  sq: {
    shell: { skip: "Kalo te përmbajtja", nav: "Navigimi kryesor", world: "Eksploro botën", catalogue: "Katalogu", demo: "Platforma", signin: "Hyr", mission: "Materiale ndërtimi dhe ripërdorim në Shqipëri.", footer: "Lidhjet në fund të faqes", a11y: "Aksesueshmëria", home: "ECONERA, kryefaqja" },
    overview: {
      title: "Nga materiali te projekti",
      description: "ECONERA lidh eksplorimin arkitektonik me inventarin e ndërtimit dhe kërkesat për ofertë. Ndiq rrugëtimin e një materiali në 3–5 minuta.",
      start: "Fillo demonstrimin",
      problemTitle: "Sfida dhe mundësia",
      problem: "Informacioni për materialet, sasitë dhe furnitorët shpërndahet në lista dhe biseda. ECONERA synon t’i afrojë këto të dhëna me vendimin e blerjes, veçanërisht për lote të tepërta ose të ripërdorshme.",
      technologyTitle: "Si funksionon",
      technology: "Një skenë 3D lidh elementet e ndërtesës me klasifikimin e muraturës dhe inventarin e publikuar. Supabase ruan materialet, anëtarësitë dhe kërkesat për ofertë, ndërsa politikat e PostgreSQL kufizojnë qasjen.",
      usersTitle: "Për kë është",
      users: "Për kontraktorë, projektues, furnitorë dhe pronarë që kërkojnë materiale sipas specifikimit, sasisë dhe vendndodhjes. Organizatat ofrojnë një bazë për bashkëpunim në prokurim.",
      circularTitle: "Ripërdorimi",
      circular: "Synimi është të gjenden përdorime të reja për materialet e tepërta. Gjurmueshmëria e loteve dhe metodologjia e matjes së ndikimit mbeten në zhvillim.",
      accessTitle: "Qasje dhe zgjerim",
      access: "Demonstrimi përdoret me tastierë dhe pa WebGL. Bota 3D ka një rrugë alternative drejt katalogut. Modulet ndajnë një bazë të dhënash me politika qasjeje sipas përdoruesit.",
      roadmap: "Gjendja e produktit",
      pilot: "Kërko qasje pilot",
      pilotUnavailable: "Kërkesat për qasje pilot ende nuk janë hapur.",
    },
    tour: { title: "Demonstrimi ECONERA", description: "Ndiq një lot murature, nga elementi i ndërtesës te një porosi shembull.", fixture: "Të dhëna shembull. Ky lot nuk ofrohet për blerje.", index: "Hapat e demonstrimit", previous: "Hapi i kaluar", next: "Hapi tjetër", finish: "Përfundo demonstrimin", open: "Hap funksionin në shqip", price: "Çmimi për copë", quantity: "Sasia", location: "Vendndodhja", total: "Vlera e materialit", pieces: "copë", city: "Tiranë" },
    statuses: { live: "Funksional", prototype: "Prototip interaktiv", partial: "Kërkesat funksionojnë", planned: "Në plan" },
    steps: {
      world: ["Hyr në ECONERA World", "Afrohu te porta dhe hape për të hyrë në ndërtesë."],
      house: ["Eksploro ndërtesën", "Brenda, zgjidh murin e tullave për të hapur pamjen e materialit."],
      material: ["Zgjidh llojin e muraturës", "Studioja ndryshon teksturën ilustrative dhe filtron inventarin e publikuar sipas klasifikimit të zgjedhur."],
      record: ["Shqyrto lotin e materialit", "Një rekord tregon sasinë, njësinë, vendndodhjen dhe kushtet e ofertës që ka publikuar shitësi."],
      project: ["Përgatit një projekt blerjeje", "Shembull: një ekip që rinovon një ambient pune cakton sasinë e tullave dhe afatin e nevojshëm."],
      quote: ["Shqyrto ofertën e furnitorit", "Përdoruesit mund të dërgojnë kërkesa për ofertë. Oferta e mëposhtme ilustron përgjigjen e ardhshme të furnitorit."],
      logistics: ["Planifiko transportin", "Shembull: furnitori propozon tërheqje nga magazina, ndërsa ekipi përcakton adresën e dorëzimit dhe afatin."],
      order: ["Shiko përmbledhjen e porosisë", "Përmbledhja ilustron vlerën e materialit. Transporti dhe taksat vlerësohen veçmas në një proces të ardhshëm."],
      passport: ["Eksploro pasaportën e materialit", "Një pasaportë mund të mbledhë origjinën, gjendjen dhe dokumentet e lidhura me lotin."],
      ai: ["Shiko mundësitë e ECONERA AI", "Një asistent i ardhshëm mund të ndihmojë në kërkim dhe lexim specifikimesh. Rezultatet do të kërkojnë verifikim nga përdoruesi."],
    },
  },
  en: {
    shell: { skip: "Skip to content", nav: "Main navigation", world: "Explore World", catalogue: "Catalogue", demo: "Platform", signin: "Sign in", mission: "Construction materials and reuse in Albania.", footer: "Footer links", a11y: "Accessibility", home: "ECONERA overview" },
    overview: {
      title: "From material to project",
      description: "ECONERA connects architectural exploration with construction inventory and quotation requests. Follow one material through a 3–5 minute tour.",
      start: "Start the tour",
      problemTitle: "The challenge and opportunity",
      problem: "Information about materials, quantities and suppliers is spread across lists and conversations. ECONERA brings these details closer to purchasing decisions, especially for surplus and reusable lots.",
      technologyTitle: "How it works",
      technology: "A 3D environment connects building components with masonry classifications and published inventory. Supabase stores materials, memberships and quotation requests, with access restricted by PostgreSQL policies.",
      usersTitle: "Who it serves",
      users: "Contractors, designers, suppliers and owners looking for materials by specification, quantity and location. Organizations provide a foundation for collaborative procurement.",
      circularTitle: "Material reuse",
      circular: "The goal is to find new uses for surplus materials. Lot traceability and an approach to measuring impact are still in development.",
      accessTitle: "Access and scale",
      access: "The tour works with a keyboard and without WebGL. The 3D World offers an alternative route to the catalogue. Modules share a database with per-user access policies.",
      roadmap: "Product status",
      pilot: "Request pilot access",
      pilotUnavailable: "Pilot access requests are not open yet.",
    },
    tour: { title: "ECONERA Demonstration Experience", description: "Follow a masonry lot from a building element to a sample order.", fixture: "Demonstration data. This lot is unavailable for purchase.", index: "Tour steps", previous: "Previous step", next: "Next step", finish: "Finish the tour", open: "Open the Albanian feature", price: "Unit price", quantity: "Quantity", location: "Location", total: "Material subtotal", pieces: "pieces", city: "Tirana" },
    statuses: { live: "Operational", prototype: "Interactive prototype", partial: "Requests operational", planned: "Planned" },
    steps: {
      world: ["Enter ECONERA World", "Approach the door and open it to step inside the building."],
      house: ["Explore the building", "Once inside, select the brick wall to open the material view."],
      material: ["Choose a masonry type", "The studio swaps illustrative textures and filters published stock using the selected classification."],
      record: ["Review the material lot", "A listing shows the quantity, unit, location and quotation terms the seller published."],
      project: ["Prepare a procurement project", "Example: a team renovating a workspace defines its brick quantity and target date."],
      quote: ["Review a supplier quotation", "Users can submit quotation requests today. The quotation below illustrates a future supplier response."],
      logistics: ["Plan delivery", "Example: the supplier proposes warehouse collection while the team defines a delivery address and deadline."],
      order: ["View the order summary", "The summary illustrates the cost of the material. A future workflow would assess transport and taxes separately."],
      passport: ["Explore a material passport", "A passport could record the origin, condition and documents associated with a lot."],
      ai: ["Explore possibilities for ECONERA AI", "A future assistant could help search inventory and read specifications. Its results would require user verification."],
    },
  },
};

// Tour-only fixture. No database ID, seller identity or commerce endpoint.
export const demoLot = { quantity: 480, unitPrice: 65 } as const;
