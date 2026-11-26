import { TEXTURE } from "@/components/home/material-slabs";
import "./sell-visual.css";

/**
 * Bright daylight composition for the Sell page: real-looking material samples standing against a concrete wall,
 * with window light, a climbing plant and a reuse tag. Pure CSS/SVG (no WebGL), so it loads instantly.
 */
const PIECES: { cls: string; tex: keyof typeof TEXTURE | "holed" }[] = [
  { cls: "sv-timber", tex: "wood" },
  { cls: "sv-terrazzo", tex: "terrazzo" },
  { cls: "sv-glass", tex: "glass" },
  { cls: "sv-insulation", tex: "insulation" },
  { cls: "sv-bricks", tex: "brick" },
  { cls: "sv-concrete", tex: "concrete" },
  { cls: "sv-stone", tex: "stone" },
  { cls: "sv-planks", tex: "wood" },
];

export function SellVisual() {
  return (
    <div className="sv" aria-hidden>
      <div className="sv-wall" />
      <div className="sv-light" />
      <div className="sv-floor" />
      {PIECES.map((p) => (
        <div key={p.cls} className={`sv-piece ${p.cls}`} style={{ ["--tex" as string]: p.tex === "holed" ? "none" : TEXTURE[p.tex] }}>
          <span className="sv-front" /><span className="sv-side" /><span className="sv-top" />
        </div>
      ))}
      {/* Perforated clay brick in front */}
      <svg className="sv-holed" viewBox="0 0 120 80">
        <defs><linearGradient id="hb" x1="0" x2="1"><stop offset="0" stopColor="#c8582f" /><stop offset="1" stopColor="#a8431f" /></linearGradient></defs>
        <polygon points="0,14 92,14 120,0 28,0" fill="#e07a4d" />
        <polygon points="92,14 120,0 120,62 92,78" fill="#8f3a1d" />
        <rect x="0" y="14" width="92" height="64" fill="url(#hb)" />
        {[0, 1, 2, 3].map((c) => [0, 1].map((r) => <rect key={`${c}${r}`} x={7 + c * 21.5} y={22 + r * 27} width="14" height="20" rx="5" fill="#3b140a" />))}
      </svg>
      {/* Climbing plant */}
      <svg className="sv-plant" viewBox="0 0 120 260">
        <path d="M88 258 C70 200 96 160 70 118 C50 86 74 50 52 6" stroke="#4d7a2e" strokeWidth="2.2" fill="none" />
        {[[70, 228, -30], [86, 196, 25], [64, 172, -40], [84, 140, 30], [58, 112, -35], [76, 84, 20], [54, 58, -30], [64, 32, 25], [48, 14, -20]].map(([x, y, r], i) => (
          <path key={i} d="M0 0 C10 -12 26 -10 30 0 C26 10 10 12 0 0Z" fill={i % 2 ? "#5f9a37" : "#76b347"} transform={`translate(${x} ${y}) rotate(${r}) scale(${0.8 + (i % 3) * 0.12})`} />
        ))}
      </svg>
      {/* Reuse tag hanging from the timber */}
      <div className="sv-tag">
        <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M7 18H4.5l3-5.2M17 6h2.5l-3 5.2M12 3.5l2.6 4.5M9.4 8 12 3.5M20 16l-2.6 4.5h-5M4 16l2.6 4.5" /></svg>
      </div>
    </div>
  );
}
