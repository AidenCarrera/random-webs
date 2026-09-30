import { BOARD_SIZE, startingTiles, type Tile } from "./game";

export type GameState = {
  tiles: Tile[];
  score: number;
  best: number;
  won: boolean;
  keepPlaying: boolean;
};

const STORAGE_KEY = "2048:game";
export const SERVER_STATE: GameState = {
  tiles: [],
  score: 0,
  best: 0,
  won: false,
  keepPlaying: false,
};

const isSavedTile = (value: unknown): value is Tile => {
  const tile = value as Tile;
  return (
    typeof tile?.id === "number" &&
    typeof tile.value === "number" &&
    [tile.row, tile.col].every(
      (n) => Number.isInteger(n) && n >= 0 && n < BOARD_SIZE,
    )
  );
};

function loadGame(): GameState {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");
    if (
      Array.isArray(saved?.tiles) &&
      saved.tiles.every(isSavedTile) &&
      typeof saved.score === "number" &&
      typeof saved.best === "number"
    ) {
      return {
        tiles: saved.tiles.map((tile: Tile) => ({ ...tile, kind: "new" })),
        score: saved.score,
        best: saved.best,
        won: saved.won === true,
        keepPlaying: saved.keepPlaying === true,
      };
    }
  } catch {
    // Malformed or blocked storage starts a fresh game.
  }
  return { ...SERVER_STATE, tiles: startingTiles() };
}

// The game lives outside React so it survives reloads and page visits, and
// the server render (an empty board) never has to guess at random tiles.
const listeners = new Set<() => void>();
let current: GameState | null = null;

export const store = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  get: () => (current ??= loadGame()),
  set(next: GameState) {
    current = next;
    try {
      const tiles = next.tiles
        .filter((tile) => !tile.consumed)
        .map(({ id, value, row, col }) => ({ id, value, row, col }));
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...next, tiles }));
    } catch {
      // Storage can be full or disabled; the game still plays.
    }
    listeners.forEach((listener) => listener());
  },
};
