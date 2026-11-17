import * as THREE from "three";

/** Building dimensions in metres. Shared by the scene, camera rig and later the interior (Faza D). */
export const BUILDING = {
  width: 8,
  depth: 6,
  ground: 3.2,
  floor: 2.8,
  floors: 3,
  get roof() { return this.ground + this.floor * this.floors; },
  door: { width: 1.2, height: 2.3 },
} as const;

type Seg = [number, number, number, number, number, number];

function box(out: Seg[], cx: number, y0: number, cz: number, w: number, h: number, d: number) {
  const x0 = cx - w / 2, x1 = cx + w / 2, z0 = cz - d / 2, z1 = cz + d / 2, y1 = y0 + h;
  for (const y of [y0, y1]) out.push([x0, y, z0, x1, y, z0], [x1, y, z0, x1, y, z1], [x1, y, z1, x0, y, z1], [x0, y, z1, x0, y, z0]);
  for (const [x, z] of [[x0, z0], [x1, z0], [x1, z1], [x0, z1]]) out.push([x, y0, z, x, y1, z]);
}

function mullions(out: Seg[], cx: number, y0: number, cz: number, w: number, h: number, d: number, step: number, skip?: (x: number) => boolean) {
  const x0 = cx - w / 2, z0 = cz - d / 2, z1 = cz + d / 2;
  for (let x = x0 + step; x < x0 + w - 0.01; x += step) {
    if (!skip?.(x)) out.push([x, y0, z1, x, y0 + h, z1]);
    out.push([x, y0, z0, x, y0 + h, z0]);
  }
  for (let z = z0 + step; z < z1 - 0.01; z += step) {
    out.push([x0, y0, z, x0, y0 + h, z], [x0 + w, y0, z, x0 + w, y0 + h, z]);
  }
  // Sill and transom lines give each floor a curtain-wall rhythm.
  const sill = y0 + 0.9;
  out.push([x0, sill, z1, x0 + w, sill, z1], [x0, sill, z0, x0 + w, sill, z0], [x0, sill, z0, x0, sill, z1], [x0 + w, sill, z0, x0 + w, sill, z1]);
}

/** Wireframe of a modern four-storey building with cantilevered upper floors and a set-back penthouse. */
export function buildingSegments(): Float32Array {
  const s: Seg[] = [];
  const { width: W, depth: D, ground: G, floor: F } = BUILDING;
  const halfDoor = BUILDING.door.width / 2 + 0.05;

  box(s, 0, 0, 0, W, G, D);
  mullions(s, 0, 0, 0, W, G, D, 1.333, (x) => Math.abs(x) < halfDoor + 0.2);
  // Canopy over the entrance.
  box(s, 0, G - 0.35, D / 2 + 0.7, 2.6, 0.12, 1.4);

  box(s, 0.25, G, 0.2, W + 0.6, F * 2, D + 0.5);
  mullions(s, 0.25, G, 0.2, W + 0.6, F, D + 0.5, 0.95);
  mullions(s, 0.25, G + F, 0.2, W + 0.6, F, D + 0.5, 0.95);
  box(s, 0.25, G + F - 0.05, 0.2, W + 0.6, 0.1, D + 0.5);

  box(s, -0.9, G + F * 2, -0.3, W - 2.4, F, D - 1);
  mullions(s, -0.9, G + F * 2, -0.3, W - 2.4, F, D - 1, 1.1);
  // Roof terrace railing on the set-back.
  box(s, 2.9, G + F * 2, 0.2, 2.4, 1.0, D + 0.5);

  return Float32Array.from(s.flat());
}

/** Translucent volumes behind the lines so the far side reads as depth, not clutter. */
export const volumes: { position: [number, number, number]; size: [number, number, number] }[] = [
  { position: [0, BUILDING.ground / 2, 0], size: [BUILDING.width, BUILDING.ground, BUILDING.depth] },
  { position: [0.25, BUILDING.ground + BUILDING.floor, 0.2], size: [BUILDING.width + 0.6, BUILDING.floor * 2, BUILDING.depth + 0.5] },
  { position: [-0.9, BUILDING.ground + BUILDING.floor * 2.5, -0.3], size: [BUILDING.width - 2.4, BUILDING.floor, BUILDING.depth - 1] },
];

function mulberry32(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A branching "data tree" growing from the roof. Segments are ordered breadth-first so a draw range can grow it. */
export function dataTree(base: THREE.Vector3, depth: number, seed = 7) {
  const rand = mulberry32(seed);
  const levels: number[][][] = [];
  const tips: number[] = [];
  const up = new THREE.Vector3(0, 1, 0);

  function grow(start: THREE.Vector3, dir: THREE.Vector3, length: number, level: number) {
    const end = start.clone().addScaledVector(dir, length);
    (levels[level] ??= []).push([start.x, start.y, start.z, end.x, end.y, end.z]);
    if (level >= depth) { tips.push(end.x, end.y, end.z); return; }
    const children = level < 2 ? 3 : 2;
    for (let i = 0; i < children; i++) {
      const yaw = (i / children) * Math.PI * 2 + rand() * 1.2 + level;
      const pitch = 0.35 + rand() * 0.45;
      const child = new THREE.Vector3(Math.cos(yaw) * Math.sin(pitch), Math.cos(pitch), Math.sin(yaw) * Math.sin(pitch));
      child.lerp(up, 0.25 + level * 0.04).normalize();
      grow(end, child, length * (0.68 + rand() * 0.12), level + 1);
    }
  }

  grow(base, up, 1.5, 0);
  return { segments: Float32Array.from(levels.flat(2)), tips: Float32Array.from(tips) };
}
