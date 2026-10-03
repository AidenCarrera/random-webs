"use client";

import {
  useEffect,
  useEffectEvent,
  useRef,
  useState,
  type RefObject,
} from "react";
import {
  Info,
  Maximize,
  MapPin,
  Shuffle,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";

import {
  cameraOn,
  clampCamera,
  drawMap,
  fitCamera,
  RULER,
  tileRect,
  zoomAround,
  type Camera,
} from "./lib/draw";
import {
  createMultiverse,
  MAP_HEIGHT,
  MAP_WIDTH,
  paintMultiverse,
  seedMultiverse,
  stepMultiverse,
  universeAt,
  type Multiverse,
} from "./lib/multiverse";
import {
  GRID,
  LANDMARKS,
  landmarkFor,
  locate,
  ruleAt,
  ruleString,
  UNIVERSES,
  type Rule,
} from "./lib/rules";
import { SPEEDS, Transport, type TransportProps } from "./Transport";
import { isTypingTarget } from "@/lib/keyboard";
import styles from "./styles.module.css";

/** Map state that outlives the map, so a trip into a universe can return. */
export type MapSession = {
  multiverse: Multiverse | null;
  camera: Camera | null;
};

type Pixels = {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  image: ImageData;
  data: Uint32Array;
};

type Gesture =
  | { kind: "pan"; x: number; y: number; camera: Camera; moved: boolean }
  | { kind: "pinch"; distance: number; x: number; y: number; camera: Camera };

type Flight = { from: Camera; to: Camera; start: number };

const FLIGHT_MS = 420;
const PULSE_MS = 1400;
const formatCount = new Intl.NumberFormat("en-US").format;

const easeInOut = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;

type Props = TransportProps & {
  sessionRef: RefObject<MapSession>;
  /** The universe just visited, ringed when the map opens. */
  focus: Rule | null;
  onEnter: (rule: Rule) => void;
};

export function MultiverseMap({
  sessionRef,
  focus,
  onEnter,
  ...transport
}: Props) {
  const { running, speed, onRunningChange } = transport;
  const interval = SPEEDS[speed].interval;
  const [stats, setStats] = useState({ generation: 0, living: UNIVERSES });
  const [hover, setHover] = useState<{
    universe: number;
    population: number;
  } | null>(null);
  const [panel, setPanel] = useState<"landmarks" | "about" | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tipRef = useRef<HTMLDivElement>(null);
  const sizeRef = useRef({ width: 0, height: 0 });
  const pixelsRef = useRef<Pixels | null>(null);
  const imageStaleRef = useRef(true);
  const frameStaleRef = useRef(true);
  const lastStepRef = useRef(0);
  const hoverRef = useRef(-1);
  const pointersRef = useRef(new Map<number, { x: number; y: number }>());
  const gestureRef = useRef<Gesture | null>(null);
  const flightRef = useRef<Flight | null>(null);
  const pulseStartRef = useRef(-PULSE_MS);
  const fontRef = useRef("ui-monospace, monospace");

  const focusAt = focus === null ? null : locate(focus);
  const focusUniverse = focusAt ? focusAt.row * GRID + focusAt.col : -1;
  const hoverRule =
    hover === null
      ? null
      : ruleAt(hover.universe % GRID, Math.floor(hover.universe / GRID));
  const hoverLandmark = hoverRule === null ? undefined : landmarkFor(hoverRule);

  const setCamera = (camera: Camera) => {
    const { width, height } = sizeRef.current;
    sessionRef.current.camera = clampCamera(camera, width, height);
    frameStaleRef.current = true;
  };

  const flyTo = (to: Camera) => {
    const from = sessionRef.current.camera;
    const { width, height } = sizeRef.current;
    if (!from) return;
    flightRef.current = {
      from,
      to: clampCamera(to, width, height),
      start: performance.now(),
    };
  };

  const zoomBy = (factor: number) => {
    const camera = sessionRef.current.camera;
    const { width, height } = sizeRef.current;
    if (!camera) return;
    flyTo(
      zoomAround(
        flightRef.current?.to ?? camera,
        factor,
        (width + RULER.left) / 2,
        (height + RULER.top) / 2,
      ),
    );
  };

  const fit = () => {
    const { width, height } = sizeRef.current;
    flyTo(fitCamera(width, height));
  };

  const step = () => {
    const multiverse = sessionRef.current.multiverse;
    if (!multiverse) return;
    stepMultiverse(multiverse);
    imageStaleRef.current = true;
    lastStepRef.current = performance.now();
  };

  const reseed = () => {
    const multiverse = sessionRef.current.multiverse;
    if (!multiverse) return;
    seedMultiverse(multiverse);
    imageStaleRef.current = true;
    lastStepRef.current = performance.now();
  };

  const onFrame = (now: number, ctx: CanvasRenderingContext2D) => {
    const multiverse = sessionRef.current.multiverse;
    const pixels = pixelsRef.current;
    const { width, height } = sizeRef.current;
    if (!multiverse || !pixels || width === 0) return;

    if (running && now - lastStepRef.current >= interval) step();

    if (imageStaleRef.current) {
      paintMultiverse(multiverse, pixels.data);
      pixels.ctx.putImageData(pixels.image, 0, 0);
      imageStaleRef.current = false;
      frameStaleRef.current = true;
    }

    const flight = flightRef.current;
    if (flight) {
      // Glide the center point and the zoom (in log space) together.
      const t = easeInOut(Math.min(1, (now - flight.start) / FLIGHT_MS));
      const cx = (width + RULER.left) / 2;
      const cy = (height + RULER.top) / 2;
      const center = (camera: Camera) => ({
        x: (cx - camera.x) / camera.zoom,
        y: (cy - camera.y) / camera.zoom,
      });
      const a = center(flight.from);
      const b = center(flight.to);
      const zoom = Math.exp(
        Math.log(flight.from.zoom) +
          (Math.log(flight.to.zoom) - Math.log(flight.from.zoom)) * t,
      );
      sessionRef.current.camera = {
        zoom,
        x: cx - (a.x + (b.x - a.x) * t) * zoom,
        y: cy - (a.y + (b.y - a.y) * t) * zoom,
      };
      frameStaleRef.current = true;
      if (t >= 1) flightRef.current = null;
    }

    const pulse = Math.max(0, 1 - (now - pulseStartRef.current) / PULSE_MS);
    if (pulse > 0) frameStaleRef.current = true;

    const camera = sessionRef.current.camera;
    if (frameStaleRef.current && camera) {
      const dpr = ctx.canvas.width / width || 1;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      drawMap(ctx, pixels.canvas, camera, width, height, {
        hover: hoverRef.current,
        focus: focusUniverse,
        pulse: pulse * pulse,
        font: fontRef.current,
      });
      frameStaleRef.current = false;
    }

    if (
      stats.generation !== multiverse.generation ||
      stats.living !== multiverse.living
    ) {
      setStats({
        generation: multiverse.generation,
        living: multiverse.living,
      });
    }
    const universe = hoverRef.current;
    const population = universe < 0 ? 0 : multiverse.population[universe];
    if (
      universe < 0
        ? hover !== null
        : hover?.universe !== universe || hover.population !== population
    ) {
      setHover(universe < 0 ? null : { universe, population });
    }
  };
  const frameEvent = useEffectEvent(onFrame);

  const onResize = (canvas: HTMLCanvasElement) => {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    if (width === 0 || height === 0) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);

    const previous = sizeRef.current;
    sizeRef.current = { width, height };
    const camera = sessionRef.current.camera;

    if (camera && previous.width > 0) {
      // Keep whatever was in the middle in the middle.
      setCamera({
        zoom: camera.zoom,
        x: camera.x + (width - previous.width) / 2,
        y: camera.y + (height - previous.height) / 2,
      });
      return;
    }

    setCamera(camera ?? fitCamera(width, height));
    if (focusUniverse < 0) return;

    // Back from a universe: make sure it's on screen, then ring it.
    const current = sessionRef.current.camera!;
    const tile = tileRect(current, focusUniverse);
    const offscreen =
      tile.x < RULER.left ||
      tile.y < RULER.top ||
      tile.x + tile.size > width ||
      tile.y + tile.size > height;
    if (offscreen) flyTo(cameraOn(focusUniverse, current.zoom, width, height));
    pulseStartRef.current = performance.now();
  };
  const resizeEvent = useEffectEvent(onResize);

  const onWheel = (event: WheelEvent) => {
    const camera = sessionRef.current.camera;
    if (!camera) return;
    event.preventDefault();
    flightRef.current = null;
    const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? 400 : 1;
    // Trackpad pinches arrive as ctrl + wheel with small deltas.
    const rate = event.ctrlKey ? 0.01 : 0.0015;
    const factor = Math.exp(-event.deltaY * unit * rate);
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    setCamera(
      zoomAround(
        camera,
        factor,
        event.clientX - rect.left,
        event.clientY - rect.top,
      ),
    );
  };
  const wheelEvent = useEffectEvent(onWheel);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const session = sessionRef.current;
    session.multiverse ??= createMultiverse();

    const source = document.createElement("canvas");
    source.width = MAP_WIDTH;
    source.height = MAP_HEIGHT;
    const sourceCtx = source.getContext("2d");
    if (!sourceCtx) return;
    const image = sourceCtx.createImageData(MAP_WIDTH, MAP_HEIGHT);
    pixelsRef.current = {
      canvas: source,
      ctx: sourceCtx,
      image,
      data: new Uint32Array(image.data.buffer),
    };
    // Everything is painted fresh into the new buffer.
    session.multiverse.stale.fill(1);
    imageStaleRef.current = true;

    const mono = getComputedStyle(canvas)
      .getPropertyValue("--font-geist-mono")
      .trim();
    if (mono) fontRef.current = `${mono}, ui-monospace, monospace`;

    const observer = new ResizeObserver(() => resizeEvent(canvas));
    observer.observe(canvas);

    const handleWheel = (event: WheelEvent) => wheelEvent(event);
    canvas.addEventListener("wheel", handleWheel, { passive: false });

    let frame = requestAnimationFrame(function loop(now) {
      frameEvent(now, ctx);
      frame = requestAnimationFrame(loop);
    });

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      canvas.removeEventListener("wheel", handleWheel);
      pixelsRef.current = null;
    };
  }, [sessionRef]);

  const onKey = useEffectEvent((event: KeyboardEvent) => {
    if (isTypingTarget(event.target)) return;
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    const key = event.key.toLowerCase();

    if (key === " ") {
      if (event.target instanceof HTMLButtonElement) return;
      event.preventDefault();
      onRunningChange(!running);
    } else if (key === "n" || key === ".") {
      onRunningChange(false);
      step();
    } else if (key === "x") {
      reseed();
    } else if (key === "+" || key === "=") {
      zoomBy(1.5);
    } else if (key === "-" || key === "_") {
      zoomBy(1 / 1.5);
    } else if (key === "0") {
      fit();
    } else if (key === "escape") {
      setPanel(null);
    }
  });

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => onKey(event);
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  const local = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };

  const universeUnder = (x: number, y: number) => {
    const camera = sessionRef.current.camera;
    if (!camera || x < RULER.left || y < RULER.top) return -1;
    return universeAt(
      Math.floor((x - camera.x) / camera.zoom),
      Math.floor((y - camera.y) / camera.zoom),
    );
  };

  const moveTip = (x: number, y: number) => {
    const tip = tipRef.current;
    if (!tip) return;
    const { width, height } = sizeRef.current;
    const left =
      x + 16 + tip.offsetWidth > width ? x - 12 - tip.offsetWidth : x + 16;
    const top =
      y + 16 + tip.offsetHeight > height ? y - 12 - tip.offsetHeight : y + 16;
    tip.style.transform = `translate(${Math.round(left)}px, ${Math.round(top)}px)`;
  };

  const setHoverUniverse = (universe: number) => {
    if (hoverRef.current === universe) return;
    hoverRef.current = universe;
    frameStaleRef.current = true;
  };

  const startGesture = () => {
    const camera = sessionRef.current.camera;
    const points = [...pointersRef.current.values()];
    if (!camera || points.length === 0) {
      gestureRef.current = null;
    } else if (points.length === 1) {
      // A pinch that drops to one finger keeps panning, and never taps.
      const moved = gestureRef.current !== null;
      gestureRef.current = { kind: "pan", ...points[0], camera, moved };
    } else {
      const [a, b] = points;
      gestureRef.current = {
        kind: "pinch",
        distance: Math.hypot(a.x - b.x, a.y - b.y) || 1,
        x: (a.x + b.x) / 2,
        y: (a.y + b.y) / 2,
        camera,
      };
    }
  };

  return (
    <>
      <header className={styles.header}>
        <h1>Conway Multiverse</h1>
        <dl className={styles.stats}>
          <div>
            <dt>Gen</dt>
            <dd>
              <output aria-label="Generation">{stats.generation}</output>
            </dd>
          </div>
          <div>
            <dt>Alive</dt>
            <dd>
              <output aria-label="Living universes">
                {formatCount(stats.living)}
              </output>
              <span className={styles.of}> / {formatCount(UNIVERSES)}</span>
            </dd>
          </div>
        </dl>
      </header>

      <div className={styles.board}>
        <canvas
          ref={canvasRef}
          className={styles.mapCanvas}
          aria-label="Map of 2,116 life-like universes. Drag to pan, scroll or pinch to zoom, and click a universe to enter it."
          onContextMenu={(event) => event.preventDefault()}
          onPointerDown={(event) => {
            if (event.button !== 0) return;
            event.currentTarget.setPointerCapture(event.pointerId);
            pointersRef.current.set(event.pointerId, local(event));
            flightRef.current = null;
            if (pointersRef.current.size > 1) setHoverUniverse(-1);
            gestureRef.current = null;
            startGesture();
          }}
          onPointerMove={(event) => {
            const point = local(event);
            const gesture = gestureRef.current;

            if (!pointersRef.current.has(event.pointerId) || !gesture) {
              if (event.pointerType !== "mouse") return;
              const universe = universeUnder(point.x, point.y);
              setHoverUniverse(universe);
              moveTip(point.x, point.y);
              event.currentTarget.style.cursor =
                universe < 0 ? "grab" : "pointer";
              return;
            }

            pointersRef.current.set(event.pointerId, point);
            if (gesture.kind === "pan") {
              const dx = point.x - gesture.x;
              const dy = point.y - gesture.y;
              if (!gesture.moved && Math.hypot(dx, dy) < 5) return;
              gesture.moved = true;
              setHoverUniverse(-1);
              event.currentTarget.style.cursor = "grabbing";
              setCamera({
                ...gesture.camera,
                x: gesture.camera.x + dx,
                y: gesture.camera.y + dy,
              });
            } else {
              const [a, b] = [...pointersRef.current.values()];
              const distance = Math.hypot(a.x - b.x, a.y - b.y) || 1;
              const x = (a.x + b.x) / 2;
              const y = (a.y + b.y) / 2;
              // The map point under the starting midpoint follows the fingers.
              const zoomed = zoomAround(
                gesture.camera,
                distance / gesture.distance,
                gesture.x,
                gesture.y,
              );
              setCamera({
                ...zoomed,
                x: zoomed.x + x - gesture.x,
                y: zoomed.y + y - gesture.y,
              });
            }
          }}
          onPointerUp={(event) => {
            const gesture = gestureRef.current;
            pointersRef.current.delete(event.pointerId);
            const tapped =
              gesture?.kind === "pan" &&
              !gesture.moved &&
              pointersRef.current.size === 0;
            startGesture();
            event.currentTarget.style.cursor = "";

            if (!tapped) return;
            const { x, y } = local(event);
            const universe = universeUnder(x, y);
            const multiverse = sessionRef.current.multiverse;
            if (universe >= 0 && multiverse)
              onEnter(multiverse.rules[universe]);
          }}
          onPointerCancel={(event) => {
            pointersRef.current.delete(event.pointerId);
            gestureRef.current = null;
            startGesture();
          }}
          onPointerLeave={(event) => {
            if (event.pointerType === "mouse" && !gestureRef.current) {
              setHoverUniverse(-1);
            }
          }}
        />

        <div
          ref={tipRef}
          className={styles.tip}
          hidden={hover === null}
          aria-hidden="true"
        >
          {hoverRule !== null && hover && (
            <>
              <span className={styles.tipRule}>{ruleString(hoverRule)}</span>
              {hoverLandmark && (
                <span className={styles.tipName}>{hoverLandmark.name}</span>
              )}
              <span className={styles.tipMeta}>
                {hover.population === 0
                  ? "Extinct"
                  : `${formatCount(hover.population)} cells`}
              </span>
            </>
          )}
        </div>
      </div>

      <div className={styles.dock}>
        {panel === "landmarks" && (
          <div className={styles.popover} role="group" aria-label="Landmarks">
            <p className={styles.popoverTitle}>Landmarks</p>
            <ul className={styles.landmarks}>
              {LANDMARKS.map((entry) => (
                <li key={entry.name}>
                  <button
                    type="button"
                    className={styles.landmark}
                    onClick={() => onEnter(entry.rule)}
                  >
                    <span>{entry.name}</span>
                    <span className={styles.landmarkRule}>
                      {ruleString(entry.rule)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {panel === "about" && (
          <div
            className={`${styles.popover} ${styles.about}`}
            role="group"
            aria-label="About the map"
          >
            <p className={styles.popoverTitle}>Reading the map</p>
            <p>
              Each square is a universe with its own rule, all started from the
              same random soup. A rule like <code>B3/S23</code> says a dead cell
              is born with 3 live neighbors and a live one survives with 2 or 3.
            </p>
            <p>
              The map holds every rule whose birth and survival counts are
              unbroken ranges. Rows group by where the birth range starts,
              columns by where survival starts, and inside each family the
              ranges grow upward and to the right.
            </p>
            <p>
              Colors show age: white newborns, then orange, yellow, green, and
              blue for the oldest cells. Rules with B0 show every other
              generation inverted, as Golly does, so they don&apos;t strobe.
            </p>
            <p className={styles.credit}>
              Based on{" "}
              <a
                href="https://www.youtube.com/watch?v=QK_KZv-YyOc"
                target="_blank"
                rel="noreferrer"
              >
                The Conway Multiverse
              </a>{" "}
              by carykh.
            </p>
          </div>
        )}

        <div className={styles.toolbar} role="toolbar" aria-label="Controls">
          <Transport {...transport} onStep={step} />
          <button
            type="button"
            className={styles.iconButton}
            onClick={reseed}
            aria-label="New soup"
            title="New soup (X)"
          >
            <Shuffle aria-hidden="true" />
          </button>

          <span aria-hidden="true" className={styles.divider} />

          <button
            type="button"
            className={styles.iconButton}
            onClick={() => zoomBy(1 / 1.5)}
            aria-label="Zoom out"
            title="Zoom out (−)"
          >
            <ZoomOut aria-hidden="true" />
          </button>
          <button
            type="button"
            className={styles.iconButton}
            onClick={() => zoomBy(1.5)}
            aria-label="Zoom in"
            title="Zoom in (+)"
          >
            <ZoomIn aria-hidden="true" />
          </button>
          <button
            type="button"
            className={styles.iconButton}
            onClick={fit}
            aria-label="Fit map"
            title="Fit map (0)"
          >
            <Maximize aria-hidden="true" />
          </button>

          <span aria-hidden="true" className={styles.divider} />

          <button
            type="button"
            className={styles.iconButton}
            onClick={() =>
              setPanel((open) => (open === "landmarks" ? null : "landmarks"))
            }
            aria-label="Landmarks"
            aria-expanded={panel === "landmarks"}
            title="Landmarks"
          >
            {panel === "landmarks" ? (
              <X aria-hidden="true" />
            ) : (
              <MapPin aria-hidden="true" />
            )}
          </button>
          <button
            type="button"
            className={styles.iconButton}
            onClick={() =>
              setPanel((open) => (open === "about" ? null : "about"))
            }
            aria-label="About the map"
            aria-expanded={panel === "about"}
            title="About the map"
          >
            {panel === "about" ? (
              <X aria-hidden="true" />
            ) : (
              <Info aria-hidden="true" />
            )}
          </button>
        </div>
      </div>
    </>
  );
}
