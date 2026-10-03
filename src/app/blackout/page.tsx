"use client";

import { useEffect, useRef, useState } from "react";

import { downloadCanvasPng } from "@/lib/canvasExport";

import {
  beacons,
  blocked,
  cast,
  cells,
  depthColor,
  exit,
  EYE,
  GRID_H,
  GRID_W,
  start,
} from "./survey";
import styles from "./styles.module.css";

const MAX_POINTS = 180_000;
const RAYS = 170;
const PULSE_RAYS = 4200;
// Points swell from one pixel to a 2x2 blob somewhere between these depths.
const BLOB_NEAR = 1.5;
const BLOB_FAR = 4.5;
const WHITE = 0xffffffff;
const GREEN = 0xff66ff9a | 0;

type Result = { points: number; seconds: number; map: string };

function floorCells() {
  const list: { x: number; y: number }[] = [];
  cells.forEach((row, y) =>
    [...row].forEach(
      (c, x) => c === "." && list.push({ x: x + 0.5, y: y + 0.5 }),
    ),
  );
  return list;
}

export default function BlackoutPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [started, setStarted] = useState(false);
  const [hud, setHud] = useState({ points: 0, found: 0, seconds: 0 });
  const [toast, setToast] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [locked, setLocked] = useState(false);
  const touchRef = useRef({ scan: false, pulse: false, move: { x: 0, y: 0 } });
  const [run, setRun] = useState(0);

  useEffect(() => {
    if (!started) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const xs = new Float32Array(MAX_POINTS);
    const ys = new Float32Array(MAX_POINTS);
    const zs = new Float32Array(MAX_POINTS);
    const colors = new Uint32Array(MAX_POINTS);
    const blobs = new Float32Array(MAX_POINTS);
    let count = 0;
    let head = 0;
    const add = (x: number, y: number, z: number, color: number) => {
      xs[head] = x;
      ys[head] = y;
      zs[head] = z;
      colors[head] = color;
      // Every point swells at its own depth, so the change never lines up into an edge.
      blobs[head] =
        BLOB_NEAR +
        ((BLOB_FAR - BLOB_NEAR) * (Math.random() + Math.random())) / 2;
      head = (head + 1) % MAX_POINTS;
      count = Math.min(MAX_POINTS, count + 1);
    };
    let ghosts: { x: number; y: number; z: number; life: number }[] = [];

    const player = { x: start.x, y: start.y, yaw: 0.1, pitch: -0.05 };
    const trail: { x: number; y: number }[] = [{ ...player }];
    const found = new Set<number>();
    const seenBeacon = new Set<number>();
    const keys = new Set<string>();
    let scanning = false;
    let pulseReady = 0;
    let pulseWanted = false;
    const began = performance.now();
    let finished = false;
    const floors = floorCells();
    let entity = { x: 38.5, y: 3.5, spotted: 0 };

    // Sound: scanner hiss, pulse and pickup blips, exit hum, the thing.
    const audio = new AudioContext();
    const master = audio.createGain();
    master.gain.value = 0.9;
    master.connect(audio.destination);
    const noise = audio.createBuffer(1, audio.sampleRate * 2, audio.sampleRate);
    const noiseData = noise.getChannelData(0);
    for (let i = 0; i < noiseData.length; i += 1)
      noiseData[i] = Math.random() * 2 - 1;
    const hiss = audio.createBufferSource();
    hiss.buffer = noise;
    hiss.loop = true;
    const hissFilter = audio.createBiquadFilter();
    hissFilter.type = "bandpass";
    hissFilter.frequency.value = 4200;
    hissFilter.Q.value = 6;
    const hissGain = audio.createGain();
    hissGain.gain.value = 0;
    hiss.connect(hissFilter).connect(hissGain).connect(master);
    hiss.start();

    const blip = (
      frequency: number,
      to: number,
      length: number,
      level: number,
      pan: number,
    ) => {
      const at = audio.currentTime + 0.01;
      const osc = audio.createOscillator();
      const gain = audio.createGain();
      const panner = audio.createStereoPanner();
      osc.frequency.setValueAtTime(frequency, at);
      osc.frequency.exponentialRampToValueAtTime(to, at + length);
      gain.gain.setValueAtTime(0, at);
      gain.gain.linearRampToValueAtTime(level, at + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0005, at + length);
      panner.pan.value = Math.max(-1, Math.min(1, pan));
      osc.connect(gain).connect(panner).connect(master);
      osc.start(at);
      osc.stop(at + length + 0.05);
    };
    // Spray-can hiss for the pulse.
    const spray = () => {
      const at = audio.currentTime + 0.01;
      const source = audio.createBufferSource();
      source.buffer = noise;
      const filter = audio.createBiquadFilter();
      filter.type = "bandpass";
      filter.Q.value = 0.8;
      filter.frequency.setValueAtTime(7000, at);
      filter.frequency.exponentialRampToValueAtTime(3500, at + 0.45);
      const gain = audio.createGain();
      gain.gain.setValueAtTime(0, at);
      gain.gain.linearRampToValueAtTime(0.14, at + 0.03);
      gain.gain.setValueAtTime(0.14, at + 0.25);
      gain.gain.exponentialRampToValueAtTime(0.001, at + 0.5);
      source.connect(filter).connect(gain).connect(master);
      source.start(at, Math.random(), 0.55);
    };
    const relative = (x: number, y: number) => {
      const angle = Math.atan2(y - player.y, x - player.x) - player.yaw;
      return {
        pan: Math.sin(angle),
        distance: Math.hypot(x - player.x, y - player.y),
      };
    };

    let width = 0;
    let height = 0;
    let image = ctx.createImageData(1, 1);
    let buffer = new Uint32Array(1);
    let depth = new Float32Array(1);
    const resize = () => {
      const cssW = canvas.clientWidth;
      const cssH = canvas.clientHeight;
      width = Math.min(960, cssW);
      height = Math.round((width * cssH) / cssW);
      canvas.width = width;
      canvas.height = height;
      image = ctx.createImageData(width, height);
      buffer = new Uint32Array(image.data.buffer);
      depth = new Float32Array(width * height);
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);

    const scan = (rays: number, spreadYaw: number, spreadPitch: number) => {
      for (let r = 0; r < rays; r += 1) {
        const yaw = player.yaw + (Math.random() - 0.5) * 2 * spreadYaw;
        const pitch = player.pitch + (Math.random() - 0.5) * 2 * spreadPitch;
        const hit = cast(player.x, player.y, yaw, pitch);
        // Does the ray pass through the thing first?
        const ux = Math.cos(yaw);
        const uy = Math.sin(yaw);
        const ox = player.x - entity.x;
        const oy = player.y - entity.y;
        const b = ox * ux + oy * uy;
        const disc = b * b - (ox * ox + oy * oy - 0.07);
        if (disc >= 0) {
          const s = -b - Math.sqrt(disc);
          const z = EYE + Math.tan(pitch) * s;
          if (
            s > 0 &&
            (!hit || s < hit.distance * Math.cos(pitch)) &&
            z > 0 &&
            z < 1.8
          ) {
            ghosts.push({
              x: player.x + ux * s,
              y: player.y + uy * s,
              z,
              life: 1,
            });
            entity.spotted += 1;
            continue;
          }
        }
        if (!hit) continue;
        let color = depthColor(hit.distance, hit.kind);
        if (hit.prop?.kind === "b") {
          const index = beacons.findIndex(
            (beacon) => beacon.x === hit.prop?.x && beacon.y === hit.prop?.y,
          );
          if (!found.has(index)) {
            color = WHITE;
            seenBeacon.add(index);
          }
        } else if (hit.prop?.kind === "E") {
          color =
            found.size === beacons.length
              ? GREEN
              : depthColor(hit.distance, "prop");
        }
        add(hit.x, hit.y, hit.z, color);
      }
    };

    const onKey = (event: KeyboardEvent) => {
      const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
      if (event.type === "keydown") {
        keys.add(key);
        if (key === " ") {
          event.preventDefault();
          scanning = true;
        }
        if (key === "e" || key === "q") pulseWanted = true;
      } else {
        keys.delete(key);
        if (key === " ") scanning = false;
      }
    };
    const onMouseMove = (event: MouseEvent) => {
      if (document.pointerLockElement !== canvas) return;
      player.yaw += event.movementX * 0.0022;
      player.pitch = Math.max(
        -1.25,
        Math.min(1.25, player.pitch - event.movementY * 0.0022),
      );
    };
    const onMouseDown = (event: MouseEvent) => {
      if (document.pointerLockElement !== canvas) {
        // Chrome rejects for ~1s after Esc; the next click retries. Safari returns undefined.
        canvas.requestPointerLock?.()?.catch(() => {});
        return;
      }
      if (event.button === 0) scanning = true;
      if (event.button === 2) pulseWanted = true;
    };
    const onMouseUp = (event: MouseEvent) => {
      if (event.button === 0) scanning = false;
    };
    const onLock = () => setLocked(document.pointerLockElement === canvas);
    const noMenu = (event: Event) => event.preventDefault();

    let look: { id: number; x: number; y: number } | null = null;
    const onTouchStart = (event: TouchEvent) => {
      for (const touch of Array.from(event.changedTouches)) {
        if (touch.clientX > window.innerWidth / 2 && !look)
          look = { id: touch.identifier, x: touch.clientX, y: touch.clientY };
      }
    };
    const onTouchMove = (event: TouchEvent) => {
      for (const touch of Array.from(event.changedTouches)) {
        if (look && touch.identifier === look.id) {
          player.yaw += (touch.clientX - look.x) * 0.006;
          player.pitch = Math.max(
            -1.25,
            Math.min(1.25, player.pitch - (touch.clientY - look.y) * 0.006),
          );
          look = { id: look.id, x: touch.clientX, y: touch.clientY };
        }
      }
      event.preventDefault();
    };
    const onTouchEnd = (event: TouchEvent) => {
      for (const touch of Array.from(event.changedTouches))
        if (look && touch.identifier === look.id) look = null;
    };

    window.addEventListener("keydown", onKey);
    window.addEventListener("keyup", onKey);
    window.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mouseup", onMouseUp);
    canvas.addEventListener("contextmenu", noMenu);
    document.addEventListener("pointerlockchange", onLock);
    canvas.addEventListener("touchstart", onTouchStart, { passive: true });
    canvas.addEventListener("touchmove", onTouchMove, { passive: false });
    canvas.addEventListener("touchend", onTouchEnd);

    let frame = 0;
    let last = performance.now();
    let stepDistance = 0;
    let pingClock = 0;
    let hudClock = 0;

    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const touch = touchRef.current;

      // Walk.
      let fx =
        (keys.has("w") || keys.has("ArrowUp") ? 1 : 0) -
        (keys.has("s") || keys.has("ArrowDown") ? 1 : 0) +
        touch.move.y;
      let sx = (keys.has("d") ? 1 : 0) - (keys.has("a") ? 1 : 0) + touch.move.x;
      if (keys.has("ArrowLeft")) player.yaw -= dt * 1.8;
      if (keys.has("ArrowRight")) player.yaw += dt * 1.8;
      const length = Math.hypot(fx, sx);
      if (length > 1) {
        fx /= length;
        sx /= length;
      }
      const speed = keys.has("Shift") ? 3.4 : 2.2;
      const mx =
        (Math.cos(player.yaw) * fx - Math.sin(player.yaw) * sx) * speed * dt;
      const my =
        (Math.sin(player.yaw) * fx + Math.cos(player.yaw) * sx) * speed * dt;
      if (!blocked(player.x + mx, player.y)) player.x += mx;
      if (!blocked(player.x, player.y + my)) player.y += my;
      stepDistance += Math.hypot(mx, my);
      if (stepDistance > 0.62) {
        stepDistance = 0;
        trail.push({ x: player.x, y: player.y });
      }

      // Scan.
      const active = scanning || touch.scan;
      hissGain.gain.setTargetAtTime(active ? 0.05 : 0, audio.currentTime, 0.04);
      if (active) scan(RAYS, 0.2, 0.15);
      if ((pulseWanted || touch.pulse) && now > pulseReady) {
        scan(PULSE_RAYS, 0.95, 0.62);
        spray();
        pulseReady = now + 3500;
      }
      pulseWanted = false;
      touch.pulse = false;

      // Once every beacon is found, the exit hums.
      pingClock += dt;
      if (pingClock > 1.8) {
        pingClock = 0;
        if (found.size === beacons.length) {
          const { pan, distance } = relative(exit.x, exit.y);
          blip(160, 110, 0.6, 0.35 / (1 + distance * 0.2), pan);
        }
      }
      beacons.forEach((beacon, index) => {
        if (
          found.has(index) ||
          Math.hypot(beacon.x - player.x, beacon.y - player.y) > 1.1
        )
          return;
        found.add(index);
        blip(660, 1760, 0.6, 0.3, 0);
        setToast(
          found.size === beacons.length
            ? "All four beacons. Somewhere, a door has started humming."
            : `Beacon acquired. ${found.size} of ${beacons.length}.`,
        );
        window.setTimeout(() => setToast(null), 3200);
      });

      // The thing does not like to be looked at up close.
      if (
        entity.spotted > 12 &&
        Math.hypot(entity.x - player.x, entity.y - player.y) < 7
      ) {
        const far = floors.filter(
          (cell) => Math.hypot(cell.x - player.x, cell.y - player.y) > 11,
        );
        const next = far[Math.floor(Math.random() * far.length)];
        if (next) {
          window.setTimeout(() => {
            entity = { x: next.x, y: next.y, spotted: 0 };
            blip(90, 40, 1.4, 0.35, 0);
          }, 1300);
          entity.spotted = -9999;
        }
      }

      if (
        !finished &&
        found.size === beacons.length &&
        Math.hypot(exit.x - player.x, exit.y - player.y) < 1.3
      ) {
        finished = true;
        blip(440, 880, 1.2, 0.3, 0);
        const map = document.createElement("canvas");
        map.width = GRID_W * 22;
        map.height = GRID_H * 22;
        const mapCtx = map.getContext("2d");
        if (mapCtx) {
          mapCtx.fillStyle = "#020205";
          mapCtx.fillRect(0, 0, map.width, map.height);
          for (let i = 0; i < count; i += 1) {
            const c = colors[i];
            mapCtx.fillStyle = `rgb(${c & 255}, ${(c >> 8) & 255}, ${(c >> 16) & 255})`;
            mapCtx.fillRect(xs[i] * 22, ys[i] * 22, 1.4, 1.4);
          }
          mapCtx.strokeStyle = "rgba(255, 255, 255, 0.7)";
          mapCtx.setLineDash([3, 5]);
          mapCtx.beginPath();
          trail.forEach((p, i) =>
            i
              ? mapCtx.lineTo(p.x * 22, p.y * 22)
              : mapCtx.moveTo(p.x * 22, p.y * 22),
          );
          mapCtx.stroke();
        }
        document.exitPointerLock?.();
        setResult({
          points: count,
          seconds: (now - began) / 1000,
          map: map.toDataURL("image/png"),
        });
      }

      // Render the cloud.
      buffer.fill(0xff050304);
      depth.fill(Infinity);
      const cy = Math.cos(player.yaw);
      const sy = Math.sin(player.yaw);
      const cp = Math.cos(player.pitch);
      const sp = Math.sin(player.pitch);
      const halfW = width / 2;
      const halfH = height / 2;
      const focal = height * 0.95;
      const plot = (
        x: number,
        y: number,
        z: number,
        color: number,
        blob: number,
      ) => {
        const dx = x - player.x;
        const dy = y - player.y;
        const dz = z - EYE;
        const forward = dx * cy + dy * sy;
        const right = -dx * sy + dy * cy;
        const f = forward * cp + dz * sp;
        if (f < 0.12) return;
        const up = -forward * sp + dz * cp;
        const px = Math.round(halfW + (right / f) * focal);
        const py = Math.round(halfH - (up / f) * focal);
        if (px < 0 || py < 0 || px >= width - 1 || py >= height - 1) return;
        const index = py * width + px;
        if (f < depth[index]) {
          depth[index] = f;
          buffer[index] = color;
        }
        if (f < blob) {
          buffer[index + 1] = color;
          buffer[index + width] = color;
          buffer[index + width + 1] = color;
        }
      };
      for (let i = 0; i < count; i += 1)
        plot(xs[i], ys[i], zs[i], colors[i], blobs[i]);
      ghosts = ghosts.filter((ghost) => (ghost.life -= dt * 0.45) > 0);
      for (const ghost of ghosts) {
        const fade = Math.round(90 + ghost.life * 165);
        plot(
          ghost.x,
          ghost.y,
          ghost.z,
          (255 << 24) | (40 << 16) | (40 << 8) | fade,
          Infinity,
        );
      }
      const pulse = 0.5 + 0.5 * Math.sin(now / 180);
      seenBeacon.forEach((index) => {
        if (found.has(index)) return;
        const beacon = beacons[index];
        for (let k = 0; k < 10; k += 1) {
          const a = (k / 10) * Math.PI * 2 + now / 600;
          plot(
            beacon.x + Math.cos(a) * 0.3 * (1 + pulse),
            beacon.y + Math.sin(a) * 0.3 * (1 + pulse),
            0.3,
            WHITE,
            Infinity,
          );
        }
      });
      if (active) {
        for (let k = 0; k < 40; k += 1) {
          const px = Math.round(halfW + (Math.random() - 0.5) * width * 0.22);
          const py = Math.round(halfH + (Math.random() - 0.5) * height * 0.2);
          buffer[py * width + px] = 0xff40ffff;
        }
      }
      ctx.putImageData(image, 0, 0);

      hudClock += dt;
      if (hudClock > 0.25) {
        hudClock = 0;
        setHud({
          points: count,
          found: found.size,
          seconds: (now - began) / 1000,
        });
      }
      if (!finished) frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("keyup", onKey);
      window.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mouseup", onMouseUp);
      canvas.removeEventListener("contextmenu", noMenu);
      document.removeEventListener("pointerlockchange", onLock);
      canvas.removeEventListener("touchstart", onTouchStart);
      canvas.removeEventListener("touchmove", onTouchMove);
      canvas.removeEventListener("touchend", onTouchEnd);
      if (document.pointerLockElement === canvas) document.exitPointerLock?.();
      void audio.close();
    };
  }, [started, run]);

  const clock = `${String(Math.floor(hud.seconds / 60)).padStart(2, "0")}:${String(Math.floor(hud.seconds % 60)).padStart(2, "0")}`;

  const joystick = (event: React.PointerEvent<HTMLDivElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - box.left) / box.width) * 2 - 1;
    const y = ((event.clientY - box.top) / box.height) * 2 - 1;
    touchRef.current.move = {
      x: Math.max(-1, Math.min(1, x)),
      y: Math.max(-1, Math.min(1, -y)),
    };
  };

  return (
    <main className={styles.page}>
      <canvas
        ref={canvasRef}
        className={styles.canvas}
        aria-label="Point cloud view. Click to take control."
      />

      {started && !result ? (
        <>
          <div className={styles.crosshair} aria-hidden="true" />
          <dl className={styles.hud}>
            <div>
              <dt>Points</dt>
              <dd>{hud.points.toLocaleString()}</dd>
            </div>
            <div>
              <dt>Beacons</dt>
              <dd>
                {hud.found}/{beacons.length}
              </dd>
            </div>
            <div>
              <dt>Elapsed</dt>
              <dd>{clock}</dd>
            </div>
          </dl>
          {!locked ? (
            <p className={styles.hint}>
              Click the view to take control · Hold click or Space to scan ·
              Right click or E to pulse · WASD to walk
            </p>
          ) : null}
          {toast ? <p className={styles.toast}>{toast}</p> : null}
          <div className={styles.touch}>
            <div
              className={styles.stick}
              onPointerDown={(event) => {
                event.currentTarget.setPointerCapture(event.pointerId);
                joystick(event);
              }}
              onPointerMove={(event) => {
                if (event.buttons) joystick(event);
              }}
              onPointerUp={() => {
                touchRef.current.move = { x: 0, y: 0 };
              }}
              aria-label="Walk"
              role="button"
              tabIndex={-1}
            />
            <div className={styles.touchButtons}>
              <button
                type="button"
                onPointerDown={() => {
                  touchRef.current.scan = true;
                }}
                onPointerUp={() => {
                  touchRef.current.scan = false;
                }}
                onPointerLeave={() => {
                  touchRef.current.scan = false;
                }}
              >
                Scan
              </button>
              <button
                type="button"
                onClick={() => {
                  touchRef.current.pulse = true;
                }}
              >
                Pulse
              </button>
            </div>
          </div>
        </>
      ) : null}

      {!started ? (
        <section className={styles.card}>
          <p className={styles.kicker}>Blackout</p>
          <h1>Scan the dark.</h1>
          <p>
            The museum closed in 1987 and the lights never came back on. Your
            scanner paints every surface it touches, and the paint stays. Find
            the four signal beacons, then find the way out.
          </p>
          <p className={styles.small}>You may not be alone in there.</p>
          <button type="button" onClick={() => setStarted(true)}>
            Power on the scanner
          </button>
        </section>
      ) : null}

      {result ? (
        <section className={`${styles.card} ${styles.result}`}>
          <p className={styles.kicker}>Survey complete</p>
          <h1>You found the way out.</h1>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={result.map}
            alt="Top-down map of everything you scanned"
            className={styles.map}
          />
          <p>
            {result.points.toLocaleString()} points in{" "}
            {Math.floor(result.seconds / 60)} min{" "}
            {Math.round(result.seconds % 60)} s.
          </p>
          <div className={styles.actions}>
            <button
              type="button"
              onClick={() => {
                const img = new Image();
                img.onload = () => {
                  const out = document.createElement("canvas");
                  out.width = img.width;
                  out.height = img.height;
                  out.getContext("2d")?.drawImage(img, 0, 0);
                  void downloadCanvasPng(out, "blackout-map.png");
                };
                img.src = result.map;
              }}
            >
              Save the map
            </button>
            <button
              type="button"
              onClick={() => {
                setResult(null);
                setRun((value) => value + 1);
              }}
            >
              Survey again
            </button>
          </div>
        </section>
      ) : null}
    </main>
  );
}
