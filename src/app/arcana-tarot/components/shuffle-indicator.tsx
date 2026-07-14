export function ShuffleIndicator() {
  return (
    <div
      className="flex flex-col items-center gap-6 animate-pulse"
      role="status"
      aria-live="polite"
    >
      <div
        aria-hidden="true"
        className="w-32 h-48 border-4 border-[#ffd700]/30 rounded-xl bg-[#2d1b4e] rotate-12"
      />
      <p className="text-xl tracking-widest text-[#ffd700]/70">SHUFFLING...</p>
    </div>
  );
}
