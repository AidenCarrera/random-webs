"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

import styles from "./styles.module.css";

const FLOOR = -3.2;
const WALL = 4.2;
const GOLDEN = Math.PI * (3 - Math.sqrt(5));
const HOT = [2.4, 2.1, 1.8];

const rnd = (i: number) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

type Form = {
  name: string;
  colors: [string, string];
  // Turns itself, so skip the global spin that would swing its tilt away.
  fixed?: boolean;
  place: (
    i: number,
    n: number,
    t: number,
    out: Float32Array,
    o: number,
  ) => void;
};

const FORMS: Form[] = [
  {
    name: "Sphere",
    colors: ["#3b82f6", "#f0abfc"],
    place: (i, n, _t, out, o) => {
      const y = 1 - (2 * (i + 0.5)) / n;
      const r = Math.sqrt(1 - y * y);
      const a = i * GOLDEN;
      const R = 2.2;
      out[o] = Math.cos(a) * r * R;
      out[o + 1] = y * R;
      out[o + 2] = Math.sin(a) * r * R;
    },
  },
  {
    name: "Block",
    colors: ["#f97316", "#fde047"],
    place: (i, n, _t, out, o) => {
      const side = Math.ceil(Math.cbrt(n));
      const s = 3.4 / (side - 1);
      const mid = (side - 1) / 2;
      out[o] = ((i % side) - mid) * s;
      out[o + 1] = ((Math.floor(i / side) % side) - mid) * s;
      out[o + 2] = (Math.floor(i / side / side) - mid) * s;
    },
  },
  {
    name: "Tide",
    colors: ["#0891b2", "#a7f3d0"],
    place: (i, n, t, out, o) => {
      const g = Math.ceil(Math.sqrt(n));
      const x = ((i % g) / (g - 1) - 0.5) * 7;
      const z = (Math.floor(i / g) / (g - 1) - 0.5) * 7;
      out[o] = x;
      out[o + 1] =
        Math.sin(x * 1.2 + t * 1.7) * Math.cos(z * 1.1 + t * 1.3) * 0.55 - 0.6;
      out[o + 2] = z;
    },
  },
  {
    name: "Galaxy",
    colors: ["#fcd34d", "#7c3aed"],
    fixed: true,
    place: (i, n, t, out, o) => {
      const f = (i + 0.5) / n;
      const d = 0.2 + 3 * f;
      const arm = (i % 3) * ((Math.PI * 2) / 3);
      const a = arm + d * 1.4 + (rnd(i) - 0.5) * (0.4 + f) + t * 0.3;
      const x = Math.cos(a) * d;
      const y = (rnd(i + n) - 0.5) * 0.4 * (1 - f);
      const z = Math.sin(a) * d;
      // Tilted toward the camera so the arms read.
      out[o] = x;
      out[o + 1] = y * Math.cos(0.6) - z * Math.sin(0.6);
      out[o + 2] = y * Math.sin(0.6) + z * Math.cos(0.6);
    },
  },
  {
    name: "Knot",
    colors: ["#ef4444", "#f9a8d4"],
    place: (i, n, t, out, o) => {
      // A (2,3) torus knot; cubes flow along the tube.
      const ring = 14;
      const u =
        (Math.floor(i / ring) / Math.ceil(n / ring)) * Math.PI * 2 + t * 0.12;
      const v = ((i % ring) / ring) * Math.PI * 2 + t * 0.6;
      const c2 = Math.cos(2 * u);
      const s2 = Math.sin(2 * u);
      const c3 = Math.cos(3 * u);
      const s3 = Math.sin(3 * u);
      const K = 0.78;
      let tx = -3 * s3 * c2 - 2 * (2 + c3) * s2;
      let ty = -3 * s3 * s2 + 2 * (2 + c3) * c2;
      let tz = 3 * c3;
      const tl = Math.hypot(tx, ty, tz);
      tx /= tl;
      ty /= tl;
      tz /= tl;
      const dot = c2 * tx + s2 * ty;
      let nx = c2 - dot * tx;
      let ny = s2 - dot * ty;
      let nz = -dot * tz;
      const nl = Math.hypot(nx, ny, nz);
      nx /= nl;
      ny /= nl;
      nz /= nl;
      const bx = ty * nz - tz * ny;
      const by = tz * nx - tx * nz;
      const bz = tx * ny - ty * nx;
      const cv = Math.cos(v) * 0.32;
      const sv = Math.sin(v) * 0.32;
      out[o] = (2 + c3) * c2 * K + cv * nx + sv * bx;
      out[o + 1] = (2 + c3) * s2 * K + cv * ny + sv * by;
      out[o + 2] = s3 * K + cv * nz + sv * bz;
    },
  },
];

export default function ShatterPage() {
  const mountRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<{
    form: (index: number) => void;
    drop: () => void;
  } | null>(null);
  const [form, setForm] = useState(0);
  const [dropped, setDropped] = useState(false);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const small =
      window.matchMedia("(pointer: coarse)").matches || window.innerWidth < 700;
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const n = small ? 1728 : 2744;
    const size = small ? 0.14 : 0.12;
    const radius = size * 0.6;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#06070b");
    scene.fog = new THREE.Fog("#06070b", 13, 28);
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 60);

    scene.add(new THREE.HemisphereLight("#9fb4ff", "#120d14", 0.9));
    const sun = new THREE.DirectionalLight("#ffffff", 2.4);
    sun.position.set(4, 9, 6);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.bias = -0.0005;
    Object.assign(sun.shadow.camera, {
      left: -7,
      right: 7,
      top: 7,
      bottom: -7,
      near: 1,
      far: 25,
    });
    scene.add(sun);
    const rim = new THREE.PointLight("#ff5fa2", 30, 20);
    rim.position.set(-5, 2, -4);
    scene.add(rim);

    const floor = new THREE.Mesh(
      new THREE.CircleGeometry(14, 64),
      new THREE.MeshStandardMaterial({ color: "#0d0f16", roughness: 0.9 }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = FLOOR;
    floor.receiveShadow = true;
    scene.add(floor);
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(WALL + radius, 0.02, 8, 128),
      new THREE.MeshBasicMaterial({ color: "#3a4160" }),
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = FLOOR + 0.02;
    scene.add(ring);

    const cubes = new THREE.InstancedMesh(
      new THREE.BoxGeometry(size, size, size),
      new THREE.MeshStandardMaterial({ roughness: 0.35, metalness: 0.15 }),
      n,
    );
    cubes.castShadow = true;
    cubes.receiveShadow = true;
    cubes.frustumCulled = false;
    cubes.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    cubes.setColorAt(0, new THREE.Color());
    const instanceColor = cubes.instanceColor;
    if (!instanceColor) return;
    instanceColor.setUsage(THREE.DynamicDrawUsage);
    scene.add(cubes);
    const matrices = cubes.instanceMatrix.array as Float32Array;
    const colors = instanceColor.array as Float32Array;

    const pos = new Float32Array(n * 3);
    const vel = new Float32Array(n * 3);
    const home = new Float32Array(n * 3);
    const spin = new Float32Array(n * 3);
    const quat = new Float32Array(n * 4);
    const heat = new Float32Array(n);
    const delay = new Float32Array(n);
    const base = new Float32Array(n * 3);

    // Start scattered overhead so the first shape assembles itself.
    for (let i = 0; i < n; i += 1) {
      pos[i * 3] = (rnd(i * 3) - 0.5) * 16;
      pos[i * 3 + 1] = 3 + rnd(i * 3 + 1) * 8;
      pos[i * 3 + 2] = (rnd(i * 3 + 2) - 0.5) * 16;
      const q = new THREE.Quaternion().random();
      quat.set([q.x, q.y, q.z, q.w], i * 4);
    }

    let t = 0;
    let angle = 0;
    let formIndex = 0;
    let formStart = 0;
    let isDropped = false;

    const placeHomes = () => {
      const { place, fixed } = FORMS[formIndex];
      const c = Math.cos(angle);
      const s = Math.sin(angle);
      for (let i = 0; i < n; i += 1) {
        const o = i * 3;
        place(i, n, t, home, o);
        if (fixed) continue;
        const x = home[o];
        const z = home[o + 2];
        home[o] = x * c + z * s;
        home[o + 2] = -x * s + z * c;
      }
    };

    const tmp = new THREE.Color();
    const assemble = (index: number, spread: number) => {
      formIndex = index;
      formStart = t;
      placeHomes();
      let low = Infinity;
      let high = -Infinity;
      for (let i = 0; i < n; i += 1) {
        low = Math.min(low, home[i * 3 + 1]);
        high = Math.max(high, home[i * 3 + 1]);
      }
      const from = new THREE.Color(FORMS[index].colors[0]);
      const to = new THREE.Color(FORMS[index].colors[1]);
      for (let i = 0; i < n; i += 1) {
        // Bottom rows wake first, so shapes build upward.
        delay[i] =
          ((home[i * 3 + 1] - low) / (high - low || 1)) * spread +
          rnd(i + index * 977) * 0.25;
        tmp.lerpColors(from, to, i / (n - 1));
        base[i * 3] = tmp.r;
        base[i * 3 + 1] = tmp.g;
        base[i * 3 + 2] = tmp.b;
      }
      isDropped = false;
      if (t === 0) return;
      setForm(index);
      setDropped(false);
    };
    assemble(0, 1.2);

    const drop = () => {
      if (isDropped) {
        assemble(formIndex, 1.1);
        return;
      }
      isDropped = true;
      for (let i = 0; i < n * 3; i += 1) vel[i] += (rnd(i + t) - 0.5) * 1.5;
      setDropped(true);
    };
    apiRef.current = { form: (index) => assemble(index, 0.6), drop };

    // Spatial hash for cube-on-cube contacts while dropped.
    const TABLE = 8192;
    const head = new Int32Array(TABLE);
    const next = new Int32Array(n);
    const cell = radius * 2;
    const key = (x: number, y: number, z: number) =>
      ((x * 73856093) ^ (y * 19349663) ^ (z * 83492791)) & (TABLE - 1);
    const collide = () => {
      head.fill(-1);
      for (let i = 0; i < n; i += 1) {
        const k = key(
          Math.floor(pos[i * 3] / cell),
          Math.floor(pos[i * 3 + 1] / cell),
          Math.floor(pos[i * 3 + 2] / cell),
        );
        next[i] = head[k];
        head[k] = i;
      }
      const min = radius * 2;
      for (let i = 0; i < n; i += 1) {
        const a = i * 3;
        const cx = Math.floor(pos[a] / cell);
        const cy = Math.floor(pos[a + 1] / cell);
        const cz = Math.floor(pos[a + 2] / cell);
        for (let dx = -1; dx <= 1; dx += 1)
          for (let dy = -1; dy <= 1; dy += 1)
            for (let dz = -1; dz <= 1; dz += 1) {
              for (
                let j = head[key(cx + dx, cy + dy, cz + dz)];
                j !== -1;
                j = next[j]
              ) {
                if (j <= i) continue;
                const b = j * 3;
                const x = pos[b] - pos[a];
                const y = pos[b + 1] - pos[a + 1];
                const z = pos[b + 2] - pos[a + 2];
                const d2 = x * x + y * y + z * z;
                if (d2 >= min * min || d2 < 1e-10) continue;
                const d = Math.sqrt(d2);
                const nx = x / d;
                const ny = y / d;
                const nz = z / d;
                const push = (min - d) / 2;
                pos[a] -= nx * push;
                pos[a + 1] -= ny * push;
                pos[a + 2] -= nz * push;
                pos[b] += nx * push;
                pos[b + 1] += ny * push;
                pos[b + 2] += nz * push;
                const vn =
                  (vel[b] - vel[a]) * nx +
                  (vel[b + 1] - vel[a + 1]) * ny +
                  (vel[b + 2] - vel[a + 2]) * nz;
                if (vn >= 0) continue;
                const impulse = vn * 0.55;
                vel[a] += nx * impulse;
                vel[a + 1] += ny * impulse;
                vel[a + 2] += nz * impulse;
                vel[b] -= nx * impulse;
                vel[b + 1] -= ny * impulse;
                vel[b + 2] -= nz * impulse;
              }
            }
      }
    };

    const step = (h: number) => {
      const qy = Math.sin(angle / 2);
      const qw = Math.cos(angle / 2);
      const spinDamp = Math.exp(-(isDropped ? 0.4 : 2.5) * h);
      for (let i = 0; i < n; i += 1) {
        const o = i * 3;
        let wake = 0;
        if (isDropped) {
          vel[o] -= vel[o] * 0.1 * h;
          vel[o + 1] -= (16 + vel[o + 1] * 0.1) * h;
          vel[o + 2] -= vel[o + 2] * 0.1 * h;
        } else {
          wake = Math.min(1, Math.max(0, (t - formStart - delay[i]) / 0.45));
          const stiff = 30 * wake * wake;
          // Underdamped, so cubes overshoot and wobble into place.
          const damp = Math.sqrt(stiff) * 1.1 + 0.6;
          for (let k = 0; k < 3; k += 1)
            vel[o + k] +=
              ((home[o + k] - pos[o + k]) * stiff - vel[o + k] * damp) * h;
        }
        pos[o] += vel[o] * h;
        pos[o + 1] += vel[o + 1] * h;
        pos[o + 2] += vel[o + 2] * h;

        if (pos[o + 1] < FLOOR + radius) {
          pos[o + 1] = FLOOR + radius;
          if (vel[o + 1] < 0) vel[o + 1] *= -0.3;
          vel[o] *= 0.92;
          vel[o + 2] *= 0.92;
          spin[o] *= 0.85;
          spin[o + 1] *= 0.85;
          spin[o + 2] *= 0.85;
        }
        if (isDropped) {
          const r = Math.hypot(pos[o], pos[o + 2]);
          if (r > WALL) {
            const nx = pos[o] / r;
            const nz = pos[o + 2] / r;
            pos[o] = nx * WALL;
            pos[o + 2] = nz * WALL;
            const vn = vel[o] * nx + vel[o + 2] * nz;
            if (vn > 0) {
              vel[o] -= 1.4 * vn * nx;
              vel[o + 2] -= 1.4 * vn * nz;
            }
          }
        }

        const wx = (spin[o] *= spinDamp);
        const wy = (spin[o + 1] *= spinDamp);
        const wz = (spin[o + 2] *= spinDamp);
        const q = i * 4;
        const qx = quat[q];
        const qy0 = quat[q + 1];
        const qz = quat[q + 2];
        const qw0 = quat[q + 3];
        let x = qx + 0.5 * h * (wx * qw0 + wy * qz - wz * qy0);
        let y = qy0 + 0.5 * h * (wy * qw0 + wz * qx - wx * qz);
        let z = qz + 0.5 * h * (wz * qw0 + wx * qy0 - wy * qx);
        let w = qw0 + 0.5 * h * (-wx * qx - wy * qy0 - wz * qz);
        if (wake > 0) {
          // Settle toward the shape's own orientation.
          const sign = y * qy + w * qw < 0 ? -1 : 1;
          const blend = (1 - Math.exp(-5 * h)) * wake;
          x += (0 - x) * blend;
          y += (sign * qy - y) * blend;
          z += (0 - z) * blend;
          w += (sign * qw - w) * blend;
        }
        const l = Math.hypot(x, y, z, w);
        quat[q] = x / l;
        quat[q + 1] = y / l;
        quat[q + 2] = z / l;
        quat[q + 3] = w / l;
      }
      if (isDropped) collide();
    };

    // Pointer: sweeping shoves cubes away from the ray; a click blasts.
    const raycaster = new THREE.Raycaster();
    const ndc = new THREE.Vector2();
    let hovering = false;
    let sweep = 0;
    let lastMove = { x: 0, y: 0, at: 0 };
    let press: { x: number; y: number } | null = null;
    const toNdc = (event: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      ndc.set(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1,
      );
    };
    const onMove = (event: PointerEvent) => {
      toNdc(event);
      const now = performance.now();
      const speed =
        Math.hypot(event.clientX - lastMove.x, event.clientY - lastMove.y) /
        Math.max(0.008, (now - lastMove.at) / 1000);
      if (hovering) sweep = Math.max(sweep, Math.min(2.5, speed / 700));
      lastMove = { x: event.clientX, y: event.clientY, at: now };
      hovering = true;
    };
    const onLeave = (event: PointerEvent) => {
      if (event.pointerType !== "mouse" || event.type === "pointerleave")
        hovering = false;
    };
    const onDown = (event: PointerEvent) => {
      press = { x: event.clientX, y: event.clientY };
      lastMove = { x: event.clientX, y: event.clientY, at: performance.now() };
      hovering = true;
    };
    const onUp = (event: PointerEvent) => {
      if (
        press &&
        Math.hypot(event.clientX - press.x, event.clientY - press.y) < 8
      ) {
        toNdc(event);
        blast();
      }
      press = null;
      onLeave(event);
    };

    const blast = () => {
      raycaster.setFromCamera(ndc, camera);
      const { origin: ro, direction: rd } = raycaster.ray;
      let best = Infinity;
      let cx = 0;
      let cy = 0;
      let cz = 0;
      for (let i = 0; i < n; i += 1) {
        const o = i * 3;
        const x = pos[o] - ro.x;
        const y = pos[o + 1] - ro.y;
        const z = pos[o + 2] - ro.z;
        const along = x * rd.x + y * rd.y + z * rd.z;
        if (along <= 0 || along >= best) continue;
        const px = x - along * rd.x;
        const py = y - along * rd.y;
        const pz = z - along * rd.z;
        if (px * px + py * py + pz * pz > 0.09) continue;
        best = along;
        cx = pos[o];
        cy = pos[o + 1];
        cz = pos[o + 2];
      }
      if (best === Infinity) {
        // Missed every cube: blast where the ray meets the floor, or nearest the middle.
        const s =
          isDropped && rd.y < 0
            ? (FLOOR - ro.y) / rd.y
            : Math.max(0, -ro.dot(rd));
        cx = ro.x + rd.x * s;
        cy = ro.y + rd.y * s;
        cz = ro.z + rd.z * s;
      }
      for (let i = 0; i < n; i += 1) {
        const o = i * 3;
        const x = pos[o] - cx;
        const y = pos[o + 1] - cy;
        const z = pos[o + 2] - cz;
        const d2 = x * x + y * y + z * z;
        const force = Math.min(22, 6 / (0.15 + d2));
        if (force < 0.05) continue;
        const d = Math.sqrt(d2) + 1e-4;
        vel[o] += (x / d) * force;
        vel[o + 1] += (y / d) * force + (isDropped ? force * 0.6 : 0);
        vel[o + 2] += (z / d) * force;
        spin[o] += (rnd(i + t) - 0.5) * force * 3;
        spin[o + 1] += (rnd(i + t + 1) - 0.5) * force * 3;
        spin[o + 2] += (rnd(i + t + 2) - 0.5) * force * 3;
      }
    };

    const disturb = (dt: number) => {
      raycaster.setFromCamera(ndc, camera);
      const { origin: ro, direction: rd } = raycaster.ray;
      const reach = 0.9;
      const strength = 40 * sweep * dt;
      for (let i = 0; i < n; i += 1) {
        const o = i * 3;
        const x = pos[o] - ro.x;
        const y = pos[o + 1] - ro.y;
        const z = pos[o + 2] - ro.z;
        const along = x * rd.x + y * rd.y + z * rd.z;
        if (along <= 0) continue;
        const px = x - along * rd.x;
        const py = y - along * rd.y;
        const pz = z - along * rd.z;
        const d2 = px * px + py * py + pz * pz;
        if (d2 > reach * reach) continue;
        const d = Math.sqrt(d2) + 1e-4;
        const f = (1 - d / reach) * strength;
        vel[o] += (px / d) * f;
        vel[o + 1] += (py / d) * f;
        vel[o + 2] += (pz / d) * f;
        // Shoved cubes tumble about the axis across the sweep.
        spin[o] += ((rd.y * pz - rd.z * py) / d) * f * 4;
        spin[o + 1] += ((rd.z * px - rd.x * pz) / d) * f * 4;
        spin[o + 2] += ((rd.x * py - rd.y * px) / d) * f * 4;
      }
    };

    const onKey = (event: KeyboardEvent) => {
      if ((event.target as HTMLElement | null)?.closest("button")) return;
      if (event.key === " ") {
        event.preventDefault();
        drop();
      }
      const digit = Number(event.key);
      if (digit >= 1 && digit <= FORMS.length) assemble(digit - 1, 0.6);
    };

    const canvas = renderer.domElement;
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointercancel", onLeave);
    canvas.addEventListener("pointerleave", onLeave);
    window.addEventListener("keydown", onKey);

    let cameraZ = 11.5;
    const resize = () => {
      const width = mount.clientWidth;
      const height = mount.clientHeight;
      renderer.setSize(width, height);
      camera.aspect = width / height;
      const portrait = width < height;
      camera.fov = portrait ? 55 : 42;
      cameraZ = portrait ? 15 : 11.5;
      camera.updateProjectionMatrix();
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(mount);

    let frame = 0;
    let last = performance.now();
    const render = (now: number) => {
      const dt = Math.min(1 / 30, (now - last) / 1000);
      last = now;
      t += dt;
      if (!calm) angle += dt * 0.18;

      placeHomes();
      sweep *= Math.exp(-6 * dt);
      if (hovering && sweep > 0.02) disturb(dt);
      step(dt / 2);
      step(dt / 2);

      const cool = Math.exp(-2.5 * dt);
      for (let i = 0; i < n; i += 1) {
        const o = i * 3;
        const speed = Math.hypot(vel[o], vel[o + 1], vel[o + 2]);
        heat[i] = Math.max(heat[i] * cool, Math.min(1, speed / 7));
        const glow = heat[i] * heat[i];
        colors[o] = base[o] + (HOT[0] - base[o]) * glow;
        colors[o + 1] = base[o + 1] + (HOT[1] - base[o + 1]) * glow;
        colors[o + 2] = base[o + 2] + (HOT[2] - base[o + 2]) * glow;

        const q = i * 4;
        const x = quat[q];
        const y = quat[q + 1];
        const z = quat[q + 2];
        const w = quat[q + 3];
        const m = i * 16;
        matrices[m] = 1 - 2 * (y * y + z * z);
        matrices[m + 1] = 2 * (x * y + w * z);
        matrices[m + 2] = 2 * (x * z - w * y);
        matrices[m + 4] = 2 * (x * y - w * z);
        matrices[m + 5] = 1 - 2 * (x * x + z * z);
        matrices[m + 6] = 2 * (y * z + w * x);
        matrices[m + 8] = 2 * (x * z + w * y);
        matrices[m + 9] = 2 * (y * z - w * x);
        matrices[m + 10] = 1 - 2 * (x * x + y * y);
        matrices[m + 12] = pos[o];
        matrices[m + 13] = pos[o + 1];
        matrices[m + 14] = pos[o + 2];
        matrices[m + 15] = 1;
      }
      cubes.instanceMatrix.needsUpdate = true;
      instanceColor.needsUpdate = true;

      camera.position.set(calm ? 0 : Math.sin(t * 0.13) * 0.8, 4.8, cameraZ);
      camera.lookAt(0, -2, 0);
      renderer.render(scene, camera);
      frame = requestAnimationFrame(render);
    };
    frame = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("keydown", onKey);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointercancel", onLeave);
      canvas.removeEventListener("pointerleave", onLeave);
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          (object.material as THREE.Material).dispose();
        }
      });
      renderer.dispose();
      mount.removeChild(canvas);
      apiRef.current = null;
    };
  }, []);

  return (
    <main className={styles.page}>
      <div
        ref={mountRef}
        className={styles.stage}
        role="img"
        aria-label="Thousands of small cubes holding a shape. Move across them to scatter them, click to blast them apart."
      />

      <header className={styles.header}>
        <h1>Shatter</h1>
        <p>{dropped ? "Dropped" : FORMS[form].name}</p>
      </header>

      <nav className={styles.controls} aria-label="Shapes">
        {FORMS.map((entry, i) => (
          <button
            key={entry.name}
            type="button"
            aria-pressed={i === form && !dropped}
            onClick={() => apiRef.current?.form(i)}
          >
            {entry.name}
          </button>
        ))}
        <button
          type="button"
          className={styles.drop}
          aria-pressed={dropped}
          onClick={() => apiRef.current?.drop()}
        >
          {dropped ? "Rebuild" : "Drop"}
        </button>
      </nav>

      <p className={styles.help}>
        <span className={styles.mouse}>
          Sweep to scatter · click to shatter · space to drop
        </span>
        <span className={styles.touch}>Drag to scatter · tap to shatter</span>
      </p>
    </main>
  );
}
