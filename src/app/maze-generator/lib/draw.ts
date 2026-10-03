import { E, findRegion, N, S, W, type Maze } from "./maze";

function gradient(stops: [number, number, number][], count: number) {
  return Array.from({ length: count }, (_, index) => {
    const t = (index / (count - 1)) * (stops.length - 1);
    const i = Math.min(Math.floor(t), stops.length - 2);
    const f = t - i;
    const [r, g, b] = stops[i].map((c, k) =>
      Math.round(c + (stops[i + 1][k] - c) * f),
    );
    return `rgb(${r} ${g} ${b})`;
  });
}

// Carve order runs teal to pink; the search's distances run gold to violet.
const DRAFT_COLORS = gradient(
  [
    [45, 212, 191],
    [56, 189, 248],
    [129, 140, 248],
    [244, 114, 182],
  ],
  64,
);
const HEAT_COLORS = gradient(
  [
    [255, 226, 140],
    [255, 159, 67],
    [255, 79, 123],
    [139, 92, 246],
  ],
  64,
);
const REGION_COLORS = Array.from(
  { length: 24 },
  (_, index) => `hsl(${Math.round((index * 137.5) % 360)} 75% 62%)`,
);

export type Solve = {
  run: Generator<{ cell: number; distance: number }, number[]>;
  heat: Float32Array;
  maxHeat: number;
  /** How many cells had been explored when each cell was visited. */
  visitedAt: Int32Array;
  explored: number;
  budget: number;
  rate: number;
  path: number[] | null;
  pathAt: number;
};
export type Player = {
  cell: number;
  x: number;
  y: number;
  moves: number;
  trail: Uint8Array;
  bump: { at: number; dx: number; dy: number } | null;
};
export type Layout = { cell: number; ox: number; oy: number };

export function drawMaze(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  maze: Maze,
  view: {
    now: number;
    drafting: boolean;
    kruskal: boolean;
    settle: number;
    solve: Solve | null;
    player: Player;
  },
): Layout {
  const { cols, rows, walls, order, active } = maze;
  const { now, drafting, solve, player } = view;
  const cell = Math.min(width / cols, height / rows);
  const ox = (width - cell * cols) / 2;
  const oy = (height - cell * rows) / 2;
  const total = cols * rows;
  const goal = total - 1;
  const centerX = (index: number) => ox + ((index % cols) + 0.5) * cell;
  const centerY = (index: number) =>
    oy + (Math.floor(index / cols) + 0.5) * cell;

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "rgba(2, 10, 24, 0.6)";
  ctx.fillRect(ox, oy, cols * cell, rows * cell);

  // Floor, tinted by carve order (or region, for Kruskal) while drafting.
  const tint = drafting ? 0.5 : 0.5 - 0.4 * view.settle;
  for (let index = 0; index < total; index += 1) {
    if (order[index] < 0) continue;
    const x = ox + (index % cols) * cell;
    const y = oy + Math.floor(index / cols) * cell;
    ctx.globalAlpha = 1;
    ctx.fillStyle = "rgba(28, 78, 138, 0.35)";
    ctx.fillRect(x, y, cell + 0.5, cell + 0.5);
    ctx.globalAlpha = tint;
    ctx.fillStyle =
      drafting && view.kruskal && maze.parent
        ? REGION_COLORS[findRegion(maze.parent, index) % REGION_COLORS.length]
        : DRAFT_COLORS[Math.floor((order[index] / total) * 63)];
    ctx.fillRect(x, y, cell + 0.5, cell + 0.5);
  }
  ctx.globalAlpha = 1;

  if (drafting) {
    for (let index = 0; index < total; index += 1) {
      if (!active[index]) continue;
      ctx.fillStyle = "rgba(255, 190, 60, 0.4)";
      if (order[index] >= 0) {
        ctx.fillRect(
          ox + (index % cols) * cell,
          oy + Math.floor(index / cols) * cell,
          cell,
          cell,
        );
      } else {
        ctx.beginPath();
        ctx.arc(centerX(index), centerY(index), cell * 0.16, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255, 190, 60, 0.85)";
        ctx.fill();
      }
    }
  }

  // The search, coloured by distance from the source. The latest visits glow
  // white and fade, so the stack, layer, or heap can be seen at work.
  if (solve) {
    const span = Math.max(solve.maxHeat, 1);
    const glow = Math.max(4, solve.rate * 0.08);
    for (let index = 0; index < total; index += 1) {
      const heat = solve.heat[index];
      if (heat < 0) continue;
      const x = ox + (index % cols) * cell;
      const y = oy + Math.floor(index / cols) * cell;
      ctx.globalAlpha = 0.82;
      ctx.fillStyle = HEAT_COLORS[Math.round((heat / span) * 63)];
      ctx.fillRect(x, y, cell + 0.5, cell + 0.5);
      const age = solve.explored - solve.visitedAt[index];
      if (!solve.path && age <= glow) {
        ctx.globalAlpha = 0.7 * (1 - (age - 1) / glow);
        ctx.fillStyle = "#fff";
        ctx.fillRect(x, y, cell + 0.5, cell + 0.5);
      }
    }
    ctx.globalAlpha = 1;
  }

  if (!drafting) {
    // Entrance and exit pads.
    ctx.fillStyle = "rgba(94, 234, 212, 0.22)";
    ctx.fillRect(ox, oy, cell, cell);
    const pulse = 0.5 + 0.5 * Math.sin(now / 320);
    ctx.fillStyle = `rgba(255, 209, 102, ${0.14 + pulse * 0.16})`;
    ctx.fillRect(ox + (cols - 1) * cell, oy + (rows - 1) * cell, cell, cell);

    // Breadcrumbs wherever the explorer has been.
    ctx.beginPath();
    for (let index = 0; index < total; index += 1) {
      if (!player.trail[index] || index === player.cell) continue;
      ctx.moveTo(centerX(index) + cell * 0.09, centerY(index));
      ctx.arc(centerX(index), centerY(index), cell * 0.09, 0, Math.PI * 2);
    }
    ctx.fillStyle = "rgba(255, 138, 128, 0.75)";
    ctx.fill();
  }

  // Walls: bright where they border carved ground, faint in solid rock.
  const bright = new Path2D();
  const faint = new Path2D();
  for (let index = 0; index < total; index += 1) {
    const x = ox + (index % cols) * cell;
    const y = oy + Math.floor(index / cols) * cell;
    const carved = order[index] >= 0;
    if (walls[index] & N) {
      const above = index - cols;
      const path = carved || (above >= 0 && order[above] >= 0) ? bright : faint;
      path.moveTo(x, y);
      path.lineTo(x + cell, y);
    }
    if (walls[index] & W) {
      const left = index % cols > 0 ? index - 1 : -1;
      const path = carved || (left >= 0 && order[left] >= 0) ? bright : faint;
      path.moveTo(x, y);
      path.lineTo(x, y + cell);
    }
    const border = carved ? bright : faint;
    if (index % cols === cols - 1 && walls[index] & E) {
      border.moveTo(x + cell, y);
      border.lineTo(x + cell, y + cell);
    }
    if (index >= total - cols && walls[index] & S) {
      border.moveTo(x, y + cell);
      border.lineTo(x + cell, y + cell);
    }
  }
  ctx.lineCap = "round";
  ctx.lineWidth = Math.max(1, cell * 0.08);
  ctx.strokeStyle = "rgba(170, 205, 255, 0.14)";
  ctx.stroke(faint);
  ctx.lineWidth = Math.max(1.4, cell * 0.13);
  ctx.strokeStyle = "#dcecff";
  ctx.stroke(bright);

  if (drafting && maze.head >= 0) {
    const x = ox + (maze.head % cols) * cell;
    const y = oy + Math.floor(maze.head / cols) * cell;
    ctx.fillStyle = "rgba(255, 190, 60, 0.3)";
    ctx.fillRect(x - cell * 0.4, y - cell * 0.4, cell * 1.8, cell * 1.8);
    ctx.fillStyle = "#ffcf5a";
    ctx.fillRect(x + cell * 0.2, y + cell * 0.2, cell * 0.6, cell * 0.6);
    return { cell, ox, oy };
  }

  // The goal: a gently pulsing diamond.
  const gx = centerX(goal);
  const gy = centerY(goal);
  const r = cell * (0.24 + 0.03 * Math.sin(now / 320));
  ctx.beginPath();
  ctx.moveTo(gx, gy - r);
  ctx.lineTo(gx + r, gy);
  ctx.lineTo(gx, gy + r);
  ctx.lineTo(gx - r, gy);
  ctx.closePath();
  ctx.fillStyle = "#ffd166";
  ctx.fill();

  // The shortest path, drawn out from the source once the search lands.
  if (solve?.path && solve.path.length > 1) {
    const duration = Math.min(1400, Math.max(500, solve.path.length * 14));
    const progress = Math.min(1, (now - solve.pathAt) / duration);
    const reach = progress * (solve.path.length - 1);
    const whole = Math.floor(reach);
    ctx.beginPath();
    ctx.moveTo(centerX(solve.path[0]), centerY(solve.path[0]));
    for (let i = 1; i <= whole; i += 1) {
      ctx.lineTo(centerX(solve.path[i]), centerY(solve.path[i]));
    }
    if (whole < solve.path.length - 1) {
      const a = solve.path[whole];
      const b = solve.path[whole + 1];
      const f = reach - whole;
      ctx.lineTo(
        centerX(a) + (centerX(b) - centerX(a)) * f,
        centerY(a) + (centerY(b) - centerY(a)) * f,
      );
    }
    ctx.lineJoin = "round";
    ctx.lineWidth = cell * 0.55;
    ctx.strokeStyle = "rgba(255, 209, 102, 0.35)";
    ctx.stroke();
    ctx.lineWidth = Math.max(2, cell * 0.2);
    ctx.strokeStyle = "#fff8e1";
    ctx.stroke();
  }

  // The explorer, easing between cells and wobbling when it hits a wall.
  let px = ox + player.x * cell;
  let py = oy + player.y * cell;
  if (player.bump) {
    const t = (now - player.bump.at) / 180;
    if (t < 1) {
      const push = Math.sin(t * Math.PI) * cell * 0.14;
      px += player.bump.dx * push;
      py += player.bump.dy * push;
    }
  }
  ctx.beginPath();
  ctx.arc(px, py, cell * 0.36, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255, 122, 110, 0.25)";
  ctx.fill();
  ctx.beginPath();
  ctx.arc(px, py, cell * 0.24, 0, Math.PI * 2);
  ctx.fillStyle = "#ff7a6e";
  ctx.fill();
  ctx.lineWidth = Math.max(1.5, cell * 0.06);
  ctx.strokeStyle = "#fff";
  ctx.stroke();

  return { cell, ox, oy };
}
