import { Maximize2, Minimize2, Pause, Play, RefreshCw } from "lucide-react";

import { PRESETS, PRESET_IDS } from "../data/presets";
import type { PresetId } from "../types";

const ICON_BUTTON_CLASS =
  "w-8.5 h-8.5 place-items-center border-0 rounded-[9px] cursor-pointer transition-all duration-150 active:scale-95 text-white/58 bg-transparent hover:text-white/92 hover:bg-white/7.5 icon-button";

type LampControlsProps = {
  presetId: PresetId;
  isUsingExactPreset: boolean;
  liquidColor: string;
  bubbleColor: string;
  isPaused: boolean;
  isFullscreen: boolean;
  onSelectPreset: (presetId: PresetId) => void;
  onLiquidColorChange: (color: string) => void;
  onBubbleColorChange: (color: string) => void;
  onTogglePaused: () => void;
  onReset: () => void;
  onToggleFullscreen: () => void;
};

export function LampControls({
  presetId,
  isUsingExactPreset,
  liquidColor,
  bubbleColor,
  isPaused,
  isFullscreen,
  onSelectPreset,
  onLiquidColorChange,
  onBubbleColorChange,
  onTogglePaused,
  onReset,
  onToggleFullscreen,
}: LampControlsProps) {
  return (
    <div
      className="absolute z-10 left-1/2 bottom-3.5 max-[700px]:bottom-5 max-[700px]:landscape:bottom-1.5 -translate-x-1/2 flex h-12 flex-nowrap items-center gap-2.5 max-[700px]:gap-1.75 w-max max-w-[calc(100%-28px)] max-[700px]:w-[calc(100%-24px)] max-[700px]:justify-between overflow-hidden p-1.5 border border-white/10 rounded-2xl bg-[#08090c]/58 shadow-[0_12px_38px_rgba(0,0,0,0.3)] backdrop-blur-lg cursor-default controls"
      onPointerDown={(event) => event.stopPropagation()}
    >
      <div
        className="flex min-w-0 items-center gap-0.5 overflow-x-auto no-scrollbar preset-list"
        aria-label="Fluid presets"
      >
        {PRESET_IDS.map((id) => (
          <button
            key={id}
            type="button"
            className={`flex-none px-2.75 max-[700px]:px-2.25 max-[410px]:px-2 py-2 border-0 rounded-[9px] text-[0.76rem] max-[410px]:text-[0.7rem] font-[610] tracking-[0.015em] cursor-pointer transition-all duration-150 active:scale-95 ${
              id === presetId && isUsingExactPreset
                ? "text-white bg-white/11 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.045)] active"
                : "text-white/58 bg-transparent hover:text-white/92 hover:bg-white/7.5"
            }`}
            onClick={() => onSelectPreset(id)}
          >
            {PRESETS[id].name}
          </button>
        ))}
      </div>

      <div className="flex flex-none items-center gap-1 pl-1.5 border-l border-white/8 icon-actions">
        <ColorPicker
          label="Liquid color"
          value={liquidColor}
          onChange={onLiquidColorChange}
        />
        <ColorPicker
          label="Bubble color"
          value={bubbleColor}
          onChange={onBubbleColorChange}
        />

        <button
          type="button"
          className={`grid ${ICON_BUTTON_CLASS}`}
          onClick={onTogglePaused}
          aria-label={isPaused ? "Resume animation" : "Pause animation"}
          title={isPaused ? "Resume" : "Pause"}
        >
          {isPaused ? <Play size={17} /> : <Pause size={17} />}
        </button>
        <button
          type="button"
          className={`grid ${ICON_BUTTON_CLASS}`}
          onClick={onReset}
          aria-label="Reset fluid"
          title="Reset"
        >
          <RefreshCw size={17} />
        </button>
        <button
          type="button"
          className={`hidden sm:grid ${ICON_BUTTON_CLASS}`}
          onClick={onToggleFullscreen}
          aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
        >
          {isFullscreen ? <Minimize2 size={17} /> : <Maximize2 size={17} />}
        </button>
      </div>
    </div>
  );
}

type ColorPickerProps = {
  label: string;
  value: string;
  onChange: (color: string) => void;
};

function ColorPicker({ label, value, onChange }: ColorPickerProps) {
  return (
    <label
      className="grid w-8.5 h-8.5 place-items-center border border-white/11 rounded-[9px] bg-white/4.5 cursor-pointer color-picker"
      title={label}
    >
      <span className="sr-only">{label}</span>
      <input
        type="color"
        className="w-5 h-5 p-0 border-0 rounded-full bg-transparent cursor-pointer"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-label={label}
      />
    </label>
  );
}
