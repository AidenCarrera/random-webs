"use client";

import { useEffect, useRef, useState, useCallback, memo } from "react";

interface Drop {
  x: number;
  y: number;
  baseSpeed: number;
  text: string;
}

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

// Hoisted once instead of calling Object.keys(EMOJIS) on every render
// (this array was previously reallocated on every single re-render,
// including on every slider drag tick).
const CATEGORY_KEYS = Object.keys(EMOJIS);

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
  fruit: {
    from: "rgba(254, 226, 226, 0.8)",
    to: "rgba(255, 255, 255, 1)",
    isDark: false,
    color: "text-red-700",
    accent: "#dc2626",
  },
  vehicles: {
    from: "rgba(219, 234, 254, 0.8)",
    to: "rgba(255, 255, 255, 1)",
    isDark: false,
    color: "text-blue-700",
    accent: "#2563eb",
  },
  time: {
    from: "rgba(241, 245, 249, 0.8)",
    to: "rgba(255, 255, 255, 1)",
    isDark: false,
    color: "text-slate-700",
    accent: "#475569",
  },
  tools: {
    from: "rgba(228, 228, 231, 0.8)",
    to: "rgba(255, 255, 255, 1)",
    isDark: false,
    color: "text-zinc-700",
    accent: "#52525b",
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

const emojiCache = new Map<string, HTMLCanvasElement>();

const getEmojiCanvas = (emoji: string): HTMLCanvasElement | null => {
  let cached = emojiCache.get(emoji);
  if (!cached) {
    if (typeof document === "undefined") return null;
    const canvas = document.createElement("canvas");
    canvas.width = 48;
    canvas.height = 48;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.font = "32px sans-serif";
      ctx.textBaseline = "middle";
      ctx.textAlign = "center";
      ctx.fillText(emoji, 24, 24);
    }
    cached = canvas;
    emojiCache.set(emoji, cached);
  }
  return cached;
};

/* ------------------------------------------------------------------ */
/* Memoized subcomponents                                             */
/*                                                                     */
/* The intensity/speed sliders update state on every drag tick, which */
/* re-runs the parent component's render. Without memoization, that   */
/* also rebuilt the full 20-button category grid (with fresh style    */
/* objects each time) and the header text on every tick even though   */
/* neither depends on intensity/speed. Wrapping them in memo() with   */
/* primitive props means React skips reconciling those subtrees       */
/* unless something they actually depend on changes.                  */
/* ------------------------------------------------------------------ */

const CategoryButtons = memo(function CategoryButtons({
  selectedCategories,
  isAllSelected,
  accentColor,
  onCategoryClick,
}: {
  selectedCategories: string[];
  isAllSelected: boolean;
  accentColor: string;
  onCategoryClick: (key: string, isShiftKey: boolean) => void;
}) {
  return (
    <div className="flex flex-wrap justify-center gap-2.5 shrink-0">
      {CATEGORY_KEYS.map((key) => {
        const isSelected = selectedCategories.includes(key);
        const buttonGlowClass =
          isSelected && isAllSelected
            ? "animate-button-glow border-transparent"
            : "";
        return (
          <button
            key={key}
            onClick={(e) => onCategoryClick(key, e.shiftKey)}
            className={`px-4 py-2 rounded-full capitalize font-bold text-sm transition-all whitespace-nowrap cursor-pointer hover:scale-105 active:scale-95 select-none ${
              isSelected
                ? `text-white shadow-lg ${buttonGlowClass}`
                : "bg-slate-100 text-slate-500 hover:bg-slate-200"
            }`}
            style={{
              backgroundColor: isSelected
                ? isAllSelected
                  ? "rgba(255, 255, 255, 0.2)"
                  : accentColor
                : undefined,
              backgroundImage:
                isSelected && isAllSelected
                  ? "linear-gradient(45deg, #ff3366, #ff9933, #33cc66, #3399ff, #9933ff)"
                  : undefined,
            }}
          >
            {EMOJIS[key as keyof typeof EMOJIS][0]} {key}
          </button>
        );
      })}
    </div>
  );
});

const HeaderTitle = memo(function HeaderTitle({
  isAllSelected,
  headerName,
  isDark,
  colorClass,
}: {
  isAllSelected: boolean;
  headerName: string;
  isDark: boolean;
  colorClass: string;
}) {
  return (
    <div className="absolute top-10 left-0 w-full text-center pointer-events-none select-none z-10">
      <h1
        className={`text-4xl font-bold uppercase tracking-widest leading-loose transition-colors duration-500 ${
          isAllSelected
            ? "text-pink-200/80 drop-shadow-[0_2px_8px_rgba(255,255,255,0.15)]"
            : isDark
              ? "text-stone-400/60"
              : "text-sky-900/50"
        }`}
      >
        Cloudy with a chance of <br />
        {isAllSelected ? (
          <span className="transition-all duration-500 font-black text-transparent bg-clip-text bg-[linear-gradient(to_right,#ef4444,#fb923c,#facc15,#22c55e,#3b82f6,#6366f1,#9333ea,#ef4444)] bg-size-[200%_auto] animate-[rainbow-flow_5s_linear_infinite]">
            {headerName}
          </span>
        ) : (
          <span
            className={`transition-colors duration-500 font-extrabold ${colorClass} ${
              isDark ? "drop-shadow-[0_2px_8px_rgba(255,255,255,0.15)]" : ""
            }`}
          >
            {headerName}
          </span>
        )}
      </h1>
    </div>
  );
});

const BackgroundLayer = memo(function BackgroundLayer({
  isAllSelected,
  gradientFrom,
  gradientTo,
  opacity,
}: {
  isAllSelected: boolean;
  gradientFrom: string;
  gradientTo: string;
  opacity: number;
}) {
  return (
    <div
      className={`absolute inset-0 transition-all duration-300 pointer-events-none z-0 ${
        isAllSelected ? "animate-rainbow" : ""
      }`}
      style={
        isAllSelected
          ? { opacity }
          : {
              background: `linear-gradient(to bottom, ${gradientFrom}, ${gradientTo})`,
              opacity,
            }
      }
    />
  );
});

export default function EmojiRain() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Customization states
  const [selectedCategories, setSelectedCategories] = useState<string[]>([
    "money",
  ]);
  const [mode, setMode] = useState<keyof typeof EMOJIS>("money");

  const [intensity, setIntensity] = useState(0.2);
  const [speedMultiplier, setSpeedMultiplier] = useState(1.0);

  // Refs for animation loop
  const intensityRef = useRef(intensity);
  const speedRef = useRef(speedMultiplier);
  const activePoolRef = useRef<string[][]>([]);
  const dropsRef = useRef<Drop[]>([]);

  // Single effect keeps both animation refs in sync (was two separate effects)
  useEffect(() => {
    intensityRef.current = intensity;
    speedRef.current = speedMultiplier;
  }, [intensity, speedMultiplier]);

  useEffect(() => {
    const pool = selectedCategories
      .map((cat) => EMOJIS[cat as keyof typeof EMOJIS])
      .filter((arr) => arr && arr.length > 0);
    activePoolRef.current = pool.length > 0 ? pool : [["✨"]];
  }, [selectedCategories]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Coalesce rapid resize events (e.g. dragging a window edge) into a
    // single canvas resize per animation frame instead of resizing (and
    // therefore clearing/repainting) on every single event.
    let resizeRAF: number | null = null;
    const handleResize = () => {
      if (resizeRAF !== null) return;
      resizeRAF = requestAnimationFrame(() => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        resizeRAF = null;
      });
    };
    window.addEventListener("resize", handleResize);

    const dropPool: Drop[] = [];
    let currentDrops = dropsRef.current;
    let nextDrops: Drop[] = [];

    const createDrop = (): Drop => {
      const activePool = activePoolRef.current;
      const chosenCategory =
        activePool[Math.floor(Math.random() * activePool.length)];
      const chosenEmoji =
        chosenCategory[Math.floor(Math.random() * chosenCategory.length)];

      const x = Math.random() * canvas.width;
      const y = -50;
      const baseSpeed = Math.random() * 4 + 2;
      const text = chosenEmoji;

      if (dropPool.length > 0) {
        const drop = dropPool.pop()!;
        drop.x = x;
        drop.y = y;
        drop.baseSpeed = baseSpeed;
        drop.text = text;
        return drop;
      }

      return { x, y, baseSpeed, text };
    };

    let animationId: number;

    const draw = () => {
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;
      ctx.clearRect(0, 0, canvasWidth, canvasHeight);

      const currentIntensity = intensityRef.current;
      const spawnCount = Math.floor(currentIntensity);
      const spawnExtra = Math.random() < currentIntensity % 1;
      const totalToSpawn = spawnCount + (spawnExtra ? 1 : 0);

      nextDrops.length = 0; // Clear without reallocating memory

      for (let j = 0; j < totalToSpawn; j++) {
        nextDrops.push(createDrop());
      }

      const currentSpeedMultiplier = speedRef.current;

      for (let i = 0; i < currentDrops.length; i++) {
        const drop = currentDrops[i];

        drop.y += drop.baseSpeed * currentSpeedMultiplier;

        const emojiCanvas = getEmojiCanvas(drop.text);
        if (emojiCanvas) {
          ctx.drawImage(emojiCanvas, drop.x - 24, drop.y - 24);
        } else {
          ctx.font = "30px sans-serif";
          ctx.fillText(drop.text, drop.x, drop.y);
        }

        if (drop.y <= canvasHeight + 50) {
          nextDrops.push(drop);
        } else {
          dropPool.push(drop); // Recycle object
        }
      }

      // Swap arrays to avoid creating a new array every frame
      const temp = currentDrops;
      currentDrops = nextDrops;
      nextDrops = temp;

      dropsRef.current = currentDrops;

      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", handleResize);
      if (resizeRAF !== null) cancelAnimationFrame(resizeRAF);
    };
  }, []);

  // Stable across renders (functional updates avoid needing selectedCategories
  // / mode in the dependency array), so memoized children that receive this
  // as a prop never re-render just because this callback got recreated.
  const handleCategoryClick = useCallback(
    (key: string, isShiftKey: boolean) => {
      if (isShiftKey) {
        setSelectedCategories((prev) => {
          if (prev.includes(key)) {
            if (prev.length <= 1) return prev;
            const next = prev.filter((c) => c !== key);
            setMode((prevMode) =>
              prevMode === key
                ? (next[next.length - 1] as keyof typeof EMOJIS)
                : prevMode,
            );
            return next;
          }
          setMode(key as keyof typeof EMOJIS);
          return [...prev, key];
        });
      } else {
        setSelectedCategories([key]);
        setMode(key as keyof typeof EMOJIS);
      }
    },
    [],
  );

  const isAllSelected = selectedCategories.length === CATEGORY_KEYS.length;

  const getHeaderName = () => {
    if (isAllSelected) return "RAINBOW STORM";
    if (selectedCategories.length === 0) return "custom Emojis";
    if (selectedCategories.length === 1) return selectedCategories[0];
    if (selectedCategories.length <= 2) return selectedCategories.join(" & ");
    return "a custom mix";
  };

  const percentage = ((intensity - 0.05) / (5.0 - 0.05)) * 100;
  const speedPercentage = ((speedMultiplier - 0.1) / (2.0 - 0.1)) * 100;
  const gradientInfo = GRADIENTS[mode] || GRADIENTS.money;

  const bgOpacity = isAllSelected
    ? Math.min(0.25 + (intensity / 5.0) * 0.45, 0.9)
    : gradientInfo.isDark
      ? Math.min(0.6 + (intensity / 5.0) * 0.38, 0.98)
      : Math.min(0.04 + (intensity / 5.0) * 0.76, 0.8);

  return (
    <div
      className="min-h-screen transition-colors duration-1000 overflow-hidden relative"
      style={{
        backgroundColor: isAllSelected
          ? "#09050d"
          : gradientInfo.isDark
            ? "#06060a"
            : "#f5f5f7",
      }}
    >
      <style>{`
        @keyframes rainbow-flow {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-rainbow {
          background: linear-gradient(-45deg, #ff3366, #ff9933, #ffff33, #33cc66, #3399ff, #9933ff, #ff3366);
          background-size: 400% 400%;
          animation: rainbow-flow 8s ease infinite;
        }

        @keyframes button-glow {
          0% { box-shadow: 0 0 12px rgba(255, 51, 102, 0.7), 0 0 20px rgba(255, 51, 102, 0.4); }
          17% { box-shadow: 0 0 12px rgba(255, 153, 51, 0.7), 0 0 20px rgba(255, 153, 51, 0.4); }
          33% { box-shadow: 0 0 12px rgba(255, 255, 51, 0.5), 0 0 20px rgba(255, 255, 51, 0.3); }
          50% { box-shadow: 0 0 12px rgba(51, 204, 102, 0.7), 0 0 20px rgba(51, 204, 102, 0.4); }
          67% { box-shadow: 0 0 12px rgba(51, 153, 255, 0.7), 0 0 20px rgba(51, 153, 255, 0.4); }
          83% { box-shadow: 0 0 12px rgba(153, 51, 255, 0.7), 0 0 20px rgba(153, 51, 255, 0.4); }
          100% { box-shadow: 0 0 12px rgba(255, 51, 102, 0.7), 0 0 20px rgba(255, 51, 102, 0.4); }
        }
        .animate-button-glow {
          animation: button-glow 4s linear infinite;
        }
      `}</style>

      <BackgroundLayer
        isAllSelected={isAllSelected}
        gradientFrom={gradientInfo.from}
        gradientTo={gradientInfo.to}
        opacity={bgOpacity}
      />

      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none z-10"
      />

      {/* Control Card Overlay */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-white/85 backdrop-blur-md p-6 rounded-3xl shadow-xl flex flex-col gap-5 max-w-2xl w-[90%] max-h-[48vh] z-20 overflow-y-auto border border-slate-200/50">
        {/* Sliders Container */}
        <div className="flex flex-col gap-4 border-b border-slate-200/60 pb-5 shrink-0">
          {/* Intensity Slider */}
          <div className="w-full flex flex-col gap-1.5">
            <div className="flex justify-between text-xs font-bold text-slate-600">
              <span>Rain Intensity</span>
              <span>{intensity.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.05"
              max="5.0"
              step="0.05"
              value={intensity}
              onChange={(e) => setIntensity(parseFloat(e.target.value))}
              className="custom-slider cursor-pointer"
              style={{
                background: isAllSelected
                  ? `linear-gradient(to right, #ff3366, #ff9933, #ffff33, #33cc66, #3399ff, #9933ff)`
                  : `linear-gradient(to right, ${gradientInfo.accent} 0%, ${gradientInfo.accent} ${percentage}%, #e2e8f0 ${percentage}%, #e2e8f0 100%)`,
              }}
            />
          </div>

          {/* Speed Slider */}
          <div className="w-full flex flex-col gap-1.5">
            <div className="flex justify-between text-xs font-bold text-slate-600">
              <span>Falling Speed</span>
              <span>{Math.round(speedMultiplier * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="2.0"
              step="0.1"
              value={speedMultiplier}
              onChange={(e) => setSpeedMultiplier(parseFloat(e.target.value))}
              className="custom-slider cursor-pointer"
              style={{
                background: isAllSelected
                  ? `linear-gradient(to right, #ff3366, #ff9933, #ffff33, #33cc66, #3399ff, #9933ff)`
                  : `linear-gradient(to right, ${gradientInfo.accent} 0%, ${gradientInfo.accent} ${speedPercentage}%, #e2e8f0 ${speedPercentage}%, #e2e8f0 100%)`,
              }}
            />
          </div>
        </div>

        <CategoryButtons
          selectedCategories={selectedCategories}
          isAllSelected={isAllSelected}
          accentColor={gradientInfo.accent}
          onCategoryClick={handleCategoryClick}
        />

        <div className="text-center text-[11px] font-medium text-slate-400 select-none shrink-0">
          💡 Shift-click categories to mix them together!
        </div>
      </div>

      <HeaderTitle
        isAllSelected={isAllSelected}
        headerName={getHeaderName()}
        isDark={gradientInfo.isDark}
        colorClass={gradientInfo.color}
      />
    </div>
  );
}
