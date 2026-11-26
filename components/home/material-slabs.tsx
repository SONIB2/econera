import Link from "next/link";
import type { Lang } from "@/lib/lang";
import "./material-slabs.css";

/**
 * Eight architectural material samples floating in space (CSS 3D, three visible faces each).
 * Surfaces are procedural SVG textures (no photos): wood grain, concrete, terrazzo, glass, insulation,
 * brushed metal, brick and veined stone. Each sample opens its marketplace category.
 */
const svg = (body: string, w = 200, h = 280) =>
  `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}' viewBox='0 0 ${w} ${h}'>${body}</svg>`)}")`;

const noise = (id: string, freq: string, octaves: number, matrix: string, seed = 3) =>
  `<filter id='${id}' x='0' y='0' width='100%' height='100%'><feTurbulence type='fractalNoise' baseFrequency='${freq}' numOctaves='${octaves}' seed='${seed}'/><feColorMatrix values='${matrix}'/></filter>`;

// Deterministic terrazzo chips.
function chips() {
  let x = 7, out = "";
  const rnd = () => ((x = (x * 16807) % 2147483647) / 2147483647);
  const cols = ["#2f3b38", "#8a8f86", "#c9c4b8", "#5d6b63", "#a58f74", "#e8e4da"];
  for (let i = 0; i < 140; i++) {
    const cx = rnd() * 200, cy = rnd() * 280, r = 1.5 + rnd() * 5.5;
    out += `<ellipse cx='${cx.toFixed(1)}' cy='${cy.toFixed(1)}' rx='${r.toFixed(1)}' ry='${(r * (0.6 + rnd() * 0.5)).toFixed(1)}' fill='${cols[Math.floor(rnd() * cols.length)]}' transform='rotate(${Math.floor(rnd() * 180)} ${cx.toFixed(1)} ${cy.toFixed(1)})'/>`;
  }
  return out;
}
function bricks() {
  let out = "<rect width='200' height='280' fill='#d9cfc0'/>";
  const tones = ["#a4482c", "#b55636", "#9a4127", "#bd6340", "#8f3c25"];
  let k = 0;
  for (let row = 0; row < 12; row++) {
    const off = row % 2 ? -32 : 0;
    for (let c = 0; c < 4; c++) { out += `<rect x='${off + c * 66 + 2}' y='${row * 24 + 2}' width='62' height='20' rx='1.5' fill='${tones[k++ % tones.length]}'/>`; }
  }
  return out + `<rect width='200' height='280' filter='url(#n)' opacity='.35'/>` + noise("n", ".9", 2, "0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 .9 0");
}

export const TEXTURE = {
  wood: svg(`${noise("w", ".012 .32", 3, "0 0 0 0 .47  0 0 0 0 .29  0 0 0 0 .15  0 0 0 -1.1 1.15", 8)}<rect width='200' height='280' fill='#8a5a32'/><rect width='200' height='280' filter='url(#w)'/>`),
  concrete: svg(`${noise("c", ".55", 4, "0 0 0 0 .38  0 0 0 0 .39  0 0 0 0 .38  0 0 0 -.9 .75")}<rect width='200' height='280' fill='#a7aaa5'/><rect width='200' height='280' filter='url(#c)'/>`),
  terrazzo: svg(`<rect width='200' height='280' fill='#d6d3cb'/>${chips()}`),
  glass: "linear-gradient(135deg, rgba(190,255,230,.55), rgba(70,160,140,.25) 45%, rgba(200,255,235,.45) 60%, rgba(40,120,105,.35))",
  insulation: svg(`${noise("i", ".04 .5", 4, "0 0 0 0 .55  0 0 0 0 .42  0 0 0 0 .14  0 0 0 -1 1.05", 5)}<rect width='200' height='280' fill='#d8b764'/><rect width='200' height='280' filter='url(#i)'/>`),
  metal: svg(`${noise("m", ".002 .9", 2, "0 0 0 0 .55  0 0 0 0 .57  0 0 0 0 .58  0 0 0 -1.2 1.1", 2)}<defs><linearGradient id='g' x1='0' x2='1'><stop offset='0' stop-color='#6f7471'/><stop offset='.45' stop-color='#c9ccca'/><stop offset='.6' stop-color='#8d918f'/><stop offset='1' stop-color='#5f6361'/></linearGradient></defs><rect width='200' height='280' fill='url(#g)'/><rect width='200' height='280' filter='url(#m)'/>`),
  brick: svg(bricks()),
  stone: svg(`${noise("s", ".008 .02", 5, "0 0 0 0 .32  0 0 0 0 .33  0 0 0 0 .32  0 0 0 -6 3.4", 11)}<rect width='200' height='280' fill='#ecebe6'/><rect width='200' height='280' filter='url(#s)'/>`),
};

const SAMPLES: { id: keyof typeof TEXTURE; cat: string; sq: string; en: string }[] = [
  { id: "wood", cat: "wood", sq: "Dru natyral", en: "Natural wood" },
  { id: "concrete", cat: "structural", sq: "Beton", en: "Concrete" },
  { id: "terrazzo", cat: "tiles", sq: "Terrazzo", en: "Terrazzo" },
  { id: "glass", cat: "windows", sq: "Xham", en: "Glass" },
  { id: "insulation", cat: "insulation", sq: "Izolim", en: "Insulation" },
  { id: "metal", cat: "structural", sq: "Metal", en: "Metal" },
  { id: "brick", cat: "bricks", sq: "Tulla", en: "Bricks" },
  { id: "stone", cat: "bricks", sq: "Gur natyral", en: "Natural stone" },
];

export function MaterialSlabs({ lang }: { lang: Lang }) {
  return (
    <ul className="ms-row" aria-label={lang === "en" ? "Material samples" : "Mostra materialesh"}>
      {SAMPLES.map((m, i) => (
        <li key={m.id} className="ms-item" style={{ ["--i" as string]: i }}>
          <Link href={`/treg?kategoria=${m.cat}`} className={`ms-slab ms-${m.id}`} style={{ ["--tex" as string]: TEXTURE[m.id] }}>
            <span aria-hidden className="ms-face ms-front" />
            <span aria-hidden className="ms-face ms-side" />
            <span aria-hidden className="ms-face ms-top" />
            <span className="ms-label">{m[lang]}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
