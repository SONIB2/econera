"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { BUILDING } from "./geometry";

/**
 * The materialised building: concrete, glass, timber, greenery and warm interiors, built procedurally (no external assets).
 * `build` (0→1) assembles the pieces level by level; `explode` (0→1) separates the floors.
 */
export type Level = 0 | 1 | 2 | 3 | 4; // 4 = site (surplus yard), never exploded
type Mat = "concrete" | "concreteDark" | "glass" | "wood" | "woodDark" | "metal" | "green" | "warm" | "fabric" | "brick" | "pallet" | "leaf";
type Piece = { level: Level; mat: Mat; pos: [number, number, number]; size: [number, number, number]; d: number; shape?: "box" | "sphere" | "cyl" };

export const EXPLODE_GAP = [0, 2.3, 4.6, 6.9, 0] as const;
const { ground: G, floor: F } = BUILDING;

function pieces(): Piece[] {
  const p: Piece[] = [];
  const add = (level: Level, mat: Mat, pos: Piece["pos"], size: Piece["size"], d: number, shape?: Piece["shape"]) => p.push({ level, mat, pos, size, d, shape });
  // Ground floor: concrete plinth and core, glass storefront, steel columns, timber canopy.
  add(0, "concreteDark", [0, 0.1, 0], [8.6, 0.2, 6.6], 0);
  add(0, "concrete", [0, G / 2, -2.85], [8, G, 0.3], 0.04);
  add(0, "concrete", [-3.85, G / 2, -1.3], [0.3, G, 3.1], 0.06);
  add(0, "concrete", [3.85, G / 2, -1.3], [0.3, G, 3.1], 0.06);
  add(0, "glass", [-2.375, G / 2, 2.95], [3.25, G, 0.05], 0.14);
  add(0, "glass", [2.375, G / 2, 2.95], [3.25, G, 0.05], 0.14);
  add(0, "glass", [0, 2.75, 2.95], [1.5, 0.9, 0.05], 0.14);
  add(0, "glass", [-3.95, G / 2, 1.3], [0.05, G, 3.2], 0.16);
  add(0, "glass", [3.95, G / 2, 1.3], [0.05, G, 3.2], 0.16);
  for (const x of [-3.95, 3.95, -1.6, 1.6]) add(0, "metal", [x, G / 2, 2.98], [0.14, G, 0.14], 0.1);
  add(0, "wood", [0, G - 0.3, 3.65], [2.8, 0.14, 1.4], 0.2);
  add(0, "warm", [0, G - 0.12, 0], [7.4, 0.04, 5.4], 0.22);
  add(0, "woodDark", [-2.2, 0.55, 1.4], [2.2, 0.9, 0.6], 0.24); // reception counter in reclaimed timber
  // Floors 1 and 2: concrete slabs, glass curtain walls, vertical timber fins, warm ceilings.
  for (const [level, base] of [[1, G], [2, G + F]] as const) {
    const d0 = level === 1 ? 0.28 : 0.42;
    add(level, "concrete", [0.25, base + 0.14, 0.2], [8.8, 0.28, 6.7], d0);
    add(level, "glass", [0.25, base + 1.5, 3.42], [8.4, F - 0.3, 0.05], d0 + 0.06);
    add(level, "glass", [0.25, base + 1.5, -3.02], [8.4, F - 0.3, 0.05], d0 + 0.06);
    add(level, "glass", [-3.95, base + 1.5, 0.2], [0.05, F - 0.3, 6.3], d0 + 0.06);
    add(level, "glass", [4.45, base + 1.5, 0.2], [0.05, F - 0.3, 6.3], d0 + 0.06);
    for (let i = 0, x = -3.85; x <= 4.36; x += 0.56, i++) add(level, "wood", [x, base + 1.5, 3.55], [0.09, F - 0.3, 0.24], d0 + 0.08 + i * 0.004);
    for (let i = 0, z = -2.7; z <= 3.1; z += 0.62, i++) add(level, "wood", [4.58, base + 1.5, z], [0.24, F - 0.3, 0.09], d0 + 0.1 + i * 0.004);
    add(level, "warm", [0.25, base + F - 0.06, 0.2], [8, 0.04, 6], d0 + 0.12);
  }
  // Floor 1 holds stock (Smart Basket): pallets of tiles, timber and boxes.
  add(1, "pallet", [-2.4, G + 0.36, -1.2], [1.2, 0.14, 1], 0.36);
  add(1, "brick", [-2.4, G + 0.75, -1.2], [1.1, 0.64, 0.9], 0.38);
  add(1, "pallet", [-0.8, G + 0.36, -1.4], [1.2, 0.14, 1], 0.37);
  add(1, "woodDark", [-0.8, G + 0.62, -1.4], [1.15, 0.38, 0.95], 0.39);
  add(1, "concrete", [1.2, G + 0.6, -1.6], [0.9, 0.6, 0.9], 0.4);
  // Floor 2 is a furnished interior (AI Renovation).
  add(2, "fabric", [1.6, G + F + 0.6, -1.6], [2.2, 0.6, 0.9], 0.5);
  add(2, "wood", [-0.6, G + F + 0.68, 0.6], [1.8, 0.08, 0.9], 0.51);
  add(2, "woodDark", [-0.6, G + F + 0.48, 0.6], [1.6, 0.34, 0.7], 0.52);
  add(2, "leaf", [3.4, G + F + 0.9, 2.3], [0.9, 0.9, 0.9], 0.53, "sphere");
  add(2, "woodDark", [-3, G + F + 1.2, -2.6], [1.4, 1.9, 0.4], 0.52);
  // Penthouse: timber-clad volume, glass front, green roof, terrace planters.
  const P = G + F * 2;
  add(3, "concrete", [0.25, P + 0.14, 0.2], [8.8, 0.28, 6.7], 0.56);
  add(3, "wood", [-0.9, P + F / 2 + 0.14, -2.8], [5.6, F, 0.14], 0.6);
  add(3, "wood", [-3.7, P + F / 2 + 0.14, -0.3], [0.14, F, 5], 0.6);
  add(3, "glass", [1.9, P + F / 2 + 0.14, -0.3], [0.05, F, 5], 0.62);
  add(3, "glass", [-0.9, P + F / 2 + 0.14, 2.2], [5.6, F, 0.05], 0.62);
  add(3, "warm", [-0.9, P + F + 0.02, -0.3], [5.2, 0.04, 4.6], 0.63);
  add(3, "concrete", [-0.9, P + F + 0.24, -0.3], [6, 0.2, 5.4], 0.66);
  add(3, "green", [-0.9, P + F + 0.4, -0.3], [5.4, 0.12, 4.8], 0.7);
  add(3, "concrete", [3.4, P + 0.58, 3.1], [2.2, 0.6, 0.5], 0.68);
  add(3, "green", [3.4, P + 0.92, 3.1], [2.1, 0.1, 0.4], 0.7);
  add(3, "leaf", [2.7, P + 1.35, 3.1], [0.7, 0.8, 0.7], 0.72, "sphere");
  add(3, "leaf", [3.9, P + 1.25, 3.1], [0.55, 0.6, 0.55], 0.73, "sphere");
  add(3, "glass", [3.4, P + 0.8, 3.5], [2.4, 1, 0.04], 0.7);
  // Surplus yard beside the entrance (Sell): materials returning to the market.
  add(4, "pallet", [6.4, 0.07, 2.3], [1.2, 0.14, 1], 0.74);
  add(4, "brick", [6.4, 0.45, 2.3], [1.1, 0.62, 0.9], 0.76);
  add(4, "wood", [6.6, 0.16, 3.9], [2.4, 0.2, 0.5], 0.78);
  add(4, "wood", [6.6, 0.38, 3.9], [2.2, 0.2, 0.45], 0.8);
  add(4, "woodDark", [7.3, 0.9, 1.2], [0.08, 1.8, 0.9], 0.8); // a reclaimed door leaning on the stack
  return p;
}

function canvasTexture(draw: (g: CanvasRenderingContext2D, s: number) => void, size = 256) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  draw(c.getContext("2d")!, size);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 4;
  return t;
}
function noise(g: CanvasRenderingContext2D, s: number, base: string, spread: number, seed = 3) {
  g.fillStyle = base; g.fillRect(0, 0, s, s);
  let x = seed;
  for (let i = 0; i < s * s * 0.25; i++) {
    x = (x * 16807) % 2147483647;
    const v = (x % 1000) / 1000;
    g.fillStyle = `rgba(${v > 0.5 ? "255,255,255" : "0,0,0"},${(Math.abs(v - 0.5) * spread).toFixed(3)})`;
    g.fillRect(x % s, (x >> 8) % s, 1, 1);
  }
}

function useMaterials() {
  return useMemo(() => {
    const concreteMap = canvasTexture((g, s) => { noise(g, s, "#b8b9b2", 0.16); g.strokeStyle = "rgba(0,0,0,.08)"; for (let y = 0; y < s; y += 64) { g.beginPath(); g.moveTo(0, y); g.lineTo(s, y); g.stroke(); } });
    const woodMap = canvasTexture((g, s) => {
      g.fillStyle = "#a8743f"; g.fillRect(0, 0, s, s);
      for (let x = 0; x < s; x += 2) { const v = Math.sin(x * 0.37) * 0.5 + Math.sin(x * 0.11) * 0.5; g.fillStyle = `rgba(${v > 0 ? "70,40,15" : "255,220,170"},${(Math.abs(v) * 0.16).toFixed(3)})`; g.fillRect(x, 0, 2, s); }
    });
    const brickMap = canvasTexture((g, s) => {
      g.fillStyle = "#e2dccf"; g.fillRect(0, 0, s, s);
      for (let r = 0; r < 8; r++) for (let c = -1; c < 5; c++) { const x = c * 64 + (r % 2) * 32; g.fillStyle = ["#a9583a", "#b5654a", "#9c4f33"][(r + c + 3) % 3]; g.fillRect(x + 2, r * 32 + 2, 60, 28); }
    });
    const m = {
      concrete: new THREE.MeshStandardMaterial({ map: concreteMap, roughness: 0.92, metalness: 0 }),
      concreteDark: new THREE.MeshStandardMaterial({ color: "#5f6863", roughness: 0.95 }),
      glass: new THREE.MeshStandardMaterial({ color: "#a9d4cb", roughness: 0.04, metalness: 0.35, transparent: true, opacity: 0.28, envMapIntensity: 1.6, depthWrite: false, side: THREE.DoubleSide }),
      wood: new THREE.MeshStandardMaterial({ map: woodMap, roughness: 0.68 }),
      woodDark: new THREE.MeshStandardMaterial({ map: woodMap, color: "#8a6a52", roughness: 0.72 }),
      metal: new THREE.MeshStandardMaterial({ color: "#2c3431", roughness: 0.35, metalness: 0.85 }),
      green: new THREE.MeshStandardMaterial({ color: "#5d8a3e", roughness: 0.95 }),
      leaf: new THREE.MeshStandardMaterial({ color: "#4f7f37", roughness: 0.9, flatShading: true }),
      warm: new THREE.MeshStandardMaterial({ color: "#3d3529", emissive: "#ffcf8a", emissiveIntensity: 0.75, roughness: 1 }),
      fabric: new THREE.MeshStandardMaterial({ color: "#c9c2b4", roughness: 1 }),
      brick: new THREE.MeshStandardMaterial({ map: brickMap, roughness: 0.9 }),
      pallet: new THREE.MeshStandardMaterial({ map: woodMap, color: "#c9a77d", roughness: 0.85 }),
    } satisfies Record<Mat, THREE.MeshStandardMaterial>;
    return m;
  }, []);
}

const ease = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));

export const LEVEL_PRODUCT: ProductId[] = ["marketplace", "basket", "renovation", "smartcut", "sell"];
export const PRODUCT_LEVEL: Record<ProductId, Level> = { marketplace: 0, verify: 0, basket: 1, renovation: 2, smartcut: 3, voice: 3, sell: 4 };

type ModelProps = {
  build: React.RefObject<{ value: number }>; explode: React.RefObject<{ value: number }>; scan: React.RefObject<{ value: number }>; levels: React.RefObject<(THREE.Group | null)[]>;
  highlight: Level | null; interactive: boolean; still: boolean; onHover: (level: Level | null) => void; onPick: (level: Level) => void;
};

export function ArchitecturalModel({ build, explode, scan, levels, highlight, interactive, still, onHover, onPick }: ModelProps) {
  const list = useMemo(() => pieces(), []);
  const mats = useMaterials();
  const meshes = useRef<(THREE.Mesh | null)[]>([]);
  const firstGlass = list.findIndex((x) => x.mat === "glass");
  const firstWarm = list.findIndex((x) => x.mat === "warm");
  const geos = useMemo(() => ({ box: new THREE.BoxGeometry(1, 1, 1), sphere: new THREE.IcosahedronGeometry(0.5, 1), cyl: new THREE.CylinderGeometry(0.5, 0.5, 1, 12) }), []);
  useEffect(() => () => { Object.values(geos).forEach((g) => g.dispose()); Object.values(mats).forEach((m) => { m.map?.dispose(); m.dispose(); }); }, [geos, mats]);

  useFrame(({ clock }) => {
    const b = build.current?.value ?? 1;
    const e = ease(explode.current?.value ?? 0);
    list.forEach((piece, i) => {
      const mesh = meshes.current[i];
      if (!mesh) return;
      const k = ease((b - piece.d) / 0.28);
      mesh.visible = k > 0.001;
      mesh.position.set(piece.pos[0], piece.pos[1] + (1 - k) * 3.5, piece.pos[2]);
      mesh.scale.set(piece.size[0], piece.size[1] * (0.4 + 0.6 * k), piece.size[2]);
    });
    // Exploded floors float gently, each slightly out of phase, so the stack feels alive without moving much.
    const t = clock.elapsedTime;
    levels.current?.forEach((g, i) => { if (g) g.position.y = EXPLODE_GAP[i] * e + (still || i === 4 ? 0 : Math.sin(t * 0.9 + i * 1.3) * 0.07 * e); });
    // Shared materials are reached through a mesh ref (the lint forbids mutating the memoised object directly).
    const glass = meshes.current[firstGlass]?.material as THREE.MeshStandardMaterial | undefined;
    const warm = meshes.current[firstWarm]?.material as THREE.MeshStandardMaterial | undefined;
    if (glass) glass.opacity = 0.28 * ease((b - 0.1) / 0.6);
    if (warm) warm.emissiveIntensity = 0.85 * ease((b - 0.5) / 0.5) * (1 - 0.75 * e);
  });

  return (
    <>
      {([0, 1, 2, 3, 4] as Level[]).map((level) => (
        <group key={level} ref={(g) => { if (levels.current) levels.current[level] = g; }}
          onPointerOver={interactive ? (ev) => { ev.stopPropagation(); onHover(level); document.body.style.cursor = "pointer"; } : undefined}
          onPointerOut={interactive ? () => { onHover(null); document.body.style.cursor = ""; } : undefined}
          onClick={interactive ? (ev) => { ev.stopPropagation(); onPick(level); } : undefined}>
          <FloorGlow level={level} build={build} explode={explode} scan={scan} lit={highlight === level} />
          {list.map((piece, i) => piece.level === level && (
            <mesh key={i} ref={(m) => { meshes.current[i] = m; }} geometry={geos[piece.shape ?? "box"]} material={mats[piece.mat]} castShadow={piece.mat !== "glass" && piece.mat !== "warm"} receiveShadow renderOrder={piece.mat === "glass" ? 3 : 0} />
          ))}
        </group>
      ))}
    </>
  );
}

/** Lime outline of each floor plate: faint when assembled, clearer when exploded, bright on the hovered floor. */
const GLOW_RECTS: Record<Level, [number, number, number, number, number][]> = {
  0: [[0, 0.21, 0, 8.6, 6.6]],
  1: [[0.25, G, 0.2, 8.8, 6.7]],
  2: [[0.25, G + F, 0.2, 8.8, 6.7]],
  3: [[0.25, G + F * 2, 0.2, 8.8, 6.7], [-0.9, G + F * 3 + 0.34, -0.3, 6, 5.4]],
  4: [[6.6, 0.02, 3, 3, 3.4]],
};
const LIME_GLOW = new THREE.Color("#c8f169").multiplyScalar(1.8);

function FloorGlow({ level, build, explode, scan, lit }: { level: Level; build: React.RefObject<{ value: number }>; explode: React.RefObject<{ value: number }>; scan: React.RefObject<{ value: number }>; lit: boolean }) {
  const geometry = useMemo(() => {
    const pts: number[] = [];
    for (const [cx, y, cz, w, d] of GLOW_RECTS[level]) {
      const x0 = cx - w / 2, x1 = cx + w / 2, z0 = cz - d / 2, z1 = cz + d / 2;
      pts.push(x0, y, z0, x1, y, z0, x1, y, z0, x1, y, z1, x1, y, z1, x0, y, z1, x0, y, z1, x0, y, z0);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
    return g;
  }, [level]);
  const material = useRef<THREE.LineBasicMaterial>(null);
  useEffect(() => () => geometry.dispose(), [geometry]);
  useFrame((_, delta) => {
    const m = material.current;
    if (!m) return;
    const b = build.current?.value ?? 1, e = explode.current?.value ?? 0;
    const sweep = level === 4 ? 0 : Math.max(0, 1 - Math.abs((scan.current?.value ?? -10) - level) * 1.6);
    const target = b < 0.95 ? 0 : Math.max(lit ? 1 : 0.18 + 0.4 * e, sweep);
    m.opacity += (target - m.opacity) * (1 - Math.exp(-delta * (sweep > 0 ? 14 : 8)));
  });
  return (
    <lineSegments geometry={geometry} renderOrder={5}>
      <lineBasicMaterial ref={material} color={LIME_GLOW} toneMapped={false} transparent opacity={0} depthWrite={false} />
    </lineSegments>
  );
}

/** Product hotspots, placed on the element that represents each ECONERA product. Positions are local to their level. */
export type ProductId = "marketplace" | "verify" | "basket" | "renovation" | "smartcut" | "voice" | "sell";
export const PRODUCT_SPOTS: { id: ProductId; level: Level; pos: [number, number, number]; side: "left" | "right" }[] = [
  { id: "voice", level: 3, pos: [-0.9, G + F * 3 + 1.3, -0.3], side: "right" },
  { id: "smartcut", level: 3, pos: [-3.8, G + F * 2 + 1.4, 0.6], side: "left" },
  { id: "renovation", level: 2, pos: [4.6, G + F + 1.5, 1.6], side: "right" },
  { id: "basket", level: 1, pos: [-4.0, G + 1.5, 1.6], side: "left" },
  { id: "verify", level: 0, pos: [4.0, 1.7, -1.4], side: "right" },
  { id: "marketplace", level: 0, pos: [-1.2, 1.4, 3.2], side: "left" },
  { id: "sell", level: 4, pos: [6.6, 1.3, 2.6], side: "right" },
];

type SpotProps = { refs: React.RefObject<Partial<Record<ProductId, HTMLElement | null>>>; visible: boolean; labels: Record<ProductId, { name: string; text: string }>; onSelect: (id: ProductId) => void; onHover: (id: ProductId | null) => void; active: ProductId | null; hot: Level | null };

/**
 * Minimal hotspots: a lime point, a hairline leader and a label; the tagline appears on hover or selection.
 * Plain DOM (keyboard and screen-reader friendly); the scene writes each label's screen position every frame.
 */
export function ProductSpots({ refs, visible, labels, onSelect, onHover, active, hot }: SpotProps) {
  return (
    <ul aria-label="ECONERA" className={`pointer-events-none absolute inset-0 z-10 transition-opacity duration-700 ${visible ? "opacity-100" : "opacity-0 [&_button]:invisible"}`}>
      {PRODUCT_SPOTS.map((s) => {
        const on = active === s.id || hot === s.level;
        return (
          <li key={s.id} ref={(el) => { if (refs.current) refs.current[s.id] = el; }} className="absolute top-0 left-0 will-change-transform" style={{ transform: "translate3d(-999px,-999px,0)" }}>
            <button type="button" onClick={() => onSelect(s.id)} onMouseEnter={() => onHover(s.id)} onMouseLeave={() => onHover(null)} onFocus={() => onHover(s.id)} onBlur={() => onHover(null)} aria-pressed={active === s.id}
              className={`xp-spot pointer-events-auto flex -translate-y-1/2 items-center gap-2.5 whitespace-nowrap rounded-full text-left outline-none focus-visible:ring-2 focus-visible:ring-[#c8f169] ${s.side === "left" ? "-translate-x-[calc(100%-7px)] flex-row-reverse text-right" : "-translate-x-[7px]"}`}>
              <span className={`relative grid size-3.5 shrink-0 place-items-center rounded-full border transition ${on ? "border-[#c8f169] bg-[#c8f169]/25" : "border-[#c8f169]/60"}`}>
                <span className={`size-1.5 rounded-full bg-[#c8f169] ${on ? "shadow-[0_0_12px_3px_rgba(200,241,105,.7)]" : ""}`} />
              </span>
              <span className={`h-px bg-[#c8f169]/70 transition-all duration-300 max-sm:hidden ${on ? "w-10" : "w-6"}`} />
              <span className="max-sm:sr-only [text-shadow:0_1px_8px_rgba(2,20,17,.9)]">
                <span className={`block text-[13px] font-semibold tracking-tight transition ${on ? "text-[#c8f169]" : "text-white"}`}>{labels[s.id].name}</span>
                <span className={`block overflow-hidden text-[11px] text-white/70 transition-all duration-300 ${on ? "max-h-5 opacity-100" : "max-h-0 opacity-0"}`}>{labels[s.id].text}</span>
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
