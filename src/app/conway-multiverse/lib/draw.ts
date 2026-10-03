import {
  MAP_HEIGHT,
  MAP_WIDTH,
  TILE,
  TILE_X,
  TILE_Y,
  VOID_RGB,
} from "./multiverse";
import {
  AGE_RGB,
  COLUMNS,
  familyLabel,
  GRID,
  LANDMARKS,
  locate,
  ROWS,
  ruleAt,
  ruleString,
} from "./rules";
import type { World } from "./world";

const VOID = `rgb(${VOID_RGB.join(", ")})`;
const ACCENT = "#38d6f0";
const INK = "rgba(238, 240, 246, 0.92)";
const MUTED = "rgba(150, 156, 176, 0.75)";
const RULE_LINE = "rgba(150, 156, 176, 0.28)";
// The board's own background, so rulers vanish into it until the map scrolls
// beneath them.
const BAND = "rgba(10, 11, 17, 0.92)";

const AGE_STYLE = AGE_RGB.map((rgb) => `rgb(${rgb.join(", ")})`);

// ───────── The map ─────────

/** Screen position = map position × zoom + (x, y), in CSS pixels. */
export type Camera = { zoom: number; x: number; y: number };

/** Space kept clear for the family rulers along the top and left edges. */
export const RULER = { top: 24, left: 36 };
const FIT_PAD = 12;
export const MAX_ZOOM = 24;

export function fitCamera(width: number, height: number): Camera {
  const roomX = width - RULER.left - FIT_PAD * 2;
  const roomY = height - RULER.top - FIT_PAD * 2;
  const zoom = Math.max(0.05, Math.min(roomX / MAP_WIDTH, roomY / MAP_HEIGHT));
  return {
    zoom,
    x: RULER.left + FIT_PAD + (roomX - MAP_WIDTH * zoom) / 2,
    y: RULER.top + FIT_PAD + (roomY - MAP_HEIGHT * zoom) / 2,
  };
}

/** Keeps the zoom in range and at least part of the map on screen. */
export function clampCamera(
  camera: Camera,
  width: number,
  height: number,
): Camera {
  const fit = fitCamera(width, height).zoom;
  const zoom = Math.min(MAX_ZOOM, Math.max(fit * 0.75, camera.zoom));
  const halfW = (MAP_WIDTH * zoom) / 2;
  const halfH = (MAP_HEIGHT * zoom) / 2;
  return {
    zoom,
    x: Math.min(width - halfW, Math.max(RULER.left - halfW, camera.x)),
    y: Math.min(height - halfH, Math.max(RULER.top - halfH, camera.y)),
  };
}

/** Scales the camera by `factor` while the point (px, py) stays put. */
export function zoomAround(
  camera: Camera,
  factor: number,
  px: number,
  py: number,
): Camera {
  return {
    zoom: camera.zoom * factor,
    x: px - (px - camera.x) * factor,
    y: py - (py - camera.y) * factor,
  };
}

/** A camera that centers one universe at the given zoom. */
export function cameraOn(
  universe: number,
  zoom: number,
  width: number,
  height: number,
): Camera {
  const centerX = TILE_X[universe % GRID] + TILE / 2;
  const centerY = TILE_Y[Math.floor(universe / GRID)] + TILE / 2;
  return {
    zoom,
    x: (width + RULER.left) / 2 - centerX * zoom,
    y: (height + RULER.top) / 2 - centerY * zoom,
  };
}

export function tileRect(camera: Camera, universe: number) {
  const size = TILE * camera.zoom;
  return {
    x: camera.x + TILE_X[universe % GRID] * camera.zoom,
    y: camera.y + TILE_Y[Math.floor(universe / GRID)] * camera.zoom,
    size,
  };
}

export type MapOverlay = {
  hover: number;
  focus: number;
  /** 1 → 0 as the focus ring settles after returning to the map. */
  pulse: number;
  font: string;
};

const LANDMARK_TILES = LANDMARKS.map((entry) => {
  const at = locate(entry.rule)!;
  return { ...entry, universe: at.row * GRID + at.col };
});

export function drawMap(
  ctx: CanvasRenderingContext2D,
  source: CanvasImageSource,
  camera: Camera,
  width: number,
  height: number,
  { hover, focus, pulse, font }: MapOverlay,
) {
  ctx.clearRect(0, 0, width, height);

  ctx.save();
  ctx.translate(camera.x, camera.y);
  ctx.scale(camera.zoom, camera.zoom);
  // Zoomed out, filtering keeps millions of cells from shimmering; zoomed
  // in, cells stay crisp squares.
  ctx.imageSmoothingEnabled = camera.zoom < 1;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(source, 0, 0);
  ctx.restore();

  const size = TILE * camera.zoom;
  const visible = (x: number, y: number) =>
    x + size > RULER.left && x < width && y + size > RULER.top && y < height;

  // Zoomed in far enough, every universe is labeled with its rule.
  if (size >= 96) {
    ctx.font = `500 11px ${font}`;
    ctx.textBaseline = "top";
    for (let universe = 0; universe < GRID * GRID; universe += 1) {
      const { x, y } = tileRect(camera, universe);
      if (!visible(x, y)) continue;
      const name = LANDMARK_TILES.find((entry) => entry.universe === universe);
      const text = name
        ? name.name
        : ruleString(ruleAt(universe % GRID, Math.floor(universe / GRID)));
      const textWidth = ctx.measureText(text).width;
      if (textWidth > size - 12) continue;
      ctx.fillStyle = BAND;
      ctx.beginPath();
      ctx.roundRect(x + 4, y + 4, textWidth + 8, 17, 4);
      ctx.fill();
      ctx.fillStyle = name ? ACCENT : INK;
      ctx.fillText(text, x + 8, y + 7);
    }
  }

  // Named universes get a notch in their top-left corner.
  if (size >= 8) {
    const notch = Math.min(12, size * 0.32);
    ctx.fillStyle = ACCENT;
    ctx.beginPath();
    for (const { universe } of LANDMARK_TILES) {
      const { x, y } = tileRect(camera, universe);
      if (!visible(x, y)) continue;
      ctx.moveTo(x - 1, y - 1);
      ctx.lineTo(x + notch, y - 1);
      ctx.lineTo(x - 1, y + notch);
      ctx.closePath();
    }
    ctx.fill();
  }

  const ring = (universe: number, color: string, line: number, grow = 0) => {
    const { x, y } = tileRect(camera, universe);
    const out = line / 2 + 1 + grow;
    ctx.strokeStyle = color;
    ctx.lineWidth = line;
    ctx.beginPath();
    ctx.roundRect(x - out, y - out, size + out * 2, size + out * 2, 3);
    ctx.stroke();
  };

  if (focus >= 0) {
    ctx.globalAlpha = 0.55 + 0.45 * pulse;
    ring(focus, ACCENT, 2, pulse * 10);
    ctx.globalAlpha = 1;
  }
  if (hover >= 0) ring(hover, INK, 1.5);

  drawRulers(ctx, camera, width, height, font, hover);
}

// Rulers name each family: survival along the top, birth down the side. They
// ride along the map's edges, and stick to the canvas edges once the map
// scrolls under them.
function drawRulers(
  ctx: CanvasRenderingContext2D,
  camera: Camera,
  width: number,
  height: number,
  font: string,
  hover: number,
) {
  const bandBottom = Math.max(RULER.top, camera.y - 4);
  const bandRight = Math.max(RULER.left, camera.x - 4);
  ctx.fillStyle = BAND;
  ctx.fillRect(0, bandBottom - RULER.top, width, RULER.top);
  ctx.fillRect(
    bandRight - RULER.left,
    bandBottom,
    RULER.left,
    height - bandBottom,
  );

  ctx.font = `500 10px ${font}`;
  ctx.textBaseline = "middle";
  ctx.lineWidth = 1;
  const hoverCol = hover >= 0 ? hover % GRID : -1;
  const hoverRow = hover >= 0 ? Math.floor(hover / GRID) : -1;

  for (let family = 0; family < 10; family += 1) {
    // Columns.
    const firstCol = COLUMNS.familyStart[family];
    const lastCol = COLUMNS.familyStart[family + 1] - 1;
    const x0 = camera.x + TILE_X[firstCol] * camera.zoom;
    const x1 = camera.x + (TILE_X[lastCol] + TILE) * camera.zoom;
    const left = Math.max(x0, bandRight + 2);
    const right = Math.min(x1, width - 2);
    if (right - left > 3) {
      ctx.strokeStyle = RULE_LINE;
      ctx.beginPath();
      ctx.moveTo(left, bandBottom - 5.5);
      ctx.lineTo(right, bandBottom - 5.5);
      ctx.stroke();

      // Narrow families drop the letter before they drop the label.
      const label = [`S${familyLabel(family)}`, familyLabel(family)].find(
        (text) => ctx.measureText(text).width + 4 <= right - left,
      );
      if (label) {
        const half = ctx.measureText(label).width / 2;
        const center = Math.min(
          right - half - 2,
          Math.max(left + half + 2, (x0 + x1) / 2),
        );
        const active = hoverCol >= firstCol && hoverCol <= lastCol;
        ctx.fillStyle = active ? ACCENT : MUTED;
        ctx.textAlign = "center";
        ctx.fillText(label, center, bandBottom - RULER.top / 2 - 2);
      }
    }

    // Rows.
    const firstRow = ROWS.familyStart[family];
    const lastRow = ROWS.familyStart[family + 1] - 1;
    const y0 = camera.y + TILE_Y[firstRow] * camera.zoom;
    const y1 = camera.y + (TILE_Y[lastRow] + TILE) * camera.zoom;
    const top = Math.max(y0, bandBottom + 2);
    const bottom = Math.min(y1, height - 2);
    if (bottom - top > 3) {
      ctx.strokeStyle = RULE_LINE;
      ctx.beginPath();
      ctx.moveTo(bandRight - 5.5, top);
      ctx.lineTo(bandRight - 5.5, bottom);
      ctx.stroke();

      if (bottom - top >= 11) {
        const center = Math.min(bottom - 6, Math.max(top + 6, (y0 + y1) / 2));
        const active = hoverRow >= firstRow && hoverRow <= lastRow;
        ctx.fillStyle = active ? ACCENT : MUTED;
        ctx.textAlign = "right";
        ctx.fillText(`B${familyLabel(family)}`, bandRight - 10, center);
      }
    }
  }
  ctx.textAlign = "left";
}

// ───────── One universe up close ─────────

/** Where the board sits inside its canvas, in CSS pixels. */
export type BoardLayout = { cell: number; ox: number; oy: number };

const byAge = new Int32Array(257);
let order = new Int32Array(0);

export function drawWorld(
  ctx: CanvasRenderingContext2D,
  world: World,
  { cell, ox, oy }: BoardLayout,
  showFates: boolean,
  hover: number,
) {
  const { cols, rows, alive, next, ages } = world;
  const width = cols * cell;
  const height = rows * cell;
  const cellX = (index: number) => ox + (index % cols) * cell;
  const cellY = (index: number) => oy + Math.floor(index / cols) * cell;

  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.fillStyle = VOID;
  ctx.fillRect(ox, oy, width, height);

  if (cell >= 8) {
    ctx.beginPath();
    for (let x = 1; x < cols; x += 1) {
      ctx.moveTo(ox + x * cell + 0.5, oy);
      ctx.lineTo(ox + x * cell + 0.5, oy + height);
    }
    for (let y = 1; y < rows; y += 1) {
      ctx.moveTo(ox, oy + y * cell + 0.5);
      ctx.lineTo(ox + width, oy + y * cell + 0.5);
    }
    ctx.strokeStyle = "rgba(255, 255, 255, 0.035)";
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // Sort live cells by age so each color is one fill.
  if (order.length < alive.length) order = new Int32Array(alive.length);
  byAge.fill(0);
  for (let i = 0; i < alive.length; i += 1) {
    if (alive[i]) byAge[ages[i] + 1] += 1;
  }
  for (let age = 1; age < byAge.length; age += 1) byAge[age] += byAge[age - 1];
  const starts = byAge.slice();
  for (let i = 0; i < alive.length; i += 1) {
    if (alive[i]) order[starts[ages[i]]++] = i;
  }

  const gap = cell >= 6 ? 1 : 0;
  for (let age = 0; age < 256; age += 1) {
    const from = byAge[age];
    const to = byAge[age + 1];
    if (from === to) continue;
    ctx.beginPath();
    for (let k = from; k < to; k += 1) {
      const index = order[k];
      ctx.rect(
        cellX(index) + gap,
        cellY(index) + gap,
        cell - gap * 2,
        cell - gap * 2,
      );
    }
    ctx.fillStyle = AGE_STYLE[Math.max(1, age)];
    ctx.fill();
  }

  // What happens next: a seed where a cell is about to be born, and a donut
  // where one is about to die.
  if (showFates && cell >= 6) {
    const half = cell / 2;
    const seeds = new Path2D();
    const holes = new Path2D();
    for (let i = 0; i < alive.length; i += 1) {
      if (alive[i] === next[i]) continue;
      const x = cellX(i) + half;
      const y = cellY(i) + half;
      const path = alive[i] ? holes : seeds;
      const radius = cell * (alive[i] ? 0.2 : 0.14);
      path.moveTo(x + radius, y);
      path.arc(x, y, radius, 0, Math.PI * 2);
    }
    ctx.fillStyle = "rgba(255, 255, 255, 0.55)";
    ctx.fill(seeds);
    ctx.fillStyle = VOID;
    ctx.fill(holes);
  }

  if (hover >= 0) {
    ctx.strokeStyle = ACCENT;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(
      cellX(hover) + 0.75,
      cellY(hover) + 0.75,
      cell - 1.5,
      cell - 1.5,
    );
  }
}
