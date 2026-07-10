"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

export type SolarTextureKey =
  | "mercury"
  | "venus_atmosphere"
  | "venus_surface"
  | "earth"
  | "earth_night"
  | "moon"
  | "mars"
  | "jupiter"
  | "saturn"
  | "uranus"
  | "neptune"
  | "sun"
  | "stars"
  | "stars_milky_way"
  | "saturn_ring";

export type ScenePlanet = {
  id: string;
  textureKey: SolarTextureKey;
  size: number;
  orbitSize: number;
  duration: number;
  hasRings?: boolean;
  hasMoon?: boolean;
};

type Props = {
  planets: ScenePlanet[];
  paused: boolean;
  timeScale: number;
  showOrbits: boolean;
  showMoons: boolean;
  enableGlow: boolean;
  bgTheme: "stars" | "stars_milky_way";
  onPlanetSelect: (id: string) => void;
  onSunSelect: () => void;
  onCanvasReady: (canvas: HTMLCanvasElement | null) => void;
  isExporting?: boolean;
  onLoaded?: () => void;
};

type RingKind = "saturn" | "uranus" | "generic";

type PlanetNode = {
  orbit: THREE.Group;
  orbitLine: THREE.LineLoop;
  carrier: THREE.Group;
  body: THREE.Mesh<THREE.SphereGeometry, THREE.MeshStandardMaterial>;
  glow: THREE.Sprite;
  ring: THREE.Mesh<THREE.RingGeometry, THREE.MeshBasicMaterial>;
  moonOrbit: THREE.Group;
  moon: THREE.Mesh<THREE.SphereGeometry, THREE.MeshStandardMaterial>;
  angle: number;
  duration: number;
  spin: number;
  ringKind: RingKind;
};

const WORLD_HALF_SIZE = 450;
const MAX_PIXEL_RATIO = 1.75;
const TWO_PI = Math.PI * 2;

const textureUrls: Record<SolarTextureKey, string> = {
  mercury: "/solar-system/2k_mercury.jpg",
  venus_atmosphere: "/solar-system/2k_venus_atmosphere.jpg",
  venus_surface: "/solar-system/2k_venus_surface.jpg",
  earth: "/solar-system/2k_earth_daymap.jpg",
  earth_night: "/solar-system/2k_earth_nightmap.jpg",
  moon: "/solar-system/2k_moon.jpg",
  mars: "/solar-system/2k_mars.jpg",
  jupiter: "/solar-system/2k_jupiter.jpg",
  saturn: "/solar-system/2k_saturn.jpg",
  uranus: "/solar-system/2k_uranus.jpg",
  neptune: "/solar-system/2k_neptune.jpg",
  sun: "/solar-system/2k_sun.jpg",
  stars: "/solar-system/2k_stars.jpg",
  stars_milky_way: "/solar-system/2k_stars_milky_way.jpg",
  saturn_ring: "/solar-system/2k_saturn_ring_alpha.png",
};

function finiteOr(value: number, fallback: number) {
  return Number.isFinite(value) ? value : fallback;
}

function planetSpin(textureKey: SolarTextureKey) {
  if (textureKey === "jupiter") return 0.78;
  if (textureKey === "saturn") return 0.62;
  if (textureKey === "venus_atmosphere") return -0.22;
  if (textureKey === "venus_surface") return -0.12;
  if (textureKey === "uranus") return -0.3;
  return 0.38;
}

function ringKindFor(textureKey: SolarTextureKey): RingKind {
  if (textureKey === "saturn") return "saturn";
  if (textureKey === "uranus") return "uranus";
  return "generic";
}

function stableStartingAngle(id: string) {
  let hash = 2166136261;

  for (let index = 0; index < id.length; index += 1) {
    hash ^= id.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return ((hash >>> 0) / 4294967295) * TWO_PI;
}

function createGlowTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;

  const context = canvas.getContext("2d");

  if (context) {
    const gradient = context.createRadialGradient(128, 128, 0, 128, 128, 128);
    gradient.addColorStop(0, "rgba(255,255,255,0.9)");
    gradient.addColorStop(0.08, "rgba(255,255,255,0.55)");
    gradient.addColorStop(0.3, "rgba(255,255,255,0.14)");
    gradient.addColorStop(1, "rgba(255,255,255,0)");
    context.fillStyle = gradient;
    context.fillRect(0, 0, canvas.width, canvas.height);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createRingTexture(kind: RingKind) {
  const canvas = document.createElement("canvas");
  canvas.width = 8;
  canvas.height = 512;

  const context = canvas.getContext("2d");

  if (context) {
    const bands = context.createLinearGradient(0, 0, 0, canvas.height);

    if (kind === "saturn") {
      bands.addColorStop(0, "rgba(224,205,167,0)");
      bands.addColorStop(0.08, "rgba(224,205,167,0.24)");
      bands.addColorStop(0.2, "rgba(224,205,167,0.78)");
      bands.addColorStop(0.34, "rgba(168,132,94,0.35)");
      bands.addColorStop(0.42, "rgba(224,205,167,0)");
      bands.addColorStop(0.5, "rgba(224,205,167,0.62)");
      bands.addColorStop(0.72, "rgba(199,165,117,0.5)");
      bands.addColorStop(0.92, "rgba(224,205,167,0.18)");
      bands.addColorStop(1, "rgba(224,205,167,0)");
    } else if (kind === "uranus") {
      bands.addColorStop(0, "rgba(173,216,230,0)");
      bands.addColorStop(0.38, "rgba(173,216,230,0)");
      bands.addColorStop(0.48, "rgba(173,216,230,0.13)");
      bands.addColorStop(0.56, "rgba(173,216,230,0.58)");
      bands.addColorStop(0.66, "rgba(173,216,230,0.12)");
      bands.addColorStop(0.74, "rgba(173,216,230,0)");
      bands.addColorStop(1, "rgba(173,216,230,0)");
    } else {
      bands.addColorStop(0, "rgba(255,255,255,0)");
      bands.addColorStop(0.32, "rgba(255,255,255,0)");
      bands.addColorStop(0.45, "rgba(255,255,255,0.55)");
      bands.addColorStop(0.58, "rgba(255,255,255,0.2)");
      bands.addColorStop(0.72, "rgba(255,255,255,0)");
      bands.addColorStop(1, "rgba(255,255,255,0)");
    }

    context.fillStyle = bands;
    context.fillRect(0, 0, canvas.width, canvas.height);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

function createRingGeometry(kind: RingKind) {
  const inner = kind === "saturn" ? 1.06 : kind === "uranus" ? 1.18 : 1.1;
  const outer = kind === "saturn" ? 1.9 : kind === "uranus" ? 1.36 : 1.7;
  const geometry = new THREE.RingGeometry(inner, outer, 128, 1);
  const positions = geometry.attributes.position;
  const uvs = geometry.attributes.uv;

  for (let index = 0; index < positions.count; index += 1) {
    const x = positions.getX(index);
    const y = positions.getY(index);
    const radius = Math.sqrt(x * x + y * y);
    const angle = Math.atan2(y, x);
    const u = (angle + Math.PI) / TWO_PI;
    const v = THREE.MathUtils.clamp((radius - inner) / (outer - inner), 0, 1);
    uvs.setXY(index, u, v);
  }

  uvs.needsUpdate = true;
  return geometry;
}

export function ThreeSolarSystem({
  planets,
  paused,
  timeScale,
  showOrbits,
  showMoons,
  enableGlow,
  bgTheme,
  onPlanetSelect,
  onSunSelect,
  onCanvasReady,
  isExporting = false,
  onLoaded,
}: Props) {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRevisionRef = useRef(0);
  const propsRef = useRef({
    planets,
    paused,
    timeScale,
    showOrbits,
    showMoons,
    enableGlow,
    bgTheme,
    onPlanetSelect,
    onSunSelect,
    onCanvasReady,
    isExporting,
    onLoaded,
  });

  propsRef.current = {
    planets,
    paused,
    timeScale,
    showOrbits,
    showMoons,
    enableGlow,
    bgTheme,
    onPlanetSelect,
    onSunSelect,
    onCanvasReady,
    isExporting,
    onLoaded,
  };

  useEffect(() => {
    sceneRevisionRef.current += 1;
  }, [planets, showOrbits, showMoons, enableGlow, bgTheme, isExporting]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(
      -WORLD_HALF_SIZE,
      WORLD_HALF_SIZE,
      WORLD_HALF_SIZE,
      -WORLD_HALF_SIZE,
      1,
      2000,
    );
    camera.position.set(0, 0, 900);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true,
      powerPreference: "high-performance",
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, MAX_PIXEL_RATIO));
    renderer.domElement.className =
      "block h-full w-full cursor-crosshair touch-manipulation";
    renderer.domElement.setAttribute("role", "img");
    renderer.domElement.setAttribute(
      "aria-label",
      "Interactive three-dimensional solar system",
    );
    mount.appendChild(renderer.domElement);
    propsRef.current.onCanvasReady(renderer.domElement);

    const staticRoot = new THREE.Group();
    const planetRoot = new THREE.Group();
    scene.add(staticRoot, planetRoot);

    let needsRender = true;
    let texturesLoaded = false;
    let hasRenderedFirstFrame = false;

    const loadingManager = new THREE.LoadingManager();
    loadingManager.onLoad = () => {
      texturesLoaded = true;
      needsRender = true;
    };

    const loadTimeout = setTimeout(() => {
      texturesLoaded = true;
      needsRender = true;
    }, 2500);

    const textureLoader = new THREE.TextureLoader(loadingManager);
    const textureCache = new Map<SolarTextureKey, THREE.Texture>();
    const planetMaterialCache = new Map<
      SolarTextureKey,
      THREE.MeshStandardMaterial
    >();
    const ringTextureCache = new Map<RingKind, THREE.CanvasTexture>();
    const ringGeometryCache = new Map<RingKind, THREE.RingGeometry>();
    const ringMaterialCache = new Map<RingKind, THREE.MeshBasicMaterial>();
    const planetNodes = new Map<string, PlanetNode>();
    const pickables = new Set<THREE.Object3D>();

    const getTexture = (key: SolarTextureKey) => {
      const cached = textureCache.get(key);
      if (cached) return cached;

      const texture = textureLoader.load(textureUrls[key], () => {
        needsRender = true;
      });
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.ClampToEdgeWrapping;
      texture.anisotropy = Math.min(
        8,
        renderer.capabilities.getMaxAnisotropy(),
      );
      textureCache.set(key, texture);
      return texture;
    };

    const getPlanetMaterial = (key: SolarTextureKey) => {
      const cached = planetMaterialCache.get(key);
      if (cached) return cached;

      const material = new THREE.MeshStandardMaterial({
        map: getTexture(key),
        roughness: 0.92,
        metalness: 0,
      });
      planetMaterialCache.set(key, material);
      return material;
    };

    const getRingTexture = (kind: RingKind) => {
      const cached = ringTextureCache.get(kind);
      if (cached) return cached;

      const texture = createRingTexture(kind);
      texture.anisotropy = Math.min(
        4,
        renderer.capabilities.getMaxAnisotropy(),
      );
      ringTextureCache.set(kind, texture);
      return texture;
    };

    const getRingGeometry = (kind: RingKind) => {
      const cached = ringGeometryCache.get(kind);
      if (cached) return cached;

      const geometry = createRingGeometry(kind);
      ringGeometryCache.set(kind, geometry);
      return geometry;
    };

    const getRingMaterial = (kind: RingKind) => {
      const cached = ringMaterialCache.get(kind);
      if (cached) return cached;

      const material = new THREE.MeshBasicMaterial({
        map: getRingTexture(kind),
        transparent: true,
        opacity: 0.9,
        alphaTest: 0.03,
        side: THREE.DoubleSide,
        depthWrite: true,
      });
      ringMaterialCache.set(kind, material);
      return material;
    };

    const backgroundGeometry = new THREE.PlaneGeometry(1, 1);
    const backgroundMaterial = new THREE.MeshBasicMaterial({
      map: getTexture(propsRef.current.bgTheme),
      depthWrite: false,
    });
    const background = new THREE.Mesh(backgroundGeometry, backgroundMaterial);
    background.position.z = -100;
    background.renderOrder = -2;
    staticRoot.add(background);

    const shadeMaterial = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.4,
      depthWrite: false,
    });
    const shade = new THREE.Mesh(backgroundGeometry, shadeMaterial);
    shade.position.z = -99;
    shade.renderOrder = -1;
    staticRoot.add(shade);

    const glowTexture = createGlowTexture();
    const sunGlowMaterial = new THREE.SpriteMaterial({
      map: glowTexture,
      color: 0xffa21f,
      transparent: true,
      opacity: 0.95,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const planetGlowMaterial = new THREE.SpriteMaterial({
      map: glowTexture,
      color: 0x9ab7ff,
      transparent: true,
      opacity: 0.12,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const sunGeometry = new THREE.SphereGeometry(48, 48, 32);
    const sunMaterial = new THREE.MeshStandardMaterial({
      map: getTexture("sun"),
      emissive: 0xff8a16,
      emissiveMap: getTexture("sun"),
      emissiveIntensity: 0.78,
      roughness: 0.82,
      metalness: 0,
    });
    const sun = new THREE.Mesh(sunGeometry, sunMaterial);
    sun.userData = { kind: "sun" };
    staticRoot.add(sun);
    pickables.add(sun);

    const sunGlow = new THREE.Sprite(sunGlowMaterial);
    sunGlow.scale.set(230, 230, 1);
    sunGlow.position.z = -2;
    staticRoot.add(sunGlow);

    const sunLight = new THREE.PointLight(0xffe0ac, 2.8, 0, 0);
    sunLight.position.set(0, 0, 140);
    staticRoot.add(sunLight);

    const fillLight = new THREE.DirectionalLight(0xffffff, 0.18);
    fillLight.position.set(-220, 260, 380);
    staticRoot.add(fillLight);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.34);
    staticRoot.add(ambientLight);

    const planetGeometry = new THREE.SphereGeometry(1, 40, 24);
    const orbitPoints = Array.from({ length: 129 }, (_, index) => {
      const angle = (index / 128) * TWO_PI;
      return new THREE.Vector3(Math.cos(angle), Math.sin(angle), 0);
    });
    const orbitGeometry = new THREE.BufferGeometry().setFromPoints(orbitPoints);
    const orbitMaterial = new THREE.LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.13,
      depthWrite: false,
    });

    const createPlanetNode = (planet: ScenePlanet) => {
      const ringKind = ringKindFor(planet.textureKey);
      const orbit = new THREE.Group();
      const orbitLine = new THREE.LineLoop(orbitGeometry, orbitMaterial);
      const carrier = new THREE.Group();
      const body = new THREE.Mesh(
        planetGeometry,
        getPlanetMaterial(planet.textureKey),
      );
      const glow = new THREE.Sprite(planetGlowMaterial);
      const ring = new THREE.Mesh(
        getRingGeometry(ringKind),
        getRingMaterial(ringKind),
      );
      const moonOrbit = new THREE.Group();
      const moon = new THREE.Mesh(planetGeometry, getPlanetMaterial("moon"));

      body.userData = { kind: "planet", id: planet.id };
      glow.position.z = -2;
      ring.rotation.set(
        THREE.MathUtils.degToRad(72),
        THREE.MathUtils.degToRad(12),
        0,
      );
      moon.scale.setScalar(2.6);
      moon.userData = { kind: "moon" };

      moonOrbit.add(moon);
      carrier.add(body, glow, ring, moonOrbit);
      orbit.add(orbitLine, carrier);
      planetRoot.add(orbit);
      pickables.add(body);

      const node: PlanetNode = {
        orbit,
        orbitLine,
        carrier,
        body,
        glow,
        ring,
        moonOrbit,
        moon,
        angle: stableStartingAngle(planet.id),
        duration: Math.max(0.1, finiteOr(planet.duration, 1)),
        spin: planetSpin(planet.textureKey),
        ringKind,
      };

      planetNodes.set(planet.id, node);
      return node;
    };

    const updatePlanetNode = (
      node: PlanetNode,
      planet: ScenePlanet,
      current: typeof propsRef.current,
    ) => {
      const radius = Math.max(3, finiteOr(planet.size, 6) / 2);
      const orbitRadius = Math.max(0, finiteOr(planet.orbitSize, 0) / 2);
      const nextRingKind = ringKindFor(planet.textureKey);

      node.duration = Math.max(0.1, finiteOr(planet.duration, 1));
      node.spin = planetSpin(planet.textureKey);
      node.carrier.position.set(0, orbitRadius, 0);
      node.body.scale.setScalar(radius);
      node.body.material = getPlanetMaterial(planet.textureKey);
      node.body.userData.id = planet.id;
      node.orbitLine.scale.setScalar(orbitRadius);
      node.orbitLine.visible = current.showOrbits && orbitRadius > 0;

      node.glow.scale.set(radius * 4.8, radius * 4.8, 1);
      node.glow.visible = current.enableGlow;

      if (node.ringKind !== nextRingKind) {
        node.ringKind = nextRingKind;
        node.ring.geometry = getRingGeometry(nextRingKind);
        node.ring.material = getRingMaterial(nextRingKind);
      }

      node.ring.scale.setScalar(radius);
      node.ring.visible = Boolean(planet.hasRings);

      node.moon.position.set(0, radius + 11, 0);
      node.moonOrbit.visible = Boolean(planet.hasMoon && current.showMoons);
    };

    const removePlanetNode = (id: string, node: PlanetNode) => {
      pickables.delete(node.body);
      planetRoot.remove(node.orbit);
      node.orbit.clear();
      node.carrier.clear();
      node.moonOrbit.clear();
      planetNodes.delete(id);
    };

    const syncScene = () => {
      const current = propsRef.current;
      const seenIds = new Set<string>();

      background.visible = Boolean(current.isExporting);
      shade.visible = Boolean(current.isExporting);

      backgroundMaterial.map = getTexture(current.bgTheme);
      backgroundMaterial.needsUpdate = true;
      sunGlow.visible = current.enableGlow;

      current.planets.forEach((planet) => {
        if (!planet.id || seenIds.has(planet.id)) return;
        seenIds.add(planet.id);

        const node = planetNodes.get(planet.id) ?? createPlanetNode(planet);
        updatePlanetNode(node, planet, current);
      });

      for (const [id, node] of planetNodes) {
        if (!seenIds.has(id)) removePlanetNode(id, node);
      }
    };

    let visibleWidth = WORLD_HALF_SIZE * 2;
    let visibleHeight = WORLD_HALF_SIZE * 2;

    const resize = () => {
      const width = Math.max(1, mount.clientWidth);
      const height = Math.max(1, mount.clientHeight);
      const aspect = width / height;

      renderer.setPixelRatio(
        Math.min(window.devicePixelRatio, MAX_PIXEL_RATIO),
      );
      renderer.setSize(width, height, false);

      if (aspect >= 1) {
        camera.left = -WORLD_HALF_SIZE * aspect;
        camera.right = WORLD_HALF_SIZE * aspect;
        camera.top = WORLD_HALF_SIZE;
        camera.bottom = -WORLD_HALF_SIZE;
        visibleWidth = WORLD_HALF_SIZE * 2 * aspect;
        visibleHeight = WORLD_HALF_SIZE * 2;
      } else {
        camera.left = -WORLD_HALF_SIZE;
        camera.right = WORLD_HALF_SIZE;
        camera.top = WORLD_HALF_SIZE / aspect;
        camera.bottom = -WORLD_HALF_SIZE / aspect;
        visibleWidth = WORLD_HALF_SIZE * 2;
        visibleHeight = (WORLD_HALF_SIZE * 2) / aspect;
      }

      camera.updateProjectionMatrix();
      background.scale.set(visibleWidth, visibleHeight, 1);
      shade.scale.set(visibleWidth, visibleHeight, 1);
      needsRender = true;
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(mount);
    resize();

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    const handlePointerUp = (event: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);

      const hit = raycaster.intersectObjects(Array.from(pickables), false)[0];
      if (!hit) return;

      if (hit.object.userData.kind === "sun") {
        propsRef.current.onSunSelect();
      } else if (hit.object.userData.kind === "planet") {
        propsRef.current.onPlanetSelect(hit.object.userData.id as string);
      }
    };

    renderer.domElement.addEventListener("pointerup", handlePointerUp);

    const clock = new THREE.Clock();
    let frame = 0;
    let lastSceneRevision = -1;

    const animate = () => {
      frame = requestAnimationFrame(animate);

      if (document.hidden) {
        clock.getDelta();
        return;
      }

      const current = propsRef.current;
      const delta = Math.min(clock.getDelta(), 0.05);

      if (lastSceneRevision !== sceneRevisionRef.current) {
        lastSceneRevision = sceneRevisionRef.current;
        syncScene();
        needsRender = true;
      }

      if (!current.paused) {
        const safeTimeScale = THREE.MathUtils.clamp(
          finiteOr(current.timeScale, 1),
          -100,
          100,
        );
        const scaledDelta = delta * safeTimeScale;

        sun.rotation.y += scaledDelta * 0.12;

        for (const node of planetNodes.values()) {
          node.angle += scaledDelta * (TWO_PI / node.duration);
          node.orbit.rotation.z = node.angle;
          node.body.rotation.y += scaledDelta * node.spin;

          if (node.moonOrbit.visible) {
            node.moonOrbit.rotation.z += scaledDelta * 4.5;
            node.moon.rotation.y += scaledDelta * 0.55;
          }
        }

        needsRender = true;
      }

      if (needsRender) {
        renderer.render(scene, camera);
        needsRender = false;

        if (texturesLoaded && !hasRenderedFirstFrame) {
          hasRenderedFirstFrame = true;
          propsRef.current.onLoaded?.();
        }
      }
    };

    animate();

    return () => {
      clearTimeout(loadTimeout);
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      renderer.domElement.removeEventListener("pointerup", handlePointerUp);
      propsRef.current.onCanvasReady(null);

      for (const [id, node] of planetNodes) {
        removePlanetNode(id, node);
      }

      orbitGeometry.dispose();
      orbitMaterial.dispose();
      planetGeometry.dispose();
      backgroundGeometry.dispose();
      backgroundMaterial.dispose();
      shadeMaterial.dispose();
      sunGeometry.dispose();
      sunMaterial.dispose();
      sunGlowMaterial.dispose();
      planetGlowMaterial.dispose();
      glowTexture.dispose();

      planetMaterialCache.forEach((material) => material.dispose());
      ringMaterialCache.forEach((material) => material.dispose());
      ringGeometryCache.forEach((geometry) => geometry.dispose());
      ringTextureCache.forEach((texture) => texture.dispose());
      textureCache.forEach((texture) => texture.dispose());

      scene.clear();
      renderer.dispose();

      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="h-full w-full overflow-hidden"
      aria-label="Interactive three-dimensional solar system"
    />
  );
}
