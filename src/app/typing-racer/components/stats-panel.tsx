import type { ReactNode } from "react";
import { Flame, Gauge, Zap } from "lucide-react";

interface StatCardProps {
  icon: ReactNode;
  iconClassName: string;
  label: string;
  value: ReactNode;
}

function StatCard({ icon, iconClassName, label, value }: StatCardProps) {
  return (
    <div className="bg-[#110a22]/80 border border-purple-900/40 rounded-3xl p-5 flex items-center gap-4 relative overflow-hidden">
      <div
        className={`h-10 w-10 rounded-xl border flex items-center justify-center ${iconClassName}`}
      >
        {icon}
      </div>
      <div>
        <div className="text-[10px] text-zinc-500 uppercase tracking-widest">
          {label}
        </div>
        {value}
      </div>
    </div>
  );
}

interface StatsPanelProps {
  wpm: number;
  accuracy: number;
  timeElapsed: number;
}

export function StatsPanel({ wpm, accuracy, timeElapsed }: StatsPanelProps) {
  return (
    <div className="lg:col-span-1 flex flex-col gap-4">
      <StatCard
        icon={<Gauge size={20} aria-hidden="true" />}
        iconClassName="bg-cyan-950/50 border-cyan-800/40 text-cyan-400"
        label="WORDS PER MINUTE"
        value={
          <div className="text-3xl font-black text-cyan-400">
            {wpm} <span className="text-xs text-zinc-400 font-normal">WPM</span>
          </div>
        }
      />

      <StatCard
        icon={<Flame size={20} aria-hidden="true" />}
        iconClassName="bg-pink-950/50 border-pink-850/40 text-pink-400"
        label="ACCURACY INDEX"
        value={
          <div className="text-3xl font-black text-pink-500">{accuracy}%</div>
        }
      />

      <StatCard
        icon={<Zap size={20} aria-hidden="true" />}
        iconClassName="bg-purple-950/50 border-purple-800/40 text-purple-400"
        label="RACE TIMER"
        value={
          <div className="text-3xl font-black text-purple-400">
            {timeElapsed.toFixed(1)}{" "}
            <span className="text-xs text-zinc-400 font-normal">SEC</span>
          </div>
        }
      />
    </div>
  );
}
