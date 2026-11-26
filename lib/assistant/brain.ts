/**
 * ECONERA Voice brain (server). Deterministic intent understanding in English and Albanian, connected to the real
 * marketplace. It never invents URLs (registry only), products (real IDs only) or prices (from listings only),
 * and it never performs consequential actions: those come back as confirmation requests for the user.
 */
import { formatNumber } from "@/lib/format";
import { parseBudget, parseRequirements } from "@/lib/tools/basket";
import { CONDITION_UI, MARKET_CATEGORIES } from "@/lib/market/categories";
import { interpret } from "@/lib/market/interpret";
import { regionLabel, unitLabel } from "@/lib/market/i18n";
import { applyFilters, demoMarket, liveMarket, type MarketItem } from "@/lib/market/live";
import { representativePhoto, unsplash } from "@/lib/market/photos";
import { categoriesIn, categoryLabel, FLOOR_GROUP, mentionsFloor, norm, ROUTES, type Lang, type RouteId } from "./registry";
import type { Action, Card, Ctx, Filters, Reply } from "./types";

export type Account = { signedIn: boolean; seller: "none" | "pending" | "approved" | "info" | "suspended" };

const CITY_ALIASES: Record<string, string> = { tirana: "Tiranë", tirane: "Tiranë", durres: "Durrës", durresi: "Durrës", vlora: "Vlorë", vlore: "Vlorë", shkodra: "Shkodër", shkoder: "Shkodër", korca: "Korçë", korce: "Korçë", elbasan: "Elbasan", fier: "Fier", berat: "Berat", lezha: "Lezhë", lezhe: "Lezhë", kukes: "Kukës", diber: "Dibër", gjirokaster: "Gjirokastër", gjirokastra: "Gjirokastër" };
const cityIn = (n: string) => { for (const tk of n.split(" ")) { const c = CITY_ALIASES[tk.replace(/[.,]/g, "")]; if (c) return c; } return undefined; };

const ORD: [RegExp, number][] = [[/\b(first|1st|i pari|te parin|e para|te paren|nr ?1|numri 1)\b/, 0], [/\b(second|2nd|i dyti|te dytin|e dyta|te dyten|nr ?2)\b/, 1], [/\b(third|3rd|i treti|te tretin|e treta|te treten|nr ?3)\b/, 2]];
const ordinal = (n: string) => ORD.find(([r]) => r.test(n))?.[1];

function link(id: RouteId, lang: Lang, primary = false): Action { return { kind: "link", label: ROUTES[id].label[lang], href: ROUTES[id].href, primary }; }
const ask = (label: string, text: string): Action => ({ kind: "ask", label, text });

function tregHref(f: Filters) {
  const p = new URLSearchParams();
  if (f.q) p.set("q", f.q);
  if (f.category) p.set("kategoria", f.category);
  if (f.near) p.set("afer", f.near);
  if (f.qty) p.set("sasia", String(f.qty));
  if (f.unit) p.set("njesia", f.unit);
  if (f.maxUnitLek) p.set("max", String(f.maxUnitLek));
  if (f.sort && f.sort !== "relevance") p.set("rendit", f.sort);
  if (f.verified) p.set("verifikuar", "1");
  const s = p.toString();
  return s ? `/treg?${s}` : "/treg";
}

function card(i: MarketItem, lang: Lang, qty?: number): Card {
  const t = (sq: string, en: string) => (lang === "en" ? en : sq);
  const title = lang === "en" && i.titleEn ? i.titleEn : i.title;
  const cur = (n: number) => (i.currency === "EUR" ? `€${formatNumber(n, 2)}` : `${formatNumber(n, 0)} ${lang === "en" ? "ALL" : "L"}`);
  const take = qty ? Math.min(qty, i.quantity) : undefined;
  return {
    id: i.id, title, demo: i.source === "demo",
    href: i.source === "live" ? `/treg/${i.id}` : `/treg/demo/${encodeURIComponent(i.id.replace("demo:", ""))}`,
    photo: i.photo ?? unsplash(representativePhoto(i.category, i.dbCategory, i.id), 240, 180), representative: !i.photo,
    condition: CONDITION_UI[i.condition][lang], category: categoryLabel(i.category, lang),
    price: cur(i.unitPrice), unit: unitLabel(i.unit, lang),
    available: `${formatNumber(i.quantity, 1)} ${unitLabel(i.unit, lang, i.quantity !== 1)}`,
    region: regionLabel(i.region, lang),
    verified: i.verifiedBusiness ? t("Biznes i verifikuar", "Verified business") : i.verifiedIdentity ? t("Shitës i verifikuar", "Verified seller") : undefined,
    total: take ? `${t("Për", "For")} ${formatNumber(take, 1)} ${unitLabel(i.unit, lang, take !== 1)}: ${cur(take * i.unitPrice)}` : undefined,
    cart: { id: i.id, title, unit: unitLabel(i.unit, lang), priceLek: i.priceLek, max: i.quantity, seller: i.seller, city: regionLabel(i.region, lang), demo: i.source === "demo" || undefined },
    qty: Math.max(1, Math.min(i.quantity, take ?? 1)),
  };
}

async function market() {
  const { items, connected } = await liveMarket().catch(() => ({ items: [] as MarketItem[], connected: false }));
  const empty = !connected || items.length === 0;
  return { items: empty ? demoMarket() : items, demo: empty };
}

async function search(f: Filters, lang: Lang, intro?: string): Promise<Reply> {
  const t = (sq: string, en: string) => (lang === "en" ? en : sq);
  const m = await market();
  const base = { q: f.q, rankOnly: Boolean(f.category && f.q), category: f.category, near: f.near, unit: f.unit, maxPrice: f.maxUnitLek, verified: f.verified, sort: f.sort ?? (f.near ? "distance" : "relevance") };
  let found = applyFilters(m.items, { ...base, minQty: f.qty });
  let relaxed = false;
  if (!found.length && f.qty) { found = applyFilters(m.items, base); relaxed = found.length > 0; }
  const top = found.slice(0, 3);
  const what = f.category ? categoryLabel(f.category, lang).toLowerCase() : f.q ? `“${f.q}”` : t("materiale", "materials");
  const where = f.near ? t(` (zona: ${f.near})`, ` near ${regionLabel(f.near, "en")}`) : "";
  const allHref = tregHref(f);
  const ctx: Ctx = { filters: f, items: top.map((i) => i.id) };

  if (!top.length) {
    const alts: Action[] = [{ kind: "link", label: t("Shfleto të gjitha", "Browse all") + (f.category ? ` · ${categoryLabel(f.category, lang)}` : ""), href: f.category ? `/treg?kategoria=${f.category}` : "/treg", primary: true }];
    if (f.near) alts.push(ask(t("Zgjero zonën", "Expand search area"), t("kudo", "anywhere")));
    if (f.maxUnitLek) alts.push(ask(t("Hiq kufirin e çmimit", "Remove price limit"), t("pa kufi çmimi", "no price limit")));
    alts.push(ask(t("Materiale të tjera", "Other materials"), t("kategoritë", "categories")));
    const text = t(`Nuk ka ende listime të miratuara për ${what}${where}.`, `No approved ${what} listings currently match your search${where ? where : ""}.`);
    return { text, speak: text, blocks: [{ type: "actions", items: alts }], ctx };
  }

  const cards = top.map((i) => card(i, lang, f.qty));
  const lead = intro ?? (m.demo
    ? t(`Tregu po pret listimet e para. Këta janë shembuj demo për ${what}${where}:`, `The marketplace is receiving its first listings. Demo examples for ${what}${where}:`)
    : t(`Gjeta ${found.length} për ${what}${where}:`, `I found ${found.length} for ${what}${where}:`));
  const text = relaxed ? `${lead} ${t(`(asnjë nuk ka ${f.qty} ${f.unit ?? ""} të plota; po tregoj më të afërtat)`, `(none has the full ${f.qty} ${f.unit ?? ""}; showing the closest)`)}` : lead;

  const actions: Action[] = [];
  if (f.sort !== "price_asc") actions.push(ask(t("Më i liri", "Lowest price"), t("më i liri", "cheapest")));
  if (f.sort !== "distance") actions.push(ask(t("Më afër meje", "Closest to me"), t("më afër", "closest")));
  if (!f.verified) actions.push(ask(t("Shitës të verifikuar", "Verified sellers"), t("vetëm të verifikuar", "verified only")));
  if (top.length > 1) actions.push(ask(t("Krahaso", "Compare"), t("krahaso", "compare")));
  if (f.category && f.qty) actions.push(ask(t("Optimizo me Smart Basket", "Optimize with Smart Basket"), t(`smart basket ${f.qty} ${f.unit ?? ""} ${categoryLabel(f.category, lang)}`, `smart basket ${f.qty} ${f.unit ?? ""} ${categoryLabel(f.category, lang)}`)));
  if (f.category && ["wood", "tiles", "paint", "bricks"].includes(f.category)) actions.push(link("renovation", lang));
  if (f.category && ["wood", "offcuts", "drywall"].includes(f.category)) actions.push(link("smartcut", lang));
  const speak = `${text} ${cards[0].title}, ${cards[0].price} ${t("për", "per")} ${cards[0].unit}, ${cards[0].region}.${m.demo ? t(" Shembull demo.", " Demo example.") : ""}`;
  return { text, speak, blocks: [{ type: "products", items: cards, count: found.length, demo: m.demo, allHref }, { type: "actions", items: actions }], ctx };
}

function categoriesReply(ids: { category: string; label?: string; desc?: string; q?: string }[], lang: Lang, text: string): Reply {
  return {
    text, speak: `${text} ${ids.map((c) => c.label ?? categoryLabel(c.category, lang)).join(", ")}.`, ctx: {},
    blocks: [{ type: "categories", items: ids.map((c) => ({ id: c.category, label: c.label ?? categoryLabel(c.category, lang), desc: c.desc ?? "", href: `/treg?kategoria=${c.category}${c.q ? `&q=${encodeURIComponent(c.q)}` : ""}` })) }],
  };
}

const say = (text: string, actions: Action[], ctx: Ctx = {}): Reply => ({ text, speak: text, blocks: actions.length ? [{ type: "actions", items: actions }] : [], ctx });

export async function answer(raw: string, lang: Lang, ctxIn: Ctx, account: Account): Promise<Reply> {
  const t = (sq: string, en: string) => (lang === "en" ? en : sq);
  const text = raw.trim().slice(0, 300);
  const n = norm(text);
  const words = n.split(" ").filter(Boolean);
  const f0 = ctxIn.filters;
  const keep: Ctx = { filters: f0, items: ctxIn.items };

  // Greeting / help
  if (/^(hi|hello|hey|pershendetje|tung|ckemi|mirdita|miredita|help|ndihme|what can you do|cfare mund te besh)\b/.test(n)) {
    return say(t("Përshëndetje! Më thuaj çfarë kërkon dhe të çoj atje.", "Hi! Tell me what you need and I'll take you there."), [
      ask(t("Dysheme", "Flooring"), t("dysheme", "flooring")), ask(t("20 m² pllaka në Tiranë", "20 m² tiles in Tirana"), t("Gjej 20 m² pllaka në Tiranë", "Find 20 m² of tiles in Tirana")),
      ask(t("Dua të shes", "I want to sell"), t("dua të shes materiale", "I want to sell materials")), ask(t("Rinovim", "Renovate"), t("dua të rinovoj kuzhinën", "I want to renovate my kitchen")),
    ], keep);
  }
  if (/^(kategorit|categories|materials?|materiale)$/.test(n)) {
    return categoriesReply(MARKET_CATEGORIES.slice(0, 8).map((c) => ({ category: c.id })), lang, t("Zgjidh një kategori:", "Choose a category:"));
  }

  // ---- Follow-ups on the last search ----
  if (f0) {
    const idx = ordinal(n);
    const pick = idx !== undefined ? ctxIn.items?.[idx] : /\b(it|ate|kete|that one|this one)\b/.test(n) ? ctxIn.items?.[0] : undefined;
    if (/\b(add|shto|shtoje|vendos|fut)\b/.test(n) && pick && !/(smart basket|basket)/.test(n)) {
      const m = await market();
      const item = m.items.find((i) => i.id === pick);
      if (!item) return say(t("Ky produkt nuk është më në dispozicion.", "That product is no longer available."), [], keep);
      const c = card(item, lang, f0.qty);
      const prompt = t(`Të shtoj ${c.qty} ${c.unit} “${c.title}” (${c.price}/${c.unit}) në shportë?`, `Add ${c.qty} ${c.unit} of “${c.title}” (${c.price}/${c.unit}) to your cart?`) + (c.demo ? t(" Është shembull demo.", " It's a demo example.") : "");
      return { text: prompt, speak: prompt, blocks: [{ type: "confirm", prompt, action: { kind: "cart", item: c.cart, qty: c.qty, demo: c.demo } }], ctx: keep };
    }
    if (/\b(show|view|open|see|shiko|trego|hap|shfaq)\b/.test(n) && (pick || /\b(product|produkt|produktin)\b/.test(n))) {
      const m = await market();
      const item = m.items.find((i) => i.id === (pick ?? ctxIn.items?.[0]));
      if (item) { const c = card(item, lang); return { text: c.title, speak: c.title, blocks: [{ type: "actions", items: [{ kind: "link", label: t("Shiko produktin", "View product"), href: c.href, primary: true }] }], ctx: keep }; }
    }
    if (/(cheap|lowest|lire|lir|ulet|me i lir)/.test(n) && words.length <= 4) return search({ ...f0, sort: "price_asc" }, lang, t("Renditur nga më i liri:", "Sorted by lowest price:"));
    if (/(closest|nearest|near me|afer|afert)/.test(n) && words.length <= 4) return search({ ...f0, sort: "distance", near: f0.near ?? "Tiranë" }, lang, t("Më të afërtat:", "Closest first:"));
    if (/(verified|verifikuar)/.test(n) && words.length <= 4) return search({ ...f0, verified: true }, lang, t("Vetëm shitës të verifikuar:", "Verified sellers only:"));
    if (/^(anywhere|kudo|everywhere)$/.test(n)) return search({ ...f0, near: undefined }, lang);
    if (/(no price limit|pa kufi)/.test(n)) return search({ ...f0, maxUnitLek: undefined }, lang);
    if (/(compare|krahaso)/.test(n)) return search(f0, lang, t("Krahasim krah për krah:", "Side by side:"));
    const city = cityIn(n);
    if (city && !categoriesIn(text).length && words.length <= 5) return search({ ...f0, near: city }, lang);
    const qty = n.match(/^(\d+(?:[.,]\d+)?)\s*(m2|m²|m|m3|m³|cope|pcs|pieces|kg|ton)?$/);
    if (qty) return search({ ...f0, qty: Number(qty[1].replace(",", ".")), unit: qty[2] ? (qty[2].startsWith("m2") ? "m²" : qty[2]) : f0.unit }, lang);
  }

  const cats = categoriesIn(text);
  const reqs = parseRequirements(text);
  const budget = parseBudget(text);

  // ---- Platform routing ----
  if (/(smart ?basket)/.test(n) || /(cheapest combination|kombinim|material list|lista e materialeve|procure|furnizim)/.test(n) || (budget && (cats.length >= 2 || reqs.length >= 2)) || cats.length >= 3) {
    const prompt = t("Smart Basket krahason materialet në dispozicion dhe optimizon buxhetin. Ta hap me këtë listë?", "Smart Basket can compare available materials and optimize your project budget. Open it with this list?");
    return { text: prompt, speak: prompt, blocks: [{ type: "confirm", prompt, action: { kind: "basket", text: text.replace(/smart ?basket/i, "").trim() } }], ctx: keep };
  }
  if (/(verif|how do you check|trust|besueshm|kontrollo)/.test(n)) return say(t("Çdo shitës dhe çdo listim shqyrtohet nga një person i ECONERA-s para publikimit.", "Every seller and every listing is reviewed by a person at ECONERA before going live."), [link("verifyInfo", lang, true)], keep);
  if (/(\bsell\b|\bselling\b|list my|\bshes\b|shitje|shitur|dua te shes)/.test(n)) {
    if (!account.signedIn) return say(t("Për të shitur të duhet një llogari shitësi. Çdo listim shqyrtohet nga ECONERA.", "To sell you need a seller account. Every listing is reviewed by ECONERA."), [link("sellerSignup", lang, true), link("login", lang)], keep);
    if (account.seller === "approved") return say(t("Llogaria jote është e verifikuar. Hap formularin e listimit; dërgohet për shqyrtim para publikimit.", "Your account is verified. Open the listing form; it goes to review before publication."), [link("sell", lang, true)], keep);
    if (account.seller === "suspended") return say(t("Llogaria e shitësit është e pezulluar.", "Your seller account is suspended."), [link("contact", lang, true)], keep);
    return say(t("Para se të shesësh, plotëso verifikimin e shitësit. Ndërkohë mund të përgatisësh skica.", "Before selling, complete seller verification. Meanwhile you can prepare drafts."), [link("verify", lang, true), link("sell", lang)], keep);
  }
  if (/(renovat|rinov|renovim|redesign|remodel|rikonstru|dizajno|design my)/.test(n) && !budget) {
    return say(t("AI Renovation llogarit materialet për hapësirën tënde dhe i gjen në treg.", "AI Renovation estimates the materials for your space and finds them on the marketplace."), [link("renovation", lang, true), link("basket", lang)], keep);
  }
  if (/(smartcut|cutting|\bcut\b|prerj|nesting)/.test(n)) return say(t("SmartCut planifikon prerjet dhe gjen copat e mbetura që të duhen.", "SmartCut plans your cuts and finds offcuts that fit."), [link("smartcut", lang, true)], keep);
  if (/(\borders?\b|porosi|my purchases|blerjet e mia|ofertat e mia)/.test(n)) return account.signedIn ? say(t("Ja porositë dhe ofertat e tua.", "Here are your orders and quotes."), [link("orders", lang, true)], keep) : say(t("Hyr për të parë porositë.", "Log in to see your orders."), [link("login", lang, true)], keep);
  if (/(my cart|shporta ime|shporten|^cart$|^shporta$|checkout)/.test(n)) return say(t("Shporta jote:", "Your cart:"), [link("cart", lang, true)], keep);
  if (/(contact|kontakt|email|telefon|phone|call you|shkruaj ju)/.test(n)) return say(t("Na shkruaj nga formulari i kontaktit.", "Write to us through the contact form."), [link("contact", lang, true)], keep);
  if (/(what is econera|who are you|about econera|about us|cfare eshte econera|kush jeni|rreth nesh|rreth econera)/.test(n)) return say(t("ECONERA është një platformë për ndërtimin qarkullues: treg materialesh, mjete AI dhe verifikim nga njerëz.", "ECONERA is a circular construction platform: a materials marketplace, AI tools and human verification."), [link("about", lang, true), link("market", lang)], keep);
  if (/(pricing|price plan|cmimet|planet)/.test(n)) return say(t("Planet për furnitorët:", "Supplier plans:"), [link("pricing", lang, true)], keep);
  if (/(business|biznes|company|kompani)/.test(n) && !cats.length) return say(t("Zgjidhje për kompanitë e ndërtimit:", "Solutions for construction companies:"), [link("business", lang, true)], keep);
  if (/(saved|favorit|ruajtur)/.test(n)) return say(t("Materialet e ruajtura:", "Saved materials:"), [link("saved", lang, true)], keep);
  if (/(project|projekt)/.test(n) && !cats.length) return say(t("Projektet e tua:", "Your projects:"), [link("projects", lang, true)], keep);
  if (/^(log ?in|login|hyr|sign ?in)$/.test(n)) return say(t("Hyr në llogari:", "Log in:"), [link("login", lang, true)], keep);

  // ---- Materials ----
  if (mentionsFloor(text) && cats.length === 0) {
    const city = cityIn(n);
    const r = categoriesReply(FLOOR_GROUP.map((g) => ({ category: g.category, label: g.label[lang], desc: g.desc[lang], q: g.q })), lang, t("Kërkon dysheme? Zgjidh llojin.", "Looking for flooring? Choose a type."));
    if (city) for (const b of r.blocks) if (b.type === "categories") b.items = b.items.map((i) => ({ ...i, href: `${i.href}&afer=${encodeURIComponent(city)}` }));
    return r;
  }
  const nl = interpret(text);
  const hasQty = /\d/.test(n);
  if (cats.length || hasQty || /\b(find|search|need|looking|gjej|kerko|me duhen|me duhet|dua|a ka)\b/.test(n)) {
    const category = cats[0] ?? nl.category;
    const filters: Filters = {
      category, q: category ? (cats.includes("bricks") && /(marble|mermer|granit|stone|gur)/.test(n) ? "mermer gur" : undefined) : (nl.words || undefined),
      near: cityIn(n) ?? nl.near, qty: nl.minQty, unit: nl.minQty ? nl.unit : undefined, maxUnitLek: nl.maxUnitLek, sort: "relevance",
    };
    if (!category && !filters.q) return say(t("Çfarë materiali kërkon?", "Which material are you looking for?"), [ask(t("Dysheme", "Flooring"), t("dysheme", "flooring")), ask(t("Tulla", "Bricks"), t("tulla", "bricks")), ask(t("Dyer", "Doors"), t("dyer", "doors"))], keep);
    // A single keyword ("wood", "tulla"): show the category and its listings.
    if (words.length <= 2 && category && !hasQty) {
      const r = await search(filters, lang);
      r.blocks.unshift({ type: "categories", items: [{ id: category, label: categoryLabel(category, lang), desc: t("Shiko të gjitha në treg", "See everything on the marketplace"), href: `/treg?kategoria=${category}` }] });
      return r;
    }
    return search(filters, lang);
  }

  return say(t("Nuk e kuptova plotësisht. Provo një nga këto:", "I didn't quite get that. Try one of these:"), [
    ask(t("Dysheme", "Flooring"), t("dysheme", "flooring")), ask(t("Gjej tulla", "Find bricks"), t("gjej tulla", "find bricks")),
    link("sell", lang), link("tools", lang), link("contact", lang),
  ], keep);
}

