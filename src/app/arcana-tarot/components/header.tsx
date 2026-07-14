export function ArcanaHeader() {
  return (
    <header className="mb-6 md:mb-8 text-center relative isolate z-10">
      <div className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-44 w-44 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(88,28,135,0.55)_0%,rgba(88,28,135,0.22)_42%,rgba(88,28,135,0)_74%)] md:h-64 md:w-64" />
      <h1 className="text-5xl md:text-7xl font-bold text-[#ffd700] mb-4 drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)]">
        Arcana
      </h1>
      <p className="text-lg text-purple-200/60 italic tracking-widest font-serif">
        Reveal your fate
      </p>
    </header>
  );
}
