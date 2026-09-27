"use client";

import { useRef } from "react";
import { BACKGROUND_COLORS } from "../data/options";
import { usePet } from "../hooks/use-pet";
import { Controls } from "./controls";
import { Screen } from "./screen";

export function Console() {
  const saveFileInputRef = useRef<HTMLInputElement>(null);
  const pet = usePet(saveFileInputRef);

  return (
    <main
      className="relative flex min-h-dvh select-none flex-col items-center justify-center overflow-hidden p-4 font-mono text-zinc-300 transition-colors duration-300 sm:p-6"
      style={{ backgroundColor: BACKGROUND_COLORS[pet.backgroundColor] }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_50%_55%_at_50%_45%,rgba(255,255,255,0.05),transparent_70%)]"
      />
      <input
        ref={saveFileInputRef}
        type="file"
        accept=".json,application/json"
        onChange={pet.handleImportSave}
        className="hidden"
        tabIndex={-1}
        aria-hidden="true"
      />
      <div className="relative z-10 flex w-full flex-col items-center">
        <div className="relative flex w-[min(100%,420px)] animate-fade-in flex-col items-center rounded-[50px] rounded-br-[90px] border-4 border-[#8f928d] bg-[linear-gradient(160deg,#c9cbc5_0%,#bfc1bb_45%,#b3b5af_100%)] p-6 pt-16 pb-16 shadow-[0_30px_70px_rgba(8,24,31,0.5),inset_0_4px_8px_rgba(255,255,255,0.75),inset_0_-8px_14px_rgba(85,90,88,0.28)] sm:p-8 sm:pt-16 sm:pb-18 md:w-[clamp(340px,calc((100dvh_-_3rem)/1.62),500px)] @container aspect-[10/16.2] justify-between">
          {/* Molded seam across the top of the shell. */}
          <div
            aria-hidden="true"
            className="absolute inset-x-10 top-7 h-px bg-[#8f928d]/60 shadow-[0_1px_0_rgba(255,255,255,0.6)]"
          />

          <Screen pet={pet} />

          <h1 className="sr-only">Style Pet</h1>

          <Controls pet={pet} />
        </div>
      </div>
    </main>
  );
}
