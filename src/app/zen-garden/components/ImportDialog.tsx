import { AnimatePresence } from "framer-motion";
import { Upload } from "lucide-react";
import type { ZenGardenController } from "../hooks/useZenGarden";

type ImportDialogProps = Pick<
  ZenGardenController,
  | "importLayout"
  | "importLayoutFromString"
  | "importString"
  | "setImportString"
  | "setShowImportDialog"
  | "showImportDialog"
>;

export function ImportDialog({
  importLayout,
  importLayoutFromString,
  importString,
  setImportString,
  setShowImportDialog,
  showImportDialog,
}: ImportDialogProps) {
  return (
    <AnimatePresence>
      {showImportDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 text-zinc-100 p-6 rounded-2xl w-full max-w-md shadow-2xl flex flex-col gap-4">
            <h3 className="text-md font-semibold text-zinc-200 font-serif">
              Import Zen Garden Layout
            </h3>
            <p className="text-xs text-zinc-400">
              Select a layout text file (`.txt`) exported from Zen Garden to
              rebuild your sanctuary.
            </p>

            <label className="flex flex-col items-center justify-center border border-dashed border-emerald-500/30 hover:border-emerald-500/50 rounded-xl p-4 cursor-pointer bg-zinc-950/40 hover:bg-zinc-950/60 transition-all">
              <Upload className="w-6 h-6 text-emerald-500 mb-1" />
              <span className="text-xs font-semibold text-zinc-200">
                Choose layout text file
              </span>
              <span className="text-[10px] text-zinc-500">
                Accepts .txt files
              </span>
              <input
                type="file"
                accept=".txt"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = (loadEvent) => {
                    const text = loadEvent.target?.result;
                    if (typeof text === "string") importLayoutFromString(text);
                  };
                  reader.readAsText(file);
                }}
              />
            </label>

            <div className="text-center text-zinc-500 text-[10px] uppercase font-bold tracking-widest my-0.5">
              — OR PASTE CODE —
            </div>
            <textarea
              value={importString}
              onChange={(event) => setImportString(event.target.value)}
              placeholder="Paste code here..."
              rows={2}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-xs text-zinc-300 focus:outline-none focus:border-amber-500 font-mono resize-none"
            />
            <div className="flex justify-end gap-2 text-xs font-semibold mt-1">
              <button
                onClick={() => {
                  setShowImportDialog(false);
                  setImportString("");
                }}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={importLayout}
                disabled={!importString.trim()}
                className="px-4 py-2 rounded-xl bg-amber-500 text-black hover:bg-amber-400 transition-colors disabled:opacity-50"
              >
                Import Code
              </button>
            </div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
