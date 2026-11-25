"use client";

import { RoundedBox } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { BUILDING } from "./geometry";

/**
 * ECONERA's assistant as a small procedural robot (no external model).
 * `mode` blends its anchor: 0 = in front of the viewer, 1 = stepped aside, 2 = standing on the roof terrace.
 * `wave` (0/1) makes it wave; it always faces the camera and follows the pointer with its head.
 */
export type RobotState = { mode: number; wave: number; scale: number; fx: number; fy: number; fz: number };

const LIME = new THREE.Color("#c8f169");
const { ground: G, floor: F } = BUILDING;
const ROOF = new THREE.Vector3(3.3, G + F * 2 + 0.95, 2.9); // terrace of the penthouse (level 3)

export function Robot({ state, levelY, pointer, onClick, onHead, visible }: {
  state: React.RefObject<RobotState>;
  /** Current vertical offset of the penthouse level (exploded view). */
  levelY: () => number;
  pointer: React.RefObject<{ x: number; y: number }>;
  onClick?: () => void;
  /** Reports the head position in normalised device coordinates for the speech bubble. */
  onHead?: (x: number, y: number, inFront: boolean) => void;
  visible: boolean;
}) {
  const { camera } = useThree();
  const root = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  const eyes = useRef<THREE.Group>(null);
  const handL = useRef<THREE.Mesh>(null);
  const handR = useRef<THREE.Mesh>(null);
  const ring = useRef<THREE.Mesh>(null);
  const tmp = useMemo(() => ({ a: new THREE.Vector3(), b: new THREE.Vector3(), c: new THREE.Vector3(), q: new THREE.Quaternion(), fwd: new THREE.Vector3(), right: new THREE.Vector3(), up: new THREE.Vector3(), headW: new THREE.Vector3() }), []);
  const mats = useMemo(() => ({
    shell: new THREE.MeshPhysicalMaterial({ color: "#f4f8f6", roughness: 0.16, metalness: 0.05, clearcoat: 1, clearcoatRoughness: 0.06, fog: false }),
    visor: new THREE.MeshPhysicalMaterial({ color: "#020d0b", roughness: 0.05, metalness: 0.3, clearcoat: 1, clearcoatRoughness: 0.02, fog: false }),
    glow: new THREE.MeshBasicMaterial({ color: LIME.clone().multiplyScalar(1.6), toneMapped: false, fog: false }),
    dark: new THREE.MeshStandardMaterial({ color: "#0d2a25", roughness: 0.4, metalness: 0.5, fog: false }),
  }), []);

  useFrame(({ clock }) => {
    const g = root.current, s = state.current;
    if (!g || !s) return;
    const t = clock.elapsedTime;
    // Camera-relative anchors (front, aside) and the world anchor on the roof.
    camera.getWorldDirection(tmp.fwd);
    tmp.right.crossVectors(tmp.fwd, camera.up).normalize();
    tmp.up.crossVectors(tmp.right, tmp.fwd).normalize();
    const anchor = (x: number, y: number, z: number, out: THREE.Vector3) => out.copy(camera.position).addScaledVector(tmp.right, x).addScaledVector(tmp.up, y).addScaledVector(tmp.fwd, z);
    anchor(s.fx, s.fy, s.fz, tmp.a);
    anchor(-4.6, -1.8, 13, tmp.b);
    tmp.c.copy(ROOF).setY(ROOF.y + levelY());
    const m = s.mode;
    if (m <= 1) g.position.lerpVectors(tmp.a, tmp.b, THREE.MathUtils.smoothstep(m, 0, 1));
    else g.position.lerpVectors(tmp.b, tmp.c, THREE.MathUtils.smoothstep(m - 1, 0, 1));
    g.position.y += Math.sin(t * 1.6) * 0.12; // hover
    g.scale.setScalar(s.scale);
    // Face the camera, head follows the pointer a little.
    g.quaternion.copy(camera.quaternion);
    if (head.current) {
      head.current.rotation.y = THREE.MathUtils.lerp(head.current.rotation.y, (pointer.current?.x ?? 0) * 0.45, 0.08);
      head.current.rotation.x = THREE.MathUtils.lerp(head.current.rotation.x, -(pointer.current?.y ?? 0) * 0.3, 0.08);
      head.current.rotation.z = Math.sin(t * 0.9) * 0.04;
    }
    // Blink every few seconds.
    if (eyes.current) { const b = (t % 3.8) < 0.12 ? 0.1 : 1; eyes.current.scale.y = THREE.MathUtils.lerp(eyes.current.scale.y, b, 0.5); }
    if (handL.current) handL.current.position.y = -0.95 + Math.sin(t * 1.6 + 1) * 0.08;
    if (handR.current) {
      const w = s.wave;
      handR.current.position.set(0.98 + w * 0.15, -0.95 + w * (1.25 + Math.sin(t * 9) * 0.12) + Math.sin(t * 1.6 + 2) * 0.08, w * 0.2);
    }
    if (ring.current) { const k = 1 + Math.sin(t * 3) * 0.08; ring.current.scale.set(k, k, k); }
    if (onHead && head.current) {
      head.current.getWorldPosition(tmp.headW).project(camera);
      onHead(tmp.headW.x, tmp.headW.y, tmp.headW.z < 1);
    }
  });

  return (
    <group ref={root} visible={visible} onClick={onClick ? (e) => { e.stopPropagation(); onClick(); } : undefined}
      onPointerOver={onClick ? () => { document.body.style.cursor = "pointer"; } : undefined} onPointerOut={onClick ? () => { document.body.style.cursor = ""; } : undefined}>
      {/* Own key and rim light so the robot reads crisp and bright against the dark scene. */}
      <pointLight position={[1.2, 1.8, 2.4]} intensity={9} distance={6} decay={2} color="#ffffff" />
      <pointLight position={[-1.6, 1.2, -1.4]} intensity={5} distance={5} decay={2} color="#c8f169" />
      <group ref={head} position={[0, 0.55, 0]}>
        <RoundedBox args={[1.6, 1.15, 1.15]} radius={0.38} smoothness={5} material={mats.shell} castShadow />
        <RoundedBox args={[1.3, 0.62, 0.2]} radius={0.22} smoothness={4} position={[0, 0.02, 0.52]} material={mats.visor} />
        <group ref={eyes} position={[0, 0.04, 0.64]}>
          <mesh position={[-0.3, 0, 0]} material={mats.glow}><capsuleGeometry args={[0.075, 0.16, 4, 12]} /></mesh>
          <mesh position={[0.3, 0, 0]} material={mats.glow}><capsuleGeometry args={[0.075, 0.16, 4, 12]} /></mesh>
        </group>
        <mesh position={[0, 0.72, 0]} material={mats.dark}><cylinderGeometry args={[0.03, 0.03, 0.32, 8]} /></mesh>
        <mesh position={[0, 0.92, 0]} material={mats.glow}><sphereGeometry args={[0.09, 16, 16]} /></mesh>
        <mesh position={[-0.82, 0, 0]} rotation-z={Math.PI / 2} material={mats.dark}><cylinderGeometry args={[0.16, 0.16, 0.12, 20]} /></mesh>
        <mesh position={[0.82, 0, 0]} rotation-z={Math.PI / 2} material={mats.dark}><cylinderGeometry args={[0.16, 0.16, 0.12, 20]} /></mesh>
      </group>
      <mesh position={[0, -0.55, 0]} material={mats.shell} castShadow><capsuleGeometry args={[0.5, 0.45, 8, 20]} /></mesh>
      <mesh position={[0, -0.42, 0]} rotation-x={Math.PI / 2} material={mats.glow}><torusGeometry args={[0.52, 0.025, 8, 40]} /></mesh>
      <mesh ref={handL} position={[-0.98, -0.95, 0]} material={mats.shell}><sphereGeometry args={[0.2, 20, 20]} /></mesh>
      <mesh ref={handR} position={[0.98, -0.95, 0]} material={mats.shell}><sphereGeometry args={[0.2, 20, 20]} /></mesh>
      <mesh ref={ring} position={[0, -1.35, 0]} rotation-x={Math.PI / 2} material={mats.glow}><torusGeometry args={[0.3, 0.03, 8, 32]} /></mesh>
    </group>
  );
}
