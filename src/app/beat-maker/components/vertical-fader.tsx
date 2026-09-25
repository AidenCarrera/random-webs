"use client";

interface VerticalFaderProps {
  id: string;
  value: number;
  onChange: (id: string, value: number) => void;
}

const TICKS = [6, 0, -12, -24, -36, -48, -60];

export function VerticalFader({ id, value, onChange }: VerticalFaderProps) {
  const thumbPercent = ((value + 60) / 66) * 100;
  const isMaster = id === "master";
  return (
    <div className="group relative h-full w-5 md:w-6">
      <input
        type="range"
        min="-60"
        max="6"
        step="1"
        value={value}
        onChange={(event) => onChange(id, Number(event.target.value))}
        onDoubleClick={() => onChange(id, 0)}
        title="Double-click to reset to 0 dB"
        aria-label={`${id} volume`}
        className="peer absolute inset-0 z-20 h-6 w-36 origin-top-left translate-y-36 -rotate-90 cursor-pointer touch-none opacity-0 md:w-44 md:translate-y-44"
      />
      <div aria-hidden="true" className="absolute inset-x-0 top-2 bottom-2">
        {TICKS.map((tick) => (
          <span
            key={tick}
            className="absolute left-0 h-px w-1"
            style={{
              bottom: `${((tick + 60) / 66) * 100}%`,
              background:
                tick === 0 ? "rgba(165,180,252,0.6)" : "rgba(255,255,255,0.12)",
            }}
          />
        ))}
      </div>
      <div
        className="absolute bottom-2 left-1/2 top-2 w-0.5 -translate-x-1/2 rounded-full"
        style={{
          background: "rgba(0,0,0,0.6)",
          boxShadow: "0 0 0 1px rgba(255,255,255,0.05)",
        }}
      />
      <div
        className="pointer-events-none absolute left-0 right-0 z-10 h-6 rounded-md transition-[box-shadow] duration-150 group-hover:shadow-[0_0_0_1px_rgba(165,180,252,0.45),0_4px_10px_rgba(0,0,0,0.6)] peer-focus-visible:shadow-[0_0_0_2px_rgba(165,180,252,0.9)]"
        style={{
          bottom: `${thumbPercent}%`,
          transform: "translateY(50%)",
          background: isMaster
            ? "linear-gradient(180deg,#5b5f86 0%,#35375a 48%,#262842 52%,#3b3e63 100%)"
            : "linear-gradient(180deg,#4a4a55 0%,#2c2c35 48%,#202027 52%,#34343e 100%)",
          boxShadow:
            "0 3px 8px rgba(0,0,0,0.6),inset 0 1px 0 rgba(255,255,255,0.22)",
          border: "1px solid rgba(0,0,0,0.5)",
        }}
      >
        <div
          className="absolute inset-x-1.5 top-1/2 h-px -translate-y-1/2 rounded-full"
          style={{
            background: isMaster ? "#c7d2fe" : "rgba(255,255,255,0.7)",
            boxShadow: isMaster ? "0 0 4px #818cf8" : "none",
          }}
        />
      </div>
    </div>
  );
}
