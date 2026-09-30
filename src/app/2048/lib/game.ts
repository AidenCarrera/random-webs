export const BOARD_SIZE = 4;
export const WIN_VALUE = 2048;

export type Direction = "up" | "down" | "left" | "right";

export type Tile = {
  id: number;
  value: number;
  row: number;
  col: number;
  /** Plays the spawn or merge animation for one move. */
  kind?: "new" | "merged";
  /** Merged away: it slides into place under its replacement, then goes. */
  consumed?: boolean;
};

const nextIdFor = (tiles: Tile[]) =>
  tiles.reduce((max, tile) => Math.max(max, tile.id), 0) + 1;

export function spawnTile(tiles: Tile[]): Tile | null {
  const taken = new Set(
    tiles
      .filter((tile) => !tile.consumed)
      .map((tile) => tile.row * BOARD_SIZE + tile.col),
  );
  const free: number[] = [];
  for (let cell = 0; cell < BOARD_SIZE * BOARD_SIZE; cell += 1) {
    if (!taken.has(cell)) free.push(cell);
  }
  if (free.length === 0) return null;

  const cell = free[Math.floor(Math.random() * free.length)];
  return {
    id: nextIdFor(tiles),
    value: Math.random() < 0.9 ? 2 : 4,
    row: Math.floor(cell / BOARD_SIZE),
    col: cell % BOARD_SIZE,
    kind: "new",
  };
}

export function startingTiles() {
  const tiles: Tile[] = [];
  for (let count = 0; count < 2; count += 1) {
    const tile = spawnTile(tiles);
    if (tile) tiles.push(tile);
  }
  return tiles;
}

export function slide(tiles: Tile[], direction: Direction) {
  const live = tiles
    .filter((tile) => !tile.consumed)
    .map(({ id, value, row, col }): Tile => ({ id, value, row, col }));
  const vertical = direction === "up" || direction === "down";
  const reverse = direction === "right" || direction === "down";
  const along = (tile: Tile) => (vertical ? tile.row : tile.col);
  const result: Tile[] = [];
  let nextId = nextIdFor(tiles);
  let moved = false;
  let gained = 0;

  for (let line = 0; line < BOARD_SIZE; line += 1) {
    const inLine = live
      .filter((tile) => (vertical ? tile.col : tile.row) === line)
      .sort((a, b) => (reverse ? along(b) - along(a) : along(a) - along(b)));

    let slot = 0;
    let mergeable: Tile | null = null;

    for (const tile of inLine) {
      if (mergeable && mergeable.value === tile.value) {
        const { row, col } = mergeable;
        mergeable.consumed = true;
        result.push(
          { ...tile, row, col, consumed: true },
          { id: nextId, value: tile.value * 2, row, col, kind: "merged" },
        );
        nextId += 1;
        gained += tile.value * 2;
        moved = true;
        mergeable = null;
        continue;
      }

      const offset = reverse ? BOARD_SIZE - 1 - slot : slot;
      const placed = {
        ...tile,
        row: vertical ? offset : line,
        col: vertical ? line : offset,
      };
      if (placed.row !== tile.row || placed.col !== tile.col) moved = true;
      result.push(placed);
      mergeable = placed;
      slot += 1;
    }
  }

  return { tiles: result, moved, gained };
}

export function canMove(tiles: Tile[]) {
  const grid = new Map<number, number>();
  for (const tile of tiles) {
    if (!tile.consumed) grid.set(tile.row * BOARD_SIZE + tile.col, tile.value);
  }
  if (grid.size < BOARD_SIZE * BOARD_SIZE) return true;

  for (let row = 0; row < BOARD_SIZE; row += 1) {
    for (let col = 0; col < BOARD_SIZE; col += 1) {
      const value = grid.get(row * BOARD_SIZE + col);
      if (
        col < BOARD_SIZE - 1 &&
        value === grid.get(row * BOARD_SIZE + col + 1)
      )
        return true;
      if (
        row < BOARD_SIZE - 1 &&
        value === grid.get((row + 1) * BOARD_SIZE + col)
      )
        return true;
    }
  }
  return false;
}
