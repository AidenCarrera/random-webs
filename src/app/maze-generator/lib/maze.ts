// Grid mazes carved one step at a time by generators, so every algorithm can
// be animated, and solved by a depth-first, breadth-first, or A* search over
// the open passages.

export type Algorithm = "backtracker" | "prim" | "kruskal";
export type Solver = "dfs" | "bfs" | "astar";

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
 * A search from `source`, yielding each cell as it is visited along with its
 * distance from the source along the search tree, and returning the route it
 * found to `target`.
 */
type Search = Generator<{ cell: number; distance: number }, number[]>;

function trace(previous: Int32Array, target: number) {
  const path: number[] = [];
  for (let cell = target; cell !== -1; cell = previous[cell]) path.push(cell);
  return path.reverse();
}

/**
 * Depth-first search: follows one corridor as deep as it goes, then backtracks
 * to the last junction. It finds a route, but rarely the shortest one.
 */
function* dfs(maze: Maze, source: number, target: number): Search {
  const depth = new Int32Array(maze.walls.length);
  const previous = new Int32Array(maze.walls.length).fill(-1);
  const visited = new Uint8Array(maze.walls.length);
  const stack = [source];

  while (stack.length > 0) {
    const cell = stack.pop()!;
    if (visited[cell]) continue;
    visited[cell] = 1;
    yield { cell, distance: depth[cell] };
    if (cell === target) return trace(previous, target);

    for (let direction = 0; direction < 4; direction += 1) {
      const next = passage(maze, cell, direction);
      if (next < 0 || visited[next]) continue;
      // A cell still waiting on the stack is claimed by the deeper branch.
      depth[next] = depth[cell] + 1;
      previous[next] = cell;
      stack.push(next);
    }
  }
  return [];
}

/**
 * Breadth-first search: floods outward one distance layer at a time, so the
 * first route to reach the target is a shortest one.
 */
function* bfs(maze: Maze, source: number, target: number): Search {
  const distance = new Int32Array(maze.walls.length).fill(-1);
  const previous = new Int32Array(maze.walls.length).fill(-1);
  const queue = [source];
  distance[source] = 0;

  for (let head = 0; head < queue.length; head += 1) {
    const cell = queue[head];
    yield { cell, distance: distance[cell] };
    if (cell === target) return trace(previous, target);

    for (let direction = 0; direction < 4; direction += 1) {
      const next = passage(maze, cell, direction);
      if (next < 0 || distance[next] >= 0) continue;
      distance[next] = distance[cell] + 1;
      previous[next] = cell;
      queue.push(next);
    }
  }
  return [];
}

/**
 * A*: always visits the cell whose steps so far plus Manhattan distance to the
 * target is smallest. That estimate never overshoots the real distance, so the
 * route is still a shortest one, usually found with far less searching.
 */
function* astar(maze: Maze, source: number, target: number): Search {
  const distance = new Float64Array(maze.walls.length).fill(Infinity);
  const previous = new Int32Array(maze.walls.length).fill(-1);
  const settled = new Uint8Array(maze.walls.length);
  const open = new MinHeap();
  const estimate = (cell: number) =>
    Math.abs((cell % maze.cols) - (target % maze.cols)) +
    Math.abs(Math.floor(cell / maze.cols) - Math.floor(target / maze.cols));

  distance[source] = 0;
  open.push(estimate(source), source);

  while (open.size > 0) {
    const [, cell] = open.pop();
    if (settled[cell]) continue;
    settled[cell] = 1;
    yield { cell, distance: distance[cell] };
    if (cell === target) return trace(previous, target);

    const cost = distance[cell] + 1;
    for (let direction = 0; direction < 4; direction += 1) {
      const next = passage(maze, cell, direction);
      if (next < 0 || settled[next] || cost >= distance[next]) continue;
      distance[next] = cost;
      previous[next] = cell;
      // The fraction breaks ties in favour of the cell nearer the target.
      const remaining = estimate(next);
      open.push(cost + remaining + remaining / 1024, next);
    }
  }
  return [];
}

const SOLVERS: Record<
  Solver,
  (maze: Maze, source: number, target: number) => Search
> = { dfs, bfs, astar };

export const solveMaze = (
  maze: Maze,
  solver: Solver,
  source: number,
  target: number,
) => SOLVERS[solver](maze, source, target);

export function shortestPath(maze: Maze, source: number, target: number) {
  const search = bfs(maze, source, target);
  let step = search.next();
  while (!step.done) step = search.next();
  return step.value;
}
