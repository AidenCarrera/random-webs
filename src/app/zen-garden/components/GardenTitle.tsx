import type { Theme } from "../types";

export function GardenTitle({ theme }: { theme: Theme }) {
  const usesLightText = theme.id === "moss" || theme.id === "obsidian";

  return (
    <div className="zen-title absolute top-3 left-4 sm:top-10 sm:left-10 z-30 pointer-events-none">
      <h1
        className={`text-lg sm:text-4xl font-light tracking-wide font-serif transition-colors duration-1000 pointer-events-none ${
          usesLightText
            ? "text-emerald-50 dark:text-emerald-100 drop-shadow-sm"
            : "text-green-900"
        }`}
      >
        The Zen Garden
      </h1>
      <p
        className={`hidden md:block mt-2 transition-colors duration-1000 pointer-events-none ${
          usesLightText
            ? "text-emerald-100/70 dark:text-emerald-200/60"
            : "text-green-700/60 opacity-60"
        }`}
      >
        Click anywhere to sow life.
      </p>
    </div>
  );
}
