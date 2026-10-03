// Every universe on the map, simulated at once. Each one is a 32 × 32 board
// that wraps around, so a row of cells fits in one 32-bit integer and a whole
// row's neighbor counts can be added up with bitwise logic.

import {
  AGE_RGB,
  COLUMNS,
  GRID,
  phaseRules,
  ROWS,
  ruleAt,
  UNIVERSES,
  type Rule,
} from "./rules";

export const TILE = 32;
const LAST = TILE - 1;
const CELLS = TILE * TILE;

/** Seed soup size and density, shared by every universe. */
const SOUP = 16;
const SOUP_DENSITY = 0.5;

// ───────── Map geometry, in map pixels (one pixel per cell) ─────────

const GAP = 4;
const FAMILY_GAP = 16;

function tileOrigins(family: number[]) {
  const origins = [0];
  for (let i = 1; i < GRID; i += 1) {
    const gap = family[i] === family[i - 1] ? GAP : FAMILY_GAP;
    origins.push(origins[i - 1] + TILE + gap);
  }
  return origins;
}

export const TILE_X = tileOrigins(COLUMNS.family);
export const TILE_Y = tileOrigins(ROWS.family);
export const MAP_WIDTH = TILE_X[GRID - 1] + TILE;
export const MAP_HEIGHT = TILE_Y[GRID - 1] + TILE;

const tileAt = (origins: number[], at: number) => {
  for (let i = 0; i < GRID; i += 1) {
    if (at < origins[i]) return -1;
    if (at < origins[i] + TILE) return i;
  }
  return -1;
};

/** The universe under a point on the map, or -1 over a gap. */
export function universeAt(mapX: number, mapY: number) {
  const col = tileAt(TILE_X, mapX);
  const row = tileAt(TILE_Y, mapY);
  return col < 0 || row < 0 ? -1 : row * GRID + col;
}

// ───────── Simulation ─────────

export type Multiverse = {
  /** TILE rows per universe; bit x of a row is the cell in column x. */
  cells: Uint32Array;
  next: Uint32Array;
  /** Generations each cell has been alive, capped at 255. */
  ages: Uint8Array;
  /** Rules for even and odd generations, two per universe. */
  phases: Uint32Array;
  rules: Rule[];
  population: Uint16Array;
  /** Universes whose pixels are out of date. */
  stale: Uint8Array;
  generation: number;
  /** Universes with at least one live cell. */
  living: number;
};

export function createMultiverse(): Multiverse {
  const rules: Rule[] = [];
  const phases = new Uint32Array(UNIVERSES * 2);
  for (let u = 0; u < UNIVERSES; u += 1) {
    const rule = ruleAt(u % GRID, Math.floor(u / GRID));
    rules.push(rule);
    phases.set(phaseRules(rule), u * 2);
  }

  const multiverse: Multiverse = {
    cells: new Uint32Array(UNIVERSES * TILE),
    next: new Uint32Array(UNIVERSES * TILE),
    ages: new Uint8Array(UNIVERSES * CELLS),
    phases,
    rules,
    population: new Uint16Array(UNIVERSES),
    stale: new Uint8Array(UNIVERSES),
    generation: 0,
    living: 0,
  };
  seedMultiverse(multiverse);
  return multiverse;
}

const popcount = (value: number) => {
  value -= (value >>> 1) & 0x55555555;
  value = (value & 0x33333333) + ((value >>> 2) & 0x33333333);
  return Math.imul((value + (value >>> 4)) & 0x0f0f0f0f, 0x01010101) >>> 24;
};

/** Drops the same random soup into the middle of every universe. */
export function seedMultiverse(multiverse: Multiverse) {
  const { cells, ages, population, stale } = multiverse;
  const offset = (TILE - SOUP) / 2;
  const soup = new Uint32Array(TILE);
  for (let y = offset; y < offset + SOUP; y += 1) {
    for (let x = offset; x < offset + SOUP; x += 1) {
      if (Math.random() < SOUP_DENSITY) soup[y] |= 1 << x;
    }
  }

  const soupAges = new Uint8Array(CELLS);
  for (let i = 0; i < CELLS; i += 1) {
    soupAges[i] = (soup[i >> 5] >>> (i & LAST)) & 1;
  }
  const count = soup.reduce((sum, row) => sum + popcount(row), 0);

  for (let u = 0; u < UNIVERSES; u += 1) {
    cells.set(soup, u * TILE);
    ages.set(soupAges, u * CELLS);
  }
  population.fill(count);
  stale.fill(1);
  multiverse.generation = 0;
  multiverse.living = count > 0 ? UNIVERSES : 0;
}

const AGE_UP = Uint8Array.from({ length: 256 }, (_, age) =>
  Math.min(255, age + 1),
);

export function stepMultiverse(multiverse: Multiverse) {
  const { cells, next, ages, phases, population, stale } = multiverse;
  const phase = multiverse.generation & 1;
  let living = 0;

  for (let u = 0; u < UNIVERSES; u += 1) {
    const base = u * TILE;
    const rule = phases[u * 2 + phase];

    // Without birth at zero, an empty universe stays empty.
    if (population[u] === 0 && !(rule & 1)) {
      next.fill(0, base, base + TILE);
      continue;
    }

    let count = 0;
    let above = cells[base + LAST];
    let here = cells[base];
    for (let y = 0; y < TILE; y += 1) {
      const below = cells[base + ((y + 1) & LAST)];

      // The eight neighbors of every cell in the row, as bitboards.
      const a = (above << 1) | (above >>> 31);
      const b = above;
      const c = (above >>> 1) | (above << 31);
      const d = (here << 1) | (here >>> 31);
      const e = (here >>> 1) | (here << 31);
      const f = (below << 1) | (below >>> 31);
      const g = below;
      const h = (below >>> 1) | (below << 31);

      // Add them into a four-bit count per cell with a tree of adders.
      const ab = a ^ b;
      const sum1 = ab ^ c;
      const carry1 = (a & b) | (c & ab);
      const de = d ^ e;
      const sum2 = de ^ f;
      const carry2 = (d & e) | (f & de);
      const sum3 = g ^ h;
      const carry3 = g & h;
      const sum12 = sum1 ^ sum2;
      const ones = sum12 ^ sum3;
      const carryA = (sum1 & sum2) | (sum3 & sum12);
      const carry12 = carry1 ^ carry2;
      const pairs = carry12 ^ carry3;
      const carryB = (carry1 & carry2) | (carry3 & carry12);
      const twos = pairs ^ carryA;
      const carryC = pairs & carryA;
      const fours = carryB ^ carryC;
      const eights = carryB & carryC;

      // Cells with exactly n neighbors. Eight is the only count with the
      // eights bit, so the others only need to rule it out for zero.
      const notOnes = ~ones;
      const notTwos = ~twos;
      const notFours = ~fours;
      const n0 = notOnes & notTwos & notFours & ~eights;
      const n1 = ones & notTwos & notFours;
      const n2 = notOnes & twos & notFours;
      const n3 = ones & twos & notFours;
      const n4 = notOnes & notTwos & fours;
      const n5 = ones & notTwos & fours;
      const n6 = notOnes & twos & fours;
      const n7 = ones & twos & fours;

      let born = 0;
      if (rule & 0x1) born |= n0;
      if (rule & 0x2) born |= n1;
      if (rule & 0x4) born |= n2;
      if (rule & 0x8) born |= n3;
      if (rule & 0x10) born |= n4;
      if (rule & 0x20) born |= n5;
      if (rule & 0x40) born |= n6;
      if (rule & 0x80) born |= n7;
      if (rule & 0x100) born |= eights;
      let kept = 0;
      if (rule & 0x200) kept |= n0;
      if (rule & 0x400) kept |= n1;
      if (rule & 0x800) kept |= n2;
      if (rule & 0x1000) kept |= n3;
      if (rule & 0x2000) kept |= n4;
      if (rule & 0x4000) kept |= n5;
      if (rule & 0x8000) kept |= n6;
      if (rule & 0x10000) kept |= n7;
      if (rule & 0x20000) kept |= eights;

      const row = (born & ~here) | (kept & here);
      next[base + y] = row;

      if (row | here) {
        count += popcount(row);
        let i = (base + y) * TILE;
        for (let x = 0; x < TILE; x += 1, i += 1) {
          ages[i] = ((row >>> x) & 1) * AGE_UP[ages[i]];
        }
      }

      above = here;
      here = below;
    }

    population[u] = count;
    stale[u] = 1;
    if (count > 0) living += 1;
  }

  multiverse.cells = next;
  multiverse.next = cells;
  multiverse.generation += 1;
  multiverse.living = living;
}

// ───────── Pixels ─────────

/** Dead cells inside a universe; the gaps between universes stay clear. */
export const VOID_RGB: [number, number, number] = [19, 22, 34];

// ImageData pixels as little-endian 32-bit words: 0xAABBGGRR.
const toPixel = ([r, g, b]: [number, number, number]) =>
  (0xff000000 | (b << 16) | (g << 8) | r) >>> 0;

const PIXELS = Uint32Array.from(AGE_RGB, (rgb, age) =>
  toPixel(age === 0 ? VOID_RGB : rgb),
);

/** Repaints the universes that changed into a MAP_WIDTH-wide pixel buffer. */
export function paintMultiverse(multiverse: Multiverse, pixels: Uint32Array) {
  const { ages, stale } = multiverse;
  for (let u = 0; u < UNIVERSES; u += 1) {
    if (!stale[u]) continue;
    stale[u] = 0;
    const left = TILE_X[u % GRID];
    const top = TILE_Y[Math.floor(u / GRID)];
    let i = u * CELLS;
    for (let y = 0; y < TILE; y += 1) {
      let p = (top + y) * MAP_WIDTH + left;
      for (let x = 0; x < TILE; x += 1) pixels[p++] = PIXELS[ages[i++]];
    }
  }
}
