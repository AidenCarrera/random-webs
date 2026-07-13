"use client";

import type { FractalExplorerController } from "../hooks/useFractalExplorer";

interface FractalCanvasProps {
  explorer: FractalExplorerController;
}

export function FractalCanvas({ explorer }: FractalCanvasProps) {
  const {
    canvasRef,
    cpuCanvasRef,
    handleCanvasClick,
    handleDoubleClick,
    handlePointerDown,
    handlePointerMove,
    handlePointerUpOrCancel,
    handleWheel,
  } = explorer;

  return (
    <>
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUpOrCancel}
        onPointerCancel={handlePointerUpOrCancel}
        onPointerLeave={handlePointerUpOrCancel}
        onWheel={handleWheel}
        onDoubleClick={handleDoubleClick}
        onClick={handleCanvasClick}
        className="absolute top-0 left-0 w-full h-full cursor-grab active:cursor-grabbing block animate-fade-in duration-300 touch-none"
      />
      <canvas
        ref={cpuCanvasRef}
        aria-hidden="true"
        className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-0 block"
      />

      <div className="absolute inset-0 pointer-events-none z-10 bg-[radial-gradient(circle_at_18%_18%,rgba(89,76,183,0.08),transparent_31%),radial-gradient(circle_at_87%_90%,rgba(34,211,238,0.04),transparent_26%)]" />
      <div
        className="absolute inset-0 pointer-events-none z-10 opacity-[0.09]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.10) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.10) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          maskImage:
            "linear-gradient(to bottom, rgba(0,0,0,0.65), transparent 74%)",
        }}
      />
    </>
  );
}
