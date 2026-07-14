interface CountdownPanelProps {
  countdown: number;
}

export function CountdownPanel({ countdown }: CountdownPanelProps) {
  return (
    <div className="bg-[#120b24]/75 border border-purple-900/40 rounded-3xl p-24 backdrop-blur-xl shadow-2xl flex flex-col items-center justify-center min-h-87.5 animate-in fade-in zoom-in duration-300">
      <span className="text-zinc-500 text-sm uppercase tracking-[0.3em] mb-12 relative z-10">
        DRIVERS PREPARE
      </span>
      <div
        className="relative w-32 h-32 flex items-center justify-center my-6"
        aria-live="assertive"
        aria-atomic="true"
      >
        <div
          className="absolute text-9xl font-black text-transparent bg-clip-text bg-linear-to-b from-cyan-400 to-purple-600 animate-ping select-none pointer-events-none opacity-45"
          aria-hidden="true"
        >
          {countdown}
        </div>
        <div className="absolute text-9xl font-black text-transparent bg-clip-text bg-linear-to-b from-cyan-400 to-purple-600">
          {countdown}
        </div>
      </div>
      <span className="text-purple-400 text-xs font-bold uppercase tracking-widest mt-12 animate-pulse relative z-10">
        GET READY TO TYPE...
      </span>
    </div>
  );
}
