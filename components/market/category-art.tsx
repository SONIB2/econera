/** Original material textures drawn in SVG for category cards and listings without photos (illustrations, not product photos). */
const P: Record<string, [string, string, string]> = {
  structural: ["#d9dedc", "#9aa6a2", "#56625e"], wood: ["#e8d2ad", "#c79a62", "#8c6239"], bricks: ["#e6c3a8", "#b86b45", "#7d3f25"],
  roofing: ["#e3c7b4", "#a9583d", "#6e3322"], facade: ["#ecebe6", "#c9c6bc", "#8d8a80"], insulation: ["#f2ecd2", "#e3cf86", "#b39a45"],
  plumbing: ["#dbe6ea", "#8fb2bf", "#3f6b7a"], electrical: ["#efe6cf", "#d9b44a", "#3a3a3a"], hvac: ["#e2e8ea", "#a9b8bd", "#5d6f75"],
  tiles: ["#efeae1", "#d5ccbd", "#a69a85"], drywall: ["#f1f0ec", "#dcd9d1", "#a9a59a"], windows: ["#dfeae8", "#a9c7c2", "#4d6f69"],
  paint: ["#f3efe6", "#d8e4cf", "#7fa56a"], outdoor: ["#e5e0d3", "#b9ae93", "#7c705a"], tools: ["#e4e6e3", "#f0b74a", "#2f3432"],
  furniture: ["#efe5d8", "#c9a985", "#6d5039"], offcuts: ["#efe2c9", "#d1ad78", "#8c6a3c"],
};

export function CategoryArt({ id, className = "" }: { id: string; className?: string }) {
  const [a, b, c] = P[id] ?? P.structural;
  const common = { className: `size-full ${className}`, viewBox: "0 0 160 120", preserveAspectRatio: "xMidYMid slice", "aria-hidden": true } as const;
  switch (id) {
    case "wood": case "furniture":
      return <svg {...common}><rect width="160" height="120" fill={a} />{[0, 1, 2, 3, 4, 5].map((i) => <g key={i}><rect y={i * 20} width="160" height="19" fill={i % 2 ? b : a} /><path d={`M0 ${i * 20 + 8}c30-4 50 6 80 2s50-6 80-1`} stroke={c} strokeOpacity=".35" fill="none" /></g>)}</svg>;
    case "bricks": case "roofing":
      return <svg {...common}><rect width="160" height="120" fill={c} />{Array.from({ length: 8 }, (_, r) => Array.from({ length: 6 }, (_, k) => <rect key={`${r}${k}`} x={k * 30 - (r % 2 ? 15 : 0)} y={r * 15 + 1} width="28" height="13" rx={id === "roofing" ? 6 : 1} fill={(r + k) % 3 ? b : a} />))}</svg>;
    case "tiles": case "facade": case "drywall":
      return <svg {...common}><rect width="160" height="120" fill={c} />{Array.from({ length: 4 }, (_, r) => Array.from({ length: 5 }, (_, k) => <rect key={`${r}${k}`} x={k * 32 + 1} y={r * 30 + 1} width="30" height="28" fill={(r + k) % 2 ? a : b} />))}</svg>;
    case "plumbing": case "hvac":
      return <svg {...common}><rect width="160" height="120" fill={a} /><path d="M-5 40h70a15 15 0 0 1 15 15v70M30 -5v40M100 -5v30a15 15 0 0 0 15 15h50" stroke={b} strokeWidth="14" fill="none" /><path d="M-5 40h70a15 15 0 0 1 15 15v70M30 -5v40M100 -5v30a15 15 0 0 0 15 15h50" stroke={c} strokeWidth="2" fill="none" strokeOpacity=".4" /></svg>;
    case "electrical":
      return <svg {...common}><rect width="160" height="120" fill={a} />{[20, 45, 70, 95].map((y, i) => <path key={y} d={`M-5 ${y}c40 -10 60 18 90 6s50-12 80 0`} stroke={i % 2 ? c : b} strokeWidth="7" fill="none" strokeLinecap="round" />)}</svg>;
    case "insulation":
      return <svg {...common}><rect width="160" height="120" fill={a} />{Array.from({ length: 7 }, (_, r) => <path key={r} d={`M0 ${r * 18 + 9}q10 -9 20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0`} stroke={b} strokeWidth="6" fill="none" />)}</svg>;
    case "windows":
      return <svg {...common}><rect width="160" height="120" fill={a} /><rect x="30" y="14" width="100" height="92" fill={b} stroke={c} strokeWidth="5" /><path d="M80 14v92M30 60h100" stroke={c} strokeWidth="4" /><path d="M40 24l28 28" stroke="#fff" strokeOpacity=".5" strokeWidth="3" /></svg>;
    case "paint":
      return <svg {...common}><rect width="160" height="120" fill={a} /><rect x="0" y="0" width="54" height="120" fill={b} /><rect x="54" y="0" width="54" height="120" fill={c} opacity=".75" /><rect x="108" y="0" width="52" height="120" fill="#e8d9b5" /></svg>;
    case "offcuts":
      return <svg {...common}><rect width="160" height="120" fill={c} /><rect x="8" y="10" width="70" height="44" fill={a} /><rect x="84" y="10" width="68" height="64" fill={b} /><rect x="8" y="60" width="44" height="50" fill={b} /><rect x="58" y="60" width="20" height="50" fill={a} /><rect x="84" y="80" width="68" height="30" fill={a} opacity=".8" /></svg>;
    case "tools":
      return <svg {...common}><rect width="160" height="120" fill={a} /><rect x="30" y="50" width="100" height="22" rx="6" fill={b} /><rect x="70" y="30" width="20" height="60" rx="4" fill={c} /></svg>;
    case "outdoor":
      return <svg {...common}><rect width="160" height="120" fill={a} />{Array.from({ length: 40 }, (_, i) => <circle key={i} cx={(i * 37) % 160} cy={(i * 53) % 120} r={4 + (i % 4) * 2} fill={i % 3 ? b : c} />)}</svg>;
    default:
      return <svg {...common}><rect width="160" height="120" fill={a} />{[0, 1, 2].map((i) => <rect key={i} x="-10" y={20 + i * 32} width="180" height="18" fill={b} />)}{[0, 1, 2, 3, 4].map((i) => <rect key={`v${i}`} x={10 + i * 34} y="0" width="8" height="120" fill={c} opacity=".5" />)}</svg>;
  }
}
