import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { HDRLoader } from "three/addons/loaders/HDRLoader.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import type { MasonryType } from "./masonry";
import type { WorldPhase } from "./world-state";

type Position = [number, number, number];
type Interactable = "door" | "wall";
type Pose = { position: Position; target: Position; door: number };
const outside: Pose = { position: [5.6, 2.8, 13], target: [-.6, 1.62, 1.9], door: 0 };
const portal: Pose = { position: [1.25, 1.72, 8.55], target: [0, 1.58, 2.12], door: 0 };
const house: Pose = { position: [.72, 1.65, .18], target: [-1.48, 1.46, -4.4], door: 1.59 };
const masonry: Pose = { position: [-.77, 1.59, -1.53], target: [-3.65, 1.54, -2.05], door: 1.59 };
const presets: Partial<Record<WorldPhase, Pose>> = {
  approaching: portal, portal, opening: { ...portal, door: 1.59 }, entering: house, house, focusing: masonry, masonry,
};
const duration: Partial<Record<WorldPhase, number>> = { approaching: 1750, opening: 1100, entering: 1950, focusing: 1050 };
const masonryRepeat: Record<MasonryType, [number, number]> = {
  clay: [4.4, 2.1], hollow: [3.6, 1.75], reclaimed: [3.6, 1.75], block: [4.4, 1.97],
};

export function createWorld(host: HTMLDivElement, callbacks: {
  hit: (target: Interactable) => void;
  unavailable: () => void;
}) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "low-power" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.shadowMap.autoUpdate = false;
  renderer.shadowMap.needsUpdate = true;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#56665f");
  scene.fog = new THREE.FogExp2("#a89683", .012);
  const camera = new THREE.PerspectiveCamera(52, 1, .07, 70);
  const target = new THREE.Vector3(...outside.target);
  camera.position.set(...outside.position);
  let stopped = false;
  const ownedTextures = new Set<THREE.Texture>();
  const loader = new THREE.TextureLoader();
  function finish(name: string, repeat: [number, number]) {
    const pending: Promise<boolean>[] = [];
    function load(channel: "color" | "normal") {
      let settle!: (loaded: boolean) => void;
      pending.push(new Promise((resolve) => { settle = resolve; }));
      const map = loader.load(`/world/${name}-${channel}.webp`, () => {
        settle(true);
        if (!stopped) render();
      }, undefined, () => settle(false));
      map.wrapS = map.wrapT = THREE.RepeatWrapping;
      map.repeat.set(...repeat);
      map.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
      map.colorSpace = channel === "color" ? THREE.SRGBColorSpace : THREE.NoColorSpace;
      ownedTextures.add(map);
      return map;
    }
    const maps = { map: load("color"), normalMap: load("normal") };
    return { maps, ready: Promise.all(pending).then((channels) => channels.every(Boolean)) };
  }
  new HDRLoader().load("/world/sunset.hdr", (sky) => {
    if (stopped) { sky.dispose(); return; }
    ownedTextures.add(sky);
    sky.mapping = THREE.EquirectangularReflectionMapping;
    scene.background = scene.environment = sky;
    scene.backgroundIntensity = .48;
    scene.environmentIntensity = .32;
    scene.backgroundRotation.y = scene.environmentRotation.y = 1.84;
    render();
  }, undefined, () => {});
  const slab = new THREE.MeshStandardMaterial({ color: "#a19687", roughness: .88 });
  const plaster = new THREE.MeshStandardMaterial({ ...finish("plaster", [1.5, 1.5]).maps, color: "#a9b4bf", roughness: .92 });
  const black = new THREE.MeshStandardMaterial({ color: "#24292a", metalness: .22, roughness: .66 });
  const bronze = new THREE.MeshStandardMaterial({ color: "#b89151", metalness: .72, roughness: .31 });
  const wood = new THREE.MeshStandardMaterial({ ...finish("oak", [3, 3]).maps, color: "#b2a394", roughness: .63 });
  const doorWood = new THREE.MeshStandardMaterial({ ...finish("door", [1, 1]).maps, color: "#ac9780", roughness: .65 });
  doorWood.emissive.set("#f8c581");
  const masonryMaterial = new THREE.MeshStandardMaterial({ color: "#9b725d", roughness: .92, emissive: "#e9bf82", emissiveIntensity: 0 });
  const maps = new Map<MasonryType, ReturnType<typeof finish>>();
  const box = (w: number, h: number, d: number, position: Position, material: THREE.Material, parent: THREE.Object3D = scene) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
    mesh.position.set(...position);
    mesh.castShadow = mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  };
  const easedEdge = (w: number, h: number, d: number, position: Position, material: THREE.Material, parent: THREE.Object3D = scene) => {
    const mesh = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 2, Math.min(h, w, d) * .15), material);
    mesh.position.set(...position);
    mesh.castShadow = mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  };
  const sun = new THREE.DirectionalLight("#ffe0c2", 2.55);
  sun.position.set(9, 7, 6);
  sun.castShadow = true;
  const shadowSize = window.matchMedia("(max-width: 700px)").matches ? 1024 : 2048;
  sun.shadow.mapSize.set(shadowSize, shadowSize);
  Object.assign(sun.shadow.camera, { left: -10, right: 10, top: 10, bottom: -10, far: 30 });
  sun.shadow.normalBias = .016;
  scene.add(sun, new THREE.HemisphereLight("#bfcfe4", "#746657", 1.14));
  const lamp = new THREE.PointLight("#ffdbb8", 23, 11, 2);
  lamp.position.set(.2, 2.75, -2.9);
  scene.add(lamp);

  const earth = new THREE.MeshStandardMaterial({ color: "#585040", roughness: 1 });
  const ivory = new THREE.MeshStandardMaterial({ color: "#b4aa96", roughness: .81 });
  const lightStrip = new THREE.MeshBasicMaterial({ color: "#fff1bb" });
  box(160, .15, 160, [0, -.22, 0], earth);
  box(10.4, .28, 9.85, [0, -.13, -.93], plaster);
  for (let i = 0; i < 11; i++) box(2.28, .07, .51, [0, -.105, 4.3 + i * .62], plaster);
  box(7.55, .08, 7.9, [0, .015, -1.84], wood);
  box(9.55, .23, 8.91, [.46, 3.66, -1.68], plaster);
  box(9.62, .085, 8.95, [.46, 3.53, -1.68], black);
  box(7.46, .04, 7.82, [0, 3.47, -1.89], ivory);
  box(3, 3.45, .32, [-2.31, 1.72, 2.12], plaster);
  box(3, 3.45, .32, [2.31, 1.72, 2.12], plaster);
  for (let i = 0; i < 23; i++) box(.048, 3.42, .16, [1.19 + i * .111, 1.72, 2.35], doorWood);
  box(7.7, .38, .44, [0, 3.25, 2.12], plaster);
  box(2.05, .19, 1.24, [0, 3.08, 2.56], black);
  box(1.78, .025, .021, [0, 2.98, 2.72], lightStrip);
  box(.027, 2.63, .022, [-.735, 1.51, 2.344], lightStrip);
  const entranceLight = new THREE.PointLight("#ffce99", 9, 5.5, 2);
  entranceLight.position.set(0, 2.81, 2.77);
  scene.add(entranceLight);
  // Intersecting courtyard walls frame the entry and cast real shadows across it.
  box(.24, 2.16, 4.7, [-4.24, .95, 4.29], plaster);
  box(3.4, .68, .21, [3.51, .27, 3.82], plaster);
  box(3.44, .065, .26, [3.51, .65, 3.82], black);
  box(.25, 2.93, .46, [-.82, 1.48, 2.12], black);
  box(.25, 2.93, .46, [.82, 1.48, 2.12], black);
  box(1.63, .12, .42, [0, 2.98, 2.12], black);
  box(3.7, 3.55, .24, [-2, 1.78, -5.8], plaster);
  box(4.04, .63, .24, [1.87, .32, -5.8], plaster);
  box(4.04, .48, .24, [1.87, 3.31, -5.8], plaster);
  const wall = box(.25, 3.55, 7.92, [-3.77, 1.78, -1.83], masonryMaterial);
  // Window wall: real openings, mullions, and a transparent interior glazing plane.
  box(.24, .45, 8, [3.77, .23, -1.82], slab);
  box(.24, .45, 8, [3.77, 3.31, -1.82], slab);
  for (let i = 0; i <= 6; i++) box(.23, 2.7, .065, [3.77, 1.79, 2.08 - i * 1.3], black);
  const glass = new THREE.MeshPhysicalMaterial({ color: "#b8d1c5", roughness: .15, transparent: true, opacity: .24, depthWrite: false });
  for (let i = 0; i < 5; i++) box(.075, 2.48, .23, [-.14 + i, 1.84, -5.8], black);
  box(4.02, .08, .29, [1.87, .67, -5.8], black);
  box(4.02, .08, .29, [1.87, 3.04, -5.8], black);
  box(4.02, 2.36, .03, [1.87, 1.85, -5.8], glass).castShadow = false;
  const windows = box(.03, 2.65, 7.67, [3.77, 1.79, -1.85], glass);
  windows.castShadow = false;
  // Full-height millwork and an island give the interior a domestic scale.
  box(2.52, 2.46, .56, [-1.95, 1.28, -5.38], doorWood);
  for (let i = 0; i < 4; i++) {
    box(.012, 2.33, .012, [-2.861 + i * .603, 1.29, -5.093], black);
    box(.027, .18, .034, [-2.62 + i * .603, 1.14, -5.056], bronze);
  }
  box(2.27, .9, .74, [1.23, .51, -4.84], doorWood);
  easedEdge(2.36, .062, .80, [1.23, .988, -4.84], ivory);
  box(1.55, .805, .68, [1.4, .47, -2.93], plaster);
  easedEdge(1.81, .075, .84, [1.4, .91, -2.93], ivory);
  box(.23, 3.39, .23, [3.21, 1.76, -3.9], black);
  box(1.62, .043, .11, [1.4, 2.57, -2.93], black);
  box(1.57, .015, .05, [1.4, 2.54, -2.93], lightStrip);
  for (const x of [.74, 2.06]) box(.011, .89, .011, [x, 3.02, -2.93], black);
  const islandLight = new THREE.PointLight("#ffe1b4", 10, 4.15, 2);
  islandLight.position.set(1.4, 2.51, -2.93);
  scene.add(islandLight);
  // A narrow wash reveals relief on the material wall.
  box(.027, .023, 5.75, [-3.43, 3.43, -1.83], lightStrip);
  for (const z of [-4.1, -1.85, .25]) {
    const wash = new THREE.PointLight("#ffe3c8", 7.5, 4.25, 2);
    wash.position.set(-3.32, 3.15, z);
    scene.add(wash);
  }

  const hinge = new THREE.Group();
  hinge.position.set(-.678, .06, 2.15);
  scene.add(hinge);
  const door = box(1.36, 2.84, .11, [.68, 1.42, 0], doorWood, hinge);
  for (let i = 0; i < 9; i++) box(.008, 2.81, .008, [.14 + i * .135, 1.42, .058], black, hinge);
  const handle = easedEdge(.034, .64, .047, [1.17, 1.27, .133], bronze, hinge);
  for (const y of [.99, 1.54]) box(.033, .032, .088, [1.17, y, .092], bronze, hinge);
  box(1.34, .045, .18, [0, .061, 2.13], bronze);
  const planting = new THREE.MeshStandardMaterial({ color: "#777b52", roughness: 1, side: THREE.DoubleSide });
  const blades = new THREE.InstancedMesh(new THREE.ConeGeometry(.055, .46, 3), planting, 2300);
  const place = new THREE.Object3D();
  const wash = new THREE.Color();
  for (let i = 0; i < blades.count; i++) {
    const u = ((i * 761) % 2309) / 2309;
    const v = ((i * 503) % 2297) / 2297;
    const side = i % 2 ? 1 : -1;
    const z = v * 23 - 12;
    place.position.set(side * (u * 12 + (z > 4.1 ? 1.35 : 5.5)), -.095, z);
    place.rotation.set(u * .55 - .27, v * 7, u * .74 - .37);
    place.scale.setScalar(.2 + v * .82);
    place.updateMatrix();
    blades.setMatrixAt(i, place.matrix);
    blades.setColorAt(i, wash.setHSL(.095 + u * .09, .12 + v * .26, .36 + u * .26));
  }
  blades.receiveShadow = true;
  scene.add(blades);
  const modelLoader = new GLTFLoader();
  function furnish(name: string, position: Position, turn: number, scale = 1) {
    modelLoader.load(`/world/${name}/model.gltf`, ({ scene: model }) => {
      model.traverse((object) => {
        if (!(object instanceof THREE.Mesh)) return;
        object.castShadow = object.receiveShadow = true;
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        for (const material of materials) {
          for (const value of Object.values(material)) if (value instanceof THREE.Texture) {
            if (stopped) value.dispose();
            else ownedTextures.add(value);
          }
          if (stopped) material.dispose();
        }
        if (stopped) object.geometry.dispose();
      });
      if (stopped) return;
      model.position.set(...position);
      model.rotation.y = turn;
      model.scale.setScalar(scale);
      scene.add(model);
      renderer.shadowMap.needsUpdate = true;
      render();
    }, undefined, () => {});
  }
  furnish("wooden_stool_01", [.19, .057, -3.04], -.28);
  furnish("potted_plant_04", [1.94, .949, -3.01], .3, 1.65);

  let phase: WorldPhase = "intro";
  let selectedSurface: Interactable | null = null;
  let frame = 0;
  let requestedMasonry: MasonryType | undefined;
  function render() { camera.lookAt(target); renderer.render(scene, camera); }
  const resize = () => {
    const { clientWidth, clientHeight } = host;
    if (!clientWidth || !clientHeight) return;
    camera.aspect = clientWidth / clientHeight;
    camera.fov = camera.aspect < .8 ? 63 : 48;
    camera.updateProjectionMatrix();
    renderer.setSize(clientWidth, clientHeight);
    render();
  };
  const observer = new ResizeObserver(resize);
  function setMaterial(kind: MasonryType) {
    requestedMasonry = kind;
    let material = maps.get(kind);
    if (!material) {
      material = finish(kind, masonryRepeat[kind]);
      maps.set(kind, material);
    }
    const { maps: selected, ready } = material;
    void ready.then((loaded) => {
      if (!loaded || stopped || requestedMasonry !== kind) return;
      masonryMaterial.map = selected.map;
      masonryMaterial.normalMap = selected.normalMap;
      masonryMaterial.color.set("#ffffff");
      masonryMaterial.normalScale.setScalar(.83);
      masonryMaterial.needsUpdate = true;
      render();
      renderer.domElement.dataset.masonry = kind;
    });
  }

  function travel(next: WorldPhase, reducedMotion: boolean, done: () => void) {
    phase = next;
    selectedSurface = null;
    doorWood.emissiveIntensity = 0;
    renderer.domElement.style.cursor = "";
    cancelAnimationFrame(frame);
    const destination = presets[next] ?? outside;
    const startPosition = camera.position.clone();
    const startTarget = target.clone();
    const endPosition = new THREE.Vector3(...destination.position);
    const endTarget = new THREE.Vector3(...destination.target);
    if ((next === "house" || next === "entering") && camera.aspect < .8) endTarget.x -= .92;
    const startDoor = hinge.rotation.y;
    const length = reducedMotion ? 0 : duration[next] ?? 0;
    const start = performance.now();
    function tick(now: number) {
      const progress = length ? Math.min((now - start) / length, 1) : 1;
      const eased = progress * progress * (3 - 2 * progress);
      camera.position.lerpVectors(startPosition, endPosition, eased);
      if (next === "entering") camera.position.x -= Math.sin(Math.PI * eased) ** 2 * 1.28;
      target.lerpVectors(startTarget, endTarget, eased);
      if (hinge.rotation.y !== destination.door) renderer.shadowMap.needsUpdate = true;
      hinge.rotation.y = startDoor + (destination.door - startDoor) * eased;
      masonryMaterial.emissiveIntensity = next === "focusing" ? eased * .07 : next === "masonry" ? .07 : 0;
      render();
      if (progress < 1) frame = requestAnimationFrame(tick);
      else done();
    }
    frame = requestAnimationFrame(tick);
  }

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  function findHit(event: PointerEvent): Interactable | null {
    if (phase !== "portal" && phase !== "house") return null;
    const bounds = renderer.domElement.getBoundingClientRect();
    pointer.set((event.clientX - bounds.left) * 2 / bounds.width - 1, 1 - (event.clientY - bounds.top) * 2 / bounds.height);
    raycaster.setFromCamera(pointer, camera);
    const matches = raycaster.intersectObjects(phase === "portal" ? [door, handle] : [wall], false);
    return matches.length ? (phase === "portal" ? "door" : "wall") : null;
  }
  const hover = (event: PointerEvent) => {
    const hit = findHit(event);
    renderer.domElement.style.cursor = hit ? "pointer" : "";
    highlight(hit);
  };
  function highlight(hit: Interactable | null) {
    if (hit === selectedSurface) return;
    selectedSurface = hit;
    if (phase === "portal") doorWood.emissiveIntensity = hit === "door" ? .085 : 0;
    if (phase === "house") masonryMaterial.emissiveIntensity = hit === "wall" ? .085 : 0;
    render();
  }
  const reset = () => {
    renderer.domElement.style.cursor = "";
    highlight(null);
  };
  const click = (event: PointerEvent) => {
    if (event.button !== 0) return;
    const hit = findHit(event);
    if (hit) callbacks.hit(hit);
  };
  const lost = (event: Event) => { event.preventDefault(); callbacks.unavailable(); };
  renderer.domElement.setAttribute("aria-hidden", "true");
  renderer.domElement.addEventListener("pointermove", hover);
  renderer.domElement.addEventListener("pointerleave", reset);
  renderer.domElement.addEventListener("pointerup", click);
  renderer.domElement.addEventListener("webglcontextlost", lost);
  host.appendChild(renderer.domElement);
  observer.observe(host);
  resize();
  setMaterial("clay");
  return {
    travel, setMaterial, highlight,
    dispose() {
      if (stopped) return;
      stopped = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      const materials = new Set<THREE.Material>();
      scene.traverse((item) => {
        if (!(item instanceof THREE.Mesh)) return;
        item.geometry.dispose();
        for (const material of Array.isArray(item.material) ? item.material : [item.material]) {
          if (material instanceof THREE.Material) materials.add(material);
        }
      });
      materials.add(wood);
      materials.add(bronze);
      materials.forEach((material) => material.dispose());
      ownedTextures.forEach((map) => map.dispose());
      sun.shadow.map?.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
