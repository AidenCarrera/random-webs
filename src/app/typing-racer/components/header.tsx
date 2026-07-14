import { Trophy } from "lucide-react";

interface HeaderProps {
  highScore: number;
}

export function Header({ highScore }: HeaderProps) {
  return (
    <header className="flex justify-between items-center bg-[#150d2a]/80 border border-purple-900/60 rounded-3xl p-5 backdrop-blur-xl shadow-lg">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-black tracking-widest text-transparent bg-clip-text bg-linear-to-r from-purple-400 via-pink-400 to-cyan-400">
          TYPING RACER
        </h1>
      </div>
      <div className="flex items-center gap-3">
        <div className="bg-purple-950/40 border border-purple-900/40 rounded-full px-4 py-1.5 flex items-center gap-2 text-xs text-purple-300 font-bold">
          <Trophy size={14} className="text-yellow-400" aria-hidden="true" />
          <span>HIGH SCORE: {highScore} WPM</span>
        </div>
      </div>
    </header>
  );
}
