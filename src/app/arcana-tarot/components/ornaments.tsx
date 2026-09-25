import { useId, type SVGProps } from "react";

import styles from "../styles.module.css";

const GOLD = "#ffd700";

// Rounded so server and browser trig results serialize identically.
const round = (value: number) => Math.round(value * 100) / 100;

function seeded(seed: number) {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

const STARS = (() => {
  const random = seeded(78);
  return Array.from({ length: 90 }, (_, index) => ({
    id: index,
    x: random() * 100,
    y: random() * 100,
    r: random() < 0.12 ? 1.6 : 0.55 + random() * 0.6,
    delay: random() * 6,
    duration: 3 + random() * 4,
  }));
})();

/** A deterministic field of softly twinkling stars. */
export function Starfield() {
  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 h-full w-full"
      preserveAspectRatio="none"
    >
      {STARS.map((star) => (
        <circle
          key={star.id}
          cx={`${star.x}%`}
          cy={`${star.y}%`}
          r={star.r}
          fill={star.r > 1.2 ? "#fff3b0" : "#e9d5ff"}
          className={styles.star}
          style={
            {
              "--d": `${star.duration}s`,
              animationDelay: `${star.delay}s`,
              opacity: 0.55,
            } as React.CSSProperties
          }
        />
      ))}
    </svg>
  );
}

const NUMERALS = [
  "I",
  "II",
  "III",
  "IV",
  "V",
  "VI",
  "VII",
  "VIII",
  "IX",
  "X",
  "XI",
  "XII",
];

/** A slowly turning astrolabe ring drawn behind the title. */
export function AstrolabeRing(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="-200 -200 400 400" aria-hidden="true" {...props}>
      <g fill="none" stroke={GOLD} strokeWidth="0.6">
        <circle r="196" opacity="0.35" />
        <circle r="184" opacity="0.2" />
        <circle r="150" opacity="0.28" strokeDasharray="1 5" />
        <circle r="118" opacity="0.18" />
        {Array.from({ length: 72 }, (_, index) => {
          const angle = (index / 72) * Math.PI * 2;
          const inner = index % 6 === 0 ? 172 : 180;
          return (
            <line
              key={index}
              x1={round(Math.cos(angle) * inner)}
              y1={round(Math.sin(angle) * inner)}
              x2={round(Math.cos(angle) * 184)}
              y2={round(Math.sin(angle) * 184)}
              opacity="0.4"
            />
          );
        })}
        <polygon
          points={Array.from({ length: 12 }, (_, index) => {
            const angle = (index / 12) * Math.PI * 2 - Math.PI / 2;
            const radius = index % 2 === 0 ? 118 : 92;
            return `${round(Math.cos(angle) * radius)},${round(Math.sin(angle) * radius)}`;
          }).join(" ")}
          opacity="0.18"
        />
      </g>
      <g
        fill={GOLD}
        fontSize="9"
        textAnchor="middle"
        dominantBaseline="middle"
        opacity="0.45"
        style={{ fontFamily: "inherit", letterSpacing: "0.1em" }}
      >
        {NUMERALS.map((numeral, index) => {
          const angle = (index / 12) * Math.PI * 2 - Math.PI / 2;
          return (
            <text
              key={numeral}
              x={round(Math.cos(angle) * 164)}
              y={round(Math.sin(angle) * 164)}
            >
              {numeral}
            </text>
          );
        })}
      </g>
    </svg>
  );
}

/** The ornate reverse side shared by the deck and every face-down card. */
export function CardBack({ className = "" }: { className?: string }) {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const glowId = `arcana-back-glow-${id}`;
  const latticeId = `arcana-back-lattice-${id}`;

  return (
    <svg
      viewBox="0 0 200 300"
      aria-hidden="true"
      className={className}
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <radialGradient id={glowId} cx="50%" cy="50%" r="60%">
          <stop offset="0" stopColor="#4c1d95" />
          <stop offset="1" stopColor="#1e0b36" />
        </radialGradient>
        <pattern
          id={latticeId}
          width="16"
          height="16"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)"
        >
          <path
            d="M0 8h16M8 0v16"
            stroke={GOLD}
            strokeWidth="0.4"
            opacity="0.16"
          />
          <circle cx="8" cy="8" r="0.9" fill={GOLD} opacity="0.35" />
        </pattern>
      </defs>
      <rect width="200" height="300" fill={`url(#${glowId})`} />
      <rect width="200" height="300" fill={`url(#${latticeId})`} />
      <g fill="none" stroke={GOLD}>
        <rect
          x="10"
          y="10"
          width="180"
          height="280"
          rx="8"
          opacity="0.55"
          strokeWidth="1.2"
        />
        <rect
          x="16"
          y="16"
          width="168"
          height="268"
          rx="5"
          opacity="0.3"
          strokeWidth="0.6"
        />
        <circle cx="100" cy="150" r="46" opacity="0.5" strokeWidth="0.8" />
        <circle
          cx="100"
          cy="150"
          r="56"
          opacity="0.25"
          strokeWidth="0.6"
          strokeDasharray="2 4"
        />
        {Array.from({ length: 24 }, (_, index) => {
          const angle = (index / 24) * Math.PI * 2;
          const inner = 48;
          const outer = index % 2 === 0 ? 70 : 60;
          return (
            <line
              key={index}
              x1={round(100 + Math.cos(angle) * inner)}
              y1={round(150 + Math.sin(angle) * inner)}
              x2={round(100 + Math.cos(angle) * outer)}
              y2={round(150 + Math.sin(angle) * outer)}
              opacity="0.45"
              strokeWidth="0.8"
            />
          );
        })}
        <path
          d="M70 150 Q100 122 130 150 Q100 178 70 150 Z"
          strokeWidth="1.4"
          opacity="0.85"
        />
      </g>
      <circle cx="100" cy="150" r="9" fill={GOLD} opacity="0.85" />
      <circle cx="100" cy="150" r="4" fill="#1e0b36" />
      <g fill={GOLD} opacity="0.7">
        <path d="M100 40 l3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3z" />
        <path d="M100 240 l3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3z" />
        <path d="M40 60 a9 9 0 1 0 8 13 a7 7 0 1 1 -8 -13z" opacity="0.75" />
        <path d="M160 240 a9 9 0 1 1 -8 13 a7 7 0 1 0 8 -13z" opacity="0.75" />
      </g>
    </svg>
  );
}

const ELEMENT_PATHS: Record<string, { d: string; bar: boolean }> = {
  Fire: { d: "M0 -16 L14 10 L-14 10 Z", bar: false },
  Air: { d: "M0 -16 L14 10 L-14 10 Z", bar: true },
  Water: { d: "M0 16 L14 -10 L-14 -10 Z", bar: false },
  Earth: { d: "M0 16 L14 -10 L-14 -10 Z", bar: true },
};

/** Classical alchemical symbol for a card's element, framed in a sun. */
export function ElementEmblem({
  element,
  className = "",
}: {
  element: string;
  className?: string;
}) {
  const glyph = ELEMENT_PATHS[element] ?? ELEMENT_PATHS.Fire;
  const pointsUp = glyph.d.startsWith("M0 -16");

  return (
    <svg
      viewBox="-40 -40 80 80"
      aria-hidden="true"
      className={className}
      fill="none"
      stroke={GOLD}
    >
      <circle r="30" opacity="0.35" strokeWidth="0.8" />
      <circle r="24" opacity="0.2" strokeWidth="0.6" strokeDasharray="1.5 3" />
      {Array.from({ length: 16 }, (_, index) => {
        const angle = (index / 16) * Math.PI * 2;
        const outer = index % 2 === 0 ? 38 : 34;
        return (
          <line
            key={index}
            x1={round(Math.cos(angle) * 31)}
            y1={round(Math.sin(angle) * 31)}
            x2={round(Math.cos(angle) * outer)}
            y2={round(Math.sin(angle) * outer)}
            opacity="0.5"
            strokeWidth="0.8"
          />
        );
      })}
      <path d={glyph.d} strokeWidth="1.8" strokeLinejoin="round" />
      {glyph.bar ? (
        <line
          x1={-9}
          x2={9}
          y1={pointsUp ? 1 : -1}
          y2={pointsUp ? 1 : -1}
          strokeWidth="1.8"
        />
      ) : null}
    </svg>
  );
}

/** Small filigree used on the corners of framed panels. */
export function CornerFlourish({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      fill="none"
      stroke={GOLD}
      strokeWidth="1.2"
    >
      <path d="M2 22 V8 Q2 2 8 2 H22" />
      <path d="M6 22 V10 Q6 6 10 6 H22" opacity="0.5" />
      <circle cx="2" cy="2" r="1.6" fill={GOLD} stroke="none" />
    </svg>
  );
}

export function toRomanNumeral(value: number) {
  if (value === 0) return "0";
  const table: [number, string][] = [
    [10, "X"],
    [9, "IX"],
    [5, "V"],
    [4, "IV"],
    [1, "I"],
  ];
  let remaining = value;
  let result = "";
  for (const [amount, numeral] of table) {
    while (remaining >= amount) {
      result += numeral;
      remaining -= amount;
    }
  }
  return result;
}
