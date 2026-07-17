import { canvasToBlob } from "@/lib/canvasExport";

import type { FallingSandEngine } from "../engine";
import type { FallingSandSnapshot } from "../types";

export async function createSnapshot(
  engine: FallingSandEngine,
): Promise<FallingSandSnapshot> {
  const exportCanvas = document.createElement("canvas");
  const width = 1200;
  const topBand = 92;
  const padding = 36;
  const artWidth = width - padding * 2;
  const artHeight = Math.round(artWidth * (engine.height / engine.width));
  const bottomBand = 54;
  exportCanvas.width = width;
  exportCanvas.height = topBand + artHeight + bottomBand;
  const exportContext = exportCanvas.getContext("2d");
  if (!exportContext) throw new Error("Unable to prepare the PNG export.");

  exportContext.fillStyle = "#11110f";
  exportContext.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
  exportContext.fillStyle = "#efe9dc";
  exportContext.font = "700 28px Arial, sans-serif";
  exportContext.fillText("FALLING SAND", padding, 49);
  exportContext.fillStyle = "#938f85";
  exportContext.font = "15px Arial, sans-serif";
  exportContext.fillText("A pocket world made one cell at a time", padding, 73);

  const worldCanvas = document.createElement("canvas");
  worldCanvas.width = engine.width;
  worldCanvas.height = engine.height;
  const worldContext = worldCanvas.getContext("2d");
  if (!worldContext) throw new Error("Unable to render the current world.");
  engine.render(worldContext);

  exportContext.imageSmoothingEnabled = false;
  exportContext.drawImage(
    worldCanvas,
    0,
    0,
    engine.width,
    engine.height,
    padding,
    topBand,
    artWidth,
    artHeight,
  );
  exportContext.fillStyle = "#938f85";
  exportContext.font = "14px Arial, sans-serif";
  exportContext.fillText(
    "random-webs.vercel.app/falling-sand",
    padding,
    topBand + artHeight + 34,
  );

  const blob = await canvasToBlob(exportCanvas);
  const date = new Date().toISOString().slice(0, 10);
  return {
    blob,
    fileName: `falling-sand-${date}.png`,
    imageSrc: URL.createObjectURL(blob),
  };
}
