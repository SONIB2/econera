/** ECONERA Verify vocabulary in Albanian and English. Add a language by adding a key to each record. */
export type L = { sq: string; en: string };

export const MODERATION: Record<string, L> = {
  unreviewed: { sq: "Skicë", en: "Draft" },
  pending: { sq: "Në pritje të shqyrtimit", en: "Pending review" },
  under_review: { sq: "Në shqyrtim", en: "Under review" },
  info_required: { sq: "Kërkohen të dhëna shtesë", en: "Additional information required" },
  inspection_required: { sq: "Kërkohet inspektim teknik", en: "Technical inspection required" },
  escalated: { sq: "Te specialisti teknik", en: "Escalated to specialist" },
  approved: { sq: "Miratuar", en: "Approved" },
  rejected: { sq: "Refuzuar", en: "Rejected" },
  suspended: { sq: "Pezulluar", en: "Suspended" },
};

export const PUBLICATION: Record<string, L> = {
  draft: { sq: "Jo publik", en: "Not public" },
  published: { sq: "Publikuar", en: "Published" },
  archived: { sq: "Arkivuar", en: "Archived" },
  suspended: { sq: "Pezulluar", en: "Suspended" },
  expired: { sq: "Skaduar", en: "Expired" },
};

/** Combined status shown to people, following the ECONERA Verify workflow. */
export function listingStatus(publication: string, moderation: string, quantity?: number): L {
  if (publication === "archived") return PUBLICATION.archived;
  if (publication === "suspended" || moderation === "suspended") return MODERATION.suspended;
  if (publication === "expired") return PUBLICATION.expired;
  if (publication === "published" && quantity !== undefined && quantity <= 0) return { sq: "Shitur", en: "Sold out" };
  if (publication === "published") return PUBLICATION.published;
  return MODERATION[moderation] ?? MODERATION.unreviewed;
}

export const SELLER_STATUS: Record<string, L> = {
  draft: { sq: "Skicë", en: "Draft" }, submitted: { sq: "Dorëzuar", en: "Submitted" }, under_review: { sq: "Në shqyrtim", en: "Under review" },
  info_required: { sq: "Kërkohen të dhëna shtesë", en: "More information required" }, approved: { sq: "Verifikuar", en: "Verified" },
  rejected: { sq: "Refuzuar", en: "Rejected" }, revoked: { sq: "Verifikimi u revokua", en: "Verification revoked" },
};

export const DOC_TYPES: Record<string, L> = {
  identity: { sq: "Dokument identiteti", en: "Identity document" },
  business_extract: { sq: "Ekstrakt i regjistrimit të biznesit (QKB)", en: "Business registration extract" },
  business_license: { sq: "Licencë biznesi", en: "Business licence" },
  qualification: { sq: "Kualifikim profesional", en: "Professional qualification" },
  photo: { sq: "Foto reale e materialit", en: "Real product photo" },
  technical_datasheet: { sq: "Fletë teknike", en: "Technical data sheet" },
  invoice: { sq: "Faturë blerjeje", en: "Purchase invoice" },
  ownership: { sq: "Dëshmi pronësie", en: "Proof of ownership" },
  ce_marking: { sq: "Dokumentim i shenjës CE", en: "CE marking documentation" },
  dop: { sq: "Deklaratë performance (DoP)", en: "Declaration of Performance" },
  doc_conformity: { sq: "Deklaratë performance dhe konformiteti", en: "Declaration of Performance and Conformity" },
  certificate: { sq: "Certifikatë konformiteti", en: "Certificate of conformity" },
  eta: { sq: "Vlerësim Teknik Evropian (ETA)", en: "European Technical Assessment" },
  lab_report: { sq: "Raport laboratori", en: "Laboratory test report" },
  safety_data_sheet: { sq: "Fletë të dhënash sigurie (SDS)", en: "Safety Data Sheet" },
  fire_performance: { sq: "Performanca ndaj zjarrit", en: "Fire performance documentation" },
  structural_performance: { sq: "Performanca strukturore", en: "Structural performance documentation" },
  warranty: { sq: "Garanci e prodhuesit", en: "Manufacturer warranty" },
  inspection_report: { sq: "Raport inspektimi fizik", en: "Physical inspection report" },
  independent_certification: { sq: "Certifikim i pavarur", en: "Independent certification" },
  evidence: { sq: "Provë (ankesë)", en: "Evidence (complaint)" },
  other: { sq: "Tjetër", en: "Other" },
};

export const PRODUCT_DOC_TYPES = ["photo", "technical_datasheet", "invoice", "ownership", "ce_marking", "dop", "doc_conformity", "certificate", "eta", "lab_report", "safety_data_sheet", "fire_performance", "structural_performance", "warranty", "independent_certification", "other"] as const;
export const SELLER_DOC_TYPES = ["identity", "business_extract", "business_license", "qualification", "other"] as const;

export const RISK: Record<string, L & { tone: string }> = {
  low: { sq: "Rrezik i ulët", en: "Low risk", tone: "bg-accent text-lime" },
  medium: { sq: "Rrezik mesatar", en: "Medium risk", tone: "bg-[#fdf3dc] text-[#7a5a12]" },
  high: { sq: "Rrezik i lartë", en: "High risk", tone: "bg-[#fde8e4] text-[#8a2f1d]" },
  prohibited: { sq: "I ndaluar", en: "Prohibited", tone: "bg-[#2b1410] text-white" },
};

export const INTENDED_USE: Record<string, L> = {
  decorative: { sq: "Dekorativ", en: "Decorative" },
  non_structural: { sq: "Jo strukturor", en: "Non-structural" },
  finishing: { sq: "Përfundime / veshje", en: "Finishing" },
  structural: { sq: "Strukturor / mbajtës", en: "Structural / load-bearing" },
  fire_safety: { sq: "Mbrojtje nga zjarri", en: "Fire protection" },
  electrical: { sq: "Elektrik me rëndësi sigurie", en: "Safety-critical electrical" },
  pressure: { sq: "Sistem me presion", en: "Pressure system" },
};

export const ROLES: Record<string, L & { text: L }> = {
  super_admin: { sq: "Super Admin", en: "Super Admin", text: { sq: "Administrim i plotë, stafi, rregullat dhe raportet.", en: "Full administration, staff, policy and reporting." } },
  seller_officer: { sq: "Oficer i verifikimit të shitësve", en: "Seller Verification Officer", text: { sq: "Identiteti dhe regjistrimi i bizneseve.", en: "Identity and business verification." } },
  product_officer: { sq: "Oficer i verifikimit të produkteve", en: "Product Verification Officer", text: { sq: "Listimet, fotot, specifikimet dhe dokumentet.", en: "Listings, photos, specifications and documents." } },
  technical_reviewer: { sq: "Shqyrtues teknik", en: "Technical Reviewer", text: { sq: "Dokumentim teknik, inspektime, miratimi i dytë.", en: "Technical documents, inspections, second approval." } },
  customer_protection: { sq: "Oficer i mbrojtjes së klientit", en: "Customer Protection Officer", text: { sq: "Ankesat, kthimet dhe rimbursimet.", en: "Complaints, returns and refunds." } },
  finance: { sq: "Administrator financiar", en: "Finance Administrator", text: { sq: "Pagesat, komisionet dhe regjistrat financiarë.", en: "Payments, commissions and financial records." } },
  support: { sq: "Agjent mbështetjeje", en: "Support Agent", text: { sq: "Akses i kufizuar për mbështetjen e klientëve.", en: "Limited customer-support access." } },
};

export const DISPUTE_KIND: Record<string, L> = {
  wrong_description: { sq: "Përshkrim i pasaktë", en: "Incorrect description" },
  damaged: { sq: "Produkt i dëmtuar", en: "Damaged product" },
  missing_quantity: { sq: "Mungon sasia", en: "Missing quantity" },
  counterfeit: { sq: "Produkt i falsifikuar", en: "Counterfeit product" },
  suspicious_seller: { sq: "Shitës i dyshimtë", en: "Suspicious seller" },
  missing_documents: { sq: "Mungojnë dokumentet", en: "Missing documentation" },
  not_as_pictured: { sq: "Nuk përputhet me fotot", en: "Does not match photos" },
  safety: { sq: "Shqetësim sigurie", en: "Safety concern" },
  delivery: { sq: "Problem me dorëzimin", en: "Delivery problem" },
  non_delivery: { sq: "Nuk u dorëzua", en: "Not delivered" },
  other: { sq: "Tjetër", en: "Other" },
};

export const DISPUTE_STATUS: Record<string, L> = {
  open: { sq: "E hapur", en: "Open" }, assigned: { sq: "E caktuar", en: "Assigned" }, investigating: { sq: "Në hetim", en: "Investigating" },
  waiting_customer: { sq: "Pret përgjigjen tënde", en: "Waiting for you" }, resolved: { sq: "Zgjidhur", en: "Resolved" }, rejected: { sq: "Refuzuar", en: "Rejected" },
};

export const NOTIFICATION: Record<string, L> = {
  "seller.pending": { sq: "Verifikimi i llogarisë është në pritje të shqyrtimit.", en: "Your account verification is pending review." },
  "seller.approved": { sq: "Llogaria jote u verifikua.", en: "Your account has been verified." },
  "seller.rejected": { sq: "Verifikimi i llogarisë u refuzua.", en: "Your account verification was rejected." },
  "seller.info_required": { sq: "Duhen të dhëna shtesë për verifikimin e llogarisë.", en: "More information is needed to verify your account." },
  "seller.revoked": { sq: "Verifikimi i llogarisë u revokua.", en: "Your account verification was revoked." },
  "listing.submitted": { sq: "Listimi u dorëzua për shqyrtim.", en: "Your listing was submitted for review." },
  "listing.approved": { sq: "Listimi u miratua dhe u publikua.", en: "Your listing was approved and published." },
  "listing.rejected": { sq: "Listimi u refuzua.", en: "Your listing was rejected." },
  "listing.info_required": { sq: "Duhen dokumente ose të dhëna shtesë për listimin.", en: "Additional documents or information are required." },
  "listing.inspection_required": { sq: "Listimi kërkon inspektim fizik.", en: "Your listing needs a physical inspection." },
  "listing.suspended": { sq: "Listimi u pezullua.", en: "Your listing was suspended." },
  "listing.expired": { sq: "Listimi doli nga tregu: një dokument i detyrueshëm ka skaduar.", en: "Your listing left the market: a mandatory document expired." },
  "document.expiring": { sq: "Një certifikatë skadon së shpejti.", en: "A certificate expires soon." },
  "buyer.safety_notice": { sq: "Njoftim sigurie për një material për të cilin kërkove ofertë.", en: "Safety notice about a material you requested a quote for." },
  "staff.seller_case": { sq: "Rast i ri verifikimi shitësi.", en: "New seller verification case." },
  "staff.listing_case": { sq: "Listim i ri për shqyrtim.", en: "New listing to review." },
  "staff.second_approval": { sq: "Listim me rrezik të lartë pret miratimin e dytë.", en: "High-risk listing awaits second approval." },
  "staff.escalated": { sq: "Listim i përshkallëzuar te specialisti.", en: "Listing escalated to a specialist." },
  "staff.dispute": { sq: "Ankesë e re nga një klient.", en: "New customer complaint." },
};

export const DECISION_RESULT: Record<string, L> = {
  ok: { sq: "Vendimi u regjistrua.", en: "Decision recorded." },
  awaiting_second_approval: { sq: "Miratimi i parë u regjistrua. Duhet miratimi i një shqyrtuesi tjetër.", en: "First approval recorded. A second reviewer must approve." },
  reason_required: { sq: "Shkruaj arsyen (të paktën 5 shkronja).", en: "Enter a reason (at least 5 characters)." },
  own_listing: { sq: "Nuk mund të vendosësh për listimin tënd.", en: "You cannot decide on your own listing." },
  stale_revision: { sq: "Listimi ndryshoi ndërkohë. Rifresko faqen.", en: "The listing changed meanwhile. Refresh the page." },
  forbidden: { sq: "Roli yt nuk e lejon këtë veprim, ose MFA nuk është aktive.", en: "Your role does not allow this, or MFA is not active." },
  invalid_state: { sq: "Ky veprim nuk lejohet në statusin aktual.", en: "This action is not allowed in the current status." },
  prohibited: { sq: "Materiali është i ndaluar dhe nuk mund të miratohet.", en: "The material is prohibited and cannot be approved." },
  seller_unverified: { sq: "Për rrezik të lartë shitësi duhet të jetë i verifikuar.", en: "High-risk listings need a verified seller." },
  not_found: { sq: "Listimi nuk u gjet.", en: "Listing not found." },
};
