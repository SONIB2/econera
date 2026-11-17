"use client";

import { Grid } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import gsap from "gsap";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { BUILDING, buildingSegments, dataTree, volumes } from "./geometry";

export type Phase = "loading" | "ready" | "intro" | "outside" | "entering" | "inside" | "exiting";

export type SceneProps = {
  phase: Phase;
  lowPower: boolean;
  reducedMotion: boolean;
  onReady: () => void;
  onIntroDone: () => void;
  onDoor: () => void;
  onEntered: () => void;
  onExited: () => void;
  onFade: (value: number) => void;
};

const LIME = new THREE.Color("#c8f169");
const INK = new THREE.Color("#eef3ee");
const BG = "#0b110e";

/** Orbit parameters are tweened by GSAP; the frame loop turns them into a camera pose. */
type Rig = { angle: number; radius: number; height: number; targetY: number; targetZ: number; inside: number; fit: number };
const ORBIT: Omit<Rig, "angle"> = { radius: 27, height: 9.5, targetY: 7.2, targetZ: 0, inside: 0, fit: 1 };
const CRANE: Omit<Rig, "angle"> = { radius: 40, height: 30, targetY: 7, targetZ: 0, inside: 0, fit: 1 };
const FRONT_DOOR: Omit<Rig, "angle"> = { radius: 9, height: 1.75, targetY: 1.35, targetZ: BUILDING.depth / 2, inside: 0, fit: 0.35 };

export default function Scene(props: SceneProps) {
  return (
    <Canvas
      dpr={props.lowPower ? [1, 1.25] : [1, 1.75]}
      gl={{ antialias: !props.lowPower, powerPreference: "high-performance", alpha: false }}
      camera={{ fov: 42, near: 0.1, far: 200, position: [20, 26, 34] }}
      onCreated={({ gl }) => { gl.setClearColor(BG); props.onReady(); }}
      aria-hidden="true"
    >
      <fog attach="fog" args={[BG, 28, 75]} />
      <World {...props} />
      {!props.lowPower && (
        <EffectComposer multisampling={0}>
          <Bloom mipmapBlur intensity={0.85} luminanceThreshold={0.62} luminanceSmoothing={0.2} />
        </EffectComposer>
      )}
    </Canvas>
  );
}

function World({ phase, lowPower, reducedMotion, onIntroDone, onDoor, onEntered, onExited, onFade }: SceneProps) {
  const rig = useRef<Rig>({ angle: 0.55, ...CRANE });
  const door = useRef({ open: 0 });
  const growth = useRef({ value: 0 });
  const pointer = useRef(new THREE.Vector2());
  const target = useMemo(() => new THREE.Vector3(), []);
  const { camera, size } = useThree();

  // Phase transitions drive GSAP timelines. Each one is killed if the phase changes mid-flight.
  useEffect(() => {
    const r = rig.current;
    const fast = reducedMotion ? 0.001 : 1;
    let tl: gsap.core.Timeline | undefined;

    if (phase === "intro") {
      tl = gsap.timeline({ onComplete: onIntroDone });
      tl.to(r, { ...ORBIT, angle: r.angle + 0.9, duration: 3.2 * fast, ease: "power3.inOut" }, 0);
      tl.to(growth.current, { value: 1, duration: 3.6 * fast, ease: "power2.out" }, 0.6 * fast);
    }
    if (phase === "entering") {
      const front = Math.round(r.angle / (Math.PI * 2)) * Math.PI * 2;
      tl = gsap.timeline({ onComplete: onEntered });
      tl.to(r, { ...FRONT_DOOR, angle: front, duration: 2 * fast, ease: "power3.inOut" })
        .to(door.current, { open: 1, duration: 0.9 * fast, ease: "power2.inOut" }, "-=0.25")
        .to(r, { radius: 5.2, height: 1.6, targetZ: -3, fit: 0, duration: 1.3 * fast, ease: "power2.in" }, "-=0.2")
        .to({ v: 0 }, { v: 1, duration: 0.45 * fast, onUpdate() { onFade(this.targets()[0].v); } }, "-=0.45")
        .set(r, { inside: 1, radius: 2.2, height: 1.55, targetY: 1.3, targetZ: -3 })
        .to({ v: 1 }, { v: 0, duration: 0.6 * fast, onUpdate() { onFade(this.targets()[0].v); } });
    }
    if (phase === "exiting") {
      tl = gsap.timeline({ onComplete: onExited });
      tl.to({ v: 0 }, { v: 1, duration: 0.4 * fast, onUpdate() { onFade(this.targets()[0].v); } })
        .set(r, { ...FRONT_DOOR, inside: 0, radius: 4.5 })
        .to({ v: 1 }, { v: 0, duration: 0.5 * fast, onUpdate() { onFade(this.targets()[0].v); } })
        .to(door.current, { open: 0, duration: 0.8 * fast, ease: "power2.inOut" }, "<")
        .to(r, { ...ORBIT, duration: 2.4 * fast, ease: "power3.inOut" }, "<0.2");
    }
    if (phase === "outside" && growth.current.value < 1) growth.current.value = 1;
    return () => { tl?.kill(); };
  }, [phase, reducedMotion, onIntroDone, onEntered, onExited, onFade]);

  useEffect(() => {
    const move = (event: PointerEvent) => pointer.current.set((event.clientX / window.innerWidth) * 2 - 1, (event.clientY / window.innerHeight) * 2 - 1);
    window.addEventListener("pointermove", move, { passive: true });
    return () => window.removeEventListener("pointermove", move);
  }, []);

  useFrame((state, delta) => {
    const r = rig.current;
    const fog = state.scene.fog;
    const dt = Math.min(delta, 0.05);
    const orbiting = phase === "outside" || phase === "loading" || phase === "ready";
    if (orbiting && !reducedMotion) r.angle += dt * (phase === "outside" ? 0.045 : 0.02);

    const parallax = phase === "inside" ? 0.35 : 0.6;
    const px = reducedMotion ? 0 : pointer.current.x * parallax;
    const py = reducedMotion ? 0 : pointer.current.y * parallax * 0.5;

    if (r.inside) {
      camera.position.set(px * 0.6, r.height - py * 0.3, r.radius);
      target.set(px * 1.5, r.targetY - py, r.targetZ);
    } else {
      // Portrait screens need a wider orbit so the whole tower and the tree stay in frame.
      const aspect = size.width / Math.max(1, size.height);
      const radius = r.radius * (1 + r.fit * (Math.min(1.9, Math.max(1, 1.2 / aspect)) - 1));
      // Fog follows the camera distance so far orbits never swallow the building.
      if (fog instanceof THREE.Fog) { fog.near = radius * 1.05; fog.far = radius * 2.8; }
      camera.position.set(Math.sin(r.angle) * radius + Math.cos(r.angle) * px, r.height - py, r.targetZ + Math.cos(r.angle) * radius - Math.sin(r.angle) * px);
      target.set(0, r.targetY, r.targetZ);
    }
    camera.lookAt(target);
  });

  return (
    <>
      <Grid
        position={[0, -0.01, 0]}
        args={[120, 120]}
        infiniteGrid
        cellSize={1}
        cellThickness={0.6}
        cellColor="#1d2b24"
        sectionSize={6}
        sectionThickness={1}
        sectionColor="#2f4a38"
        fadeDistance={70}
        fadeStrength={1.6}
      />
      <Building />
      <DataTree growth={growth} lowPower={lowPower} />
      <Door open={door} interactive={phase === "outside"} onEnter={onDoor} />
      <Interior visible={phase === "inside" || phase === "entering" || phase === "exiting"} />
    </>
  );
}

function Lines({ positions, color, opacity, toneMapped = true }: { positions: Float32Array; color: THREE.Color; opacity: number; toneMapped?: boolean }) {
  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return g;
  }, [positions]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <lineSegments geometry={geometry} renderOrder={2}>
      <lineBasicMaterial color={color} transparent opacity={opacity} toneMapped={toneMapped} depthWrite={false} />
    </lineSegments>
  );
}

function Building() {
  const segments = useMemo(() => buildingSegments(), []);
  return (
    <group>
      {volumes.map((v, i) => (
        <mesh key={i} position={v.position} renderOrder={1}>
          <boxGeometry args={v.size} />
          <meshBasicMaterial color="#0f1a15" transparent opacity={0.72} depthWrite={false} side={THREE.DoubleSide} />
        </mesh>
      ))}
      <Lines positions={segments} color={INK} opacity={0.62} />
    </group>
  );
}

function DataTree({ growth, lowPower }: { growth: React.RefObject<{ value: number }>; lowPower: boolean }) {
  const { segments, tips } = useMemo(() => dataTree(new THREE.Vector3(-0.9, BUILDING.roof, -0.3), lowPower ? 4 : 5), [lowPower]);
  const lineGeo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(segments, 3));
    g.setDrawRange(0, 0);
    return g;
  }, [segments]);
  const tipGeo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(tips, 3));
    return g;
  }, [tips]);
  const tipMaterial = useRef<THREE.PointsMaterial>(null);
  const glow = useMemo(() => LIME.clone().multiplyScalar(1.6), []);
  useEffect(() => () => { lineGeo.dispose(); tipGeo.dispose(); }, [lineGeo, tipGeo]);

  useFrame(({ clock }) => {
    const value = growth.current?.value ?? 0;
    lineGeo.setDrawRange(0, Math.floor((segments.length / 3) * value / 2) * 2);
    if (tipMaterial.current) tipMaterial.current.opacity = Math.max(0, value - 0.85) / 0.15 * (0.75 + Math.sin(clock.elapsedTime * 2.2) * 0.25);
  });

  return (
    <group>
      <lineSegments geometry={lineGeo}>
        <lineBasicMaterial color={glow} toneMapped={false} transparent opacity={0.95} />
      </lineSegments>
      <points geometry={tipGeo}>
        <pointsMaterial ref={tipMaterial} color={glow} size={0.16} sizeAttenuation toneMapped={false} transparent opacity={0} depthWrite={false} />
      </points>
    </group>
  );
}

function Door({ open, interactive, onEnter }: { open: React.RefObject<{ open: number }>; interactive: boolean; onEnter: () => void }) {
  const { width, height } = BUILDING.door;
  const z = BUILDING.depth / 2 + 0.01;
  const hinge = useRef<THREE.Group>(null);
  const panel = useRef<THREE.MeshBasicMaterial>(null);
  const edge = useRef<THREE.LineBasicMaterial>(null);
  const threshold = useRef<THREE.MeshBasicMaterial>(null);
  const [hover, setHover] = useState(false);
  const panelEdges = useMemo(() => new THREE.EdgesGeometry(new THREE.PlaneGeometry(width, height)), [width, height]);
  const glow = useMemo(() => LIME.clone().multiplyScalar(1.4), []);
  const dark = useMemo(() => new THREE.Color("#1a2a21"), []);
  const idle = useMemo(() => LIME.clone().multiplyScalar(0.75), []);
  const frame = useMemo(() => {
    const x = width / 2 + 0.08, y = height + 0.08;
    return new Float32Array([-x, 0, 0, -x, y, 0, -x, y, 0, x, y, 0, x, y, 0, x, 0, 0]);
  }, [width, height]);

  useEffect(() => {
    if (!interactive) return;
    document.body.style.cursor = hover ? "pointer" : "";
    return () => { document.body.style.cursor = ""; };
  }, [hover, interactive]);

  useFrame(({ clock }, delta) => {
    const lit = interactive && hover ? 1 : 0;
    const pulse = interactive ? 0.35 + Math.sin(clock.elapsedTime * 2) * 0.15 : 0;
    if (hinge.current) hinge.current.rotation.y = -(open.current?.open ?? 0) * 1.65;
    if (panel.current) panel.current.color.lerp(lit ? glow : dark, 1 - Math.exp(-delta * 10));
    if (edge.current) edge.current.color.lerp(lit ? glow : idle, 1 - Math.exp(-delta * 10));
    if (threshold.current) threshold.current.opacity = Math.max(lit, pulse);
  });

  return (
    <group position={[0, 0, z]}>
      <Lines positions={frame} color={INK} opacity={0.9} />
      <group ref={hinge} position={[-width / 2, 0, 0]}>
        <mesh
          position={[width / 2, height / 2, 0]}
          onPointerOver={(event) => { event.stopPropagation(); setHover(true); }}
          onPointerOut={() => setHover(false)}
          onClick={(event) => { event.stopPropagation(); if (interactive) onEnter(); }}
        >
          <planeGeometry args={[width, height]} />
          <meshBasicMaterial ref={panel} color={dark} toneMapped={false} side={THREE.DoubleSide} transparent opacity={0.92} />
        </mesh>
        <lineSegments geometry={panelEdges} position={[width / 2, height / 2, 0.005]}>
          <lineBasicMaterial ref={edge} color={INK} toneMapped={false} />
        </lineSegments>
        <mesh position={[width - 0.14, height / 2, 0.03]}>
          <boxGeometry args={[0.03, 0.4, 0.03]} />
          <meshBasicMaterial color={glow} toneMapped={false} />
        </mesh>
      </group>
      <mesh position={[0, 0.005, 0.55]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[width + 0.4, 0.04]} />
        <meshBasicMaterial ref={threshold} color={glow} toneMapped={false} transparent opacity={0} />
      </mesh>
    </group>
  );
}

/** Placeholder interior shell. Faza D replaces it with the interactive room and hotspots. */
function Interior({ visible }: { visible: boolean }) {
  const floor = useMemo(() => {
    const s: number[] = [];
    const w = BUILDING.width / 2 - 0.1, d = BUILDING.depth / 2 - 0.1;
    for (let x = -w; x <= w + 0.001; x += 0.6) s.push(x, 0.01, -d, x, 0.01, d);
    for (let z = -d; z <= d + 0.001; z += 0.6) s.push(-w, 0.01, z, w, 0.01, z);
    return Float32Array.from(s);
  }, []);
  return (
    <group visible={visible}>
      <Lines positions={floor} color={LIME} opacity={0.18} />
    </group>
  );
}
