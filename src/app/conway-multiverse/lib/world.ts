// One universe up close: a wraparound board of any size, under any rule.

import { phaseRules, type Rule } from "./rules";

export type World = {
  cols: number;
  rows: number;
  rule: Rule;
  /** Rules for even and odd phases (they differ only for B0 rules). */
  phases: [Rule, Rule];
  phase: 0 | 1;
  alive: Uint8Array;
  /** What the board will look like next generation. */
  next: Uint8Array;
  ages: Uint8Array;
  generation: number;
  population: number;
};

export function createWorld(cols: number, rows: number, rule: Rule): World {
  const cells = cols * rows;
  return {
    cols,
    rows,
    rule,
    phases: phaseRules(rule),
    phase: 0,
    alive: new Uint8Array(cells),
    next: new Uint8Array(cells),
    ages: new Uint8Array(cells),
    generation: 0,
    population: 0,
  };
}

/** Works out the next generation without moving to it. */
export function forecast(world: World) {
  const { cols, rows, alive, next } = world;
  const rule = world.phases[world.phase];

  for (let y = 0; y < rows; y += 1) {
    const up = ((y + rows - 1) % rows) * cols;
    const row = y * cols;
    const down = ((y + 1) % rows) * cols;

    for (let x = 0; x < cols; x += 1) {
      const left = (x + cols - 1) % cols;
      const right = (x + 1) % cols;
      const neighbors =
        alive[up + left] +
        alive[up + x] +
        alive[up + right] +
        alive[row + left] +
        alive[row + right] +
        alive[down + left] +
        alive[down + x] +
        alive[down + right];
      const index = row + x;
      next[index] = (rule >> (neighbors + 9 * alive[index])) & 1;
    }
  }
}

export function stepWorld(world: World) {
  const { alive, next, ages } = world;
  let population = 0;
  for (let index = 0; index < alive.length; index += 1) {
    const lives = next[index];
    ages[index] = lives
      ? alive[index]
        ? Math.min(255, ages[index] + 1)
        : 1
      : 0;
    alive[index] = lives;
    population += lives;
  }
  world.population = population;
  world.generation += 1;
  if (world.phases[0] !== world.phases[1]) world.phase ^= 1;
  forecast(world);
}

/** Starts the phase cycle over, for a new rule or a fresh board. */
function restart(world: World) {
  world.phase = 0;
  world.population = world.alive.reduce((sum, cell) => sum + cell, 0);
  forecast(world);
}

export function setRule(world: World, rule: Rule) {
  world.rule = rule;
  world.phases = phaseRules(rule);
  restart(world);
}

export function clearWorld(world: World) {
  world.alive.fill(0);
  world.ages.fill(0);
  world.generation = 0;
  restart(world);
}

/** A random soup in the middle of the board, like the multiverse's. */
export function seedSoup(world: World, density = 0.5) {
  clearWorld(world);
  const { cols, rows, alive, ages } = world;
  const size = Math.min(24, cols, rows);
  const left = Math.floor((cols - size) / 2);
  const top = Math.floor((rows - size) / 2);
  for (let y = top; y < top + size; y += 1) {
    for (let x = left; x < left + size; x += 1) {
      if (Math.random() < density) {
        alive[y * cols + x] = 1;
        ages[y * cols + x] = 1;
      }
    }
  }
  restart(world);
}

/** Places or removes one cell by hand. Returns true if anything changed. */
export function setCell(world: World, index: number, value: 0 | 1) {
  if (index < 0 || world.alive[index] === value) return false;
  world.alive[index] = value;
  world.ages[index] = value;
  world.population += value ? 1 : -1;
  return true;
}

/** A copy of the world at a new size, keeping its cells centered. */
export function resizeWorld(world: World, cols: number, rows: number) {
  const resized = createWorld(cols, rows, world.rule);
  const dx = Math.floor((cols - world.cols) / 2);
  const dy = Math.floor((rows - world.rows) / 2);

  for (let y = 0; y < world.rows; y += 1) {
    for (let x = 0; x < world.cols; x += 1) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) continue;
      resized.alive[ny * cols + nx] = world.alive[y * world.cols + x];
      resized.ages[ny * cols + nx] = world.ages[y * world.cols + x];
    }
  }

  resized.generation = world.generation;
  resized.phase = world.phase;
  resized.population = resized.alive.reduce((sum, cell) => sum + cell, 0);
  forecast(resized);
  return resized;
}
