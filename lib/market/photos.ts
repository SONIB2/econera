/**
 * Representative photographs (Unsplash, free licence; hotlinked from images.unsplash.com as Unsplash requires).
 * Shown when a listing has no approved photo of its own, and always labelled as representative.
 */
export const unsplash = (id: string, w = 800, h?: number) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}${h ? `&h=${h}` : ""}&q=70`;

export const CATEGORY_PHOTO: Record<string, string> = {
  structural: "1763771420746-c75fefab51b5", wood: "1634672652995-ee7525bce595", bricks: "1559322575-2f4e66131d55", roofing: "1605450099279-533bd3ce379a",
  facade: "1534237710431-e2fc698436d0", insulation: "1766524789735-1f3e89c98f85", plumbing: "1763776091902-3d58451c42fc", electrical: "1761507320645-b11a00bfcc34",
  hvac: "1698479603408-1a66a6d9e80f", tiles: "1580398562556-d33329a0f29b", drywall: "1733431772808-82d878e59000", windows: "1630579083524-e3ac854edb46",
  paint: "1784887830054-ea5fbe193e7c", outdoor: "1743802969597-cded1a7356bd", tools: "1426927308491-6380b6a9936f", furniture: "1577176434922-803273eba97a",
  offcuts: "1590635022668-81cc8696a19d",
};

/** Finer choice for demo stock, by its original category, so a cement bag is not shown as a brick. */
const DB_PHOTO: Record<string, string[]> = {
  tulla: ["1559322575-2f4e66131d55", "1629608564457-5d74829a9e14"], suva: ["1710141530542-f792450e736e"], cimento: ["1710141530542-f792450e736e"],
  hekur: ["1763771420746-c75fefab51b5"], agregat: ["1743802969597-cded1a7356bd"], pllaka: ["1580398562556-d33329a0f29b"], parket: ["1597113366853-fea190b6cd82", "1634672652995-ee7525bce595"],
  dritare: ["1630579083524-e3ac854edb46"], dyer: ["1630579083524-e3ac854edb46"], sanitari: ["1763776091902-3d58451c42fc"], elektrike: ["1761507320645-b11a00bfcc34"],
  hidraulike: ["1763776091902-3d58451c42fc"], izolim: ["1766524789735-1f3e89c98f85"], cati: ["1605450099279-533bd3ce379a"], boje: ["1784887830054-ea5fbe193e7c", "1769173129390-a57de2512782"],
  copeza: ["1700973408133-b45276ec8feb", "1590635022668-81cc8696a19d"],
};

export function representativePhoto(category: string, dbCategory?: string, seed = "") {
  const list = (dbCategory && DB_PHOTO[dbCategory]) || [CATEGORY_PHOTO[category] ?? CATEGORY_PHOTO.structural];
  let h = 0; for (const c of seed) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return list[h % list.length];
}

export const TOOL_PHOTO = {
  renovation: "1724582586529-62622e50c0b3", basket: "1637241612956-b7309005288b", smartcut: "1505798577917-a65157d3320a", voice: "1628158088791-89567a8e84ec",
  business: "1527335988388-b40ee248d80c", warehouse: "1710141530542-f792450e736e", crane: "1599707254554-027aeb4deacd",
} as const;
