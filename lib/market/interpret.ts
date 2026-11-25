/**
 * Reads a natural-language marketplace query ("40 m² light oak flooring under €600 within 30 km of Tirana")
 * into filters. Deterministic; every value it sets is shown back to the user as a removable chip.
 */
import { parseBudget, parseRequirements } from "@/lib/tools/basket";
import { REGIONS } from "@/lib/tools/inventory";
import { uiCategoryOf } from "./categories";

const TOOL_TO_UI: Record<string, string> = { tulla: "bricks", cimento: "structural", hekur: "structural", agregat: "outdoor", suva: "drywall", pllaka: "tiles", parket: "wood", dritare: "windows", dyer: "windows", boje: "paint", sanitari: "plumbing", elektrike: "electrical", hidraulike: "plumbing", izolim: "insulation", cati: "roofing" };

export type Interpreted = { category?: string; minQty?: number; unit?: string; maxUnitLek?: number; near?: string; radius?: number; words: string };

export function interpret(q: string): Interpreted {
  const text = q.trim();
  if (!text) return { words: "" };
  const [req] = parseRequirements(text);
  const budget = parseBudget(text);
  const radius = text.match(/(?:within|brenda|deri në|nën)\s*(\d{1,3})\s*km/i);
  const near = Object.keys(REGIONS).find((r) => text.toLowerCase().includes(r.toLowerCase().slice(0, 5)) || (r === "Tiranë" && /tirana/i.test(text)));
  const qty = req && /\d/.test(req.text) ? req.quantity : undefined;
  const out: Interpreted = {
    category: req?.category ? TOOL_TO_UI[req.category] ?? uiCategoryOf(req.category) : undefined,
    minQty: qty && qty > 1 ? qty : undefined,
    unit: req?.unit,
    maxUnitLek: budget ? Math.round(budget / (qty && qty > 1 ? qty : 1)) : undefined,
    near,
    radius: radius ? Number(radius[1]) : undefined,
    words: text.replace(/(?:find|gjej|kërko|i need|më duhen)\s+/gi, "").replace(/\d+(?:[.,]\d+)?\s*(m²|m2|m³|m3|copë|cope|pieces|kovë)?/gi, " ").replace(/(?:under|nën|max\w*|deri në|budget|buxhet\w*)\s*€?\s*[\d.,]+\s*(€|euro|eur|lekë|lek)?/gi, " ").replace(/(?:within|brenda)\s*\d+\s*km/gi, " ").replace(/\b(of|near|in|në|afër|me|for)\b/gi, " ").replace(/\s+/g, " ").trim(),
  };
  return out;
}
