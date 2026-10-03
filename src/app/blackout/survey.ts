// An abandoned museum, one metre per character.
// # wall · . floor · o pillar · p piano · c crate · s statue · b beacon · E exit · S start
const MAP = [
  "############################################",
  "#S.....#.............#.......o.....o.......#",
  "#......#.............#.....................#",
  "#...........p........#........s............#",
  "#......#.........................b.........#",
  "#......#.............#.....................#",
  "#......#.....c.......#.......o.....o.......#",
  "####.#####################.#################",
  "#......#.......#.....#.........#...........#",
  "#......#..........c..................c.....#",
  "#..b.......c...#.....#.........#...........#",
  "#......#.......#.....#.........#........b..#",
  "#......#.......###########.#####...........#",
  "#......#.......#######.........#...........#",
  "###.#######.##########.........######.######",
  "#......#.............#....s....#...........#",
  "#.o..o.#...................................#",
  "#....................#..c......#...........#",
  "#.o..o.#....b........#.........#.....E.....#",
  "#......#.............###########...........#",
  "############################################",
];

export const GRID_W = MAP[0].length;
export const GRID_H = MAP.length;
export const WALL_HEIGHT = 3.2;
export const EYE = 1.6;
export const MAX_RANGE = 22;

export type Prop = { x: number; y: number; r: number; h: number; kind: string };

export const cells: string[] = MAP.map((row) => row.padEnd(GRID_W, "#"));
export const props: Prop[] = [];
export const beacons: { x: number; y: number }[] = [];
export let start = { x: 1.5, y: 1.5 };
export let exit = { x: 0, y: 0 };

const PROP_SHAPES: Record<string, { r: number; h: number }> = {
  o: { r: 0.32, h: WALL_HEIGHT },
  p: { r: 0.7, h: 1.05 },
  c: { r: 0.42, h: 0.85 },
  s: { r: 0.35, h: 2.1 },
  b: { r: 0.18, h: 0.55 },
  E: { r: 0.5, h: 2.3 },
};

cells.forEach((row, y) => {
  [...row].forEach((char, x) => {
    const shape = PROP_SHAPES[char];
    if (shape) props.push({ x: x + 0.5, y: y + 0.5, ...shape, kind: char });
    if (char === "b") beacons.push({ x: x + 0.5, y: y + 0.5 });
    if (char === "S") start = { x: x + 0.5, y: y + 0.5 };
    if (char === "E") exit = { x: x + 0.5, y: y + 0.5 };
  });
});

const propAt = new Map<number, Prop>();
for (const prop of props)
  propAt.set(Math.floor(prop.y) * GRID_W + Math.floor(prop.x), prop);

export const isWall = (x: number, y: number) => {
  const gx = Math.floor(x);
  const gy = Math.floor(y);
  if (gx < 0 || gy < 0 || gx >= GRID_W || gy >= GRID_H) return true;
  return cells[gy][gx] === "#";
};

export type Hit = {
  x: number;
  y: number;
  z: number;
  kind: "wall" | "floor" | "ceiling" | "prop";
  prop?: Prop;
  distance: number;
};

/** Casts one ray through the building and reports the first surface it meets. */
export function cast(
  px: number,
  py: number,
  yaw: number,
  pitch: number,
): Hit | null {
  const cp = Math.cos(pitch);
  const dx = Math.cos(yaw) * cp;
  const dy = Math.sin(yaw) * cp;
  const dz = Math.sin(pitch);
  const flat = Math.hypot(dx, dy) || 1e-6;
  const ux = dx / flat;
  const uy = dy / flat;

  // Where would the ray leave through the floor or ceiling, in horizontal distance?
  let planeT = Infinity;
  let planeKind: "floor" | "ceiling" = "floor";
  if (dz < -1e-4) {
    planeT = (0 - EYE) / dz;
    planeKind = "floor";
  } else if (dz > 1e-4) {
    planeT = (WALL_HEIGHT - EYE) / dz;
    planeKind = "ceiling";
  }
  const planeFlat = planeT * flat;

  let gx = Math.floor(px);
  let gy = Math.floor(py);
  const stepX = ux > 0 ? 1 : -1;
  const stepY = uy > 0 ? 1 : -1;
  const deltaX = Math.abs(1 / ux);
  const deltaY = Math.abs(1 / uy);
  let sideX = (ux > 0 ? gx + 1 - px : px - gx) * deltaX;
  let sideY = (uy > 0 ? gy + 1 - py : py - gy) * deltaY;
  let travelled = 0;

  for (let i = 0; i < 64 && travelled < MAX_RANGE; i += 1) {
    const prop = propAt.get(gy * GRID_W + gx);
    if (prop) {
      const ox = px - prop.x;
      const oy = py - prop.y;
      const b = ox * ux + oy * uy;
      const c = ox * ox + oy * oy - prop.r * prop.r;
      const disc = b * b - c;
      if (disc >= 0) {
        const s = -b - Math.sqrt(disc);
        if (s > 0 && s < planeFlat) {
          const z = EYE + (s / flat) * dz;
          if (z >= 0 && z <= prop.h) {
            return {
              x: px + ux * s,
              y: py + uy * s,
              z,
              kind: "prop",
              prop,
              distance: s / flat,
            };
          }
        }
      }
    }
    if (sideX < sideY) {
      travelled = sideX;
      sideX += deltaX;
      gx += stepX;
    } else {
      travelled = sideY;
      sideY += deltaY;
      gy += stepY;
    }
    if (planeFlat < travelled) break;
    if (
      gx < 0 ||
      gy < 0 ||
      gx >= GRID_W ||
      gy >= GRID_H ||
      cells[gy][gx] === "#"
    ) {
      const z = EYE + (travelled / flat) * dz;
      return {
        x: px + ux * travelled,
        y: py + uy * travelled,
        z,
        kind: "wall",
        distance: travelled / flat,
      };
    }
  }
  if (planeFlat < MAX_RANGE) {
    return {
      x: px + ux * planeFlat,
      y: py + uy * planeFlat,
      z: planeKind === "floor" ? 0 : WALL_HEIGHT,
      kind: planeKind,
      distance: planeT,
    };
  }
  return null;
}

export function blocked(x: number, y: number, radius = 0.24) {
  for (const [ox, oy] of [
    [radius, 0],
    [-radius, 0],
    [0, radius],
    [0, -radius],
    [radius * 0.7, radius * 0.7],
    [-radius * 0.7, radius * 0.7],
    [radius * 0.7, -radius * 0.7],
    [-radius * 0.7, -radius * 0.7],
  ]) {
    if (isWall(x + ox, y + oy)) return true;
  }
  return props.some(
    (prop) =>
      prop.kind !== "b" && Math.hypot(prop.x - x, prop.y - y) < prop.r + radius,
  );
}

/** Warm up close, cool with distance, the way a scanner false-colours depth. */
export function depthColor(distance: number, kind: Hit["kind"]) {
  const t = Math.min(1, distance / 16);
  const stops = [
    [255, 94, 58],
    [255, 210, 70],
    [70, 255, 170],
    [60, 180, 255],
    [140, 90, 255],
  ];
  const scaled = t * (stops.length - 1);
  const i = Math.min(stops.length - 2, Math.floor(scaled));
  const f = scaled - i;
  const shade = kind === "floor" ? 0.55 : kind === "ceiling" ? 0.4 : 1;
  const r = (stops[i][0] + (stops[i + 1][0] - stops[i][0]) * f) * shade;
  const g = (stops[i][1] + (stops[i + 1][1] - stops[i][1]) * f) * shade;
  const b = (stops[i][2] + (stops[i + 1][2] - stops[i][2]) * f) * shade;
  // Packed for a little-endian Uint32 view of ImageData: 0xAABBGGRR.
  return (
    (255 << 24) | (Math.round(b) << 16) | (Math.round(g) << 8) | Math.round(r)
  );
}
