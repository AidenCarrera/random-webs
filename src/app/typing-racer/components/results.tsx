import { Award, RotateCcw } from "lucide-react";

import { RANK_LABELS } from "../data/race-config";
import type { LeaderboardRunner, RaceRank } from "../types";

interface ResultsProps {
  wpm: number;
  accuracy: number;
  timeElapsed: number;
  errors: number;
  currentRank: RaceRank;
  leaderboard: LeaderboardRunner[];
  onRaceAgain: () => void;
  onReturnToMenu: () => void;
}

export function Results({
  wpm,
  accuracy,
  timeElapsed,
  errors,
  currentRank,
  leaderboard,
  onRaceAgain,
  onReturnToMenu,
}: ResultsProps) {
  return (
    <div className="bg-[#120b24]/75 border border-purple-900/40 rounded-3xl p-10 backdrop-blur-xl shadow-2xl flex flex-col gap-8 animate-in zoom-in-95 duration-300">
      <div className="text-center flex flex-col items-center gap-2">
        <div className="h-16 w-16 rounded-full bg-yellow-500/10 border border-yellow-500/40 flex items-center justify-center text-yellow-400 animate-bounce mb-2">
          <Award size={36} aria-hidden="true" />
        </div>
        <h2 className="text-4xl font-black tracking-widest uppercase text-transparent bg-clip-text bg-linear-to-r from-yellow-400 to-pink-500">
          RACE COMPLETE
        </h2>
        <p className="text-zinc-500 text-xs uppercase tracking-widest">
          Good job! Rank: {RANK_LABELS[currentRank]}
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-black/40 border border-purple-950/60 rounded-2xl p-6">
        <div className="text-center p-2">
          <div className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">
            Final speed
          </div>
          <div className="text-3xl font-black text-cyan-400">{wpm} WPM</div>
        </div>
        <div className="text-center p-2 border-l border-purple-950">
          <div className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">
            ACCURACY
          </div>
          <div className="text-3xl font-black text-pink-500">{accuracy}%</div>
        </div>
        <div className="text-center p-2 border-l border-purple-950">
          <div className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">
            TIME TAKEN
          </div>
          <div className="text-3xl font-black text-purple-400">
            {timeElapsed.toFixed(2)}s
          </div>
        </div>
        <div className="text-center p-2 border-l border-purple-950">
          <div className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">
            ERRORS
          </div>
          <div className="text-3xl font-black text-zinc-300">{errors}</div>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-[10px] text-purple-400 font-bold uppercase tracking-widest pl-2">
          Leaderboard Standings
        </span>
        <div className="flex flex-col border border-purple-950 rounded-2xl overflow-hidden divide-y divide-purple-950">
          {leaderboard.map((runner, index) => (
            <div
              key={runner.name}
              className={`flex items-center justify-between p-4 px-6 text-sm ${
                runner.isPlayer
                  ? "bg-purple-900/20 font-black text-cyan-300"
                  : "bg-black/20 text-zinc-400"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="font-bold w-4">{index + 1}.</span>
                <span>{runner.name}</span>
              </div>
              <span className="font-bold">{runner.wpm} WPM</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-4">
        <button
          type="button"
          onClick={onRaceAgain}
          className="flex-1 py-4 bg-linear-to-r from-purple-700 to-indigo-800 hover:from-purple-600 hover:to-indigo-700 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2"
        >
          <RotateCcw size={16} aria-hidden="true" />
          <span>RACE AGAIN</span>
        </button>
        <button
          type="button"
          onClick={onReturnToMenu}
          className="px-8 py-4 bg-zinc-900/60 hover:bg-zinc-800/80 border border-purple-900/40 rounded-2xl text-xs font-bold uppercase tracking-wider text-zinc-400 transition-all"
        >
          RETURN TO MENU
        </button>
      </div>
    </div>
  );
}
