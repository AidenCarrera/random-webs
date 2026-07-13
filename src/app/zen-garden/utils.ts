import type {
  Atmosphere,
  GardenLayout,
  ImportedGarden,
  Plant,
  Theme,
} from "./types";

export const randomUnit = () => Math.random();

export const createRandomId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : randomUnit().toString(36).slice(2);

export const createExportFileName = () => `my-zen-garden-${Date.now()}.png`;

export const blendColors = (c1: string, c2: string, ratio: number) => {
  if (!c1.startsWith("#")) return c1;
  const r1 = parseInt(c1.substring(1, 3), 16);
  const g1 = parseInt(c1.substring(3, 5), 16);
  const b1 = parseInt(c1.substring(5, 7), 16);

  const r2 = parseInt(c2.substring(1, 3), 16);
  const g2 = parseInt(c2.substring(3, 5), 16);
  const b2 = parseInt(c2.substring(5, 7), 16);

  const r = Math.round(r1 * (1 - ratio) + r2 * ratio);
  const g = Math.round(g1 * (1 - ratio) + g2 * ratio);
  const b = Math.round(b1 * (1 - ratio) + b2 * ratio);

  return `#${r.toString(16).padStart(2, "0")}${g
    .toString(16)
    .padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
};

export const getActiveBackgroundColor = (
  theme: Theme,
  atmosphere: Atmosphere,
) => {
  if (atmosphere === "dusk") return blendColors(theme.bg, "#f97316", 0.15);
  if (atmosphere === "night") return blendColors(theme.bg, "#1e1b4b", 0.35);
  return theme.bg;
};

export const getEmojiScaleFactor = (emoji: string): number => {
  if (["🐉", "⛩️"].includes(emoji)) return 2.4;
  if (["🌳", "🌲", "⛲"].includes(emoji)) return 2.2;
  if (["🌴", "🗿", "🌈"].includes(emoji)) return 2.0;
  if (["🪨"].includes(emoji)) return 1.8;
  if (["🦚"].includes(emoji)) return 1.75;
  if (["🎋"].includes(emoji)) return 1.6;
  if (["🌵", "⛅", "🌙"].includes(emoji)) return 1.5;
  if (["🪵", "🧱", "🏮", "🧘"].includes(emoji)) return 1.35;
  if (["🌻"].includes(emoji)) return 1.25;
  if (["🏺"].includes(emoji)) return 1.2;
  if (["🦆"].includes(emoji)) return 1.15;
  if (["🔔"].includes(emoji)) return 1.1;
  if (["🌿", "🐸"].includes(emoji)) return 0.85;
  if (["🍁", "🍂", "🍃", "🐦", "🕯️", "🍵", "⭐", "💎", "🌾"].includes(emoji)) {
    return 0.8;
  }
  if (["🍄"].includes(emoji)) return 0.75;
  if (["🌱", "🍀"].includes(emoji)) return 0.7;
  if (["🦋", "🐟", "🐠"].includes(emoji)) return 0.65;
  if (["🐌"].includes(emoji)) return 0.55;
  if (["🐞", "🐝"].includes(emoji)) return 0.4;
  return 1;
};

export const encodeGardenLayout = (layout: GardenLayout) =>
  btoa(unescape(encodeURIComponent(JSON.stringify(layout))));

export const parseGardenLayout = (code: string) => {
  const decoded = decodeURIComponent(escape(atob(code.trim())));
  const data = JSON.parse(decoded) as ImportedGarden;
  const importedPlants = Array.isArray(data.plants) ? data.plants : [];

  const plants = importedPlants.map((value): Plant => {
    const plant =
      typeof value === "object" && value !== null
        ? (value as Record<string, unknown>)
        : {};

    return {
      id: typeof plant.id === "string" ? plant.id : createRandomId(),
      x: Number(plant.x) || 0.5,
      y: Number(plant.y) || 0.5,
      type: String(plant.type || "🌱"),
      rotation: Number(plant.rotation) || 0,
      scale: Number(plant.scale) || 1.2,
    };
  });

  return {
    plants,
    strokes: Array.isArray(data.strokes) ? data.strokes : [],
    ripples: Array.isArray(data.ripples) ? data.ripples : [],
    theme: data.theme,
  };
};

export const dataUrlToBlob = (dataUrl: string) => {
  const [header, encodedData] = dataUrl.split(",");
  const mime = header.match(/:(.*?);/)?.[1] || "image/png";
  const binary = atob(encodedData);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return new Blob([bytes], { type: mime });
};
