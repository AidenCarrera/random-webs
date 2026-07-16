import type { ChangeStatus } from "./types";

export const ROOT_ID = "__repository_root__";
export const MAX_TREE_FILES = 700;
export const MAX_COMMITS = 16;

export const FILE_COLORS = {
  typescript: "#59a8ff",
  javascript: "#f8d35f",
  styles: "#d68bff",
  data: "#ffad5c",
  docs: "#60d394",
  image: "#ff7b9c",
  audio: "#d58cff",
  video: "#ff665f",
  config: "#9ba8bd",
  other: "#57d6d1",
} as const;

export const STATUS_COLORS: Record<ChangeStatus, string> = {
  added: "#4ade80",
  modified: "#facc15",
  removed: "#fb7185",
};

export const LEGEND_ITEMS = [
  ["TypeScript", FILE_COLORS.typescript],
  ["JavaScript", FILE_COLORS.javascript],
  ["Styles", FILE_COLORS.styles],
  ["Data", FILE_COLORS.data],
  ["Docs", FILE_COLORS.docs],
  ["Images", FILE_COLORS.image],
  ["Other", FILE_COLORS.other],
] as const;
