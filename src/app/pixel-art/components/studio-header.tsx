import { GRID_SIZES } from "../constants";
import { CanvasActions } from "./canvas-actions";
import { PixelLogo } from "./pixel-logo";

type StudioHeaderProps = {
  isSaving: boolean;
  onClear: () => void;
  onSave: () => void;
  onSizeChange: (size: number) => void;
  onToggleGrid: () => void;
  showGrid: boolean;
  size: number;
};

export function StudioHeader({
  isSaving,
  onClear,
  onSave,
  onSizeChange,
  onToggleGrid,
  showGrid,
  size,
}: StudioHeaderProps) {
  return (
    <header className="pixel-panel bg-white p-3 sm:p-5 lg:py-3">
      <div className="flex flex-col gap-2 sm:gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <PixelLogo className="pixel-logo h-7 w-7 shrink-0 sm:h-10 sm:w-10" />
          <h1 className="pixel-font text-lg leading-none text-[#1d2b53] sm:text-3xl">
            PIXEL STUDIO {size}
          </h1>
        </div>

        <div className="grid w-full gap-1.5 sm:flex sm:w-auto sm:flex-wrap sm:gap-2">
          <div className="grid grid-cols-3 gap-1.5 sm:flex sm:flex-wrap sm:gap-2">
            {GRID_SIZES.map((gridSize) => (
              <button
                key={gridSize}
                onClick={() => onSizeChange(gridSize)}
                aria-pressed={size === gridSize}
                className={`pixel-chip ${size === gridSize ? "pixel-chip-active" : ""}`}
                type="button"
              >
                {gridSize}x{gridSize}
              </button>
            ))}
          </div>

          <CanvasActions
            compact
            isSaving={isSaving}
            onClear={onClear}
            onSave={onSave}
            onToggleGrid={onToggleGrid}
            showGrid={showGrid}
          />
        </div>
      </div>
    </header>
  );
}
