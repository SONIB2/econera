/**
 * Small isometric material illustrations for the marketplace category bar (original SVG, 64×48).
 * Built from one projection helper so every object shares the same angle, light and scale.
 */
type V = [number, number, number];
const C = 0.866, S = 0.5;
const P = ([x, y, z]: V) => `${(32 + (x - y) * C).toFixed(1)},${(30 + (x + y) * S - z).toFixed(1)}`;
const poly = (pts: V[], fill: string, k: string, stroke = "rgba(0,0,0,.18)") => <polygon key={k} points={pts.map(P).join(" ")} fill={fill} stroke={stroke} strokeWidth=".4" strokeLinejoin="round" />;

/** An axis-aligned box at (x,y,z) with size (w along x, d along y, h up). Colours: top, left (x face), right (y face). */
function box(x: number, y: number, z: number, w: number, d: number, h: number, [top, left, right]: [string, string, string], k: string) {
  return (
    <g key={k}>
      {poly([[x, y + d, z], [x + w, y + d, z], [x + w, y + d, z + h], [x, y + d, z + h]], left, `${k}l`)}
      {poly([[x + w, y, z], [x + w, y + d, z], [x + w, y + d, z + h], [x + w, y, z + h]], right, `${k}r`)}
      {poly([[x, y, z + h], [x + w, y, z + h], [x + w, y + d, z + h], [x, y + d, z + h]], top, `${k}t`)}
    </g>
  );
}

const STEEL: [string, string, string] = ["#d5dcdc", "#a3adae", "#7b8586"];
const WOOD: [string, string, string] = ["#e9c48f", "#c48d52", "#9c6a39"];
const BRICK: [string, string, string] = ["#e0845d", "#b9512f", "#8f3a21"];
const TILE: [string, string, string] = ["#efe9df", "#cfc6b6", "#a89d8a"];
const WHITE: [string, string, string] = ["#f7f7f3", "#dcdbd3", "#b9b7ad"];
const INSUL: [string, string, string] = ["#f4d57a", "#d9b24e", "#b38a2c"];
const GLASS: [string, string, string] = ["#cdeee6", "#8fc7bb", "#5f9e92"];

const ART: Record<string, React.ReactNode> = {
  structural: <>{box(-14, -3, 0, 28, 6, 2, STEEL, "a")}{box(-14, -1, 2, 28, 2, 9, STEEL, "b")}{box(-14, -3, 11, 28, 6, 2, STEEL, "c")}</>,
  wood: <>{box(-13, -9, 0, 26, 6, 4, WOOD, "a")}{box(-13, -2, 0, 26, 6, 4, WOOD, "b")}{box(-13, 5, 0, 26, 6, 4, WOOD, "c")}{box(-13, -5.5, 4, 26, 6, 4, WOOD, "d")}{box(-13, 1.5, 4, 26, 6, 4, WOOD, "e")}{box(-13, -2, 8, 26, 6, 4, WOOD, "f")}</>,
  bricks: <>{box(-12, -6, 0, 11, 5, 5, BRICK, "a")}{box(0, -6, 0, 11, 5, 5, BRICK, "b")}{box(-12, 0, 0, 11, 5, 5, BRICK, "c")}{box(0, 0, 0, 11, 5, 5, BRICK, "d")}{box(-6, -6, 5.5, 11, 5, 5, BRICK, "e")}{box(-6, 0, 5.5, 11, 5, 5, BRICK, "f")}</>,
  roofing: <>{[0, 1, 2, 3, 4].map((i) => box(-12 + i * 5, -8 + i * 0, i * 0, 4.4, 16, 3 + (i % 2), ["#e56a45", "#c04a2a", "#93351c"], `t${i}`))}{box(-13, -9, 0, 26, 18, 0.8, ["#b9512f", "#8f3a21", "#7a2f19"], "base")}</>,
  facade: <>{box(-12, -2, 0, 7, 2, 20, ["#d8dcd6", "#b7bdb5", "#8f968c"], "a")}{box(-4, -2, 0, 7, 2, 20, ["#3b4a46", "#2c3835", "#212b28"], "b")}{box(4, -2, 0, 7, 2, 20, ["#c9a77e", "#a8845a", "#86663f"], "c")}</>,
  insulation: <>{box(-11, -8, 0, 22, 16, 10, INSUL, "a")}<path d="M17 37 q2.5 -3 5 0 t5 0 t5 0 t5 0" stroke="#b38a2c" strokeWidth=".8" fill="none" /><path d="M17 33 q2.5 -3 5 0 t5 0 t5 0 t5 0" stroke="#b38a2c" strokeWidth=".8" fill="none" /></>,
  plumbing: <>
    <line x1="14" y1="34" x2="40" y2="21" stroke="#8b9496" strokeWidth="7" strokeLinecap="round" /><line x1="14" y1="34" x2="40" y2="21" stroke="#c9d0d1" strokeWidth="3" strokeLinecap="round" />
    <line x1="24" y1="40" x2="50" y2="27" stroke="#6f7a7c" strokeWidth="7" strokeLinecap="round" /><line x1="24" y1="40" x2="50" y2="27" stroke="#b5bebf" strokeWidth="3" strokeLinecap="round" />
    <ellipse cx="50" cy="27" rx="2.6" ry="3.6" fill="#3e4849" transform="rotate(-27 50 27)" />
  </>,
  electrical: <>{[13, 10, 7, 4].map((r, i) => <ellipse key={r} cx="32" cy={30 - i * 1.6} rx={r * 1.25} ry={r * 0.62} fill="none" stroke={i % 2 ? "#c86d2f" : "#e08a45"} strokeWidth="3" />)}<path d="M48 28 q6 2 8 8" stroke="#e08a45" strokeWidth="3" fill="none" strokeLinecap="round" /></>,
  hvac: <>{box(-11, -9, 0, 22, 18, 18, ["#e9ecec", "#c8cecf", "#9aa3a4"], "a")}<ellipse cx="43" cy="27" rx="5.5" ry="7.5" fill="#5f6b6d" transform="skewY(-30) translate(0 25)" opacity=".0" /><circle cx="21" cy="30" r="5.6" fill="#55605f" /><circle cx="21" cy="30" r="1.6" fill="#c8cecf" /><path d="M21 25 v10 M16 30 h10" stroke="#8a9495" strokeWidth=".8" /></>,
  tiles: <>{[0, 1, 2, 3].map((i) => box(-11 + i * 0.6, -9 + i * 0.4, i * 2.2, 20, 16, 1.8, i % 2 ? ["#e2dbcf", "#c3b9a6", "#9d927e"] : TILE, `t${i}`))}</>,
  drywall: <>{[0, 1, 2, 3, 4].map((i) => box(-12, -8, i * 1.6, 24, 16, 1.4, WHITE, `d${i}`))}</>,
  windows: <>{box(-10, -1.5, 0, 20, 3, 22, ["#4c5a57", "#3b4744", "#2d3735"], "f")}{poly([[-8, 1.6, 2], [8, 1.6, 2], [8, 1.6, 20], [-8, 1.6, 20]], GLASS[1], "g")}<line x1={32 - 0} y1="31" x2="32" y2="13" stroke="#3b4744" strokeWidth="1.2" /></>,
  paint: <>
    <rect x="21" y="20" width="22" height="20" rx="1" fill="#bcc5c6" /><ellipse cx="32" cy="40" rx="11" ry="4" fill="#9aa3a4" /><ellipse cx="32" cy="20" rx="11" ry="4" fill="#dfe4e4" /><ellipse cx="32" cy="20" rx="8.5" ry="2.8" fill="#9bc96a" />
    <rect x="21" y="26" width="22" height="7" fill="#c8f169" opacity=".85" />
  </>,
  outdoor: <>{[0, 1, 2].map((r) => [0, 1, 2].map((c) => box(-12 + c * 8.2, -12 + r * 8.2, 0, 7.6, 7.6, 2, ["#c9c0ad", "#a59b86", "#857b67"], `p${r}${c}`)))}<circle cx="44" cy="17" r="6" fill="#5c9a4c" /><circle cx="48" cy="21" r="4.5" fill="#4c8640" /><rect x="44.6" y="21" width="1.6" height="7" fill="#6b4f33" /></>,
  tools: <>{box(-3, -14, 0, 3, 24, 3, WOOD, "h")}{box(-7, 8, 1, 11, 4, 5, STEEL, "head")}</>,
  furniture: <>{box(-8, -8, 7, 16, 16, 2, WOOD, "seat")}{box(-8, -8, 0, 2, 2, 7, WOOD, "l1")}{box(6, -8, 0, 2, 2, 7, WOOD, "l2")}{box(-8, 6, 0, 2, 2, 7, WOOD, "l3")}{box(6, 6, 0, 2, 2, 7, WOOD, "l4")}{box(-8, -8, 9, 16, 2, 12, WOOD, "back")}</>,
  offcuts: <>{box(-13, -8, 0, 14, 10, 2.2, WOOD, "a")}{box(3, -10, 0, 9, 7, 2.2, ["#e3d0a8", "#c1a777", "#9c8452"], "b")}{box(-6, 4, 0, 18, 6, 2.2, ["#d6b788", "#b08a57", "#8c6a3c"], "c")}{box(-10, -4, 2.2, 8, 12, 2.2, ["#e3d0a8", "#c1a777", "#9c8452"], "d")}</>,
};

export function CategoryIcon({ id, className = "" }: { id: string; className?: string }) {
  if (id === "all") {
    return (
      <svg viewBox="0 0 64 48" className={className} aria-hidden fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinejoin="round">
        <rect x="19" y="8" width="11" height="11" rx="2.5" /><rect x="34" y="8" width="11" height="11" rx="2.5" /><rect x="19" y="23" width="11" height="11" rx="2.5" /><rect x="34" y="23" width="11" height="11" rx="2.5" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 64 48" className={className} aria-hidden>
      <ellipse cx="32" cy="42" rx="22" ry="4" fill="rgba(0,0,0,.28)" />
      {ART[id] ?? ART.structural}
    </svg>
  );
}
