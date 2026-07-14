import { memo } from "react";

interface CarProps {
  color: string;
}

export const Car = memo(function Car({ color }: CarProps) {
  return (
    <svg
      viewBox="0 0 50 25"
      className="w-14 h-7 transition-all duration-300"
      style={{ transform: "scaleX(-1)" }}
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M 2 15 L 14 13 L 20 6 L 36 6 L 42 13 L 48 15 C 49 15 50 16 50 17 L 50 21 C 50 22 49 23 48 23 L 2 23 C 1 23 0 22 0 21 L 0 17 C 0 16 1 15 2 15 Z"
        fill={color}
      />
      <rect x="0" y="17" width="2" height="4" fill="#64748b" />
      <rect x="48" y="17" width="2" height="4" fill="#f43f5e" />
      <path d="M 21 8 L 33 8 L 36 12 L 18 12 Z" fill="#000" opacity="0.75" />
      <path d="M 22 9 L 27 9 L 26 11 L 20 11 Z" fill="#00ffff" opacity="0.8" />
      <path d="M 28 9 L 32 9 L 34 11 L 27 11 Z" fill="#00ffff" opacity="0.8" />
      <circle
        cx="10"
        cy="21"
        r="4.5"
        fill="#07060c"
        stroke={color}
        strokeWidth="1.5"
      />
      <circle cx="10" cy="21" r="1.5" fill="#cbd5e1" />
      <circle
        cx="38"
        cy="21"
        r="4.5"
        fill="#07060c"
        stroke={color}
        strokeWidth="1.5"
      />
      <circle cx="38" cy="21" r="1.5" fill="#cbd5e1" />
    </svg>
  );
});
