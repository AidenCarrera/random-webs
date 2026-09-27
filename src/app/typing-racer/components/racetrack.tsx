import type { Competitor, GameState, RaceRank } from "../types";
import styles from "../styles.module.css";
import { Car } from "./car";

interface RaceLaneProps {
  label: string;
  labelClassName: string;
  color: string;
  progress: number;
  running: boolean;
}

function RaceLane({
  label,
  labelClassName,
  color,
  progress,
  running,
}: RaceLaneProps) {
  return (
    <div
      className={`${styles.lane} ${running ? styles.laneRunning : ""} relative h-12 bg-black/40 border-y border-purple-900/40 flex items-center px-4 rounded-xl`}
    >
      <div
        className={`absolute left-3 z-10 text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${labelClassName}`}
      >
        {label}
      </div>
      <div
        className={`${styles.car} absolute z-10 transition-all duration-300`}
        style={
          {
            left: `calc(${progress}% - 48px)`,
            marginLeft: "48px",
            "--car-glow": `${color}4d`,
          } as React.CSSProperties
        }
      >
        <Car color={color} />
      </div>
      <div aria-hidden="true" className={styles.finish} />
    </div>
  );
}

interface RacetrackProps {
  gameState: GameState;
  competitors: Competitor[];
  playerProgress: number;
  currentRank: RaceRank;
}

export function Racetrack({
  gameState,
  competitors,
  playerProgress,
  currentRank,
}: RacetrackProps) {
  return (
    <div
      className="bg-[#110a22]/80 border border-purple-900/50 rounded-3xl p-6 relative overflow-hidden backdrop-blur-xl shadow-xl flex flex-col gap-6"
      aria-label={`Cyber highway track. Player position ${currentRank} of 3.`}
    >
      <div
        className={`absolute inset-0 z-0 opacity-15 rolling-grid ${
          gameState === "playing" ? styles.gridScroll : ""
        }`}
        style={{
          backgroundImage: `
            linear-gradient(rgba(147, 51, 234, 0.4) 1px, transparent 1px),
            linear-gradient(90deg, rgba(147, 51, 234, 0.4) 1px, transparent 1px)
          `,
          backgroundSize: "60px 40px",
        }}
      />

      <div className="flex justify-between items-center border-b border-purple-950 pb-3 relative z-10">
        <span className="text-xs text-purple-400 font-bold uppercase tracking-wider">
          CYBER HIGHWAY TRACK
        </span>
        <div className="flex items-center gap-4 text-xs font-bold text-cyan-400">
          <span>POSITION: {currentRank} / 3</span>
        </div>
      </div>

      <div className="flex flex-col gap-5 relative z-10 pb-2">
        <RaceLane
          label="YOU"
          labelClassName="text-cyan-400 bg-cyan-950/60 border border-cyan-800/40"
          color="#22d3ee"
          progress={playerProgress}
          running={gameState === "playing"}
        />

        {competitors[0] && (
          <RaceLane
            label={competitors[0].name.split(" - ")[1]}
            labelClassName="text-purple-400 bg-purple-950/60 border border-purple-800/40"
            color={competitors[0].color}
            progress={competitors[0].progress}
            running={gameState === "playing"}
          />
        )}

        {competitors[1] && (
          <RaceLane
            label={competitors[1].name.split(" - ")[1]}
            labelClassName="text-pink-400 bg-pink-950/60 border border-pink-850/40"
            color={competitors[1].color}
            progress={competitors[1].progress}
            running={gameState === "playing"}
          />
        )}
      </div>
    </div>
  );
}
