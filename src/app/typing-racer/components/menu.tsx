import { ChevronRight } from "lucide-react";

import { DIFFICULTY_OPTIONS, DIFFICULTY_SETTINGS } from "../data/race-config";
import type { Difficulty } from "../types";

interface MenuProps {
  difficulty: Difficulty;
  onDifficultyChange: (difficulty: Difficulty) => void;
  onStart: () => void;
}

export function Menu({ difficulty, onDifficultyChange, onStart }: MenuProps) {
  return (
    <div className="bg-[#120b24]/75 border border-purple-900/40 rounded-3xl p-10 backdrop-blur-xl shadow-2xl flex flex-col items-center text-center gap-8 animate-in fade-in zoom-in duration-300">
      <div className="flex flex-col gap-2">
        <h2 className="text-5xl font-black tracking-tighter uppercase text-transparent bg-clip-text bg-linear-to-r from-purple-400 to-pink-500">
          T Y P I N G R A C E R
        </h2>
        <p className="text-zinc-500 text-sm max-w-lg mx-auto">
          Type the passage as fast as possible to race against CPU opponents
          down the highway.
        </p>
      </div>

      <div
        className="flex flex-col md:flex-row gap-4 w-full justify-center"
        role="group"
        aria-label="Race difficulty"
      >
        {DIFFICULTY_OPTIONS.map((level) => {
          const active = difficulty === level;
          const config = DIFFICULTY_SETTINGS[level];

          return (
            <button
              key={level}
              type="button"
              onClick={() => onDifficultyChange(level)}
              aria-pressed={active}
              className={`flex-1 p-6 rounded-2xl border transition-all duration-300 flex flex-col items-center gap-2 ${
                active
                  ? "bg-purple-900/30 border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.3)] text-white"
                  : "bg-black/40 border-purple-900/30 text-zinc-500 hover:border-purple-800/40 hover:text-zinc-300"
              }`}
            >
              <span className="text-xs uppercase tracking-wider font-bold">
                MODE
              </span>
              <span className="text-2xl font-black tracking-widest">
                {config.name}
              </span>
              <span className="text-[10px] opacity-70 uppercase tracking-widest">
                Bots: {config.bot1Wpm} &amp; {config.bot2Wpm} WPM
              </span>
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={onStart}
        className="px-12 py-5 liquid-gradient-btn hover:scale-105 active:scale-95 text-white font-black text-lg tracking-widest rounded-2xl transition-all shadow-[0_0_25px_rgba(168,85,247,0.4)] flex items-center gap-3"
      >
        <ChevronRight size={20} className="animate-pulse" aria-hidden="true" />
        <span>LAUNCH RACE</span>
      </button>
    </div>
  );
}
