"use client";

import { Html } from "@react-three/drei";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { useCallback, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { HOTSPOTS, type Hotspot, type Vec3 } from "@/lib/interior";

type Part = { position: Vec3; size: Vec3 };
/** Cross-section stack: layers leave the surface along `axis` and fan out along `spread` as X-Ray opens. */
type Stack = { origin: Vec3; axis: "x" | "y" | "z"; sign: 1 | -1; face: [number, number]; spread: Vec3 };

const LIME = new THREE.Color("#c8f169");
const GLOW = LIME.clone().multiplyScalar(1.5);
const INK = new THREE.Color("#eef3ee");
const FILL = new THREE.Color("#18271f");

/* ---------- pattern helpers (line segments) ---------- */
function bricks(x0: number, x1: number, y0: number, y1: number, z: number) {
  const s: number[] = [];
  let row = 0;
  for (let y = y0; y <= y1 + 1e-3; y += 0.25, row++) {
    s.push(x0, y, z, x1, y, z);
    if (y + 0.25 > y1 + 1e-3) break;
    for (let x = x0 + (row % 2 ? 0.25 : 0.5); x < x1; x += 0.5) s.push(x, y, z, x, Math.min(y + 0.25, y1), z);
  }
  return s;
}
function planks(x0: number, x1: number, z0: number, z1: number, y: number) {
  const s: number[] = [];
  let row = 0;
  for (let z = z0; z <= z1 + 1e-3; z += 0.2, row++) {
    s.push(x0, y, z, x1, y, z);
    if (z + 0.2 > z1 + 1e-3) break;
    for (let x = x0 + ((row * 0.37) % 1.2); x < x1; x += 1.2) s.push(x, y, z, x, y, Math.min(z + 0.2, z1));
  }
  return s;
}
function grid(x0: number, x1: number, z0: number, z1: number, y: number, step: number) {
  const s: number[] = [];
  for (let x = x0; x <= x1 + 1e-3; x += step) s.push(x, y, z0, x, y, z1);
  for (let z = z0; z <= z1 + 1e-3; z += step) s.push(x0, y, z, x1, y, z);
  return s;
}

/* ---------- geometry per hotspot ---------- */
const BACK = -2.86;
const SHAPES: Record<string, { parts: Part[]; lines?: number[]; stack?: Stack }> = {
  mur: {
    parts: [{ position: [-1.95, 1.6, BACK], size: [3.9, 3.2, 0.16] }],
    lines: bricks(-3.9, 0, 0, 3.2, BACK + 0.081),
    stack: { origin: [-3.2, 1.45, BACK + 0.09], axis: "z", sign: 1, face: [0.8, 1.0], spread: [0.34, 0, 0] },
  },
  dritare: {
    parts: [{ position: [-3.86, 1.6, -0.6], size: [0.1, 1.4, 1.8] }, { position: [-3.83, 1.6, -0.6], size: [0.02, 1.25, 1.65] }],
    lines: [-3.8, 0.9, -0.6, -3.8, 2.3, -0.6, -3.8, 1.6, -1.5, -3.8, 1.6, 0.3, -3.8, 0.88, -1.6, -3.8, 0.88, 0.4],
    stack: { origin: [-3.78, 1.6, -1.2], axis: "x", sign: 1, face: [0.7, 0.6], spread: [0, 0, 0.32] },
  },
  parket: {
    parts: [{ position: [-1.35, 0.01, 0], size: [5.1, 0.02, 5.8] }],
    lines: planks(-3.9, 1.2, -2.9, 2.9, 0.022),
    stack: { origin: [-2.9, 0.03, -1.4], axis: "y", sign: 1, face: [0.8, 0.8], spread: [0.36, 0, 0] },
  },
  pllaka: {
    parts: [{ position: [2.55, 0.012, -1.2], size: [2.7, 0.024, 3.4] }],
    lines: grid(1.2, 3.9, -2.9, 0.5, 0.026, 0.6),
    stack: { origin: [1.6, 0.035, -1.5], axis: "y", sign: 1, face: [0.7, 0.7], spread: [0.3, 0, 0] },
  },
  sanitari: {
    parts: [
      { position: [3.35, 0.2, -2.52], size: [0.38, 0.4, 0.55] },
      { position: [3.35, 0.43, -2.45], size: [0.4, 0.05, 0.46] },
      { position: [3.35, 0.78, -2.8], size: [0.42, 0.62, 0.14] },
      { position: [2.35, 0.86, -2.66], size: [0.6, 0.14, 0.42] },
      { position: [2.35, 0.42, -2.76], size: [0.16, 0.84, 0.16] },
    ],
  },
  dyer: {
    parts: [{ position: [3.87, 1.05, 1.6], size: [0.06, 2.1, 0.9] }, { position: [3.82, 1.0, 1.25], size: [0.05, 0.05, 0.16] }],
    lines: [3.84, 0, 1.12, 3.84, 2.16, 1.12, 3.84, 2.16, 1.12, 3.84, 2.16, 2.08, 3.84, 2.16, 2.08, 3.84, 0, 2.08],
  },
  elektrike: {
    parts: [
      { position: [0.6, 1.7, -2.8], size: [0.4, 0.5, 0.08] },
      { position: [-0.3, 0.35, -2.81], size: [0.09, 0.09, 0.03] },
      { position: [1.05, 0.35, -2.81], size: [0.09, 0.09, 0.03] },
      { position: [0.15, 1.15, -2.81], size: [0.08, 0.12, 0.03] },
    ],
    lines: [0.6, 1.95, -2.77, 0.6, 3.15, -2.77, 0.5, 1.45, -2.77, 0.5, 0.6, -2.77, 0.5, 0.6, -2.77, -0.3, 0.6, -2.77, -0.3, 0.6, -2.77, -0.3, 0.4, -2.77, 0.7, 1.45, -2.77, 0.7, 0.6, -2.77, 0.7, 0.6, -2.77, 1.05, 0.6, -2.77, 1.05, 0.6, -2.77, 1.05, 0.4, -2.77, 0.5, 1.15, -2.77, 0.19, 1.15, -2.77],
  },
  hidraulike: {
    parts: [
      { position: [3.78, 1.05, -2.78], size: [0.06, 2.1, 0.06] },
      { position: [3.05, 0.62, -2.8], size: [1.5, 0.05, 0.05] },
      { position: [2.6, 0.62, -2.8], size: [0.05, 0.25, 0.05] },
      { position: [3.62, 0.08, -2.4], size: [0.11, 0.11, 0.7] },
    ],
  },
  cati: {
    parts: [{ position: [0, 3.12, -0.25], size: [7.6, 0.1, 5.3] }],
    lines: grid(-3.8, 3.8, -2.9, 2.4, 3.065, 1.2),
    stack: { origin: [-0.6, 3.06, -1.6], axis: "y", sign: -1, face: [0.9, 0.8], spread: [0.36, 0, 0] },
  },
};

/** Eases a set of materials towards a colour and opacity. */
function tint(materials: Iterable<THREE.Material & { color: THREE.Color }>, color: THREE.Color, opacity: number, k: number, delta: number) {
  for (const m of materials) {
    m.color.lerp(color, k);
    m.opacity = THREE.MathUtils.damp(m.opacity, opacity, 8, delta);
  }
}

/* ---------- components ---------- */
export function Interior({ visible, interactive, hovered, selected, xray, onHover, onSelect }: {
  visible: boolean; interactive: boolean; hovered: string | null; selected: string | null; xray: boolean;
  onHover: (id: string | null) => void; onSelect: (id: string) => void;
}) {
  return (
    <group visible={visible}>
      <StaticRoom xray={xray} />
      {HOTSPOTS.map((hotspot) => (
        <HotspotObject
          key={hotspot.id}
          hotspot={hotspot}
          interactive={interactive && visible}
          active={hovered === hotspot.id || selected === hotspot.id}
          selected={selected === hotspot.id}
          dimmed={selected !== null && selected !== hotspot.id}
          xray={xray}
          showLabel={visible && interactive && (hovered === hotspot.id || selected === hotspot.id)}
          showLayerLabels={visible && xray && (selected === hotspot.id || (selected === null && hovered === hotspot.id))}
          onHover={onHover}
          onSelect={onSelect}
        />
      ))}
    </group>
  );
}

function StaticRoom({ xray }: { xray: boolean }) {
  const lines = useMemo(() => {
    const s: number[] = [];
    // Utility wall behind sanitary and plumbing.
    s.push(0, 0, BACK + 0.08, 3.9, 0, BACK + 0.08, 0, 3.2, BACK + 0.08, 3.9, 3.2, BACK + 0.08);
    // Skirting along the side walls.
    s.push(-3.88, 0.08, -2.9, -3.88, 0.08, 2.9, 3.88, 0.08, -2.9, 3.88, 0.08, 2.9);
    return new Float32Array(s);
  }, []);
  const material = useRef<THREE.MeshBasicMaterial>(null);
  useFrame((_, delta) => { if (material.current) material.current.opacity = THREE.MathUtils.damp(material.current.opacity, xray ? 0.05 : 0.8, 6, delta); });
  return (
    <group>
      <mesh position={[1.95, 1.6, BACK]} renderOrder={3}>
        <boxGeometry args={[3.9, 3.2, 0.16]} />
        <meshBasicMaterial ref={material} color="#122019" transparent opacity={0.8} depthWrite={false} />
      </mesh>
      <LineSet positions={lines} color={INK} opacity={0.35} />
    </group>
  );
}

function LineSet({ positions, color, opacity }: { positions: Float32Array; color: THREE.Color; opacity: number }) {
  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return g;
  }, [positions]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <lineSegments geometry={geometry} renderOrder={4}>
      <lineBasicMaterial color={color} transparent opacity={opacity} depthWrite={false} />
    </lineSegments>
  );
}

function HotspotObject({ hotspot, interactive, active, selected, dimmed, xray, showLabel, showLayerLabels, onHover, onSelect }: {
  hotspot: Hotspot; interactive: boolean; active: boolean; selected: boolean; dimmed: boolean; xray: boolean; showLabel: boolean; showLayerLabels: boolean;
  onHover: (id: string | null) => void; onSelect: (id: string) => void;
}) {
  const shape = SHAPES[hotspot.id];
  // Materials register themselves here so one frame loop can animate every part of the element together.
  const fills = useRef(new Set<THREE.MeshBasicMaterial>());
  const lines = useRef(new Set<THREE.LineBasicMaterial>());
  const fillRef = useCallback((m: THREE.MeshBasicMaterial | null) => { if (m) fills.current.add(m); }, []);
  const lineRef = useCallback((m: THREE.LineBasicMaterial | null) => { if (m) lines.current.add(m); }, []);
  const accent = useMemo(() => FILL.clone().lerp(LIME, 0.14), []);
  const marker = useRef<THREE.Mesh>(null);
  const edges = useMemo(() => shape.parts.map((p) => new THREE.EdgesGeometry(new THREE.BoxGeometry(...p.size))), [shape]);
  const pattern = useMemo(() => {
    if (!shape.lines) return null;
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(shape.lines), 3));
    return g;
  }, [shape]);
  useEffect(() => () => { edges.forEach((e) => e.dispose()); pattern?.dispose(); }, [edges, pattern]);

  useFrame(({ clock }, delta) => {
    const k = 1 - Math.exp(-delta * 10);
    tint(lines.current, active ? GLOW : xray ? LIME : INK, active ? 1 : dimmed ? 0.18 : xray ? 0.7 : 0.5, k, delta);
    tint(fills.current, active && !xray ? accent : FILL, xray ? 0.04 : dimmed ? 0.55 : 0.9, k, delta);
    if (marker.current) {
      const pulse = 1 + Math.sin(clock.elapsedTime * 2.4 + hotspot.anchor[0]) * 0.25;
      marker.current.scale.setScalar(interactive && !active && !selected ? pulse : 0.001);
    }
  });

  const handlers = interactive ? {
    onPointerOver: (e: ThreeEvent<PointerEvent>) => { e.stopPropagation(); onHover(hotspot.id); document.body.style.cursor = "pointer"; },
    onPointerOut: () => { onHover(null); document.body.style.cursor = ""; },
    onClick: (e: ThreeEvent<MouseEvent>) => { e.stopPropagation(); onSelect(hotspot.id); },
  } : {};

  return (
    <group>
      <group {...handlers}>
        {shape.parts.map((part, i) => (
          <group key={i} position={part.position}>
            <mesh renderOrder={3}>
              <boxGeometry args={part.size} />
              <meshBasicMaterial ref={fillRef} color={FILL} transparent opacity={0.9} depthWrite={false} toneMapped={false} />
            </mesh>
            <lineSegments geometry={edges[i]} renderOrder={5}>
              <lineBasicMaterial ref={lineRef} color={INK} transparent opacity={0.5} depthWrite={false} toneMapped={false} />
            </lineSegments>
          </group>
        ))}
        {pattern && (
          <lineSegments geometry={pattern} renderOrder={5}>
            <lineBasicMaterial ref={lineRef} color={INK} transparent opacity={0.5} depthWrite={false} toneMapped={false} />
          </lineSegments>
        )}
      </group>
      <mesh ref={marker} position={hotspot.anchor}>
        <sphereGeometry args={[0.035, 12, 12]} />
        <meshBasicMaterial color={GLOW} toneMapped={false} />
      </mesh>
      {showLabel && (
        <Html position={hotspot.anchor} center zIndexRange={[20, 10]} style={{ pointerEvents: "none" }}>
          <span className="whitespace-nowrap rounded-full border border-lime/60 bg-bg/85 px-3 py-1 text-xs font-semibold text-lime shadow-[0_0_24px_rgba(200,241,105,0.25)] backdrop-blur">{hotspot.label}</span>
        </Html>
      )}
      {shape.stack && hotspot.layers && <LayerStack stack={shape.stack} hotspot={hotspot} xray={xray} labels={showLayerLabels} />}
    </group>
  );
}

/** Exploded cross-section shown in X-Ray view. Thickness is exaggerated so thin layers stay visible. */
function LayerStack({ stack, hotspot, xray, labels }: { stack: Stack; hotspot: Hotspot; xray: boolean; labels: boolean }) {
  const group = useRef<THREE.Group>(null);
  const explode = useRef(0);
  const layers = hotspot.layers!;
  const axis = stack.axis === "x" ? 0 : stack.axis === "y" ? 1 : 2;
  const thick = useMemo(() => layers.map((l) => Math.max(0.02, Math.min(0.12, l.thicknessCm / 100 * 1.2))), [layers]);
  const size = useCallback((t: number): Vec3 => {
    const [a, b] = stack.face;
    return axis === 0 ? [t, b, a] : axis === 1 ? [a, t, b] : [a, b, t];
  }, [axis, stack.face]);
  const meshes = useRef<(THREE.Group | null)[]>([]);
  const geometries = useMemo(() => thick.map((t) => {
    const box = new THREE.BoxGeometry(...size(t));
    return { box, edges: new THREE.EdgesGeometry(box) };
  }), [thick, size]);
  useEffect(() => () => geometries.forEach((g) => { g.box.dispose(); g.edges.dispose(); }), [geometries]);

  useFrame((_, delta) => {
    explode.current = THREE.MathUtils.damp(explode.current, xray ? 1 : 0, 4, delta);
    if (group.current) group.current.visible = explode.current > 0.02;
    let offset = 0;
    meshes.current.forEach((m, i) => {
      if (!m) return;
      const e = explode.current;
      const d = (offset + thick[i] / 2 + i * 0.12 * e) * stack.sign;
      const p: Vec3 = [stack.origin[0] + stack.spread[0] * i * e, stack.origin[1] + stack.spread[1] * i * e, stack.origin[2] + stack.spread[2] * i * e];
      p[axis] += d * Math.max(0.15, e);
      m.position.set(...p);
      m.scale.setScalar(0.6 + explode.current * 0.4);
      offset += thick[i];
    });
  });

  return (
    <group ref={group} visible={false}>
      {layers.map((layer, i) => (
        <group key={layer.name} ref={(el) => { meshes.current[i] = el; }}>
          <mesh renderOrder={6} geometry={geometries[i].box}>
            <meshBasicMaterial color={layer.color} transparent opacity={0.55} toneMapped={false} depthWrite={false} />
          </mesh>
          <lineSegments renderOrder={7} geometry={geometries[i].edges}>
            <lineBasicMaterial color={GLOW} toneMapped={false} />
          </lineSegments>
          {labels && (
            <Html position={axis === 2 ? [stack.face[0] / 2, stack.face[1] / 2, 0] : axis === 0 ? [0, stack.face[1] / 2, stack.face[0] / 2] : [stack.face[0] / 2, 0, -stack.face[1] / 2]} center zIndexRange={[20, 10]} style={{ pointerEvents: "none" }}>
              <span title={layer.name} className="grid size-5 place-items-center rounded-full bg-lime font-mono text-[10px] font-bold text-bg shadow-[0_0_12px_rgba(200,241,105,0.6)]">{i + 1}</span>
            </Html>
          )}
        </group>
      ))}
    </group>
  );
}
