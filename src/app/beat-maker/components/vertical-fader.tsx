"use client";

interface VerticalFaderProps {
  id: string;
  value: number;
  onChange: (id: string, value: number) => void;
}

export function VerticalFader({ id, value, onChange }: VerticalFaderProps) {
  const thumbPercent = ((value + 60) / 66) * 100;
  const isMaster = id === "master";
  return (
    <div className="relative h-full w-5 md:w-6">
      <input
        type="range"
        min="-60"
        max="6"
        step="1"
        value={value}
        onChange={(event) => onChange(id, Number(event.target.value))}
        onDoubleClick={() => onChange(id, 0)}
        title="Double-click to reset to 0 dB"
        className="absolute inset-0 w-36 md:w-44 h-6 origin-top-left -rotate-90 translate-y-36 md:translate-y-44 opacity-0 cursor-pointer z-20 touch-none"
      />
      <div
        className="absolute left-1/2 -translate-x-1/2 top-2 bottom-2 w-px rounded-full"
        style={{ background: "rgba(255,255,255,0.08)" }}
      />
      <div
        className="absolute left-0 right-0 h-6 rounded-lg pointer-events-none z-10"
        style={{
          bottom: `${thumbPercent}%`,
          transform: "translateY(50%)",
          background: isMaster
            ? "linear-gradient(180deg,rgba(255,255,255,0.18) 0%,rgba(255,255,255,0.08) 100%)"
            : "linear-gradient(180deg,rgba(255,255,255,0.12) 0%,rgba(255,255,255,0.05) 100%)",
          boxShadow:
            "0 2px 8px rgba(0,0,0,0.5),inset 0 1px 0 rgba(255,255,255,0.15)",
          border: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        <div
          className="absolute inset-x-2 top-1/2 -translate-y-1/2 h-px rounded-full"
          style={{
            background: isMaster
              ? "rgba(255,255,255,0.3)"
              : "rgba(255,255,255,0.2)",
          }}
        />
      </div>
    </div>
  );
}
