"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { FractalExplorerController } from "../hooks/useFractalExplorer";

interface CoordinatesOverlayProps {
  explorer: FractalExplorerController;
}

export function CoordinatesOverlay({ explorer }: CoordinatesOverlayProps) {
  const { currentIterations, showCoordinates, uiCoords, zoomLevel } = explorer;

  return (
    <AnimatePresence>
      {showCoordinates && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.2 }}
          className="absolute bottom-3 left-3 sm:bottom-6 sm:left-6 pointer-events-none z-30 flex flex-col gap-2 max-w-[calc(100vw-6.5rem)] sm:max-w-75"
        >
          <div className="min-w-57 rounded-2xl border border-white/13 bg-[#0a0b1a]/72 p-3 sm:p-3.5 text-zinc-400 shadow-[0_16px_40px_rgba(0,0,0,0.34)] backdrop-blur-xl text-[9px] sm:text-[10px] font-mono leading-relaxed">
            <div className="mb-2 flex items-center justify-between border-b border-white/8 pb-2">
              <span className="uppercase font-semibold tracking-[0.18em] text-zinc-500">
                Coordinates
              </span>
            </div>
            <div className="grid grid-cols-[2.25rem_1fr] gap-y-0.5">
              <span className="text-zinc-600">RE</span>
              <span className="text-zinc-300">{uiCoords.r.toFixed(10)}</span>
              <span className="text-zinc-600">IM</span>
              <span className="text-zinc-300">{uiCoords.i.toFixed(10)}</span>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-white/[0.07] bg-white/[0.07]">
              <div className="bg-[#090a18]/75 px-2 py-1.5">
                <span className="block text-[8px] font-sans font-semibold uppercase tracking-wider text-zinc-600">
                  Zoom
                </span>
                <span className="text-zinc-200">
                  {zoomLevel < 1000
                    ? zoomLevel.toFixed(1)
                    : zoomLevel.toExponential(2)}
                  ×
                </span>
              </div>
              <div className="bg-[#090a18]/75 px-2 py-1.5">
                <span className="block text-[8px] font-sans font-semibold uppercase tracking-wider text-zinc-600">
                  Iter
                </span>
                <span className="text-zinc-200">{currentIterations}</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
