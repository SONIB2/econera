"use client";

import { ContactShadows, Environment, Grid, Lightformer } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import gsap from "gsap";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { hotspotById, INSIDE_VIEW } from "@/lib/interior";
import { BUILDING, buildingSegments, dataTree, volumes } from "./geometry";
import { Interior } from "./interior";
import { Robot, type RobotState } from "./robot";
import { ArchitecturalModel, LEVEL_PRODUCT, PRODUCT_SPOTS, type Level, type ProductId } from "./model";

export type Phase = "boot" | "welcome" | "intro" | "outside" | "entering" | "inside" | "exiting";

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
  hovered: string | null;
  selected: string | null;
  /** A product zone inside the building: camera focus on this hotspot without opening its material panel. */
  focus?: string | null;
  xray: boolean;
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
  /** Exterior exploration controls. */
  exploded: boolean;
  paused: boolean;
  zoom: number;
  resetKey: number;
  highlight: Level | null;
  onHotLevel: (level: Level | null) => void;
  placeSpot: (id: ProductId, x: number, y: number, visible: boolean) => void;
  /** Screen position of the robot's head (pixels in the canvas), for its speech bubble. */
  placeBubble: (x: number, y: number, visible: boolean) => void;
  /** Lay the exterior out on the right half of wide screens (text on the left). */
  wide: boolean;
  onProduct: (id: ProductId) => void;
};

const LIME = new THREE.Color("#c8f169");
const INK = new THREE.Color("#eef3ee");
const BG = "#062723";

/** Orbit parameters are tweened by GSAP; the frame loop turns them into a camera pose. */
/** Outside, radius/height orbit the target. Inside (inside = 1), camX/height/radius are the absolute camera position. */
type Rig = { shift: number; angle: number; radius: number; height: number; targetY: number; targetZ: number; inside: number; fit: number; camX: number; targetX: number; fov: number };
const ORBIT: Omit<Rig, "angle" | "shift"> = { radius: 31, height: 10, targetY: 7.4, targetZ: 0, inside: 0, fit: 1, camX: 0, targetX: 0, fov: 42 };
const CRANE: Omit<Rig, "angle" | "shift"> = { radius: 40, height: 30, targetY: 7, targetZ: 0, inside: 0, fit: 1, camX: 0, targetX: 0, fov: 42 };
const FRONT_DOOR: Omit<Rig, "angle" | "shift"> = { radius: 9, height: 1.75, targetY: 1.35, targetZ: BUILDING.depth / 2, inside: 0, fit: 0.35, camX: 0, targetX: 0, fov: 42 };
const pose = (position: readonly number[], target: readonly number[]) => ({ camX: position[0], height: position[1], radius: position[2], targetX: target[0], targetY: target[1], targetZ: target[2] });

export default function Scene(props: SceneProps) {
  return (
    <Canvas
      dpr={props.lowPower ? [1, 1.25] : [1, 1.75]}
      gl={{ antialias: !props.lowPower, powerPreference: "high-performance", alpha: false }}
      camera={{ fov: 42, near: 0.1, far: 200, position: [20, 26, 34] }}
      onCreated={({ gl }) => { gl.setClearColor(BG); props.onReady(); }}
      style={{ touchAction: "pan-y" }}
    >
      <fog attach="fog" args={[BG, 28, 75]} />
      <World {...props} />
      {/* Bloom is for the blueprint exterior only; the lit interior stays natural and never blows out. */}
      {!props.lowPower && props.phase !== "inside" && (
        <EffectComposer multisampling={0}>
          <Bloom mipmapBlur intensity={0.55} luminanceThreshold={0.93} luminanceSmoothing={0.2} />
        </EffectComposer>
      )}
    </Canvas>
  );
}

function World({ phase, lowPower, reducedMotion, onIntroDone, onEntered, onExited, onFade, hovered, selected, focus, xray, onHover, onSelect, exploded, paused, zoom, resetKey, highlight, onHotLevel, placeSpot, placeBubble, wide, onProduct }: SceneProps) {
  const rig = useRef<Rig>({ angle: 0.55, shift: 0, ...CRANE });
  const robot = useRef<RobotState>({ mode: 0, wave: 0, scale: 1, fx: 0, fy: -0.9, fz: 9 });
  const door = useRef({ open: 0 });
  const growth = useRef({ value: 0 });
  const build = useRef({ value: 0 });
  const explode = useRef({ value: 0 });
  const levels = useRef<(THREE.Group | null)[]>([]);
  const drag = useRef({ active: false, x: 0, y: 0, idleUntil: 0 });
  const zoomRef = useRef({ value: 1 });
  const sway = useRef({ amount: 0 });
  const stacked = exploded && phase === "outside";
  // Effective explode value (user setting × scroll), a light scan that sweeps the floors, and arrival state.
  const explodeEff = useRef({ value: 0 });
  const scan = useRef({ value: -10 });
  const arriving = useRef(false);
  const prevPhase = useRef<Phase>("boot");
  const projected = useRef(new THREE.Vector3());
  const pointer = useRef(new THREE.Vector2());
  const target = useMemo(() => new THREE.Vector3(), []);
  const { camera, size } = useThree();

  // Phase transitions drive GSAP timelines. Each one is killed if the phase changes mid-flight.
  useEffect(() => {
    const r = rig.current;
    const fast = reducedMotion ? 0.001 : 1;
    let tl: gsap.core.Timeline | undefined;
    if (phase === "welcome") {
      // First impression: the building assembles itself in front of the viewer, then the robot pops up to greet.
      build.current.value = 0; growth.current.value = 0;
      const rb = robot.current;
      Object.assign(rb, { mode: 0, scale: 0, wave: 0, fx: wide ? 2.6 : 0, fy: wide ? -0.6 : 2.6, fz: wide ? 9 : 15 });
      tl = gsap.timeline();
      tl.to(r, { ...ORBIT, radius: 34, angle: r.angle + 0.7, duration: 3.4 * fast, ease: "power3.inOut" }, 0)
        .to(build.current, { value: 1, duration: 3.2 * fast, ease: "power1.inOut" }, 0.2 * fast)
        .to(growth.current, { value: 1, duration: 1.4 * fast, ease: "power2.out" }, 2.6 * fast)
        .to(rb, { scale: 1, duration: 0.8 * fast, ease: "back.out(1.8)" }, 2.6 * fast)
        .to(rb, { wave: 1, duration: 0.3 * fast }, 3.0 * fast)
        .to(rb, { wave: 0, duration: 0.4 * fast }, 5.2 * fast);
    }
    if (phase === "outside") {
      build.current.value = 1; growth.current.value = 1;
      const rb = robot.current;
      // Coming from the welcome screen the robot flies up to the roof; otherwise it is already there.
      if (rb.mode < 1.9 && !reducedMotion) { tl = gsap.timeline(); tl.to(rb, { mode: 2, scale: 0.65, wave: 0, duration: 1.4, ease: "power2.inOut" }, 0); }
      else Object.assign(rb, { mode: 2, scale: 0.65, wave: 0 });
    }

    if (phase === "intro") {
      tl = gsap.timeline({ onComplete: onIntroDone });
      // Blueprint → material assembly → finished building, about four seconds and skippable.
      const rb = robot.current;
      tl.to(rb, { wave: 0, duration: 0.3 * fast }, 0);
      tl.to(rb, { mode: 1, duration: 1.1 * fast, ease: "power2.inOut" }, 0);
      tl.to(r, { ...ORBIT, angle: r.angle + 0.9, duration: 3.8 * fast, ease: "power3.inOut" }, 0);
      tl.to(build.current, { value: 1, duration: 4.4 * fast, ease: "power1.inOut" }, 0.5 * fast);
      tl.to(growth.current, { value: 1, duration: 1.6 * fast, ease: "power2.out" }, 3.6 * fast);
      // The robot flies up to the roof terrace and becomes the Voice point of the building.
      tl.to(rb, { mode: 2, scale: 0.65, duration: 1.4 * fast, ease: "power2.inOut" }, 4.2 * fast);
    }
    if (phase === "entering") {
      const front = Math.round(r.angle / (Math.PI * 2)) * Math.PI * 2;
      tl = gsap.timeline({ onComplete: onEntered });
      tl.to(r, { ...FRONT_DOOR, angle: front, duration: 2 * fast, ease: "power3.inOut" })
        .to(door.current, { open: 1, duration: 0.9 * fast, ease: "power2.inOut" }, "-=0.25")
        .to(r, { radius: 5.2, height: 1.6, targetZ: -3, fit: 0, duration: 1.3 * fast, ease: "power2.in" }, "-=0.2")
        .to({ v: 0 }, { v: 1, duration: 0.45 * fast, onUpdate() { onFade(this.targets()[0].v); } }, "-=0.45")
        .set(r, { inside: 1, ...pose(INSIDE_VIEW.position, INSIDE_VIEW.target), fov: 42 })
        .to(r, { fov: 58, duration: 1.2 * fast, ease: "power2.out" }, "<")
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
    if (phase === "outside" || phase === "inside") { build.current.value = 1; growth.current.value = 1; }
    if (phase === "outside" && r.inside === 0 && r.radius > 35) gsap.to(r, { ...ORBIT, duration: 1.2 * fast, ease: "power3.out" });
    return () => { tl?.kill(); };
  }, [phase, reducedMotion, onIntroDone, onEntered, onExited, onFade, wide]);

  // Focus the camera on the selected element, or return to the room overview.
  useEffect(() => {
    if (phase !== "inside") return;
    const hotspot = hotspotById(selected ?? focus ?? null);
    const view = hotspot ? hotspot.focus : INSIDE_VIEW;
    const tween = gsap.to(rig.current, { ...pose(view.position, view.target), duration: reducedMotion ? 0.001 : 1.3, ease: "power3.inOut" });
    return () => { tween.kill(); };
  }, [phase, selected, focus, reducedMotion]);

  // Exploded view separates the floors; the camera rises and widens to keep all labels in frame.
  useEffect(() => {
    const fast = reducedMotion ? 0.001 : 1;
    const from = prevPhase.current;
    prevPhase.current = phase;
    const sweep = () => gsap.fromTo(scan.current, { value: -0.8 }, { value: 4.8, duration: 1.9 * fast, ease: "power1.inOut" });
    const target = { targetY: stacked ? 9.4 : ORBIT.targetY, radius: stacked ? 44 : ORBIT.radius, height: stacked ? 12 : ORBIT.height };
    // Arrival for visitors who skip the intro: the building flies in from the distance towards the viewer,
    // the floors burst apart with a slight overshoot, then a lime scan sweeps up through every floor.
    if (phase === "outside" && stacked && from === "boot" && !reducedMotion) {
      const r = rig.current;
      arriving.current = true;
      Object.assign(r, { radius: 170, height: 52, targetY: 3, angle: r.angle - 2.2 });
      explode.current.value = 0;
      const tl = gsap.timeline({ onComplete: () => { arriving.current = false; } });
      // Rushes in past its resting distance (towards the viewer), then eases back as the floors burst open.
      tl.to(r, { radius: 26, height: 9, targetY: 6.5, angle: r.angle + 2.0, duration: 2.1, ease: "power3.out" }, 0)
        .to(r, { ...target, angle: r.angle + 2.2, duration: 1.5, ease: "power2.inOut" }, 2.0)
        .to(explode.current, { value: 1, duration: 1.6, ease: "back.out(1.7)" }, 1.9)
        .add(sweep(), 3.1);
      return () => { tl.kill(); arriving.current = false; };
    }
    const a = gsap.to(explode.current, { value: stacked ? 1 : 0, duration: 1.6 * fast, ease: stacked ? "back.out(1.4)" : "power3.inOut", onComplete: () => { if (stacked && !reducedMotion) sweep(); } });
    const b = phase === "outside" ? gsap.to(rig.current, { ...target, duration: 1.6 * fast, ease: "power3.inOut" }) : null;
    return () => { a.kill(); b?.kill(); };
  }, [stacked, phase, reducedMotion]);
  useEffect(() => { const t = gsap.to(zoomRef.current, { value: zoom, duration: reducedMotion ? 0.001 : 0.6, ease: "power2.out" }); return () => { t.kill(); }; }, [zoom, reducedMotion]);
  useEffect(() => {
    if (!resetKey) return;
    const t = gsap.to(rig.current, { ...ORBIT, angle: 0.55, duration: reducedMotion ? 0.001 : 1.2, ease: "power3.inOut" });
    return () => { t.kill(); };
  }, [resetKey, reducedMotion]);

  // Drag to rotate (horizontal) and tilt (vertical). touch-action: pan-y keeps vertical page scrolling on phones.
  const { gl } = useThree();
  useEffect(() => {
    if (phase !== "outside") return;
    const el = gl.domElement;
    const d = drag.current;
    const down = (e: PointerEvent) => { d.active = true; d.x = e.clientX; d.y = e.clientY; el.style.cursor = "grabbing"; };
    const move = (e: PointerEvent) => {
      if (!d.active) return;
      const r = rig.current;
      r.angle -= (e.clientX - d.x) * 0.006;
      if (e.pointerType === "mouse") r.height = Math.min(24, Math.max(2.5, r.height + (e.clientY - d.y) * 0.04));
      d.x = e.clientX; d.y = e.clientY; d.idleUntil = performance.now() + 4000;
    };
    const up = () => { d.active = false; el.style.cursor = ""; };
    el.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    return () => { el.removeEventListener("pointerdown", down); window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); window.removeEventListener("pointercancel", up); };
  }, [phase, gl]);

  useEffect(() => {
    const move = (event: PointerEvent) => pointer.current.set((event.clientX / window.innerWidth) * 2 - 1, (event.clientY / window.innerHeight) * 2 - 1);
    window.addEventListener("pointermove", move, { passive: true });
    return () => window.removeEventListener("pointermove", move);
  }, []);

  useFrame((state, delta) => {
    const r = rig.current;
    const fog = state.scene.fog;
    const dt = Math.min(delta, 0.05);
    const orbiting = phase === "outside" || phase === "welcome" || phase === "boot";
    const idle = !paused && !drag.current.active && performance.now() > drag.current.idleUntil;
    // Welcome: slow full orbit. Exploring: a gentle sway, so labels stay readable instead of circling away.
    if (phase !== "outside" && orbiting && idle && !reducedMotion) r.angle += dt * 0.025;
    const s = sway.current;
    s.amount += ((phase === "outside" && idle && !reducedMotion ? 1 : 0) - s.amount) * (1 - Math.exp(-dt * 1.5));
    // Scrolling away from the hero folds the floors back together and turns the building.
    const scroll = phase === "outside" ? Math.min(1, Math.max(0, window.scrollY / Math.max(1, window.innerHeight))) : 0;
    explodeEff.current.value = explode.current.value * (1 - 0.9 * scroll);
    const angle = r.angle + Math.sin(state.clock.elapsedTime * 0.22) * 0.32 * s.amount + scroll * 1.1;

    const parallax = phase === "inside" ? 0.35 : 0.6;
    const px = reducedMotion ? 0 : pointer.current.x * parallax;
    const py = reducedMotion ? 0 : pointer.current.y * parallax * 0.5;

    const cam = state.camera as THREE.PerspectiveCamera;
    // On wide screens the exterior sits in the right half (text on the left), by shifting the lens, not the canvas.
    r.shift += ((wide && (phase === "outside" || phase === "intro") ? (phase === "intro" ? 0.08 : 0.17) : 0) - r.shift) * (1 - Math.exp(-dt * 2.5));
    const film = -r.shift * 2 * Math.tan(THREE.MathUtils.degToRad(r.fov / 2)) * (size.width / Math.max(1, size.height)) * cam.filmGauge;
    if (Math.abs(cam.fov - r.fov) > 0.01 || Math.abs(cam.filmOffset - film) > 0.001) { cam.fov = r.fov; cam.filmOffset = film; cam.updateProjectionMatrix(); }
    if (r.inside) {
      const look = selected ? 0.25 : 1;
      camera.position.set(r.camX + px * 0.3 * look, r.height - py * 0.2 * look, r.radius);
      target.set(r.targetX + px * 1.2 * look, r.targetY - py * 0.8 * look, r.targetZ);
    } else {
      // Portrait screens need a wider orbit so the whole tower and the tree stay in frame.
      const aspect = size.width / Math.max(1, size.height);
      const radius = r.radius * (1 + r.fit * (Math.min(1.9, Math.max(1, 1.2 / aspect)) - 1)) * (phase === "outside" ? zoomRef.current.value : 1);
      // Fog follows the camera distance so far orbits never swallow the building.
      if (fog instanceof THREE.Fog) { fog.near = radius * 1.05; fog.far = radius * 2.8; }
      camera.position.set(Math.sin(angle) * radius + Math.cos(angle) * px, r.height - py, r.targetZ + Math.cos(angle) * radius - Math.sin(angle) * px);
      target.set(0, r.targetY, r.targetZ);
    }
    camera.lookAt(target);

    // Hotspot labels are DOM elements; place each one on its projected 3D point.
    if (phase === "outside") {
      camera.updateMatrixWorld();
      const v = projected.current;
      for (const spot of PRODUCT_SPOTS) {
        v.set(spot.pos[0], spot.pos[1] + (levels.current[spot.level]?.position.y ?? 0), spot.pos[2]).project(camera);
        placeSpot(spot.id, (v.x + 1) / 2 * size.width, (1 - v.y) / 2 * size.height, v.z < 1 && !arriving.current && scroll < 0.25);
      }
    }
  });

  const exterior = phase !== "inside";
  return (
    <>
      <hemisphereLight args={["#e3efe9", "#0b2a25", 0.55]} />
      <directionalLight position={[12, 18, 10]} intensity={2.1} color="#ffe6c4" castShadow={!lowPower} shadow-mapSize={[1024, 1024]} shadow-camera-left={-14} shadow-camera-right={14} shadow-camera-top={18} shadow-camera-bottom={-6} />
      <directionalLight position={[-10, 8, -12]} intensity={0.55} color="#9fd8d0" />
      <Environment resolution={lowPower ? 32 : 128} frames={1}>
        <Lightformer intensity={2.2} color="#fff1dc" position={[0, 6, -9]} scale={[14, 6, 1]} />
        <Lightformer intensity={0.9} color="#c8f169" position={[-8, 2, 4]} rotation-y={Math.PI / 2} scale={[8, 1.2, 1]} />
        <Lightformer intensity={1.2} color="#d8efe8" position={[8, 4, 6]} rotation-y={-Math.PI / 2} scale={[10, 4, 1]} />
      </Environment>
      <group visible={exterior}>
        <Grid position={[0, -0.01, 0]} args={[120, 120]} infiniteGrid cellSize={1} cellThickness={0.5} cellColor="#16302a" sectionSize={6} sectionThickness={0.9} sectionColor="#284a3e" fadeDistance={60} fadeStrength={1.8} />
        {!lowPower && <ContactShadows position={[0, 0.005, 0]} scale={34} blur={2.4} opacity={0.55} far={14} resolution={512} color="#021512" />}
        <Building build={build} explode={explodeEff} />
        <ScanPlane scan={scan} explode={explodeEff} />
        <ArchitecturalModel build={build} explode={explodeEff} scan={scan} levels={levels} highlight={highlight} interactive={phase === "outside"} still={reducedMotion} onHover={onHotLevel} onPick={(level) => onProduct(LEVEL_PRODUCT[level])} />
        <LevelFollower levels={levels} index={3}><DataTree growth={growth} lowPower={lowPower} /></LevelFollower>
        <Robot state={robot} pointer={pointer} visible={phase !== "entering" && phase !== "exiting"} levelY={() => levels.current[3]?.position.y ?? 0}
          onClick={phase === "outside" ? () => onProduct("voice") : undefined}
          onHead={(x, y, front) => placeBubble((x + 1) / 2 * size.width, (1 - y) / 2 * size.height, front && robot.current.scale > 0.8 && (phase === "welcome" || phase === "intro"))} />
        <Door open={door} interactive={phase === "outside"} onEnter={() => onProduct("marketplace")} />
      </group>
      <Interior
        visible={phase === "inside" || phase === "entering" || phase === "exiting"}
        interactive={phase === "inside"}
        hovered={hovered}
        selected={selected}
        xray={xray}
        onHover={onHover}
        onSelect={onSelect}
      />
    </>
  );
}

/** A thin lime light plane that rises through the floors once, like a scanner reading the building. */
function ScanPlane({ scan, explode }: { scan: React.RefObject<{ value: number }>; explode: React.RefObject<{ value: number }> }) {
  const mesh = useRef<THREE.Mesh>(null);
  const mat = useRef<THREE.MeshBasicMaterial>(null);
  useFrame(() => {
    const v = scan.current?.value ?? -10, e = explode.current?.value ?? 0;
    if (!mesh.current || !mat.current) return;
    const on = v > -0.8 && v < 4.8;
    mesh.current.visible = on;
    if (!on) return;
    const i = Math.max(0, Math.min(3, Math.floor(v))), f = Math.max(0, Math.min(1, v - i));
    const y = (k: number) => [0, 3.2, 6, 8.8, 11.6][k] + [0, 2.3, 4.6, 6.9, 6.9][k] * e;
    mesh.current.position.y = y(i) + (y(Math.min(4, i + 1)) - y(i)) * f + 0.3;
    mat.current.opacity = 0.22 * Math.sin(Math.min(1, (v + 0.8) / 5.6) * Math.PI);
  });
  return (
    <mesh ref={mesh} rotation-x={-Math.PI / 2} position={[0.25, 0, 0.2]} visible={false} renderOrder={6}>
      <planeGeometry args={[11, 9]} />
      <meshBasicMaterial ref={mat} color={new THREE.Color("#c8f169").multiplyScalar(1.6)} toneMapped={false} transparent opacity={0} depthWrite={false} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} />
    </mesh>
  );
}

/** Keeps decorations attached to a floor while the exploded view moves it. */
function LevelFollower({ levels, index, children }: { levels: React.RefObject<(THREE.Group | null)[]>; index: number; children: React.ReactNode }) {
  const g = useRef<THREE.Group>(null);
  useFrame(() => { const l = levels.current?.[index]; if (g.current && l) g.current.position.y = l.position.y; });
  return <group ref={g}>{children}</group>;
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

/** The blueprint: precise wireframe first, then a faint drawing under the finished materials. Hidden in exploded view. */
function Building({ build, explode }: { build: React.RefObject<{ value: number }>; explode: React.RefObject<{ value: number }> }) {
  const segments = useMemo(() => buildingSegments(), []);
  const geometry = useMemo(() => { const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(segments, 3)); return g; }, [segments]);
  const line = useRef<THREE.LineBasicMaterial>(null);
  const fill = useRef<(THREE.MeshBasicMaterial | null)[]>([]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  useFrame(() => {
    const b = build.current?.value ?? 1;
    const e = explode.current?.value ?? 0;
    const k = Math.min(1, Math.max(0, (b - 0.45) / 0.5));
    if (line.current) line.current.opacity = (0.7 - 0.6 * k) * (1 - e);
    fill.current.forEach((m) => { if (m) m.opacity = 0.6 * (1 - Math.min(1, b * 2.5)); });
  });
  return (
    <group>
      {volumes.map((v, i) => (
        <mesh key={i} position={v.position} renderOrder={1}>
          <boxGeometry args={v.size} />
          <meshBasicMaterial ref={(m) => { fill.current[i] = m; }} color="#08302b" transparent opacity={0.6} depthWrite={false} side={THREE.DoubleSide} />
        </mesh>
      ))}
      <lineSegments geometry={geometry} renderOrder={4}>
        <lineBasicMaterial ref={line} color={LIME.clone().lerp(INK, 0.55)} transparent opacity={0.7} depthWrite={false} />
      </lineSegments>
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
  const dark = useMemo(() => new THREE.Color("#12403a"), []);
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
