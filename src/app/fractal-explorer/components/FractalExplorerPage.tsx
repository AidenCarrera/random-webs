"use client";

import { useFractalExplorer } from "../hooks/useFractalExplorer";
import { AudioPrompt } from "./AudioPrompt";
import { CoordinatesOverlay } from "./CoordinatesOverlay";
import { FractalCanvas } from "./FractalCanvas";
import { SettingsPanel } from "./SettingsPanel";

export function FractalExplorerPage() {
  const explorer = useFractalExplorer();

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#050611] font-sans select-none overscroll-none">
      <FractalCanvas explorer={explorer} />
      <CoordinatesOverlay explorer={explorer} />
      <SettingsPanel explorer={explorer} />
      <AudioPrompt explorer={explorer} />
    </div>
  );
}
