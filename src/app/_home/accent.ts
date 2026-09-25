import type { WebsiteEntry } from "@/lib/websites";

// Tailwind 400-shade hex values for the hues used by registry accents. Canvas
// and SVG drawing need concrete colors rather than utility classes.
const HUE_HEX: Record<string, string> = {
  amber: "#fbbf24",
  black: "#a1a1aa",
  blue: "#60a5fa",
  cyan: "#22d3ee",
  emerald: "#34d399",
  fuchsia: "#e879f9",
  green: "#4ade80",
  indigo: "#818cf8",
  lime: "#a3e635",
  neutral: "#a3a3a3",
  orange: "#fb923c",
  pink: "#f472b6",
  purple: "#c084fc",
  red: "#f87171",
  rose: "#fb7185",
  sky: "#38bdf8",
  slate: "#94a3b8",
  stone: "#a8a29e",
  teal: "#2dd4bf",
  violet: "#a78bfa",
  yellow: "#facc15",
  zinc: "#a1a1aa",
};

const FALLBACK = "#e4e4e7";

function hueFor(accent: string, stop: "from" | "via" | "to") {
  const match = accent.match(new RegExp(`${stop}-([a-z]+)`));
  return (match && HUE_HEX[match[1]]) ?? FALLBACK;
}

export function getAccentColors(website: Pick<WebsiteEntry, "accent">) {
  return {
    from: hueFor(website.accent, "from"),
    via: hueFor(website.accent, "via"),
    to: hueFor(website.accent, "to"),
  };
}
