"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";
import { FastForward, PencilRuler, Route } from "lucide-react";

import {
  createMaze,
  estimateSteps,
  generateMaze,
  passage,
  shortestPath,
  solveMaze,
  DIRECTIONS,
  type Algorithm,
  type Maze,
  type Solver,
} from "./lib/maze";
import { drawMaze, type Layout, type Player, type Solve } from "./lib/draw";
import { isTypingTarget } from "@/lib/keyboard";
import styles from "./styles.module.css";

type MazeSize = "S" | "M" | "L";
type Phase = "idle" | "generating" | "ready" | "solving" | "solved" | "escaped";

const ALGORITHMS: { id: Algorithm; name: string }[] = [
  { id: "backtracker", name: "Backtracker" },
  { id: "prim", name: "Prim's" },
  { id: "kruskal", name: "Kruskal's" },
];

// Depth-first search settles for the first route it finds, not the shortest.
const SOLVERS: { id: Solver; name: string; label: string; optimal: boolean }[] =
  [
    { id: "dfs", name: "DFS", label: "Depth-first search", optimal: false },
    { id: "bfs", name: "BFS", label: "Breadth-first search", optimal: true },
    { id: "astar", name: "A*", label: "A-star search", optimal: true },
  ];

// Cells along the stage's shorter side.
const SHORT_SIDE: Record<MazeSize, number> = { S: 11, M: 19, L: 31 };
const SIZE_NAMES: Record<MazeSize, string> = {
  S: "Small",
  M: "Medium",
  L: "Large",
};
const DRAFT_SECONDS = 3.2;
const SOLVE_SECONDS = 2;
const MAX_DRAG_STEPS = 8;

const KEY_DIRECTIONS: Record<string, number> = {
  ArrowUp: 0,
  ArrowRight: 1,
  ArrowDown: 2,
  ArrowLeft: 3,
  w: 0,
  d: 1,
  s: 2,
  a: 3,
};

type Draft = { run: Generator<void>; rate: number; budget: number };

const escapeVerdict = (moves: number, best: number) => {
  if (moves <= best) return "A flawless route.";
  if (best / moves >= 0.8) return "Nearly optimal.";
  if (best / moves >= 0.5) return "A few wrong turns.";
  return "The scenic route.";
};

export default function MazeGenerator() {
  const [algorithm, setAlgorithm] = useState<Algorithm>("backtracker");
  const [size, setSize] = useState<MazeSize>("M");
  const [loops, setLoops] = useState(true);
  const [solver, setSolver] = useState<Solver>("bfs");
  const [phase, setPhase] = useState<Phase>("idle");
  const [sheet, setSheet] = useState({ number: 0, cols: 0, rows: 0 });
  const [moves, setMoves] = useState(0);
  const [solution, setSolution] = useState<{
    steps: number;
    explored: number;
  } | null>(null);
  const [escaped, setEscaped] = useState<{
    moves: number;
    best: number;
  } | null>(null);

  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mazeRef = useRef<Maze | null>(null);
  const draftRef = useRef<Draft | null>(null);
  const solveRef = useRef<Solve | null>(null);
  const playerRef = useRef<Player | null>(null);
  const layoutRef = useRef<Layout>({ cell: 1, ox: 0, oy: 0 });
  const clockRef = useRef({ last: 0, settledAt: 0 });
  const dragRef = useRef(false);

  const generate = (
    options: Partial<{
      algorithm: Algorithm;
      size: MazeSize;
      loops: boolean;
    }> = {},
  ) => {
    const stage = stageRef.current;
    if (!stage || stage.clientWidth === 0) return;
    const settings = { algorithm, size, loops, ...options };
    const short = SHORT_SIDE[settings.size];
    const aspect = stage.clientWidth / stage.clientHeight;
    const cols = aspect >= 1 ? Math.min(64, Math.round(short * aspect)) : short;
    const rows = aspect >= 1 ? short : Math.min(64, Math.round(short / aspect));

    const maze = createMaze(cols, rows);
    mazeRef.current = maze;
    draftRef.current = {
      run: generateMaze(maze, settings.algorithm, settings.loops),
      rate: estimateSteps(maze, settings.algorithm) / DRAFT_SECONDS,
      budget: 0,
    };
    solveRef.current = null;
    // The start counts as visited, so the first step leaves a breadcrumb.
    const trail = new Uint8Array(cols * rows);
    trail[0] = 1;
    playerRef.current = {
      cell: 0,
      x: 0.5,
      y: 0.5,
      moves: 0,
      trail,
      bump: null,
    };

    setPhase("generating");
    setSheet((previous) => ({ number: previous.number + 1, cols, rows }));
    setMoves(0);
    setSolution(null);
    setEscaped(null);
  };

  const finishDraft = () => {
    const draft = draftRef.current;
    if (!draft) return;
    while (!draft.run.next().done) {
      // Run the generator to the end.
    }
    draftRef.current = null;
    clockRef.current.settledAt = performance.now();
    setPhase("ready");
  };

  const solve = (method: Solver = solver) => {
    const maze = mazeRef.current;
    const player = playerRef.current;
    if (!maze || !player || phase === "generating" || phase === "idle") return;
    const goal = maze.walls.length - 1;
    const source = player.cell === goal ? 0 : player.cell;

    solveRef.current = {
      run: solveMaze(maze, method, source, goal),
      heat: new Float32Array(maze.walls.length).fill(-1),
      maxHeat: 0,
      visitedAt: new Int32Array(maze.walls.length),
      explored: 0,
      budget: 0,
      rate: maze.walls.length / SOLVE_SECONDS,
      path: null,
      pathAt: 0,
    };
    setPhase("solving");
    setSolution(null);
    setEscaped(null);
  };

  const walk = (path: number[]) => {
    const maze = mazeRef.current;
    const player = playerRef.current;
    if (!maze || !player || path.length === 0) return;
    const goal = maze.walls.length - 1;

    // Moving on wipes the last solution off the sheet.
    solveRef.current = null;
    setSolution(null);

    for (const cell of path) {
      player.cell = cell;
      player.trail[cell] = 1;
      player.moves += 1;
      if (cell === goal) break;
    }
    setMoves(player.moves);

    if (player.cell === goal) {
      setEscaped({
        moves: player.moves,
        best: shortestPath(maze, 0, goal).length - 1,
      });
      setPhase("escaped");
    } else {
      setPhase("ready");
    }
  };

  const canExplore =
    phase === "ready" || phase === "solving" || phase === "solved";

  const step = (direction: number) => {
    const maze = mazeRef.current;
    const player = playerRef.current;
    if (!maze || !player || !canExplore) return;
    const next = passage(maze, player.cell, direction);
    if (next < 0) {
      const { dx, dy } = DIRECTIONS[direction];
      player.bump = { at: performance.now(), dx, dy };
      return;
    }
    walk([next]);
  };

  const onFrame = (now: number, ctx: CanvasRenderingContext2D) => {
    const canvas = ctx.canvas;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    if (width === 0 || height === 0) return;
    if (
      canvas.width !== Math.round(width * dpr) ||
      canvas.height !== Math.round(height * dpr)
    ) {
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
    }

    const clock = clockRef.current;
    const dt = clock.last ? Math.min(0.05, (now - clock.last) / 1000) : 1 / 60;
    clock.last = now;

    if (!mazeRef.current) generate();
    const maze = mazeRef.current;
    const player = playerRef.current;
    if (!maze || !player) return;

    const draft = draftRef.current;
    if (draft) {
      draft.budget += dt * draft.rate;
      for (; draft.budget >= 1; draft.budget -= 1) {
        if (draft.run.next().done) {
          draftRef.current = null;
          clock.settledAt = now;
          setPhase("ready");
          break;
        }
      }
    }

    const search = solveRef.current;
    if (search && !search.path) {
      search.budget += dt * search.rate;
      for (; search.budget >= 1; search.budget -= 1) {
        const settled = search.run.next();
        if (settled.done) {
          search.path = settled.value;
          search.pathAt = now;
          setPhase("solved");
          setSolution({
            steps: settled.value.length - 1,
            explored: search.explored,
          });
          break;
        }
        search.heat[settled.value.cell] = settled.value.distance;
        search.maxHeat = Math.max(search.maxHeat, settled.value.distance);
        search.visitedAt[settled.value.cell] = search.explored;
        search.explored += 1;
      }
    }

    const ease = Math.min(1, dt * 18);
    player.x += ((player.cell % maze.cols) + 0.5 - player.x) * ease;
    player.y += (Math.floor(player.cell / maze.cols) + 0.5 - player.y) * ease;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    layoutRef.current = drawMaze(ctx, width, height, maze, {
      now,
      drafting: draftRef.current !== null,
      kruskal: maze.parent !== null,
      settle: Math.min(1, (now - clock.settledAt) / 900),
      solve: solveRef.current,
      player,
    });
  };
  const frameEvent = useEffectEvent(onFrame);

  useEffect(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    clockRef.current.last = 0;
    let frame = requestAnimationFrame(function loop(now) {
      frameEvent(now, ctx);
      frame = requestAnimationFrame(loop);
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  const onKey = useEffectEvent((event: KeyboardEvent) => {
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    if (isTypingTarget(event.target)) return;

    const direction =
      KEY_DIRECTIONS[event.key] ?? KEY_DIRECTIONS[event.key.toLowerCase()];
    if (direction !== undefined) {
      event.preventDefault();
      step(direction);
    } else if (event.key.toLowerCase() === "g") {
      generate();
    } else if (event.key === "Enter") {
      if (event.target instanceof HTMLButtonElement) return;
      if (phase === "generating") finishDraft();
      else solve();
    }
  });

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => onKey(event);
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  const followPointer = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const maze = mazeRef.current;
    const player = playerRef.current;
    if (!maze || !player || !canExplore) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const { cell, ox, oy } = layoutRef.current;
    const x = Math.floor((event.clientX - rect.left - ox) / cell);
    const y = Math.floor((event.clientY - rect.top - oy) / cell);
    if (x < 0 || y < 0 || x >= maze.cols || y >= maze.rows) return;
    const target = y * maze.cols + x;
    if (target === player.cell) return;

    // Short hops only: the explorer follows your finger, not a teleport.
    const path = shortestPath(maze, player.cell, target);
    if (path.length > 1 && path.length <= MAX_DRAG_STEPS + 1)
      walk(path.slice(1));
  };

  const chosen = SOLVERS.find((entry) => entry.id === solver)!;

  const status =
    phase === "generating"
      ? "Drafting…"
      : phase === "solving"
        ? `${chosen.name} searching…`
        : phase === "solved" && solution
          ? `Solved in ${solution.steps} steps`
          : phase === "escaped"
            ? "Escaped"
            : phase === "ready"
              ? "Ready to explore"
              : "—";

  return (
    <main className={styles.maze}>
      <div className={styles.sheet}>
        <div ref={stageRef} className={styles.stage}>
          <canvas
            ref={canvasRef}
            className={styles.canvas}
            aria-label="Maze. Drag from the explorer or use the arrow keys to move."
            onPointerDown={(event) => {
              if (!canExplore) return;
              event.currentTarget.setPointerCapture(event.pointerId);
              dragRef.current = true;
              followPointer(event);
            }}
            onPointerMove={(event) => {
              if (dragRef.current) followPointer(event);
            }}
            onPointerUp={() => {
              dragRef.current = false;
            }}
            onPointerCancel={() => {
              dragRef.current = false;
            }}
          />

          {escaped && (
            <div className={styles.escape} role="status">
              <p className={styles.escapeTitle}>Escaped!</p>
              <p>
                {escaped.moves} moves · shortest route {escaped.best}
              </p>
              <p className={styles.verdict}>
                {Math.round((escaped.best / escaped.moves) * 100)}% efficient.{" "}
                {escapeVerdict(escaped.moves, escaped.best)}
              </p>
              <div className={styles.escapeActions}>
                <button
                  type="button"
                  className={styles.primary}
                  onClick={() => generate()}
                >
                  <PencilRuler aria-hidden="true" />
                  Draft another
                </button>
                <button
                  type="button"
                  className={styles.secondary}
                  onClick={() => solve()}
                >
                  <Route aria-hidden="true" />
                  {chosen.optimal ? "Show shortest" : "Show a route"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <aside className={styles.panel} aria-label="Maze controls">
        <header className={styles.panelHeader}>
          <h1>Labyrinth</h1>
          <p>
            Guide the <span className={styles.dot} /> explorer to the{" "}
            <span className={styles.diamond} /> exit. Drag through the corridors
            or use the arrow keys.
          </p>
        </header>

        <div className={styles.field}>
          <span className={styles.caption} id="maze-algorithm">
            Method
          </span>
          <div
            className={styles.segmented}
            role="radiogroup"
            aria-labelledby="maze-algorithm"
          >
            {ALGORITHMS.map((entry) => (
              <button
                key={entry.id}
                type="button"
                role="radio"
                aria-checked={algorithm === entry.id}
                onClick={() => {
                  setAlgorithm(entry.id);
                  generate({ algorithm: entry.id });
                }}
              >
                {entry.name}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.fieldRow}>
          <div className={styles.field}>
            <span className={styles.caption} id="maze-size">
              Size
            </span>
            <div
              className={styles.segmented}
              role="radiogroup"
              aria-labelledby="maze-size"
            >
              {(["S", "M", "L"] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  role="radio"
                  aria-label={SIZE_NAMES[option]}
                  aria-checked={size === option}
                  onClick={() => {
                    setSize(option);
                    generate({ size: option });
                  }}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
          <div className={styles.field}>
            <span className={styles.caption} id="maze-loops">
              Loops
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={loops}
              aria-labelledby="maze-loops"
              className={styles.switch}
              onClick={() => {
                setLoops(!loops);
                generate({ loops: !loops });
              }}
            >
              <span />
            </button>
          </div>
        </div>

        <div className={styles.field}>
          <span className={styles.caption} id="maze-solver">
            Solver
          </span>
          <div
            className={styles.segmented}
            role="radiogroup"
            aria-labelledby="maze-solver"
          >
            {SOLVERS.map((entry) => (
              <button
                key={entry.id}
                type="button"
                role="radio"
                aria-label={entry.label}
                aria-checked={solver === entry.id}
                onClick={() => {
                  setSolver(entry.id);
                  // A search already on the sheet is redrawn by the new solver.
                  if (phase === "solving" || phase === "solved")
                    solve(entry.id);
                }}
              >
                {entry.name}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.primary}
            onClick={() => generate()}
          >
            <PencilRuler aria-hidden="true" />
            Draft new maze
          </button>
          {/* Skipping sits where Solve will be, so a double click never
              throws away the maze it just finished. */}
          {phase === "generating" ? (
            <button
              type="button"
              className={styles.secondary}
              onClick={finishDraft}
            >
              <FastForward aria-hidden="true" />
              Finish drafting
            </button>
          ) : (
            <button
              type="button"
              className={styles.secondary}
              onClick={() => solve()}
              disabled={phase === "idle" || phase === "solving"}
            >
              <Route aria-hidden="true" />
              Solve with {chosen.name}
            </button>
          )}
        </div>

        <div className={styles.readout}>
          <dl className={styles.titleBlock}>
            <div>
              <dt>Dwg</dt>
              <dd>M-{String(sheet.number).padStart(3, "0")}</dd>
            </div>
            <div>
              <dt>Grid</dt>
              <dd>
                {sheet.cols} × {sheet.rows}
              </dd>
            </div>
            <div>
              <dt>Moves</dt>
              <dd>{moves}</dd>
            </div>
            <div>
              <dt>Searched</dt>
              <dd>{solution ? solution.explored : "—"}</dd>
            </div>
            <div className={styles.statusRow}>
              <dt>Status</dt>
              <dd aria-live="polite">{status}</dd>
            </div>
          </dl>

          <dl className={styles.keys} aria-label="Keyboard shortcuts">
            <div>
              <dt>
                <span aria-hidden="true" className={styles.arrowKeys}>
                  <kbd className={styles.up}>↑</kbd>
                  <kbd>←</kbd>
                  <kbd>↓</kbd>
                  <kbd>→</kbd>
                </span>
                <span className="sr-only">Arrow keys</span>
              </dt>
              <dd>Move</dd>
            </div>
            <div>
              <dt>
                <kbd>G</kbd>
              </dt>
              <dd>New maze</dd>
            </div>
            <div>
              <dt>
                <kbd>Enter</kbd>
              </dt>
              <dd>Solve</dd>
            </div>
          </dl>
        </div>
      </aside>
    </main>
  );
}
