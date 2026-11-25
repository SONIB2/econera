/**
 * ECONERA pricing (pilot, Nëntor 2026). Buyers are always free; suppliers pay a subscription
 * plus a small commission only on completed orders, matching the deck's business model
 * (abonim · komision · transport · enterprise). Prices in lekë, VAT excluded.
 */
export type Plan = {
  id: "falas" | "start" | "rritje" | "pro";
  name: string;
  tagline: string;
  monthly: number;
  annual: number; // per month, billed yearly (−20%)
  commission: string;
  includesFrom?: string;
  features: string[];
  highlight?: boolean;
};

export const SUPPLIER_PLANS: Plan[] = [
  {
    id: "falas", name: "ECONERA Falas", tagline: "Për çdo furnitor që do të provojë tregun.",
    monthly: 0, annual: 0, commission: "4%",
    features: ["Deri në 10 artikuj aktivë", "Regjistrim me foto dhe AI, 5 skanime në muaj", "Kërkesa për ofertë nga blerësit", "1 përdorues"],
  },
  {
    id: "start", name: "Start", tagline: "Për depo dhe furnitorë të vegjël.",
    monthly: 2500, annual: 2000, commission: "3%", includesFrom: "Falas",
    features: ["Deri në 100 artikuj aktivë", "Skano depon me AI pa kufi", "Certifikatë e gjelbër për çdo porosi", "Statistika të shikimeve dhe kërkesave", "2 përdorues", "Mbështetje me email"],
  },
  {
    id: "rritje", name: "Rritje", tagline: "Për furnitorë që shesin çdo javë.", highlight: true,
    monthly: 6900, annual: 5500, commission: "2%", includesFrom: "Start",
    features: ["Deri në 500 artikuj aktivë", "Shfaqje e theksuar te Tregu dhe te AI", "Kërkesat nga Plan → preventiv te ju të parët", "Koordinim transporti me çmim të qartë", "Fatura dhe porosi në një vend", "5 përdorues", "Mbështetje me chat"],
  },
  {
    id: "pro", name: "Pro", tagline: "Për kompani ndërtimi me disa kantiere.",
    monthly: 14900, annual: 11900, commission: "1.5%", includesFrom: "Rritje",
    features: ["Artikuj pa kufi, për çdo kantier dhe depo", "Pasaporta Digjitale e Materialit", "Raport CO₂ vjetor për tendera", "Eksport CSV dhe API", "Përdorues pa kufi", "Menaxher i dedikuar dhe onboarding"],
  },
];

export const ENTERPRISE = {
  name: "Enterprise",
  tagline: "Për zhvillues dhe kompani të mëdha: integrim me ERP, kontrata vjetore dhe çmim sipas volumit.",
};

export const BUYER_FEATURES = [
  "Kërkim me AI në të gjithë stokun",
  "Kërkesa për ofertë pa kufi",
  "Krahasim çmimi, distance dhe përputhjeje",
  "Plan → preventiv nga planimetria",
  "Certifikatë e gjelbër për çdo blerje",
];

export const PILOT_OFFER = "20 furnitorët e parë të pilotit në Tiranë marrin planin Rritje falas për 3 muaj.";

/** English copy for the pricing page, keyed by plan id (same order as the Albanian features). */
export const PLAN_EN: Record<Plan["id"], { tagline: string; features: string[] }> = {
  falas: { tagline: "For any supplier who wants to try the market.", features: ["Up to 10 active listings", "Photo + AI listing, 5 scans a month", "Quote requests from buyers", "1 user"] },
  start: { tagline: "For depots and small suppliers.", features: ["Up to 100 active listings", "Unlimited AI warehouse scans", "Green certificate for every order", "View and request statistics", "2 users", "Email support"] },
  rritje: { tagline: "For suppliers who sell every week.", features: ["Up to 500 active listings", "Featured in the Market and in AI results", "First to receive Plan → quote requests", "Transport coordination at a clear price", "Invoices and orders in one place", "5 users", "Chat support"] },
  pro: { tagline: "For construction companies with several sites.", features: ["Unlimited listings, for every site and depot", "Digital Material Passport", "Annual CO₂ report for tenders", "CSV export and API", "Unlimited users", "Dedicated manager and onboarding"] },
};
export const ENTERPRISE_EN = "For developers and large companies: ERP integration, annual contracts and volume pricing.";
export const BUYER_FEATURES_EN = ["AI search across all stock", "Unlimited quote requests", "Compare price, distance and match", "Plan → quote from a floor plan", "Green certificate for every purchase"];
export const PILOT_OFFER_EN = "The first 20 pilot suppliers in Tirana get the Growth plan free for 3 months.";
export const PLAN_NAME_EN: Record<Plan["id"], string> = { falas: "ECONERA Free", start: "Start", rritje: "Growth", pro: "Pro" };
