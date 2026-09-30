"use client";

import {
  useEffect,
  useEffectEvent,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import confetti from "canvas-confetti";

import {
  BOARD_SIZE,
  canMove,
  slide,
  spawnTile,
  startingTiles,
  WIN_VALUE,
  type Direction,
} from "./lib/game";
import { SERVER_STATE, store, type GameState } from "./lib/store";
import { isTypingTarget } from "@/lib/keyboard";
import styles from "./styles.module.css";

const KEY_DIRECTIONS: Record<string, Direction> = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
  w: "up",
  s: "down",
  a: "left",
  d: "right",
};

const NUDGE: Record<Direction, [number, number]> = {
  up: [0, -1],
  down: [0, 1],
  left: [-1, 0],
  right: [1, 0],
};

const isLocked = (game: GameState) =>
  (game.won && !game.keepPlaying) ||
  (game.tiles.length > 0 && !canMove(game.tiles));

export default function Game2048() {
  const game = useSyncExternalStore(
    store.subscribe,
    store.get,
    () => SERVER_STATE,
  );
  const [gain, setGain] = useState<{ amount: number; key: number } | null>(
    null,
  );
  const boardRef = useRef<HTMLDivElement>(null);
  const swipeRef = useRef<{ x: number; y: number } | null>(null);

  const over = game.tiles.length > 0 && !canMove(game.tiles);
  const showWin = game.won && !game.keepPlaying;

  const move = (direction: Direction) => {
    const state = store.get();
    if (isLocked(state)) return;

    const { tiles, moved, gained } = slide(state.tiles, direction);
    if (!moved) {
      // Nothing can slide that way: the board leans in and springs back.
      const [x, y] = NUDGE[direction];
      boardRef.current?.animate(
        [
          { transform: "translate(0, 0)" },
          { transform: `translate(${x * 7}px, ${y * 7}px)` },
          { transform: "translate(0, 0)" },
        ],
        { duration: 200, easing: "cubic-bezier(0.34, 1.56, 0.64, 1)" },
      );
      return;
    }

    const spawned = spawnTile(tiles);
    const score = state.score + gained;
    const reachedWin =
      !state.won &&
      tiles.some((tile) => tile.kind === "merged" && tile.value >= WIN_VALUE);

    store.set({
      tiles: spawned ? [...tiles, spawned] : tiles,
      score,
      best: Math.max(state.best, score),
      won: state.won || reachedWin,
      keepPlaying: state.keepPlaying,
    });

    if (gained > 0) {
      setGain((previous) => ({
        amount: gained,
        key: (previous?.key ?? 0) + 1,
      }));
    }
    if (reachedWin) {
      window.setTimeout(() => {
        confetti({
          particleCount: 160,
          spread: 90,
          startVelocity: 42,
          origin: { y: 0.55 },
          colors: ["#edc22e", "#f2b179", "#f67c5f", "#eee4da", "#8f7a66"],
          disableForReducedMotion: true,
        });
      }, 250);
    }
  };

  const newGame = () => {
    store.set({
      ...SERVER_STATE,
      best: store.get().best,
      tiles: startingTiles(),
    });
    setGain(null);
  };

  const onKey = useEffectEvent((event: KeyboardEvent) => {
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    if (isTypingTarget(event.target)) return;

    const direction =
      KEY_DIRECTIONS[event.key] ?? KEY_DIRECTIONS[event.key.toLowerCase()];
    if (!direction) return;
    event.preventDefault();
    move(direction);
  });

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => onKey(event);
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  const best = Math.max(game.best, game.score);
  const tiles = [...game.tiles].sort((a, b) => a.id - b.id);

  return (
    <main className={styles.game}>
      <div className={styles.container}>
        <div className={styles.heading}>
          <h1 className={styles.title}>2048</h1>
          <div className={styles.scores}>
            <div className={styles.scoreBox}>
              <span className={styles.scoreLabel}>Score</span>
              <span className={styles.scoreValue}>{game.score}</span>
              {gain && (
                <span key={gain.key} aria-hidden="true" className={styles.gain}>
                  +{gain.amount}
                </span>
              )}
            </div>
            <div className={styles.scoreBox}>
              <span className={styles.scoreLabel}>Best</span>
              <span className={styles.scoreValue}>{best}</span>
            </div>
          </div>
        </div>

        <div className={styles.above}>
          <p className={styles.intro}>
            Join the numbers and get to the <strong>2048 tile!</strong>
          </p>
          <button type="button" className={styles.button} onClick={newGame}>
            New Game
          </button>
        </div>

        <div className={styles.boardWrap}>
          <div
            ref={boardRef}
            className={styles.board}
            aria-label="2048 board"
            role="group"
            onPointerDown={(event) => {
              if (event.pointerType === "mouse" && event.button !== 0) return;
              event.currentTarget.setPointerCapture(event.pointerId);
              swipeRef.current = { x: event.clientX, y: event.clientY };
            }}
            onPointerUp={(event) => {
              const start = swipeRef.current;
              swipeRef.current = null;
              if (!start) return;
              const dx = event.clientX - start.x;
              const dy = event.clientY - start.y;
              if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
              move(
                Math.abs(dx) > Math.abs(dy)
                  ? dx > 0
                    ? "right"
                    : "left"
                  : dy > 0
                    ? "down"
                    : "up",
              );
            }}
            onPointerCancel={() => {
              swipeRef.current = null;
            }}
          >
            {Array.from({ length: BOARD_SIZE * BOARD_SIZE }, (_, cell) => (
              <div
                key={cell}
                className={styles.cell}
                style={
                  {
                    "--row": Math.floor(cell / BOARD_SIZE),
                    "--col": cell % BOARD_SIZE,
                  } as React.CSSProperties
                }
              />
            ))}
            {tiles.map((tile) => (
              <div
                key={tile.id}
                className={styles.tile}
                data-value={tile.value > WIN_VALUE ? "super" : tile.value}
                data-kind={tile.kind}
                aria-hidden={tile.consumed || undefined}
                style={
                  {
                    "--row": tile.row,
                    "--col": tile.col,
                  } as React.CSSProperties
                }
              >
                <div
                  className={styles.inner}
                  data-digits={Math.min(String(tile.value).length, 5)}
                >
                  {tile.value}
                </div>
              </div>
            ))}
          </div>

          {(over || showWin) && (
            <div
              className={styles.message}
              data-kind={showWin ? "won" : "over"}
              role="status"
            >
              <p>{showWin ? "You win!" : "Game over!"}</p>
              <div className={styles.messageActions}>
                {showWin && (
                  <button
                    type="button"
                    className={styles.button}
                    onClick={() =>
                      store.set({ ...store.get(), keepPlaying: true })
                    }
                  >
                    Keep going
                  </button>
                )}
                <button
                  type="button"
                  className={styles.button}
                  onClick={newGame}
                >
                  Try again
                </button>
              </div>
            </div>
          )}
        </div>

        <p className={styles.howTo}>
          <strong>How to play:</strong> Use your <strong>arrow keys</strong> or{" "}
          <strong>swipe</strong> to move the tiles. Tiles with the same number{" "}
          <strong>merge into one</strong> when they touch.
        </p>
      </div>
    </main>
  );
}
