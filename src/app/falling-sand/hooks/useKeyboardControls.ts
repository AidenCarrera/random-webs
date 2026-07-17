import { useEffect } from "react";

import { KEYBOARD_MATERIALS } from "../data/materials";
import type { Material } from "../types";

export function useKeyboardControls(
  onMaterialChange: (material: Material) => void,
  togglePaused: () => void,
) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement) return;
      if (event.code === "Space") {
        if (event.target instanceof HTMLButtonElement) return;
        event.preventDefault();
        togglePaused();
        return;
      }
      const material = KEYBOARD_MATERIALS.get(event.key.toLowerCase());
      if (material !== undefined) onMaterialChange(material);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onMaterialChange, togglePaused]);
}
