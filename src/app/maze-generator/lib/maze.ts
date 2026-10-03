// Grid mazes carved one step at a time by generators, so every algorithm can
// be animated, and solved with Dijkstra's algorithm over the open passages.

export type Algorithm = "backtracker" | "prim" | "kruskal";

export const N = 1;
export const E = 2;
export const S = 4;
export const W = 8;

export const DIRECTIONS = [
  { bit: N, dx: 0, dy: -1, opposite: S },
  { bit: E, dx: 1, dy: 0, opposite: W },
  { bit: S, dx: 0, dy: 1, opposite: N },
  { bit: W, dx: -1, dy: 0, opposite: E },
] as const;

export type Maze = {
  cols: number;
  rows: number;
  /** Bitmask of the walls still standing around each cell. */
  walls: Uint8Array;
  /** The step at which each cell was carved, or -1 while it is solid. */
  order: Int32Array;
  /** Cells on the backtracker's stack or Prim's frontier. */
  active: Uint8Array;
  /** Kruskal's disjoint-set parents, used to colour the merging regions. */
  parent: Int32Array | null;
  carved: number;
  /** The cell the generator touched last. */
  head: number;
};

export function createMaze(cols: number, rows: number): Maze {
  return {
    cols,
    rows,
    walls: new Uint8Array(cols * rows).fill(N | E | S | W),
    order: new Int32Array(cols * rows).fill(-1),
    active: new Uint8Array(cols * rows),
    parent: null,
    carved: 0,
    head: -1,
  };
}

export function neighbor(maze: Maze, cell: number, direction: number) {
  const { dx, dy } = DIRECTIONS[direction];
  const x = (cell % maze.cols) + dx;
  const y = Math.floor(cell / maze.cols) + dy;
  if (x < 0 || y < 0 || x >= maze.cols || y >= maze.rows) return -1;
  return y * maze.cols + x;
}

/** The neighbor reachable through an open wall, or -1. */
export function passage(maze: Maze, cell: number, direction: number) {
  if (maze.walls[cell] & DIRECTIONS[direction].bit) return -1;
  return neighbor(maze, cell, direction);
}

function carve(maze: Maze, cell: number, direction: number) {
  const next = neighbor(maze, cell, direction);
  maze.walls[cell] &= ~DIRECTIONS[direction].bit;
  maze.walls[next] &= ~DIRECTIONS[direction].opposite;
  return next;
}

function mark(maze: Maze, cell: number) {
  if (maze.order[cell] < 0) maze.order[cell] = maze.carved++;
}

const pick = <T>(items: readonly T[]) =>
  items[Math.floor(Math.random() * items.length)];

function shuffle<T>(items: T[]) {
  for (let i = items.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}

const directionsWhere = (test: (direction: number) => boolean) =>
  [0, 1, 2, 3].filter(test);

/** Depth-first search: long, winding corridors with few branches. */
function* backtracker(maze: Maze) {
  const start = Math.floor(Math.random() * maze.walls.length);
  const stack = [start];
  mark(maze, start);
  maze.active[start] = 1;

  while (stack.length > 0) {
    const cell = stack[stack.length - 1];
    maze.head = cell;
    const options = directionsWhere((direction) => {
      const next = neighbor(maze, cell, direction);
      return next >= 0 && maze.order[next] < 0;
    });

    if (options.length > 0) {
      const next = carve(maze, cell, pick(options));
      mark(maze, next);
      maze.active[next] = 1;
      stack.push(next);
    } else {
      stack.pop();
      maze.active[cell] = 0;
    }
    yield;
  }
}

/** Randomized Prim's: grows outward like a crystal, full of short spurs. */
function* prim(maze: Maze) {
  const frontier: number[] = [];
  const grow = (cell: number) => {
    mark(maze, cell);
    maze.active[cell] = 0;
    maze.head = cell;
    for (let direction = 0; direction < 4; direction += 1) {
      const next = neighbor(maze, cell, direction);
      if (next >= 0 && maze.order[next] < 0 && !maze.active[next]) {
        maze.active[next] = 1;
        frontier.push(next);
      }
    }
  };

  grow(Math.floor(Math.random() * maze.walls.length));
  yield;

  while (frontier.length > 0) {
    const index = Math.floor(Math.random() * frontier.length);
    const cell = frontier[index];
    frontier[index] = frontier[frontier.length - 1];
    frontier.pop();

    const carvedSides = directionsWhere((direction) => {
      const next = neighbor(maze, cell, direction);
      return next >= 0 && maze.order[next] >= 0;
    });
    carve(maze, cell, pick(carvedSides));
    grow(cell);
    yield;
  }
}

export function findRegion(parent: Int32Array, cell: number) {
  while (parent[cell] !== cell) {
    parent[cell] = parent[parent[cell]];
    cell = parent[cell];
  }
  return cell;
}

/** Randomized Kruskal's: scattered islands that merge into one maze. */
function* kruskal(maze: Maze) {
  const count = maze.walls.length;
  const parent = Int32Array.from({ length: count }, (_, cell) => cell);
  const size = new Int32Array(count).fill(1);
  maze.parent = parent;

  const edges: [number, number][] = [];
  for (let cell = 0; cell < count; cell += 1) {
    if (neighbor(maze, cell, 1) >= 0) edges.push([cell, 1]);
    if (neighbor(maze, cell, 2) >= 0) edges.push([cell, 2]);
  }

  for (const [cell, direction] of shuffle(edges)) {
    const next = neighbor(maze, cell, direction);
    let a = findRegion(parent, cell);
    let b = findRegion(parent, next);
    if (a === b) continue;

    // The larger region absorbs the smaller one and keeps its colour.
    if (size[a] < size[b]) [a, b] = [b, a];
    parent[b] = a;
    size[a] += size[b];

    carve(maze, cell, direction);
    mark(maze, cell);
    mark(maze, next);
    maze.head = next;
    yield;
  }
}

const wallCount = (walls: number) =>
  (walls & 1) + ((walls >> 1) & 1) + ((walls >> 2) & 1) + ((walls >> 3) & 1);

/** Knocks through some dead ends so there is more than one way around. */
function* braid(maze: Maze, chance: number) {
  const deadEnds = shuffle(
    Array.from(maze.walls.keys()).filter(
      (cell) => wallCount(maze.walls[cell]) === 3,
    ),
  );

  for (const cell of deadEnds) {
    if (wallCount(maze.walls[cell]) !== 3 || Math.random() > chance) continue;
    const closed = directionsWhere(
      (direction) =>
        (maze.walls[cell] & DIRECTIONS[direction].bit) !== 0 &&
        neighbor(maze, cell, direction) >= 0,
    );
    // Joining two dead ends removes both at once.
    const joinsDeadEnd = closed.filter(
      (direction) =>
        wallCount(maze.walls[neighbor(maze, cell, direction)]) === 3,
    );
    carve(maze, cell, pick(joinsDeadEnd.length > 0 ? joinsDeadEnd : closed));
    maze.head = cell;
    yield;
  }
}

const GENERATORS: Record<Algorithm, (maze: Maze) => Generator<void>> = {
  backtracker,
  prim,
  kruskal,
};

/** Rough generator step count, used to pace the animation. */
export const estimateSteps = (maze: Maze, algorithm: Algorithm) =>
  maze.walls.length * (algorithm === "backtracker" ? 2 : 1.1);

export function* generateMaze(
  maze: Maze,
  algorithm: Algorithm,
  loops: boolean,
) {
  yield* GENERATORS[algorithm](maze);
  if (loops) yield* braid(maze, 0.4);

  maze.active.fill(0);
  maze.head = -1;
  // Open the entrance and exit in the outer wall.
  maze.walls[0] &= ~W;
  maze.walls[maze.walls.length - 1] &= ~E;
}

/** A small binary min-heap of [priority, cell] pairs. */
class MinHeap {
  private items: [number, number][] = [];

  get size() {
    return this.items.length;
  }

  push(priority: number, cell: number) {
    const items = this.items;
    items.push([priority, cell]);
    let i = items.length - 1;
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (items[parent][0] <= items[i][0]) break;
      [items[parent], items[i]] = [items[i], items[parent]];
      i = parent;
    }
  }

  pop() {
    const items = this.items;
    const top = items[0];
    const last = items.pop()!;
    if (items.length > 0) {
      items[0] = last;
      let i = 0;
      for (;;) {
        const left = i * 2 + 1;
        const right = left + 1;
        let smallest = i;
        if (left < items.length && items[left][0] < items[smallest][0])
          smallest = left;
        if (right < items.length && items[right][0] < items[smallest][0])
          smallest = right;
        if (smallest === i) break;
        [items[smallest], items[i]] = [items[i], items[smallest]];
        i = smallest;
      }
    }
    return top;
  }
}

/**
 * Dijkstra's algorithm from `source`, yielding each cell as it is settled
 * (closest first) and returning the shortest path to `target`.
 */
export function* dijkstra(
  maze: Maze,
  source: number,
  target: number,
): Generator<{ cell: number; distance: number }, number[]> {
  const distance = new Float64Array(maze.walls.length).fill(Infinity);
  const previous = new Int32Array(maze.walls.length).fill(-1);
  const settled = new Uint8Array(maze.walls.length);
  const queue = new MinHeap();

  distance[source] = 0;
  queue.push(0, source);

  while (queue.size > 0) {
    const [cost, cell] = queue.pop();
    if (settled[cell]) continue;
    settled[cell] = 1;
    yield { cell, distance: cost };
    if (cell === target) break;

    for (let direction = 0; direction < 4; direction += 1) {
      const next = passage(maze, cell, direction);
      // Every corridor step costs the same, so each edge weighs 1.
      if (next < 0 || settled[next] || cost + 1 >= distance[next]) continue;
      distance[next] = cost + 1;
      previous[next] = cell;
      queue.push(cost + 1, next);
    }
  }

  if (!settled[target]) return [];
  const path: number[] = [];
  for (let cell = target; cell !== -1; cell = previous[cell]) path.push(cell);
  return path.reverse();
}

export function shortestPath(maze: Maze, source: number, target: number) {
  const search = dijkstra(maze, source, target);
  let step = search.next();
  while (!step.done) step = search.next();
  return step.value;
}
