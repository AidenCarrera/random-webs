"use client";

import { useEffect, useRef, useState } from "react";

const EMOJIS = {
  rain: ["💧", "🌧️", "☔", "⛈️", "🌊"],
  money: ["💸", "💰", "🤑", "💵", "💎"],
  love: ["❤️", "💖", "🥰", "💌", "💘"],
  food: ["🍔", "🍕", "🍟", "🥤", "🌮"],
  space: ["🚀", "🛸", "🌌", "⭐", "🌙"],
  music: ["🎵", "🎸", "🎹", "🎧", "🎷"],
  tech: ["💻", "🤖", "💾", "📱", "🔋"],
  spooky: ["👻", "🎃", "🦇", "🕸️", "💀"],
  ocean: ["🐠", "🐳", "🐙", "🦀", "🦈"],
  animals: ["🐶", "🐱", "🦊", "🐼", "🦁"],
  nature: ["🌸", "🌲", "🌵", "🍀", "🌻"],
  party: ["🎉", "🎈", "🥳", "🥂", "🎂"],
  sports: ["⚽", "🏀", "🏈", "⚾", "🎾"],
  fruit: ["🍎", "🍌", "🍇", "🍓", "🍒"],
  vehicles: ["🚗", "✈️", "🚂", "🚤", "🚜"],
  time: ["⌚", "⏰", "⏳", "🌙", "☀️"],
  tools: ["🔨", "🔧", "🪛", "⛏️", "⚙️"],
  magic: ["✨", "🧙‍♂️", "🔮", "🦄", "🌟"],
  faces: ["😀", "😂", "😎", "🤔", "😴"],
  fire: ["🔥", "💥", "🧨", "🌋", "🚒"],
};

const GRADIENTS = {
  rain: { from: "rgba(186, 230, 253, 0.8)", to: "rgba(255, 255, 255, 1)", isDark: false, color: "text-sky-700" },
  money: { from: "rgba(167, 243, 208, 0.8)", to: "rgba(255, 255, 255, 1)", isDark: false, color: "text-emerald-700" },
  love: { from: "rgba(254, 205, 211, 0.8)", to: "rgba(255, 255, 255, 1)", isDark: false, color: "text-rose-700" },
  food: { from: "rgba(254, 215, 170, 0.8)", to: "rgba(255, 255, 255, 1)", isDark: false, color: "text-orange-700" },
  space: { from: "rgba(10, 10, 24, 1)", to: "rgba(30, 27, 75, 1)", isDark: true, color: "text-sky-300" },
  music: { from: "rgba(233, 213, 255, 0.8)", to: "rgba(255, 255, 255, 1)", isDark: false, color: "text-purple-700" },
  tech: { from: "rgba(165, 243, 252, 0.8)", to: "rgba(255, 255, 255, 1)", isDark: false, color: "text-cyan-700" },
  spooky: { from: "rgba(15, 15, 15, 1)", to: "rgba(38, 38, 38, 1)", isDark: true, color: "text-stone-300" },
  ocean: { from: "rgba(14, 165, 233, 0.6)", to: "rgba(255, 255, 255, 1)", isDark: false, color: "text-blue-700" },
  animals: { from: "rgba(187, 247, 208, 0.8)", to: "rgba(255, 255, 255, 1)", isDark: false, color: "text-green-700" },
  nature: { from: "rgba(187, 247, 208, 0.8)", to: "rgba(254, 243, 199, 1)", isDark: false, color: "text-emerald-700" },
  party: { from: "rgba(245, 208, 254, 0.8)", to: "rgba(255, 255, 255, 1)", isDark: false, color: "text-fuchsia-700" },
  sports: { from: "rgba(254, 215, 170, 0.8)", to: "rgba(254, 240, 138, 1)", isDark: false, color: "text-amber-700" },
  fruit: { from: "rgba(254, 226, 226, 0.8)", to: "rgba(255, 255, 255, 1)", isDark: false, color: "text-red-700" },
  vehicles: { from: "rgba(219, 234, 254, 0.8)", to: "rgba(255, 255, 255, 1)", isDark: false, color: "text-blue-700" },
  time: { from: "rgba(241, 245, 249, 0.8)", to: "rgba(255, 255, 255, 1)", isDark: false, color: "text-slate-700" },
  tools: { from: "rgba(228, 228, 231, 0.8)", to: "rgba(255, 255, 255, 1)", isDark: false, color: "text-zinc-700" },
  magic: { from: "rgba(24, 15, 45, 1)", to: "rgba(45, 15, 80, 1)", isDark: true, color: "text-purple-300" },
  faces: { from: "rgba(254, 240, 138, 0.8)", to: "rgba(255, 255, 255, 1)", isDark: false, color: "text-yellow-700" },
  fire: { from: "rgba(254, 215, 170, 0.8)", to: "rgba(248, 113, 113, 0.8)", isDark: false, color: "text-red-700" },
};

export default function EmojiRain() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<keyof typeof EMOJIS>("money");
  const [intensity, setIntensity] = useState(0.2);
  const intensityRef = useRef(intensity);
  
  const dropsRef = useRef<
    { x: number; y: number; speed: number; text: string }[]
  >([]);

  useEffect(() => {
    intensityRef.current = intensity;
  }, [intensity]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    const createDrop = () => {
      const list = EMOJIS[mode];
      return {
        x: Math.random() * canvas.width,
        y: -50,
        speed: Math.random() * 5 + 2,
        text: list[Math.floor(Math.random() * list.length)],
      };
    };

    let animationId: number;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const currentIntensity = intensityRef.current;
      const spawnCount = Math.floor(currentIntensity);
      const spawnExtra = Math.random() < (currentIntensity % 1);
      const totalToSpawn = spawnCount + (spawnExtra ? 1 : 0);

      for (let j = 0; j < totalToSpawn; j++) {
        dropsRef.current.push(createDrop());
      }

      for (let i = dropsRef.current.length - 1; i >= 0; i--) {
        const drop = dropsRef.current[i];
        drop.y += drop.speed;

        ctx.font = "30px sans-serif";
        ctx.fillText(drop.text, drop.x, drop.y);

        if (drop.y > canvas.height + 50) {
          dropsRef.current.splice(i, 1);
        }
      }

      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", handleResize);
    };
  }, [mode]);

  const percentage = ((intensity - 0.05) / (3.5 - 0.05)) * 100;
  const gradientInfo = GRADIENTS[mode];

  // Dynamic opacity: light themes stay very soft unless slider goes high. Space/Spooky/Magic start dark and saturated.
  const bgOpacity = gradientInfo.isDark
    ? Math.min(0.6 + (intensity / 3.5) * 0.38, 0.98)
    : Math.min(0.04 + (intensity / 3.5) * 0.76, 0.8);

  return (
    <div 
      className="min-h-screen transition-colors duration-1000 overflow-hidden relative"
      style={{
        backgroundColor: gradientInfo.isDark ? "#06060a" : "#f5f5f7"
      }}
    >
      {/* Dynamic Saturated Color Overlay Gradient */}
      <div 
        className="absolute inset-0 transition-all duration-300 pointer-events-none z-0"
        style={{
          background: `linear-gradient(to bottom, ${gradientInfo.from}, ${gradientInfo.to})`,
          opacity: bgOpacity
        }}
      />

      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none z-10"
      />

      {/* Control Card Overlay */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-white/85 backdrop-blur-md p-6 rounded-3xl shadow-xl flex flex-col gap-5 max-w-2xl w-[90%] max-h-[35vh] z-20">
        {/* Full-width Intensity Slider */}
        <div className="w-full border-b border-slate-200/60 pb-5 shrink-0">
          <input
            type="range"
            min="0.05"
            max="3.5"
            step="0.05"
            value={intensity}
            onChange={(e) => setIntensity(parseFloat(e.target.value))}
            className="custom-slider"
            style={{
              background: `linear-gradient(to right, #0ea5e9 0%, #0ea5e9 ${percentage}%, #e2e8f0 ${percentage}%, #e2e8f0 100%)`,
            }}
          />
        </div>

        {/* Emojis selector list */}
        <div className="flex flex-wrap justify-center gap-3 overflow-y-auto pr-1">
          {Object.keys(EMOJIS).map((key) => (
            <button
              key={key}
              onClick={() => setMode(key as keyof typeof EMOJIS)}
              className={`px-4 py-2 rounded-full capitalize font-bold text-sm transition-all whitespace-nowrap ${
                mode === key
                  ? "bg-sky-500 text-white shadow-lg scale-105"
                  : "bg-slate-100 text-slate-500 hover:bg-slate-200"
              }`}
            >
              {key}
            </button>
          ))}
        </div>
      </div>

      {/* Dynamic Header Titles */}
      <div className="absolute top-10 left-0 w-full text-center pointer-events-none select-none z-10">
        <h1 className={`text-4xl font-bold uppercase tracking-widest leading-loose transition-colors duration-500 ${
          gradientInfo.isDark ? "text-stone-400/60" : "text-sky-900/50"
        }`}>
          Cloudy with a chance of <br />
          <span className={`transition-colors duration-500 font-extrabold ${gradientInfo.color} ${
            gradientInfo.isDark ? "drop-shadow-[0_2px_8px_rgba(255,255,255,0.15)]" : ""
          }`}>{mode}</span>
        </h1>
      </div>
    </div>
  );
}
