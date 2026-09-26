// An 8×8 pixel pencil, drawn cell by cell in the PICO-8 palette.
const SPRITE = [
  "......ee",
  ".....epe",
  "....eppe",
  "...ywpe.",
  "..yywe..",
  ".sryy...",
  "ssr.....",
  "k.......",
];

const COLORS: Record<string, string> = {
  e: "#1d2b53",
  p: "#ff77a8",
  w: "#fff1e8",
  y: "#ffa300",
  r: "#ab5236",
  s: "#ffccaa",
  k: "#1d2b53",
};

export function PixelLogo({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 8 8"
      aria-hidden="true"
      className={className}
      shapeRendering="crispEdges"
    >
      {SPRITE.flatMap((row, y) =>
        row
          .split("")
          .map((cell, x) =>
            cell === "." ? null : (
              <rect
                key={`${x}-${y}`}
                x={x}
                y={y}
                width="1"
                height="1"
                fill={COLORS[cell]}
              />
            ),
          ),
      )}
    </svg>
  );
}
