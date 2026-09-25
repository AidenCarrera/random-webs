import styles from "../styles.module.css";

const CLOUDS = [
  { top: "4%", width: 320, drift: 110, delay: -20, opacity: 0.9 },
  { top: "14%", width: 220, drift: 85, delay: -60, opacity: 0.7 },
  { top: "1%", width: 420, drift: 140, delay: -95, opacity: 0.75 },
  { top: "22%", width: 180, drift: 70, delay: -8, opacity: 0.55 },
];

/** Soft cumulus drifting behind the headline: the "cloudy" in the forecast. */
export function Clouds({ isDark }: { isDark: boolean }) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 top-0 z-1 h-[45vh] overflow-hidden transition-opacity duration-1000"
      style={{ opacity: isDark ? 0.18 : 1 }}
    >
      {CLOUDS.map((cloud, index) => (
        <svg
          key={index}
          viewBox="0 0 200 80"
          className={styles.cloud}
          style={
            {
              top: cloud.top,
              width: cloud.width,
              opacity: cloud.opacity,
              "--drift": `${cloud.drift}s`,
              "--delay": `${cloud.delay}s`,
              filter:
                "blur(1.5px) drop-shadow(0 12px 18px rgba(14,116,144,0.12))",
            } as React.CSSProperties
          }
        >
          <path
            d="M36 70 C14 70 6 54 16 42 C12 26 32 16 46 24 C52 8 80 4 94 18 C104 4 134 6 140 26 C160 18 184 30 180 48 C196 54 192 72 172 70 Z"
            fill={isDark ? "#cbd5e1" : "#ffffff"}
          />
        </svg>
      ))}
    </div>
  );
}
