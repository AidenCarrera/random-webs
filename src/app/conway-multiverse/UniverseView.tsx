"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";
import {
  ArrowLeft,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  CircleDot,
  Shuffle,
  Trash2,
} from "lucide-react";

import { drawWorld, type BoardLayout } from "./lib/draw";
import {
  birthBit,
  COLUMNS,
  familyLabel,
  GRID,
  landmarkFor,
  LANDMARKS,
  locate,
  NEIGHBOR_COUNTS,
  ROWS,
  ruleAt,
  ruleString,
  survivalBit,
  type Rule,
} from "./lib/rules";
import {
  clearWorld,
  createWorld,
  forecast,
  resizeWorld,
  seedSoup,
  setCell,
  setRule,
  stepWorld,
  type World,
} from "./lib/world";
import { SPEEDS, Transport, type TransportProps } from "./Transport";
import { isTypingTarget } from "@/lib/keyboard";
import styles from "./styles.module.css";

type Stroke = { value: 0 | 1; last: number };

const TRAVEL = [
  { dc: 0, dr: -1, icon: ChevronUp, area: "up" },
  { dc: -1, dr: 0, icon: ChevronLeft, area: "left" },
  { dc: 1, dr: 0, icon: ChevronRight, area: "right" },
  { dc: 0, dr: 1, icon: ChevronDown, area: "down" },
] as const;

const LANDMARK_SPOTS = LANDMARKS.map((entry) => locate(entry.rule)!);

function describe(rule: Rule, at: ReturnType<typeof locate>) {
  const landmark = landmarkFor(rule);
  if (landmark) return { title: landmark.name, note: landmark.note };
  if (!at) {
    return {
      title: "Off the map",
      note: "Its birth or survival counts have a gap, so it isn't one of the 2,116 connected universes on the map.",
    };
  }
  const birth = familyLabel(ROWS.family[at.row]);
  const survival = familyLabel(COLUMNS.family[at.col]);
  return {
    title: "Uncharted universe",
    note: `One of the 2,116 on the map, in the B${birth} · S${survival} family.`,
  };
}

/** The whole map in miniature, with the current universe marked. */
function Minimap({
  at,
  onPick,
}: {
  at: { col: number; row: number } | null;
  onPick: (rule: Rule) => void;
}) {
  const families = [];
  for (let row = 0; row < 10; row += 1) {
    for (let col = 0; col < 10; col += 1) {
      const x = COLUMNS.familyStart[col];
      const y = ROWS.familyStart[row];
      families.push(
        <rect
          key={`${row}-${col}`}
          x={x + 0.35}
          y={y + 0.35}
          width={COLUMNS.familyStart[col + 1] - x - 0.7}
          height={ROWS.familyStart[row + 1] - y - 0.7}
          rx={0.6}
        />,
      );
    }
  }

  return (
    <svg
      className={styles.minimap}
      viewBox={`0 0 ${GRID} ${GRID}`}
      role="img"
      aria-label={
        at
          ? `Position on the map: column ${at.col + 1}, row ${at.row + 1} of ${GRID}`
          : "Not on the map"
      }
      onClick={(event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        const col = Math.floor(
          ((event.clientX - rect.left) / rect.width) * GRID,
        );
        const row = Math.floor(
          ((event.clientY - rect.top) / rect.height) * GRID,
        );
        if (col >= 0 && row >= 0 && col < GRID && row < GRID) {
          onPick(ruleAt(col, row));
        }
      }}
    >
      <g className={styles.minimapFamilies}>{families}</g>
      <g className={styles.minimapLandmarks}>
        {LANDMARK_SPOTS.map(({ col, row }) => (
          <rect key={`${col}-${row}`} x={col} y={row} width={1} height={1} />
        ))}
      </g>
      {at && (
        <g className={styles.minimapHere}>
          <line x1={at.col + 0.5} x2={at.col + 0.5} y1={0} y2={GRID} />
          <line x1={0} x2={GRID} y1={at.row + 0.5} y2={at.row + 0.5} />
          <rect
            x={at.col - 0.5}
            y={at.row - 0.5}
            width={2}
            height={2}
            rx={0.4}
          />
        </g>
      )}
    </svg>
  );
}

type Props = TransportProps & {
  rule: Rule;
  onRuleChange: (rule: Rule) => void;
  onExit: () => void;
};

export function UniverseView({
  rule,
  onRuleChange,
  onExit,
  ...transport
}: Props) {
  const { running, speed, onRunningChange } = transport;
  const interval = SPEEDS[speed].interval;
  const [stats, setStats] = useState({ generation: 0, population: 0 });
  const [showFates, setShowFates] = useState(true);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const worldRef = useRef<World | null>(null);
  const layoutRef = useRef<BoardLayout>({ cell: 10, ox: 0, oy: 0 });
  const lastStepRef = useRef(0);
  const resumeAtRef = useRef(0);
  const hoverRef = useRef(-1);
  const strokeRef = useRef<Stroke | null>(null);

  const at = locate(rule);
  const { title, note } = describe(rule, at);
  const neighbor = (dc: number, dr: number) => {
    if (!at) return null;
    const col = at.col + dc;
    const row = at.row + dr;
    return col < 0 || row < 0 || col >= GRID || row >= GRID
      ? null
      : ruleAt(col, row);
  };
  const travel = (dc: number, dr: number) => {
    const destination = neighbor(dc, dr);
    if (destination !== null) onRuleChange(destination);
  };

  // A new rule takes over the board as it is, from the next generation on.
  useEffect(() => {
    const world = worldRef.current;
    if (world && world.rule !== rule) setRule(world, rule);
  }, [rule]);

  const step = () => {
    const world = worldRef.current;
    if (!world) return;
    stepWorld(world);
    lastStepRef.current = performance.now();
  };

  const reseed = () => {
    const world = worldRef.current;
    if (!world) return;
    seedSoup(world);
    lastStepRef.current = performance.now();
  };

  const clear = () => {
    const world = worldRef.current;
    if (world) clearWorld(world);
  };

  const onFrame = (now: number, ctx: CanvasRenderingContext2D) => {
    const world = worldRef.current;
    if (!world) return;

    // Drawing holds time still, then it waits a beat before moving on. A
    // board that can't change (empty, with no birth from nothing) just waits.
    const canChange =
      world.population > 0 || (world.phases[world.phase] & 1) !== 0;
    if (strokeRef.current) resumeAtRef.current = now + interval;
    else if (
      running &&
      canChange &&
      now >= resumeAtRef.current &&
      now - lastStepRef.current >= interval
    ) {
      step();
    }

    const dpr = ctx.canvas.width / ctx.canvas.clientWidth || 1;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawWorld(ctx, world, layoutRef.current, showFates, hoverRef.current);

    if (
      stats.generation !== world.generation ||
      stats.population !== world.population
    ) {
      setStats({ generation: world.generation, population: world.population });
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

    const cell = window.matchMedia("(pointer: coarse)").matches ? 12 : 10;
    const cols = Math.max(16, Math.floor(width / cell));
    const rows = Math.max(16, Math.floor(height / cell));
    const world = worldRef.current;
    if (!world) {
      worldRef.current = createWorld(cols, rows, rule);
      seedSoup(worldRef.current);
    } else if (world.cols !== cols || world.rows !== rows) {
      worldRef.current = resizeWorld(world, cols, rows);
    }
    layoutRef.current = {
      cell,
      ox: Math.floor((width - cols * cell) / 2),
      oy: Math.floor((height - rows * cell) / 2),
    };
  };
  const resizeEvent = useEffectEvent(onResize);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const observer = new ResizeObserver(() => resizeEvent(canvas));
    observer.observe(canvas);

    let frame = requestAnimationFrame(function loop(now) {
      frameEvent(now, ctx);
      frame = requestAnimationFrame(loop);
    });

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, []);

  const onKey = useEffectEvent((event: KeyboardEvent) => {
    if (isTypingTarget(event.target)) return;
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    const key = event.key.toLowerCase();
    const arrows: Record<string, [number, number]> = {
      arrowup: [0, -1],
      arrowdown: [0, 1],
      arrowleft: [-1, 0],
      arrowright: [1, 0],
    };

    if (key in arrows) {
      event.preventDefault();
      travel(...arrows[key]);
    } else if (key === " ") {
      if (event.target instanceof HTMLButtonElement) return;
      event.preventDefault();
      onRunningChange(!running);
    } else if (key === "n" || key === ".") {
      onRunningChange(false);
      step();
    } else if (key === "x") {
      reseed();
    } else if (key === "c") {
      clear();
    } else if (key === "f") {
      setShowFates((value) => !value);
    } else if (key === "escape") {
      onExit();
    }
  });

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => onKey(event);
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  const cellAt = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const world = worldRef.current;
    if (!world) return -1;
    const { cell, ox, oy } = layoutRef.current;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = Math.floor((event.clientX - rect.left - ox) / cell);
    const y = Math.floor((event.clientY - rect.top - oy) / cell);
    if (x < 0 || y < 0 || x >= world.cols || y >= world.rows) return -1;
    return y * world.cols + x;
  };

  const paintTo = (index: number) => {
    const world = worldRef.current;
    const stroke = strokeRef.current;
    if (!world || !stroke || index < 0) return;

    // Fill in the cells between pointer samples so fast strokes stay unbroken.
    const from = stroke.last < 0 ? index : stroke.last;
    const [x0, y0] = [from % world.cols, Math.floor(from / world.cols)];
    const [x1, y1] = [index % world.cols, Math.floor(index / world.cols)];
    const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
    let changed = false;
    for (let i = 0; i <= steps; i += 1) {
      const x = Math.round(x0 + ((x1 - x0) * i) / steps);
      const y = Math.round(y0 + ((y1 - y0) * i) / steps);
      if (setCell(world, y * world.cols + x, stroke.value)) changed = true;
    }
    if (changed) forecast(world);
    stroke.last = index;
  };

  return (
    <>
      <header className={styles.header}>
        <div className={styles.heading}>
          <button
            type="button"
            className={styles.back}
            onClick={onExit}
            aria-label="Back to the map"
            title="Back to the map (Esc)"
          >
            <ArrowLeft aria-hidden="true" />
          </button>
          <h1>Conway Multiverse</h1>
        </div>
        <dl className={styles.stats}>
          <div>
            <dt>Gen</dt>
            <dd>
              <output aria-label="Generation">{stats.generation}</output>
            </dd>
          </div>
          <div>
            <dt>Pop</dt>
            <dd>
              <output aria-label="Population">{stats.population}</output>
            </dd>
          </div>
        </dl>
      </header>

      <div className={styles.universe}>
        <aside className={styles.panel} aria-label="Universe">
          <div className={styles.identity}>
            <output className={styles.rule} aria-label="Rule">
              {ruleString(rule)}
            </output>
            <h2 className={styles.title}>{title}</h2>
            <p className={styles.note}>{note}</p>
          </div>

          <div className={styles.laws}>
            {(
              [
                ["Born with", "Birth", birthBit],
                ["Survives with", "Survival", survivalBit],
              ] as const
            ).map(([legend, label, bit]) => (
              <fieldset key={label} className={styles.counts}>
                <legend>{legend}</legend>
                <div>
                  {NEIGHBOR_COUNTS.map((n) => (
                    <button
                      key={n}
                      type="button"
                      className={styles.count}
                      aria-pressed={(rule & bit(n)) !== 0}
                      aria-label={`${label} with ${n} neighbors`}
                      onClick={() => onRuleChange(rule ^ bit(n))}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </fieldset>
            ))}
          </div>

          <div className={styles.travel}>
            <Minimap at={at} onPick={onRuleChange} />
            <div className={styles.pad} role="group" aria-label="Travel">
              {TRAVEL.map(({ dc, dr, icon: Icon, area }) => {
                const destination = neighbor(dc, dr);
                return (
                  <button
                    key={area}
                    type="button"
                    className={styles.iconButton}
                    style={{ gridArea: area }}
                    disabled={destination === null}
                    onClick={() => travel(dc, dr)}
                    aria-label={
                      destination === null
                        ? `Can't travel ${area}`
                        : `Travel to ${ruleString(destination)}`
                    }
                    title={
                      destination === null
                        ? undefined
                        : `${ruleString(destination)} (${area} arrow)`
                    }
                  >
                    <Icon aria-hidden="true" />
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        <div className={styles.board}>
          <canvas
            ref={canvasRef}
            className={styles.canvas}
            aria-label={`Universe ${ruleString(rule)}. Click or drag to draw and erase cells.`}
            onContextMenu={(event) => event.preventDefault()}
            onPointerDown={(event) => {
              const world = worldRef.current;
              const index = cellAt(event);
              if (!world || index < 0) return;
              event.currentTarget.setPointerCapture(event.pointerId);
              hoverRef.current = index;
              strokeRef.current = {
                value: event.button === 2 || world.alive[index] ? 0 : 1,
                last: -1,
              };
              paintTo(index);
            }}
            onPointerMove={(event) => {
              const index = cellAt(event);
              if (event.pointerType === "mouse" || strokeRef.current) {
                hoverRef.current = index;
              }
              paintTo(index);
            }}
            onPointerUp={(event) => {
              strokeRef.current = null;
              if (event.pointerType !== "mouse") hoverRef.current = -1;
            }}
            onPointerCancel={() => {
              strokeRef.current = null;
              hoverRef.current = -1;
            }}
            onPointerLeave={() => {
              if (!strokeRef.current) hoverRef.current = -1;
            }}
          />
          {stats.population === 0 && (
            <p className={styles.empty}>Draw some cells, or try a new soup.</p>
          )}
        </div>

        <div className={styles.dock}>
          <div className={styles.toolbar} role="toolbar" aria-label="Controls">
            <Transport {...transport} onStep={step} />
            <span aria-hidden="true" className={styles.divider} />
            <button
              type="button"
              className={styles.iconButton}
              onClick={() => setShowFates((value) => !value)}
              aria-pressed={showFates}
              aria-label="Show fates"
              title="Seeds mark births and donuts mark deaths next generation (F)"
            >
              <CircleDot aria-hidden="true" />
            </button>
            <button
              type="button"
              className={styles.iconButton}
              onClick={reseed}
              aria-label="New soup"
              title="New soup (X)"
            >
              <Shuffle aria-hidden="true" />
            </button>
            <button
              type="button"
              className={styles.iconButton}
              onClick={clear}
              aria-label="Clear"
              title="Clear (C)"
            >
              <Trash2 aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
