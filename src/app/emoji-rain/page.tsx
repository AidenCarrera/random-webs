"use client";

import { memo, useCallback, useEffect, useRef, useState, type RefObject } from "react";

const EMOJIS = {
  rain: ["💧", "🌧️", "☔", "⛈️", "🌊", "💦"],
  money: ["💸", "💰", "💵", "💎", "🪙", "📈", "🏦"],
  love: [
    "❤️",
    "💖",
    "🥰",
    "💌",
    "💘",
    "💝",
    "💕",
    "😘",
    "😍",
    "💓",
    "💞",
    "🌹",
    "💋",
  ],
  food: [
    "🍔",
    "🍕",
    "🌮",
    "🍟",
    "🍣",
    "🍜",
    "🍩",
    "🍪",
    "🍰",
    "🍫",
    "🍿",
    "☕",
    "🥤",
    "🍎",
    "🍓",
    "🍉",
  ],
  space: ["🚀", "🛸", "🪐", "⭐", "🌟", "✨", "☄️", "🌙", "🌌", "👽"],
  music: ["🎵", "🎶", "🎸", "🎹", "🎧", "🎤", "🥁", "🎷", "🎺"],
  tech: ["💻", "🖥️", "⌨️", "🖱️", "📱", "🤖", "👾", "💾", "🔋", "📡"],
  ocean: ["🐳", "🐬", "🐙", "🦈", "🐠", "🦀", "🦑", "🌊", "🐚"],
  animals: ["🐶", "🐱", "🦊", "🐼", "🦁", "🐯", "🐸", "🐧", "🦄", "🦉"],
  nature: ["🌸", "🌻", "🌹", "🌲", "🌳", "🌵", "🍀", "🍁", "🍂", "🌿"],
  party: ["🎉", "🎈", "🎊", "🥳", "🎂", "🎁", "🎆", "🎇"],
  sports: ["⚽", "🏀", "🏈", "⚾", "🎾", "🏐", "🏆", "🥇"],
  magic: ["✨", "🔮", "🪄", "🧙", "🧚", "🐉", "🦄"],
  spooky: ["👻", "🎃", "💀", "🦇", "🕷️", "🕸️", "🧟", "🧛"],
  fire: ["🔥", "💥", "🧨", "🌋", "🚒"],
  faces: [
    "😀",
    "😃",
    "😄",
    "😁",
    "😆",
    "😅",
    "😂",
    "🤣",
    "😊",
    "😇",
    "🙂",
    "🙃",
    "😉",
    "😌",
    "😍",
    "🥰",
    "😘",
    "😗",
    "😙",
    "😚",
    "😋",
    "😛",
    "😝",
    "😜",
    "🤪",
    "🤨",
    "🧐",
    "🤓",
    "😎",
    "🥸",
    "🤩",
    "🥳",
    "😏",
    "😒",
    "😞",
    "😔",
    "😟",
    "😕",
    "🙁",
    "☹️",
    "😣",
    "😖",
    "😫",
    "😩",
    "🥺",
    "😢",
    "😭",
    "😤",
    "😠",
    "😡",
    "🤬",
    "🤯",
    "😳",
    "🥵",
    "🥶",
    "😱",
    "😨",
    "😰",
    "😥",
    "😓",
    "🤗",
    "🤔",
    "🫣",
    "🤭",
    "🤫",
    "🤥",
    "😶",
    "😶‍🌫️",
    "😐",
    "😑",
    "😬",
    "🫨",
    "🫠",
    "🙄",
    "😯",
    "😦",
    "😧",
    "😮",
    "😲",
    "🥱",
    "😴",
    "🤤",
    "😪",
    "😵",
    "😵‍💫",
    "🫥",
    "🤐",
    "🥴",
    "🤢",
    "🤮",
    "🤧",
    "😷",
    "🤒",
    "🤕",
    "🤑",
    "🤠",
  ],
};

const GRADIENTS = {
  rain: {
    from: "rgba(186, 230, 253, 0.8)",
    to: "rgba(255, 255, 255, 1)",
    isDark: false,
    color: "text-sky-700",
    accent: "#0284c7",
  },
  money: {
    from: "rgba(167, 243, 208, 0.8)",
    to: "rgba(255, 255, 255, 1)",
    isDark: false,
    color: "text-emerald-700",
    accent: "#059669",
  },
  love: {
    from: "rgba(254, 205, 211, 0.8)",
    to: "rgba(255, 255, 255, 1)",
    isDark: false,
    color: "text-rose-700",
    accent: "#e11d48",
  },
  food: {
    from: "rgba(254, 215, 170, 0.8)",
    to: "rgba(255, 255, 255, 1)",
    isDark: false,
    color: "text-orange-700",
    accent: "#ea580c",
  },
  space: {
    from: "rgba(10, 10, 24, 1)",
    to: "rgba(30, 27, 75, 1)",
    isDark: true,
    color: "text-sky-300",
    accent: "#38bdf8",
  },
  music: {
    from: "rgba(233, 213, 255, 0.8)",
    to: "rgba(255, 255, 255, 1)",
    isDark: false,
    color: "text-purple-700",
    accent: "#9333ea",
  },
  tech: {
    from: "rgba(165, 243, 252, 0.8)",
    to: "rgba(255, 255, 255, 1)",
    isDark: false,
    color: "text-cyan-700",
    accent: "#0891b2",
  },
  spooky: {
    from: "rgba(15, 15, 15, 1)",
    to: "rgba(38, 38, 38, 1)",
    isDark: true,
    color: "text-stone-300",
    accent: "#78716c",
  },
  ocean: {
    from: "rgba(14, 165, 233, 0.6)",
    to: "rgba(255, 255, 255, 1)",
    isDark: false,
    color: "text-blue-700",
    accent: "#0284c7",
  },
  animals: {
    from: "rgba(187, 247, 208, 0.8)",
    to: "rgba(255, 255, 255, 1)",
    isDark: false,
    color: "text-green-700",
    accent: "#16a34a",
  },
  nature: {
    from: "rgba(187, 247, 208, 0.8)",
    to: "rgba(254, 243, 199, 1)",
    isDark: false,
    color: "text-emerald-700",
    accent: "#059669",
  },
  party: {
    from: "rgba(245, 208, 254, 0.8)",
    to: "rgba(255, 255, 255, 1)",
    isDark: false,
    color: "text-fuchsia-700",
    accent: "#c084fc",
  },
  sports: {
    from: "rgba(254, 215, 170, 0.8)",
    to: "rgba(254, 240, 138, 1)",
    isDark: false,
    color: "text-amber-700",
    accent: "#d97706",
  },
  magic: {
    from: "rgba(24, 15, 45, 1)",
    to: "rgba(45, 15, 80, 1)",
    isDark: true,
    color: "text-purple-300",
    accent: "#a855f7",
  },
  faces: {
    from: "rgba(254, 240, 138, 0.8)",
    to: "rgba(255, 255, 255, 1)",
    isDark: false,
    color: "text-yellow-700",
    accent: "#ca8a04",
  },
  fire: {
    from: "rgba(254, 215, 170, 0.8)",
    to: "rgba(248, 113, 113, 0.8)",
    isDark: false,
    color: "text-red-700",
    accent: "#dc2626",
  },
};

type Category = keyof typeof EMOJIS;
type Theme = (typeof GRADIENTS)[Category];

interface Drop {
  x: number;
  y: number;
  speed: number;
  emoji: string;
}

const CATEGORY_KEYS = Object.keys(EMOJIS) as Category[];
const DEFAULT_CATEGORY: Category = "money";
const DEFAULT_INTENSITY = 15;
const MAX_SPAWN_RATE = 3;
const HOLD_DELAY = 325;
const EMOJI_SIZE = 48;
const RAINBOW =
  "linear-gradient(to right, #ff3366, #ff9933, #ffff33, #33cc66, #3399ff, #9933ff)";
const emojiCache = new Map<string, HTMLCanvasElement>();

const randomItem = <T,>(items: readonly T[]) =>
  items[Math.floor(Math.random() * items.length)];

const getEmojiCanvas = (emoji: string) => {
  const cached = emojiCache.get(emoji);
  if (cached) return cached;

  const canvas = document.createElement("canvas");
  canvas.width = EMOJI_SIZE;
  canvas.height = EMOJI_SIZE;

  const context = canvas.getContext("2d");
  if (!context) return null;

  context.font = "32px sans-serif";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(emoji, EMOJI_SIZE / 2, EMOJI_SIZE / 2);
  emojiCache.set(emoji, canvas);
  return canvas;
};

const getHeaderName = (selected: Category[]) => {
  if (selected.length === CATEGORY_KEYS.length) return "RAINBOW STORM";
  if (selected.length === 1) return selected[0];
  if (selected.length === 2) return selected.join(" & ");
  return "a custom mix";
};

const getBackgroundOpacity = (
  intensity: number,
  isDark: boolean,
  isRainbow: boolean,
) => {
  const ratio = intensity / MAX_SPAWN_RATE;
  if (isRainbow) return Math.min(0.25 + ratio * 0.45, 0.9);
  return isDark
    ? Math.min(0.6 + ratio * 0.38, 0.98)
    : Math.min(0.04 + ratio * 0.76, 0.8);
};

const sliderBackground = (
  value: number,
  accent: string,
  isRainbow: boolean,
) =>
  isRainbow
    ? RAINBOW
    : `linear-gradient(to right, ${accent} 0%, ${accent} ${value}%, #e2e8f0 ${value}%, #e2e8f0 100%)`;

const RangeControl = memo(function RangeControl({
  label,
  value,
  displayValue,
  min,
  max,
  step,
  fill,
  onChange,
}: {
  label: string;
  value: number;
  displayValue: string;
  min: number;
  max: number;
  step: number;
  fill: string;
  onChange: (value: number) => void;
}) {
  return (
    <label className="flex w-full flex-col gap-1.5">
      <span className="flex justify-between text-xs font-bold text-slate-600">
        <span>{label}</span>
        <span>{displayValue}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(event.currentTarget.valueAsNumber)}
        className="custom-slider cursor-pointer"
        style={{ background: fill }}
      />
    </label>
  );
});

const CategoryButtons = memo(function CategoryButtons({
  selected,
  isRainbow,
  accent,
  onPress,
}: {
  selected: Category[];
  isRainbow: boolean;
  accent: string;
  onPress: (category: Category, mix: boolean) => void;
}) {
  const timerRef = useRef<number | null>(null);
  const heldRef = useRef(false);

  const clearTimer = () => {
    if (timerRef.current === null) return;
    window.clearTimeout(timerRef.current);
    timerRef.current = null;
  };

  useEffect(() => clearTimer, []);

  const beginHold = (category: Category) => {
    clearTimer();
    heldRef.current = false;
    timerRef.current = window.setTimeout(() => {
      heldRef.current = true;
      onPress(category, true);
    }, HOLD_DELAY);
  };

  return (
    <div className="flex shrink-0 flex-wrap justify-center gap-1.5 sm:gap-2.5">
      {CATEGORY_KEYS.map((category) => {
        const isSelected = selected.includes(category);

        return (
          <button
            key={category}
            type="button"
            onPointerDown={() => beginHold(category)}
            onPointerUp={clearTimer}
            onPointerLeave={clearTimer}
            onPointerCancel={clearTimer}
            onClick={(event) => {
              clearTimer();
              if (heldRef.current) {
                heldRef.current = false;
                event.preventDefault();
                return;
              }
              onPress(category, event.shiftKey);
            }}
            className={`cursor-pointer touch-manipulation select-none whitespace-nowrap rounded-full px-2.5 py-1.5 text-[11px] font-bold capitalize transition-all hover:scale-105 active:scale-95 sm:px-3.5 sm:py-2 sm:text-sm ${
              isSelected
                ? `text-white shadow-lg ${
                    isRainbow ? "animate-button-glow border-transparent" : ""
                  }`
                : "bg-slate-100 text-slate-500 hover:bg-slate-200"
            }`}
            style={
              isSelected
                ? {
                    backgroundColor: isRainbow
                      ? "rgba(255,255,255,.2)"
                      : accent,
                    backgroundImage: isRainbow
                      ? "linear-gradient(45deg, #ff3366, #ff9933, #33cc66, #3399ff, #9933ff)"
                      : undefined,
                  }
                : undefined
            }
          >
            {EMOJIS[category][0]} {category}
          </button>
        );
      })}
    </div>
  );
});

const HeaderTitle = memo(function HeaderTitle({
  name,
  theme,
  isRainbow,
}: {
  name: string;
  theme: Theme;
  isRainbow: boolean;
}) {
  return (
    <div className="pointer-events-none absolute left-0 top-10 z-10 w-full select-none text-center">
      <h1
        className={`text-4xl font-bold uppercase leading-loose tracking-widest transition-colors duration-500 ${
          isRainbow
            ? "text-pink-200/80 drop-shadow-[0_2px_8px_rgba(255,255,255,0.15)]"
            : theme.isDark
              ? "text-stone-400/60"
              : "text-sky-900/50"
        }`}
      >
        Cloudy with a chance of <br />
        <span
          className={
            isRainbow
              ? "animate-[rainbow-flow_5s_linear_infinite] bg-[linear-gradient(to_right,#ef4444,#fb923c,#facc15,#22c55e,#3b82f6,#6366f1,#9333ea,#ef4444)] bg-size-[200%_auto] bg-clip-text font-black text-transparent"
              : `font-extrabold transition-colors duration-500 ${theme.color} ${
                  theme.isDark
                    ? "drop-shadow-[0_2px_8px_rgba(255,255,255,0.15)]"
                    : ""
                }`
          }
        >
          {name}
        </span>
      </h1>
    </div>
  );
});

function useCanvasRain(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  intensity: number,
  speed: number,
  selected: Category[],
) {
  const settingsRef = useRef<{
    intensity: number;
    speed: number;
    pools: readonly (readonly string[])[];
  }>({
    intensity,
    speed,
    pools: selected.map((category) => EMOJIS[category]),
  });

  useEffect(() => {
    settingsRef.current = {
      intensity,
      speed,
      pools: selected.map((category) => EMOJIS[category]),
    };
  }, [intensity, speed, selected]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    let frameId = 0;
    let resizeFrame: number | null = null;
    let drops: Drop[] = [];
    let nextDrops: Drop[] = [];
    const recycled: Drop[] = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const scheduleResize = () => {
      if (resizeFrame !== null) return;
      resizeFrame = requestAnimationFrame(() => {
        resize();
        resizeFrame = null;
      });
    };

    const createDrop = (): Drop => {
      const pools = settingsRef.current.pools;
      const pool = pools[Math.floor(Math.random() * pools.length)];
      const emoji = pool[Math.floor(Math.random() * pool.length)];
      const drop = recycled.pop() ?? { x: 0, y: 0, speed: 0, emoji };

      drop.x = Math.random() * canvas.width;
      drop.y = -EMOJI_SIZE;
      drop.speed = Math.random() * 4 + 2;
      drop.emoji = emoji;
      return drop;
    };

    const draw = () => {
      const { intensity: rate, speed: multiplier } = settingsRef.current;
      context.clearRect(0, 0, canvas.width, canvas.height);
      nextDrops.length = 0;

      // Fractional rates spawn one extra drop probabilistically.
      const spawnCount = Math.floor(rate) + (Math.random() < rate % 1 ? 1 : 0);
      for (let i = 0; i < spawnCount; i++) nextDrops.push(createDrop());

      for (const drop of drops) {
        drop.y += drop.speed * multiplier;
        const emojiCanvas = getEmojiCanvas(drop.emoji);
        if (emojiCanvas) {
          context.drawImage(
            emojiCanvas,
            drop.x - EMOJI_SIZE / 2,
            drop.y - EMOJI_SIZE / 2,
          );
        }

        if (drop.y <= canvas.height + EMOJI_SIZE) nextDrops.push(drop);
        else recycled.push(drop);
      }

      [drops, nextDrops] = [nextDrops, drops];
      frameId = requestAnimationFrame(draw);
    };

    resize();
    window.addEventListener("resize", scheduleResize);
    draw();

    return () => {
      cancelAnimationFrame(frameId);
      if (resizeFrame !== null) cancelAnimationFrame(resizeFrame);
      window.removeEventListener("resize", scheduleResize);
    };
  }, [canvasRef]);
}

export default function EmojiRain() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selected, setSelected] = useState<Category[]>([DEFAULT_CATEGORY]);
  const [mode, setMode] = useState<Category>(DEFAULT_CATEGORY);
  const [minimized, setMinimized] = useState(false);
  const [intensityPercent, setIntensityPercent] =
    useState(DEFAULT_INTENSITY);
  const [speed, setSpeed] = useState(1);

  const intensity = (intensityPercent / 100) * MAX_SPAWN_RATE;
  const theme = GRADIENTS[mode];
  const isRainbow = selected.length === CATEGORY_KEYS.length;
  const speedPercent = ((speed - 0.1) / 1.9) * 100;
  const backgroundOpacity = getBackgroundOpacity(
    intensity,
    theme.isDark,
    isRainbow,
  );

  useCanvasRain(canvasRef, intensity, speed, selected);

  useEffect(() => {
    const query = window.matchMedia("(max-width: 640px)");
    const sync = () => setMinimized(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  const handleCategoryPress = useCallback(
    (category: Category, mix: boolean) => {
      if (!mix) {
        setSelected([category]);
        setMode(category);
        return;
      }

      setSelected((current) => {
        if (!current.includes(category)) {
          setMode(category);
          return [...current, category];
        }

        if (current.length === 1) return current;

        const next = current.filter((item) => item !== category);
        setMode((active) =>
          active === category ? next[next.length - 1] : active,
        );
        return next;
      });
    },
    [],
  );

  return (
    <main
      className="relative min-h-screen overflow-hidden transition-colors duration-1000"
      style={{
        backgroundColor: isRainbow
          ? "#09050d"
          : theme.isDark
            ? "#06060a"
            : "#f5f5f7",
      }}
    >
      <style>{`
        @keyframes rainbow-flow {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-rainbow {
          background: linear-gradient(-45deg, #ff3366, #ff9933, #ffff33, #33cc66, #3399ff, #9933ff, #ff3366);
          background-size: 400% 400%;
          animation: rainbow-flow 8s ease infinite;
        }
        @keyframes button-glow {
          0%, 100% { box-shadow: 0 0 12px rgba(255,51,102,.7), 0 0 20px rgba(255,51,102,.4); }
          17% { box-shadow: 0 0 12px rgba(255,153,51,.7), 0 0 20px rgba(255,153,51,.4); }
          33% { box-shadow: 0 0 12px rgba(255,255,51,.5), 0 0 20px rgba(255,255,51,.3); }
          50% { box-shadow: 0 0 12px rgba(51,204,102,.7), 0 0 20px rgba(51,204,102,.4); }
          67% { box-shadow: 0 0 12px rgba(51,153,255,.7), 0 0 20px rgba(51,153,255,.4); }
          83% { box-shadow: 0 0 12px rgba(153,51,255,.7), 0 0 20px rgba(153,51,255,.4); }
        }
        .animate-button-glow { animation: button-glow 4s linear infinite; }
      `}</style>

      <div
        className={`pointer-events-none absolute inset-0 z-0 transition-all duration-300 ${
          isRainbow ? "animate-rainbow" : ""
        }`}
        style={{
          opacity: backgroundOpacity,
          background: isRainbow
            ? undefined
            : `linear-gradient(to bottom, ${theme.from}, ${theme.to})`,
        }}
      />

      <canvas
        ref={canvasRef}
        className="pointer-events-none absolute inset-0 z-10"
      />

      <HeaderTitle
        name={getHeaderName(selected)}
        theme={theme}
        isRainbow={isRainbow}
      />

      <section className="absolute bottom-4 left-1/2 z-20 flex w-[min(92vw,42rem)] -translate-x-1/2 flex-col rounded-[1.75rem] border border-slate-200/50 bg-white/85 p-3 shadow-xl backdrop-blur-md sm:bottom-6 sm:p-4 md:bottom-10 md:w-[90%] md:max-w-2xl md:p-6">
        <header className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">
              Emoji Rain
            </p>
            <p className="text-sm font-semibold text-slate-700 sm:text-base">
              Controls
            </p>
          </div>
          <button
            type="button"
            onClick={() => setMinimized((value) => !value)}
            className="rounded-full border border-slate-200 bg-white/80 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-slate-600 transition hover:bg-white"
          >
            {minimized ? "Open" : "Minimize"}
          </button>
        </header>

        {!minimized && (
          <div className="mt-4 flex max-h-[50vh] flex-col gap-4 overflow-y-auto pr-1 sm:gap-5">
            <div className="flex shrink-0 flex-col gap-4 border-b border-slate-200/60 pb-4 sm:pb-5">
              <RangeControl
                label="Rain Intensity"
                value={intensityPercent}
                displayValue={`${intensityPercent}%`}
                min={0}
                max={100}
                step={1}
                fill={sliderBackground(
                  intensityPercent,
                  theme.accent,
                  isRainbow,
                )}
                onChange={setIntensityPercent}
              />
              <RangeControl
                label="Falling Speed"
                value={speed}
                displayValue={`${Math.round(speed * 100)}%`}
                min={0.1}
                max={2}
                step={0.1}
                fill={sliderBackground(speedPercent, theme.accent, isRainbow)}
                onChange={setSpeed}
              />
            </div>

            <CategoryButtons
              selected={selected}
              isRainbow={isRainbow}
              accent={theme.accent}
              onPress={handleCategoryPress}
            />

            <p className="shrink-0 select-none text-center text-[11px] font-medium text-slate-400">
              Press and hold to mix categories.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}