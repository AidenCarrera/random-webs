import { AnimatePresence, motion } from "framer-motion";
import type { ZenGardenController } from "../hooks/useZenGarden";

type GardenCanvasProps = Pick<
  ZenGardenController,
  | "activeTool"
  | "atmosphere"
  | "canvasRef"
  | "containerRef"
  | "finishInteraction"
  | "handleContainerMouseDown"
  | "handleContainerMouseMove"
  | "handlePlantClick"
  | "handleTouchMove"
  | "handleTouchStart"
  | "plants"
  | "visualRipples"
>;

export function GardenCanvas({
  activeTool,
  atmosphere,
  canvasRef,
  containerRef,
  finishInteraction,
  handleContainerMouseDown,
  handleContainerMouseMove,
  handlePlantClick,
  handleTouchMove,
  handleTouchStart,
  plants,
  visualRipples,
}: GardenCanvasProps) {
  const toolBlocksPlantInteraction = ["rake", "water"].includes(activeTool);

  return (
    <div
      ref={containerRef}
      onMouseMove={handleContainerMouseMove}
      onMouseUp={finishInteraction}
      onTouchMove={handleTouchMove}
      onTouchEnd={finishInteraction}
      className="absolute inset-0 z-0 cursor-crosshair overflow-hidden"
    >
      <canvas
        ref={canvasRef}
        onMouseDown={handleContainerMouseDown}
        onTouchStart={handleTouchStart}
        className="absolute inset-0 w-full h-full block"
        aria-label="Interactive zen garden canvas"
      />

      {atmosphere === "dusk" && (
        <div className="absolute inset-0 bg-orange-600/10 pointer-events-none mix-blend-color-burn transition-all duration-1000" />
      )}
      {atmosphere === "night" && (
        <div className="absolute inset-0 bg-indigo-950/20 pointer-events-none mix-blend-multiply transition-all duration-1000" />
      )}

      <div className="absolute inset-0 pointer-events-none z-10">
        <AnimatePresence>
          {plants.map((plant) => (
            <motion.div
              key={plant.id}
              initial={{ scale: 0, opacity: 0, rotate: plant.rotation }}
              animate={{
                scale: plant.scale,
                opacity: 1,
                rotate: plant.rotation,
              }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 220, damping: 15 }}
              onMouseDown={(event) => {
                if (!toolBlocksPlantInteraction) {
                  handleTouchStart(event, plant.id);
                }
              }}
              onTouchStart={(event) => {
                if (!toolBlocksPlantInteraction) {
                  handleTouchStart(event, plant.id);
                }
              }}
              onClick={(event) => {
                if (!toolBlocksPlantInteraction) {
                  handlePlantClick(event, plant.id);
                }
              }}
              className={`zen-emoji absolute select-none origin-center flex items-center justify-center transition-transform duration-100 ${
                toolBlocksPlantInteraction
                  ? "pointer-events-none"
                  : "pointer-events-auto cursor-grab active:cursor-grabbing hover:scale-110 active:scale-95"
              }`}
              style={{ left: `${plant.x * 100}%`, top: `${plant.y * 100}%` }}
            >
              {plant.type}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="absolute inset-0 pointer-events-none z-20">
        {visualRipples.map((ripple) => (
          <motion.div
            key={ripple.id}
            initial={{ scale: 0.2, opacity: 0.8 }}
            animate={{ scale: 2.8, opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="absolute border border-white/60 dark:border-zinc-300/40 rounded-full"
            style={{
              left: `${ripple.x * 100}%`,
              top: `${ripple.y * 100}%`,
              width: "48px",
              height: "48px",
              marginLeft: "-24px",
              marginTop: "-24px",
            }}
          />
        ))}
      </div>
    </div>
  );
}
