import { AnimatePresence, motion } from "framer-motion";
import {
  Camera,
  Check,
  Compass,
  Download,
  Redo,
  Settings2,
  Trash2,
  Undo,
  Upload,
  Volume2,
  VolumeX,
} from "lucide-react";
import { THEMES } from "../constants";
import type { ZenGardenController } from "../hooks/useZenGarden";

type SettingsPanelProps = Pick<
  ZenGardenController,
  | "clearAllPlants"
  | "clearRake"
  | "downloadGardenAsImage"
  | "emojiSize"
  | "exportLayout"
  | "history"
  | "historyIndex"
  | "rakeSize"
  | "selectedTheme"
  | "setEmojiSize"
  | "setRakeSize"
  | "setSelectedTheme"
  | "setShowImportDialog"
  | "setSidebarOpen"
  | "setSoundEnabled"
  | "setWaterBrushSize"
  | "showToast"
  | "sidebarOpen"
  | "soundEnabled"
  | "triggerRedo"
  | "triggerUndo"
  | "waterBrushSize"
>;

export function SettingsPanel({
  clearAllPlants,
  clearRake,
  downloadGardenAsImage,
  emojiSize,
  exportLayout,
  history,
  historyIndex,
  rakeSize,
  selectedTheme,
  setEmojiSize,
  setRakeSize,
  setSelectedTheme,
  setShowImportDialog,
  setSidebarOpen,
  setSoundEnabled,
  setWaterBrushSize,
  showToast,
  sidebarOpen,
  soundEnabled,
  triggerRedo,
  triggerUndo,
  waterBrushSize,
}: SettingsPanelProps) {
  return (
    <AnimatePresence>
      {sidebarOpen && (
        <>
          <div
            onClick={() => setSidebarOpen(false)}
            className="absolute inset-0 bg-black/30 backdrop-blur-sm z-40"
          />

          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="absolute right-0 top-0 bottom-0 w-full max-w-70 sm:max-w-xs bg-emerald-50/95 dark:bg-emerald-900/90 text-emerald-950 dark:text-emerald-50 border-l border-emerald-200/60 dark:border-emerald-700/60 backdrop-blur-lg shadow-2xl p-4 sm:p-6 z-50 overflow-y-auto flex flex-col gap-4 sm:gap-6"
          >
            <div className="flex justify-between items-center pb-4 border-b border-emerald-200/60 dark:border-emerald-700/60">
              <h2 className="text-lg font-serif font-semibold flex items-center gap-2 text-emerald-800 dark:text-emerald-200">
                <Settings2 className="w-5 h-5 text-amber-500" />
                Garden Settings
              </h2>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-1 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-800 text-emerald-700 dark:text-emerald-300 transition-colors text-lg"
              >
                &times;
              </button>
            </div>

            <div className="zen-sidebar-actions hidden flex-col gap-2.5">
              <label className="text-xs text-emerald-800/80 dark:text-emerald-300/80 uppercase tracking-widest font-bold">
                Quick Actions
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className={`py-2 rounded-xl flex flex-col items-center justify-center gap-1 border transition-all text-xs font-semibold ${
                    soundEnabled
                      ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-700 dark:text-emerald-300 font-bold"
                      : "bg-emerald-50/50 dark:bg-emerald-950/20 border-transparent hover:border-emerald-200 dark:hover:border-emerald-800 text-emerald-950 dark:text-emerald-50"
                  }`}
                >
                  {soundEnabled ? (
                    <Volume2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <VolumeX className="w-4 h-4 text-emerald-700 dark:text-emerald-300" />
                  )}
                  <span>Sound</span>
                </button>

                <button
                  onClick={triggerUndo}
                  disabled={historyIndex <= 0}
                  className="py-2 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-transparent hover:border-emerald-200 dark:hover:border-emerald-800 disabled:opacity-35 text-xs font-semibold flex flex-col items-center justify-center gap-1 transition-colors"
                >
                  <Undo className="w-4 h-4" />
                  <span>Undo</span>
                </button>

                <button
                  onClick={triggerRedo}
                  disabled={historyIndex >= history.length - 1}
                  className="py-2 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-transparent hover:border-emerald-200 dark:hover:border-emerald-800 disabled:opacity-35 text-xs font-semibold flex flex-col items-center justify-center gap-1 transition-colors"
                >
                  <Redo className="w-4 h-4" />
                  <span>Redo</span>
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-2.5">
              <label className="text-xs text-emerald-800/80 dark:text-emerald-300/80 uppercase tracking-widest font-bold">
                Sand Color Theme
              </label>
              <div className="flex flex-col gap-2">
                {THEMES.map((theme) => (
                  <button
                    key={theme.id}
                    onClick={() => {
                      setSelectedTheme(theme.id);
                      showToast(`Theme: ${theme.name}`);
                    }}
                    className={`flex items-center justify-between p-2.5 rounded-xl border transition-all text-left ${
                      selectedTheme === theme.id
                        ? "bg-emerald-100 dark:bg-emerald-800 border-emerald-300 dark:border-emerald-700 shadow-sm"
                        : "bg-emerald-50/50 dark:bg-emerald-900/20 border-transparent hover:border-emerald-200 dark:hover:border-emerald-800"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className="w-5 h-5 rounded-full border border-emerald-300 dark:border-emerald-700 shadow-inner"
                        style={{ backgroundColor: theme.bg }}
                      />
                      <span className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">
                        {theme.name}
                      </span>
                    </div>
                    {selectedTheme === theme.id && (
                      <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <label className="text-xs text-emerald-800/80 dark:text-emerald-300/80 uppercase tracking-widest font-bold">
                Sizing
              </label>
              <div className="flex flex-col gap-2.5 bg-emerald-100/40 dark:bg-emerald-800/30 p-3 rounded-xl border border-emerald-200/60 dark:border-emerald-700/60">
                <div>
                  <div className="flex justify-between text-xs text-emerald-850 dark:text-emerald-300 mb-1">
                    <span>Planted Emoji Size</span>
                    <span className="font-mono font-bold">
                      {emojiSize.toFixed(1)}x
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.6"
                    max="2.2"
                    step="0.2"
                    value={emojiSize}
                    onChange={(event) =>
                      setEmojiSize(parseFloat(event.target.value))
                    }
                    className="w-full zen-slider"
                  />
                </div>

                <hr className="border-emerald-200/60 dark:border-emerald-700/60 my-1" />
                <div>
                  <div className="flex justify-between text-xs text-emerald-850 dark:text-emerald-300 mb-1">
                    <span>Rake Brush Width</span>
                    <span className="font-mono font-bold">{rakeSize}px</span>
                  </div>
                  <input
                    type="range"
                    min="4"
                    max="12"
                    step="1"
                    value={rakeSize}
                    onChange={(event) =>
                      setRakeSize(parseInt(event.target.value))
                    }
                    className="w-full zen-slider"
                  />
                </div>

                <hr className="border-emerald-200/60 dark:border-emerald-700/60 my-1" />
                <div>
                  <div className="flex justify-between text-xs text-emerald-850 dark:text-emerald-300 mb-1">
                    <span>Water Brush Width</span>
                    <span className="font-mono font-bold">
                      {waterBrushSize}px
                    </span>
                  </div>
                  <input
                    type="range"
                    min="8"
                    max="32"
                    step="2"
                    value={waterBrushSize}
                    onChange={(event) =>
                      setWaterBrushSize(parseInt(event.target.value))
                    }
                    className="w-full zen-slider"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <button
                onClick={clearRake}
                className="w-full py-2.5 rounded-xl bg-amber-500/20 text-amber-800 dark:text-amber-300 hover:bg-amber-500/30 border border-amber-500/30 text-xs font-bold transition-colors flex items-center justify-center gap-1"
              >
                <Compass className="w-3.5 h-3.5" />
                Clear Sand
              </button>
              <button
                onClick={clearAllPlants}
                className="w-full py-2.5 rounded-xl bg-rose-500/20 text-rose-800 dark:text-rose-300 hover:bg-rose-500/30 border border-rose-500/30 text-xs font-bold transition-colors flex items-center justify-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear Emojis
              </button>
            </div>

            <div className="flex flex-col gap-2 border-t border-emerald-200/60 dark:border-emerald-700/60 pt-4 mt-auto">
              <button
                onClick={downloadGardenAsImage}
                className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow"
              >
                <Camera className="w-3.5 h-3.5" />
                Download Garden Image
              </button>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={exportLayout}
                  className="py-2.5 rounded-xl bg-emerald-600 dark:bg-emerald-700 text-white hover:bg-emerald-500 dark:hover:bg-emerald-600 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow"
                  title="Export layout to text file"
                >
                  <Download className="w-3.5 h-3.5" />
                  Export
                </button>
                <button
                  onClick={() => setShowImportDialog(true)}
                  className="py-2.5 rounded-xl bg-emerald-600 dark:bg-emerald-700 text-white hover:bg-emerald-500 dark:hover:bg-emerald-600 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow"
                >
                  <Upload className="w-3.5 h-3.5" />
                  Import
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
