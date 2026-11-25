/**
 * Preliminary, rule-based screening for reviewers. Results are hints for a human, never a decision.
 */
export type ScreenInput = {
  title: string; description: string; category: string; intended_use: string; quantity: number; unit: string;
  thickness_mm?: number | null; batch_no?: string | null; manufacturer?: string | null; known_defects?: string | null;
  documents: { doc_type: string; review_status: string; expires_on?: string | null; file_name: string }[];
  missing: string[];
  sellerStatus?: string | null;
  sameSellerTitles: string[];
};

export type Finding = { level: "block" | "warn" | "info"; sq: string; en: string };

const today = () => new Date().toISOString().slice(0, 10);

export function prescreen(x: ScreenInput, now = today()): Finding[] {
  const f: Finding[] = [];
  for (const m of x.missing) f.push({ level: "block", sq: `Mungon ose s'është pranuar: ${m}`, en: `Missing or not accepted: ${m}` });
  const in30 = new Date(Date.parse(now) + 30 * 864e5).toISOString().slice(0, 10);
  for (const d of x.documents) {
    if (d.expires_on && d.expires_on < now) f.push({ level: "block", sq: `Dokument i skaduar: ${d.file_name} (${d.expires_on})`, en: `Expired document: ${d.file_name} (${d.expires_on})` });
    else if (d.expires_on && d.expires_on <= in30) f.push({ level: "warn", sq: `Skadon brenda 30 ditëve: ${d.file_name}`, en: `Expires within 30 days: ${d.file_name}` });
    if (d.review_status === "pending") f.push({ level: "info", sq: `Dokument pa u shqyrtuar: ${d.file_name}`, en: `Document not yet reviewed: ${d.file_name}` });
  }
  if (!x.documents.some((d) => d.doc_type === "photo")) f.push({ level: "block", sq: "Nuk ka foto reale të materialit.", en: "No real product photos." });
  const text = `${x.title} ${x.description}`.toLowerCase();
  const thick = text.match(/(\d+(?:[.,]\d+)?)\s*mm/);
  if (thick && x.thickness_mm && Math.abs(Number(thick[1].replace(",", ".")) - x.thickness_mm) > 0.5 && /trash|thick|\bmm\b/.test(text))
    f.push({ level: "warn", sq: `Trashësia në tekst (${thick[1]} mm) ndryshon nga fusha (${x.thickness_mm} mm).`, en: `Thickness in text (${thick[1]} mm) differs from the field (${x.thickness_mm} mm).` });
  if (/strukt|mbajt|load|beam|tra |kolon|hea|ipe/.test(text) && !["structural"].includes(x.intended_use))
    f.push({ level: "warn", sq: "Përshkrimi duket strukturor, por përdorimi i deklaruar nuk është strukturor.", en: "The description looks structural but the declared use is not." });
  if (/azbest|asbest|amiant/.test(text)) f.push({ level: "block", sq: "Përmendet azbest: material i ndaluar, përshkallëzo.", en: "Asbestos mentioned: prohibited material, escalate." });
  if (/vjedh|stolen|falsif|counterfeit|replik/.test(text)) f.push({ level: "block", sq: "Fjalë që lidhen me vjedhje ose falsifikim.", en: "Words related to theft or counterfeiting." });
  if (!x.batch_no && ["structural", "fire_safety", "electrical", "pressure"].includes(x.intended_use)) f.push({ level: "warn", sq: "Mungon numri i lotit/batch për material me rrezik.", en: "No batch/lot number for a risk material." });
  const dup = x.sameSellerTitles.filter((t) => t.trim().toLowerCase() === x.title.trim().toLowerCase()).length;
  if (dup) f.push({ level: "warn", sq: `I njëjti shitës ka ${dup} listim(e) me të njëjtin titull.`, en: `The same seller has ${dup} listing(s) with the same title.` });
  if (x.sellerStatus !== "approved") f.push({ level: "info", sq: "Shitësi nuk është i verifikuar ende.", en: "The seller is not verified yet." });
  if (x.quantity <= 0) f.push({ level: "block", sq: "Sasia është zero.", en: "Quantity is zero." });
  return f;
}
