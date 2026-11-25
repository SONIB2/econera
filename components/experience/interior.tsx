"use client";

import { Environment, Html, RoundedBox, useGLTF, useTexture } from "@react-three/drei";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { Suspense, useCallback, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { HOTSPOTS, hotspotLabel, type Hotspot, type Vec3 } from "@/lib/interior";

/* Realistic, lit ground-floor room. Textures and props are CC0 (Poly Haven, see public/world/ASSET-CREDITS.txt). */

const LIME = new THREE.Color("#c8f169");
const GLOW = LIME.clone().multiplyScalar(1.4);
const W = 3.9, D = 2.9, H = 3.2, BACK = -2.86;

type Stack = { origin: Vec3; axis: "x" | "y" | "z"; sign: 1 | -1; face: [number, number]; spread: Vec3 };
const STACKS: Record<string, Stack> = {
  mur: { origin: [-3.2, 1.45, BACK + 0.09], axis: "z", sign: 1, face: [0.8, 1.0], spread: [0.34, 0, 0] },
  dritare: { origin: [-3.78, 1.6, -1.2], axis: "x", sign: 1, face: [0.7, 0.6], spread: [0, 0, 0.32] },
  parket: { origin: [-2.9, 0.03, -1.4], axis: "y", sign: 1, face: [0.8, 0.8], spread: [0.36, 0, 0] },
  pllaka: { origin: [1.6, 0.035, -1.5], axis: "y", sign: 1, face: [0.7, 0.7], spread: [0.3, 0, 0] },
  cati: { origin: [-0.6, 3.06, -1.6], axis: "y", sign: -1, face: [0.9, 0.8], spread: [0.36, 0, 0] },
};

/* ---------- material helpers (module scope keeps hook values immutable for the React compiler) ---------- */
type Lit = THREE.MeshStandardMaterial;

function textured(base: THREE.Texture, repeatX: number, repeatY: number, srgb: boolean) {
  const t = base.clone();
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeatX, repeatY);
  t.anisotropy = 8;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.needsUpdate = true;
  return t;
}

function tileTexture() {
  const size = 512, canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const g = canvas.getContext("2d")!;
  g.fillStyle = "#b9b4aa";
  g.fillRect(0, 0, size, size);
  for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) {
    const shade = 228 - ((x * 7 + y * 13) % 5) * 3;
    g.fillStyle = `rgb(${shade}, ${shade - 3}, ${shade - 9})`;
    g.fillRect(x * 128 + 3, y * 128 + 3, 122, 122);
  }
  const t = new THREE.CanvasTexture(canvas);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** Fades lit materials for X-Ray and tints them when the element is active. */
function animateMaterials(materials: Iterable<Lit>, opacity: number, glow: number, delta: number) {
  for (const m of materials) {
    const transparent = opacity < 0.999 || m.opacity < 0.995;
    if (m.transparent !== transparent) { m.transparent = transparent; m.needsUpdate = true; }
    m.depthWrite = !transparent || opacity > 0.5;
    m.opacity = THREE.MathUtils.damp(m.opacity, opacity, 8, delta);
    m.emissive.copy(LIME).multiplyScalar(THREE.MathUtils.damp(m.userData.glow ?? 0, glow, 8, delta));
    m.userData.glow = THREE.MathUtils.damp(m.userData.glow ?? 0, glow, 8, delta);
  }
}

/* ---------- textures ---------- */
function useRoomTextures() {
  const raw = useTexture({
    plaster: "/world/plaster-color.webp", plasterN: "/world/plaster-normal.webp",
    brick: "/world/clay-color.webp", brickN: "/world/clay-normal.webp",
    oak: "/world/oak-color.webp", oakN: "/world/oak-normal.webp",
    door: "/world/door-color.webp", doorN: "/world/door-normal.webp",
  });
  return useMemo(() => ({
    wall: { map: textured(raw.plaster, 2, 1.6, true), normalMap: textured(raw.plasterN, 2, 1.6, false) },
    ceiling: { map: textured(raw.plaster, 3, 2, true), normalMap: textured(raw.plasterN, 3, 2, false) },
    brick: { map: textured(raw.brick, 2.4, 2, true), normalMap: textured(raw.brickN, 2.4, 2, false) },
    oak: { map: textured(raw.oak, 2.6, 2.6, true), normalMap: textured(raw.oakN, 2.6, 2.6, false) },
    door: { map: textured(raw.door, 1, 2, true), normalMap: textured(raw.doorN, 1, 2, false) },
    tiles: { map: (() => { const t = tileTexture(); t.repeat.set(2.7 / 0.6 / 4, 3.4 / 0.6 / 4); return t; })() },
  }), [raw]);
}
type Tex = ReturnType<typeof useRoomTextures>;

/* ---------- public component ---------- */
export function Interior(props: {
  visible: boolean; interactive: boolean; hovered: string | null; selected: string | null; xray: boolean;
  onHover: (id: string | null) => void; onSelect: (id: string) => void;
}) {
  return (
    <group visible={props.visible}>
      <Suspense fallback={null}>
        <Room {...props} />
      </Suspense>
    </group>
  );
}

function Room({ visible, interactive, hovered, selected, xray, onHover, onSelect }: Parameters<typeof Interior>[0]) {
  const tex = useRoomTextures();
  return (
    <>
      {visible && <Environment files="/world/sunset.hdr" environmentIntensity={0.35} />}
      <ambientLight intensity={visible ? 0.35 : 0} />
      <hemisphereLight args={["#fff4e0", "#2a2a24", visible ? 0.55 : 0]} />
      <directionalLight position={[-9, 5, -1]} intensity={visible ? 1.6 : 0} color="#ffe2b8" />
      <pointLight position={[0, 2.75, -0.4]} intensity={visible ? 6 : 0} distance={9} decay={1.6} color="#ffd9a8" />
      <Shell tex={tex} xray={xray} />
      <Props xray={xray} />
      {HOTSPOTS.map((hotspot) => (
        <HotspotObject
          key={hotspot.id}
          hotspot={hotspot}
          tex={tex}
          interactive={interactive && visible}
          active={hovered === hotspot.id || selected === hotspot.id}
          xray={xray}
          showLabel={visible && interactive && (hovered === hotspot.id || selected === hotspot.id)}
          showLayerLabels={visible && xray && (selected === hotspot.id || (selected === null && hovered === hotspot.id))}
          onHover={onHover}
          onSelect={onSelect}
        />
      ))}
    </>
  );
}

/** Non-interactive walls, skirting and the ceiling lamp. */
function Shell({ tex, xray }: { tex: Tex; xray: boolean }) {
  const mats = useRef(new Set<Lit>());
  const reg = useCallback((m: Lit | null) => { if (m) mats.current.add(m); }, []);
  useFrame((_, delta) => animateMaterials(mats.current, xray ? 0.06 : 1, 0, delta));
  const wall = (position: Vec3, size: Vec3, key: string) => (
    <mesh key={key} position={position} receiveShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial ref={reg} normalMap={tex.wall.normalMap} normalScale={new THREE.Vector2(0.35, 0.35)} color="#ebe6dc" roughness={0.92} />
    </mesh>
  );
  return (
    <group>
      {wall([1.95, H / 2, BACK - 0.01], [3.9, H, 0.14], "back-right")}
      {wall([-W - 0.07, H / 2, 1.6], [0.14, H, 2.6], "left-front")}
      {wall([-W - 0.07, H / 2, -2.05], [0.14, H, 1.7], "left-back")}
      {wall([-W - 0.07, 0.45, -0.6], [0.14, 0.9, 1.9], "left-under-window")}
      {wall([-W - 0.07, 2.75, -0.6], [0.14, 0.9, 1.9], "left-over-window")}
      {wall([W + 0.07, H / 2, -0.75], [0.14, H, 4.3], "right-back")}
      {wall([W + 0.07, 2.65, 1.6], [0.14, 1.1, 1.0], "right-over-door")}
      {wall([W + 0.07, H / 2, 2.55], [0.14, H, 0.9], "right-front")}
      {wall([-2.45, H / 2, D + 0.07], [2.9, H, 0.14], "front-left")}
      {wall([2.45, H / 2, D + 0.07], [2.9, H, 0.14], "front-right")}
      {wall([0, 2.75, D + 0.07], [2, 0.9, 0.14], "front-over-entry")}
      {/* Base floor (micro-cement) under the parquet and tiles. */}
      <mesh position={[0, 0.002, 0]} receiveShadow>
        <boxGeometry args={[2 * W, 0.004, 2 * D]} />
        <meshStandardMaterial ref={reg} color="#bdb8ae" roughness={0.7} />
      </mesh>
      {/* Bathroom wall tiles. */}
      <mesh position={[2.55, 0.9, BACK + 0.075]}>
        <boxGeometry args={[2.7, 1.8, 0.02]} />
        <meshStandardMaterial ref={reg} map={tex.tiles.map} color="#ffffff" roughness={0.25} metalness={0} />
      </mesh>
      {/* Skirting. */}
      {[[-W + 0.01, 0.05, 0, 0.02, 0.1, 5.8], [W - 0.01, 0.05, 0, 0.02, 0.1, 5.8], [-1.95, 0.05, BACK + 0.09, 3.9, 0.1, 0.02]].map(([x, y, z, w, h, d], i) => (
        <mesh key={i} position={[x, y, z]}><boxGeometry args={[w, h, d]} /><meshStandardMaterial ref={reg} color="#e8e2d6" roughness={0.6} /></mesh>
      ))}
      {/* Pendant lamp. */}
      <mesh position={[0, 3.0, -0.4]}><cylinderGeometry args={[0.006, 0.006, 0.4]} /><meshStandardMaterial ref={reg} color="#222" /></mesh>
      <mesh position={[0, 2.75, -0.4]}><coneGeometry args={[0.22, 0.2, 32, 1, true]} /><meshStandardMaterial ref={reg} color="#1d2a22" side={THREE.DoubleSide} roughness={0.5} /></mesh>
      <mesh position={[0, 2.7, -0.4]}><sphereGeometry args={[0.06, 16, 16]} /><meshStandardMaterial ref={reg} color="#fff" emissive="#ffe7c2" emissiveIntensity={2} /></mesh>
    </group>
  );
}

function Props({ xray }: { xray: boolean }) {
  const stool = useGLTF("/world/wooden_stool_01/model.gltf");
  const plant = useGLTF("/world/potted_plant_04/model.gltf");
  const scenes = useMemo(() => [stool.scene.clone(true), plant.scene.clone(true)], [stool, plant]);
  const group = useRef<THREE.Group>(null);
  useFrame(() => { if (group.current) group.current.visible = !xray; });
  return (
    <group ref={group}>
      <primitive object={scenes[0]} position={[-2.7, 0.02, 0.9]} rotation={[0, 0.5, 0]} />
      <primitive object={scenes[1]} position={[-3.4, 0.02, 2.3]} scale={1.6} />
    </group>
  );
}

/* ---------- hotspot geometry ---------- */
function Parts({ id, tex, reg }: { id: string; tex: Tex; reg: (m: Lit | null) => void }) {
  const white = <meshStandardMaterial ref={reg} color="#f5f3ee" roughness={0.18} metalness={0} />;
  switch (id) {
    case "mur":
      return <mesh position={[-1.95, H / 2, BACK]}><boxGeometry args={[3.9, H, 0.16]} /><meshStandardMaterial ref={reg} {...tex.brick} roughness={0.9} /></mesh>;
    case "dritare":
      return (
        <group position={[-W, 1.8, -0.6]}>
          {[[0, 0.47, 0, 0.12, 0.06, 1.9], [0, -0.47, 0, 0.12, 0.06, 1.9], [0, 0, 0.92, 0.12, 1.0, 0.06], [0, 0, -0.92, 0.12, 1.0, 0.06], [0, 0, 0, 0.1, 1.0, 0.05]].map(([x, y, z, w, h, d], i) => (
            <mesh key={i} position={[x, y, z]}><boxGeometry args={[w, h, d]} /><meshStandardMaterial ref={reg} color="#f4f4f1" roughness={0.35} /></mesh>
          ))}
          <mesh position={[0.06, -0.53, 0]}><boxGeometry args={[0.28, 0.04, 2.0]} /><meshStandardMaterial ref={reg} color="#e9e4da" roughness={0.4} /></mesh>
          <mesh position={[-0.02, 0, 0]}><boxGeometry args={[0.02, 0.88, 1.8]} /><meshStandardMaterial ref={reg} color="#cfe8f2" roughness={0.05} metalness={0.1} transparent opacity={0.35} /></mesh>
          {/* Daylight outside the glass. */}
          <mesh position={[-0.3, 0, 0]} rotation={[0, Math.PI / 2, 0]}><planeGeometry args={[2.2, 1.2]} /><meshBasicMaterial color="#f6e7c8" toneMapped={false} /></mesh>
        </group>
      );
    case "parket":
      return <mesh position={[-1.35, 0.01, 0]} receiveShadow><boxGeometry args={[5.1, 0.02, 5.8]} /><meshStandardMaterial ref={reg} {...tex.oak} roughness={0.55} /></mesh>;
    case "pllaka":
      return <mesh position={[2.55, 0.012, -1.2]}><boxGeometry args={[2.7, 0.024, 3.4]} /><meshStandardMaterial ref={reg} map={tex.tiles.map} roughness={0.3} /></mesh>;
    case "sanitari":
      return (
        <group>
          <RoundedBox args={[0.38, 0.4, 0.55]} radius={0.08} position={[3.35, 0.2, -2.5]}>{white}</RoundedBox>
          <RoundedBox args={[0.4, 0.05, 0.46]} radius={0.02} position={[3.35, 0.43, -2.45]}>{white}</RoundedBox>
          <RoundedBox args={[0.42, 0.5, 0.14]} radius={0.04} position={[3.35, 0.82, -2.75]}>{white}</RoundedBox>
          <RoundedBox args={[0.6, 0.15, 0.42]} radius={0.05} position={[2.35, 0.86, -2.62]}>{white}</RoundedBox>
          <mesh position={[2.35, 1.6, BACK + 0.09]}><boxGeometry args={[0.55, 0.75, 0.02]} /><meshStandardMaterial ref={reg} color="#cfd8d6" roughness={0.02} metalness={0.9} /></mesh>
          <mesh position={[2.35, 1.02, -2.76]}><cylinderGeometry args={[0.015, 0.015, 0.18]} /><meshStandardMaterial ref={reg} color="#c9c9c9" metalness={1} roughness={0.2} /></mesh>
        </group>
      );
    case "dyer":
      return (
        <group position={[W - 0.02, 0, 1.6]}>
          <mesh position={[0, 1.05, 0]}><boxGeometry args={[0.05, 2.1, 0.88]} /><meshStandardMaterial ref={reg} {...tex.door} color="#e0c9a6" roughness={0.6} /></mesh>
          {[[0, 2.14, 0, 0.1, 0.08, 1.0], [0, 1.07, 0.47, 0.1, 2.14, 0.06], [0, 1.07, -0.47, 0.1, 2.14, 0.06]].map(([x, y, z, w, h, d], i) => (
            <mesh key={i} position={[x, y, z]}><boxGeometry args={[w, h, d]} /><meshStandardMaterial ref={reg} color="#ece6dc" roughness={0.5} /></mesh>
          ))}
          <mesh position={[-0.06, 1.0, -0.33]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.012, 0.012, 0.12]} /><meshStandardMaterial ref={reg} color="#bdbdbd" metalness={1} roughness={0.25} /></mesh>
        </group>
      );
    case "elektrike":
      return (
        <group>
          <mesh position={[0.6, 1.7, BACK + 0.11]}><boxGeometry args={[0.36, 0.46, 0.06]} /><meshStandardMaterial ref={reg} color="#f1f0ec" roughness={0.4} /></mesh>
          <mesh position={[0.6, 1.7, BACK + 0.145]}><boxGeometry args={[0.28, 0.08, 0.01]} /><meshStandardMaterial ref={reg} color="#3a3a3a" roughness={0.5} /></mesh>
          {[[-0.3, 0.35], [1.05, 0.35], [0.15, 1.15]].map(([x, y], i) => (
            <mesh key={i} position={[x, y, BACK + 0.09]}><boxGeometry args={[0.09, i === 2 ? 0.12 : 0.09, 0.02]} /><meshStandardMaterial ref={reg} color="#fbfbf8" roughness={0.3} /></mesh>
          ))}
        </group>
      );
    case "hidraulike":
      return (
        <group>
          <mesh position={[3.78, 1.05, -2.74]}><cylinderGeometry args={[0.025, 0.025, 2.1]} /><meshStandardMaterial ref={reg} color="#b87333" metalness={0.9} roughness={0.35} /></mesh>
          <mesh position={[3.05, 0.6, -2.76]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.02, 0.02, 1.45]} /><meshStandardMaterial ref={reg} color="#b87333" metalness={0.9} roughness={0.35} /></mesh>
          <mesh position={[2.35, 0.55, -2.7]}><cylinderGeometry args={[0.035, 0.035, 0.5]} /><meshStandardMaterial ref={reg} color="#e9e9e6" roughness={0.4} /></mesh>
          <mesh position={[3.62, 0.08, -2.4]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.055, 0.055, 0.7]} /><meshStandardMaterial ref={reg} color="#8c8f8a" roughness={0.6} /></mesh>
        </group>
      );
    case "cati":
      return <mesh position={[0, H - 0.04, 0]}><boxGeometry args={[2 * W + 0.2, 0.08, 2 * D + 0.2]} /><meshStandardMaterial ref={reg} normalMap={tex.ceiling.normalMap} normalScale={new THREE.Vector2(0.2, 0.2)} color="#f6f3ed" roughness={0.95} /></mesh>;
    default:
      return null;
  }
}

function HotspotObject({ hotspot, tex, interactive, active, xray, showLabel, showLayerLabels, onHover, onSelect }: {
  hotspot: Hotspot; tex: Tex; interactive: boolean; active: boolean; xray: boolean; showLabel: boolean; showLayerLabels: boolean;
  onHover: (id: string | null) => void; onSelect: (id: string) => void;
}) {
  const mats = useRef(new Set<Lit>());
  const reg = useCallback((m: Lit | null) => { if (m) mats.current.add(m); }, []);
  const group = useRef<THREE.Group>(null);
  const outline = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    animateMaterials(mats.current, xray ? (active ? 0.35 : 0.12) : 1, 0, delta);
    if (outline.current) outline.current.visible = active;
  });

  const handlers = interactive ? {
    onPointerOver: (e: ThreeEvent<PointerEvent>) => { e.stopPropagation(); onHover(hotspot.id); document.body.style.cursor = "pointer"; },
    onPointerOut: () => { onHover(null); document.body.style.cursor = ""; },
    onClick: (e: ThreeEvent<MouseEvent>) => { e.stopPropagation(); onSelect(hotspot.id); },
  } : {};

  return (
    <group>
      <group ref={group} {...handlers}>
        <Parts id={hotspot.id} tex={tex} reg={reg} />
      </group>
      <group ref={outline} visible={false}><OutlineCopy source={group} /></group>
      {showLabel && (
        <Html position={hotspot.anchor} center zIndexRange={[20, 10]} style={{ pointerEvents: "none" }}>
          <span className="whitespace-nowrap rounded-full border border-lime/60 bg-bg/85 px-3 py-1 text-xs font-semibold text-lime shadow-[0_0_24px_rgba(200,241,105,0.25)] backdrop-blur">{hotspotLabel(hotspot, typeof document !== "undefined" && document.documentElement.lang === "en" ? "en" : "sq")}</span>
        </Html>
      )}
      {STACKS[hotspot.id] && hotspot.layers && <LayerStack stack={STACKS[hotspot.id]} hotspot={hotspot} xray={xray} labels={showLayerLabels} />}
    </group>
  );
}

/** Lime outline drawn around every mesh of a hotspot (inverted-hull outlines, no post-processing). */
function OutlineCopy({ source }: { source: React.RefObject<THREE.Group | null> }) {
  const holder = useRef<THREE.Group>(null);
  useEffect(() => {
    const target = holder.current, from = source.current;
    if (!target || !from) return;
    const material = new THREE.MeshBasicMaterial({ color: GLOW, side: THREE.BackSide, toneMapped: false, transparent: true, opacity: 0.95 });
    const made: THREE.Mesh[] = [];
    from.updateWorldMatrix(true, true);
    from.traverse((child) => {
      if (!(child instanceof THREE.Mesh) || child.geometry.type === "PlaneGeometry") return;
      const shell = new THREE.Mesh(child.geometry, material);
      child.matrixWorld.decompose(shell.position, shell.quaternion, shell.scale);
      const box = new THREE.Box3().setFromBufferAttribute(child.geometry.getAttribute("position") as THREE.BufferAttribute);
      const size = box.getSize(new THREE.Vector3());
      // Grow each axis by a fixed ~1.5 cm so thin and large parts get the same rim.
      shell.scale.multiply(new THREE.Vector3(1 + 0.03 / Math.max(size.x, 0.01), 1 + 0.03 / Math.max(size.y, 0.01), 1 + 0.03 / Math.max(size.z, 0.01)));
      target.add(shell);
      made.push(shell);
    });
    return () => { made.forEach((m) => target.remove(m)); material.dispose(); };
  }, [source]);
  return <group ref={holder} />;
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
      m.scale.setScalar(0.6 + e * 0.4);
      offset += thick[i];
    });
  });

  return (
    <group ref={group} visible={false}>
      {layers.map((layer, i) => (
        <group key={layer.name} ref={(el) => { meshes.current[i] = el; }}>
          <mesh renderOrder={6} geometry={geometries[i].box}>
            <meshStandardMaterial color={layer.color} transparent opacity={0.85} roughness={0.8} />
          </mesh>
          <lineSegments renderOrder={7} geometry={geometries[i].edges}>
            <lineBasicMaterial color={LIME} />
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

useGLTF.preload("/world/wooden_stool_01/model.gltf");
useGLTF.preload("/world/potted_plant_04/model.gltf");
