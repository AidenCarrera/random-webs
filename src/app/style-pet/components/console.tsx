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
        <div className="relative flex w-[min(100%,420px)] animate-fade-in flex-col items-center rounded-[50px] border-4 border-[#8f928d] bg-[#bfc1bb] p-6 pt-16 pb-16 shadow-[0_30px_70px_rgba(8,24,31,0.5),inset_0_4px_8px_rgba(255,255,255,0.75),inset_0_-8px_14px_rgba(85,90,88,0.28)] sm:p-8 sm:pt-16 sm:pb-18 md:w-125">
          <Screen pet={pet} />
          <Controls pet={pet} />
        </div>
      </div>
    </main>
  );
}
