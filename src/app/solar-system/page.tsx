"use client";

import { useState, useEffect, useRef } from "react";
import {
  Info,
  Pause,
  Play,
  Plus,
  Trash2,
  X,
  Settings,
  RotateCcw,
} from "lucide-react";

// Asset texture mappings
const TEXTURE_MAP = {
  mercury: "/solar-system/2k_mercury.jpg",
  venus_atmosphere: "/solar-system/2k_venus_atmosphere.jpg",
  venus_surface: "/solar-system/2k_venus_surface.jpg",
  earth: "/solar-system/2k_earth_daymap.jpg",
  earth_night: "/solar-system/2k_earth_nightmap.jpg",
  moon: "/solar-system/2k_moon.jpg",
  mars: "/solar-system/2k_mars.jpg",
  jupiter: "/solar-system/2k_jupiter.jpg",
  saturn: "/solar-system/2k_saturn.jpg",
  saturn_ring: "/solar-system/2k_saturn_ring_alpha.png",
  uranus: "/solar-system/2k_uranus.jpg",
  neptune: "/solar-system/2k_neptune.jpg",
  sun: "/solar-system/2k_sun.jpg",
  stars: "/solar-system/2k_stars.jpg",
  stars_milky_way: "/solar-system/2k_stars_milky_way.jpg",
};

type TextureKey = keyof typeof TEXTURE_MAP;

interface Planet {
  id: string;
  name: string;
  textureKey: TextureKey;
  size: number; // in pixels (relatively to scale)
  orbitSize: number; // orbit path diameter
  duration: number; // seconds per orbit
  type: string;
  temp: string;
  desc: string;
  hasRings?: boolean;
  hasMoon?: boolean;
}

const GLOW_COLORS: Record<string, string> = {
  mercury: "rgba(139,137,137,0.1)",
  venus_atmosphere: "rgba(229,196,146,0.12)",
  venus_surface: "rgba(204,119,34,0.12)",
  earth: "rgba(65,105,225,0.15)",
  earth_night: "rgba(100,149,237,0.08)",
  moon: "rgba(200,200,200,0.1)",
  mars: "rgba(205,92,92,0.12)",
  jupiter: "rgba(199,165,117,0.12)",
  saturn: "rgba(224,205,167,0.1)",
  uranus: "rgba(0,206,209,0.12)",
  neptune: "rgba(30,144,255,0.15)",
};

const DEFAULT_PLANETS: Planet[] = [
  {
    id: "mercury",
    name: "Mercury",
    textureKey: "mercury",
    size: 10,
    orbitSize: 145,
    duration: 6,
    type: "Rocky",
    temp: "440 K",
    desc: "Smallest and closest planet to the Sun, heavily cratered and experiencing extreme temperatures.",
  },
  {
    id: "venus",
    name: "Venus",
    textureKey: "venus_atmosphere",
    size: 18,
    orbitSize: 200,
    duration: 10,
    type: "Rocky",
    temp: "737 K",
    desc: "A choking greenhouse world covered in thick yellow-white clouds of sulfuric acid.",
  },
  {
    id: "earth",
    name: "Earth",
    textureKey: "earth",
    size: 20,
    orbitSize: 270,
    duration: 15,
    type: "Habitable",
    temp: "288 K",
    desc: "Our home planet. The only world known to harbor life, with vast oceans and a protective atmosphere.",
    hasMoon: true,
  },
  {
    id: "mars",
    name: "Mars",
    textureKey: "mars",
    size: 13,
    orbitSize: 345,
    duration: 22,
    type: "Rocky",
    temp: "210 K",
    desc: "The red planet, covered in iron-rich dust, thin carbon dioxide atmosphere, and polar ice caps.",
  },
  {
    id: "jupiter",
    name: "Jupiter",
    textureKey: "jupiter",
    size: 56,
    orbitSize: 460,
    duration: 35,
    type: "Gas Giant",
    temp: "165 K",
    desc: "The largest planet in our solar system, famous for its Great Red Spot and turbulent storms.",
  },
  {
    id: "saturn",
    name: "Saturn",
    textureKey: "saturn",
    size: 48,
    orbitSize: 580,
    duration: 48,
    type: "Gas Giant",
    temp: "134 K",
    desc: "A gas giant adorned with a spectacular, broad ring system composed of icy particles.",
    hasRings: true,
  },
  {
    id: "uranus",
    name: "Uranus",
    textureKey: "uranus",
    size: 32,
    orbitSize: 685,
    duration: 62,
    type: "Ice Giant",
    temp: "76 K",
    desc: "A pale cyan ice giant with a unique 98-degree axial tilt, causing extreme seasons.",
    hasRings: true,
  },
  {
    id: "neptune",
    name: "Neptune",
    textureKey: "neptune",
    size: 30,
    orbitSize: 790,
    duration: 76,
    type: "Ice Giant",
    temp: "72 K",
    desc: "A deep blue, windy ice giant. The most distant planet from the Sun.",
  },
];

const PRESETS = {
  full: DEFAULT_PLANETS,
  inner: DEFAULT_PLANETS.slice(0, 4),
  outer: DEFAULT_PLANETS.slice(4),
  empty: [],
};

const TEXTURE_OPTIONS: { key: TextureKey; name: string }[] = [
  { key: "mercury", name: "Mercury" },
  { key: "venus_atmosphere", name: "Venus Atmosphere" },
  { key: "venus_surface", name: "Venus Surface" },
  { key: "earth", name: "Earth Day" },
  { key: "earth_night", name: "Earth Night" },
  { key: "mars", name: "Mars" },
  { key: "jupiter", name: "Jupiter" },
  { key: "saturn", name: "Saturn" },
  { key: "uranus", name: "Uranus" },
  { key: "neptune", name: "Neptune" },
  { key: "moon", name: "Moon" },
];

const TYPE_OPTIONS = [
  "Rocky",
  "Habitable",
  "Gas Giant",
  "Ice Giant",
  "Lava",
  "Exotic",
];

const getRingGradient = (textureKey: TextureKey) => {
  if (textureKey === "saturn") {
    return `radial-gradient(
      circle,
      transparent 38%,
      rgba(224, 205, 167, 0.25) 39%,
      rgba(224, 205, 167, 0.65) 42%,
      rgba(168, 132, 94, 0.35) 46%,
      transparent 48%,
      rgba(224, 205, 167, 0.55) 50%,
      rgba(199, 165, 117, 0.45) 55%,
      rgba(224, 205, 167, 0.25) 62%,
      transparent 65%
    )`;
  } else if (textureKey === "uranus") {
    return `radial-gradient(
      circle,
      transparent 55%,
      rgba(173, 216, 230, 0.4) 56%,
      rgba(173, 216, 230, 0.1) 58%,
      transparent 59%
    )`;
  } else {
    return `radial-gradient(
      circle,
      transparent 42%,
      rgba(255, 255, 255, 0.2) 43%,
      rgba(255, 255, 255, 0.45) 46%,
      transparent 48%,
      rgba(255, 255, 255, 0.2) 52%,
      transparent 56%
    )`;
  }
};

export default function SolarSystem() {
  const [planets, setPlanets] = useState<Planet[]>(DEFAULT_PLANETS);
  const [paused, setPaused] = useState(false);
  const [timeScale, setTimeScale] = useState(1);
  const [selectedPlanet, setSelectedPlanet] = useState<Planet | null>(null);

  // Customization Toggles
  const [showOrbits, setShowOrbits] = useState(true);
  const [showMoons, setShowMoons] = useState(true);
  const [enableGlow, setEnableGlow] = useState(true);
  const [bgTheme, setBgTheme] = useState<"stars" | "stars_milky_way">("stars");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Custom Planet Form State
  const [newPlanetName, setNewPlanetName] = useState("");
  const [newPlanetTexture, setNewPlanetTexture] = useState<TextureKey>("mars");
  const [newPlanetSize, setNewPlanetSize] = useState(16);
  const [newPlanetOrbit, setNewPlanetOrbit] = useState(400);
  const [newPlanetDuration, setNewPlanetDuration] = useState(25);
  const [newPlanetType, setNewPlanetType] = useState("Rocky");
  const [newPlanetTemp, setNewPlanetTemp] = useState("250 K");
  const [newPlanetDesc, setNewPlanetDesc] = useState(
    "A mysterious newly discovered celestial world.",
  );
  const [newPlanetHasMoon, setNewPlanetHasMoon] = useState(false);
  const [newPlanetHasRings, setNewPlanetHasRings] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  // Scaler state for responsive fitting
  const [containerScale, setContainerScale] = useState(1);

  // Refs for animation loop updates (to prevent loop resets)
  const planetRotations = useRef<{ [id: string]: number }>({});
  const planetElements = useRef<{ [id: string]: HTMLDivElement | null }>({});
  const requestRef = useRef<number>(0);
  const planetsRef = useRef(planets);
  const pausedRef = useRef(paused);
  const timeScaleRef = useRef(timeScale);

  // Sync state with refs to keep the frame loop up-to-date without restarting
  useEffect(() => {
    planetsRef.current = planets;
  }, [planets]);
  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);
  useEffect(() => {
    timeScaleRef.current = timeScale;
  }, [timeScale]);

  // Handle container resizing to fit on screen
  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      // We target fitting the 900px wide system orbits
      const scaleX = (w - (w < 1024 ? 40 : 380)) / 920;
      const scaleY = (h - 160) / 920;
      let scale = Math.min(scaleX, scaleY);
      if (w < 640) {
        scale = (w - 20) / 900;
      }
      setContainerScale(Math.min(1.2, Math.max(0.25, scale)));
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Frame animation loop
  useEffect(() => {
    // Seed initial rotations
    planetsRef.current.forEach((planet) => {
      if (planetRotations.current[planet.id] === undefined) {
        planetRotations.current[planet.id] = Math.random() * 360;
      }
    });

    let lastTime = 0;

    const animate = (time: number) => {
      if (lastTime !== 0 && !pausedRef.current) {
        const deltaTime = (time - lastTime) / 1000;

        planetsRef.current.forEach((planet) => {
          const element = planetElements.current[planet.id];
          if (element) {
            const speed = 360 / planet.duration;
            if (planetRotations.current[planet.id] === undefined) {
              planetRotations.current[planet.id] = Math.random() * 360;
            }
            planetRotations.current[planet.id] +=
              speed * timeScaleRef.current * deltaTime;
            element.style.transform = `rotate(${planetRotations.current[planet.id]}deg)`;

            // Rotate moon if present inside planet container
            const moonCarrier = element.querySelector(
              ".moon-carrier",
            ) as HTMLDivElement;
            if (moonCarrier) {
              const moonRot = (planetRotations.current[planet.id] * 4.5) % 360;
              moonCarrier.style.transform = `rotate(${moonRot}deg)`;
            }
          }
        });
      }
      lastTime = time;
      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current);
  }, []);

  // Synchronize temporary preview planet while form is active (isAdding = true)
  useEffect(() => {
    if (isAdding) {
      const previewP: Planet = {
        id: "preview-planet",
        name: newPlanetName.trim() || `New Planet`,
        textureKey: newPlanetTexture,
        size: newPlanetSize,
        orbitSize: newPlanetOrbit,
        duration: newPlanetDuration,
        type: newPlanetType,
        temp: newPlanetTemp,
        desc: newPlanetDesc,
        hasMoon: newPlanetHasMoon,
        hasRings: newPlanetHasRings,
      };

      setPlanets((prev) => {
        const index = prev.findIndex((p: Planet) => p.id === "preview-planet");
        if (index > -1) {
          const updated = [...prev];
          updated[index] = previewP;
          return updated;
        } else {
          return [...prev, previewP];
        }
      });
    } else {
      setPlanets((prev) => prev.filter((p: Planet) => p.id !== "preview-planet"));
    }
  }, [
    isAdding,
    newPlanetName,
    newPlanetTexture,
    newPlanetSize,
    newPlanetOrbit,
    newPlanetDuration,
    newPlanetType,
    newPlanetTemp,
    newPlanetDesc,
    newPlanetHasMoon,
    newPlanetHasRings,
  ]);

  // Toggle pause state
  const togglePause = () => setPaused(!paused);

  // Manage presets
  const handleLoadPreset = (key: keyof typeof PRESETS) => {
    const selectedPreset = PRESETS[key];
    setPlanets(selectedPreset);
    setSelectedPlanet(null);
  };

  // Add planet
  const handleAddPlanet = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newPlanetName.trim() || `Planet ${planets.filter((p: Planet) => p.id !== "preview-planet").length + 1}`;
    const id = `planet_${Date.now()}`;
    const newP: Planet = {
      id,
      name,
      textureKey: newPlanetTexture,
      size: newPlanetSize,
      orbitSize: newPlanetOrbit,
      duration: newPlanetDuration,
      type: newPlanetType,
      temp: newPlanetTemp,
      desc: newPlanetDesc,
      hasMoon: newPlanetHasMoon,
      hasRings: newPlanetHasRings,
    };
    setPlanets((prev) => {
      const filtered = prev.filter((p: Planet) => p.id !== "preview-planet");
      return [...filtered, newP];
    });
    setIsAdding(false);
    // Reset Form
    setNewPlanetName("");
    setNewPlanetSize(16);
    setNewPlanetHasMoon(false);
    setNewPlanetHasRings(false);
  };

  // Delete planet
  const handleDeletePlanet = (id: string) => {
    setPlanets((prev) => prev.filter((p: Planet) => p.id !== id));
    if (selectedPlanet?.id === id) {
      setSelectedPlanet(null);
    }
  };

  // Update specific planet properties live
  const handleUpdatePlanet = (id: string, fields: Partial<Planet>) => {
    setPlanets((prev) =>
      prev.map((p: Planet) => (p.id === id ? { ...p, ...fields } : p)),
    );
    setSelectedPlanet((prev) => {
      if (prev && prev.id === id) {
        return { ...prev, ...fields };
      }
      return prev;
    });
  };

  const selectedGlow =
    selectedPlanet?.id !== "sun" && selectedPlanet
      ? GLOW_COLORS[selectedPlanet.textureKey]
      : "rgba(253,184,19,0.15)";

  return (
    <div className="min-h-screen text-white font-sans overflow-hidden flex items-center justify-center relative select-none">
      {/* Texture Spin Keyframe styles */}
      <style>{`
        @keyframes rotate-texture {
          0% { background-position: 0% 50%; }
          100% { background-position: -200% 50%; }
        }
        .planet-texture-spin {
          background-size: 200% 140% !important;
          background-position-y: 50% !important;
          animation: rotate-texture 16s linear infinite;
        }
        .planet-texture-spin-slow {
          background-size: 200% 140% !important;
          background-position-y: 50% !important;
          animation: rotate-texture 32s linear infinite;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.25);
        }
      `}</style>

      {/* Starfields Background */}
      <div
        className="absolute inset-0 bg-cover bg-center -z-20 transition-all duration-1000"
        style={{
          backgroundImage: `url(${TEXTURE_MAP[bgTheme]})`,
        }}
      />
      <div className="absolute inset-0 bg-black/40 -z-10" />

      {/* Header Title */}
      <div className="absolute top-6 left-6 z-40 pointer-events-none">
        <h1 className="text-3xl font-extralight tracking-[0.2em] uppercase text-white/95 leading-none">
          Solar System Creator
        </h1>
        <p className="text-[10px] font-mono tracking-widest text-white/40 uppercase mt-1">
          Interactive Solar System Builder
        </p>
      </div>

      {/* Collapsible Settings & Creator Panel */}
      <div
        className={`absolute top-1/2 left-6 -translate-y-1/2 z-40 w-80 bg-black/50 backdrop-blur-xl border border-white/10 p-5 rounded-2xl flex flex-col shadow-[0_15px_40px_rgba(0,0,0,0.6)] transition-all duration-300 ${
          sidebarOpen ? "max-h-[80vh]" : "max-h-[54px] overflow-hidden"
        }`}
      >
        {/* Clickable Header Area */}
        <div
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="cursor-pointer group flex items-center justify-between select-none pb-1"
        >
          <span className="text-xs font-mono tracking-[0.15em] font-bold text-white/60 group-hover:text-white transition-colors uppercase">
            Control Panel
          </span>
          <span
            className={`text-white/40 group-hover:text-white/80 transition-transform duration-300 font-mono text-[9px] ${
              sidebarOpen ? "rotate-180" : ""
            }`}
          >
            ▼
          </span>
        </div>

        {sidebarOpen && (
          <div className="flex flex-col gap-6 mt-5 animate-in fade-in duration-300 overflow-y-auto custom-scrollbar pr-1 max-h-[calc(80vh-80px)]">
            {/* Preset Selector */}
            <div>
              <h3 className="text-xs font-mono font-bold tracking-widest uppercase text-white/60 mb-3 border-b border-white/5 pb-1">
                PRESETS
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleLoadPreset("full")}
                  className="px-3 py-2 text-[10px] font-mono uppercase bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg tracking-wider text-left transition-colors cursor-pointer"
                >
                  Solar System
                </button>
                <button
                  onClick={() => handleLoadPreset("inner")}
                  className="px-3 py-2 text-[10px] font-mono uppercase bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg tracking-wider text-left transition-colors cursor-pointer"
                >
                  Rocky Planets
                </button>
                <button
                  onClick={() => handleLoadPreset("outer")}
                  className="px-3 py-2 text-[10px] font-mono uppercase bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg tracking-wider text-left transition-colors cursor-pointer"
                >
                  Giants
                </button>
                <button
                  onClick={() => handleLoadPreset("empty")}
                  className="px-3 py-2 text-[10px] font-mono uppercase bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg tracking-wider text-left transition-colors cursor-pointer"
                >
                  Empty Star
                </button>
              </div>
            </div>

            {/* Engine Settings */}
            <div>
              <h3 className="text-xs font-mono font-bold tracking-widest uppercase text-white/60 mb-3 border-b border-white/5 pb-1">
                Visual Settings
              </h3>
              <div className="flex flex-col gap-3 font-mono text-[11px] text-white/70">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showOrbits}
                    onChange={(e) => setShowOrbits(e.target.checked)}
                    className="rounded border-white/20 bg-white/5 focus:ring-0 focus:ring-offset-0 text-white w-4 h-4 cursor-pointer"
                  />
                  Show Orbital Rings
                </label>
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showMoons}
                    onChange={(e) => setShowMoons(e.target.checked)}
                    className="rounded border-white/20 bg-white/5 focus:ring-0 focus:ring-offset-0 text-white w-4 h-4 cursor-pointer"
                  />
                  Show Moons
                </label>
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enableGlow}
                    onChange={(e) => setEnableGlow(e.target.checked)}
                    className="rounded border-white/20 bg-white/5 focus:ring-0 focus:ring-offset-0 text-white w-4 h-4 cursor-pointer"
                  />
                  Enable Glow Effects
                </label>
                <div className="flex flex-col gap-1.5 mt-1">
                  <span className="text-[10px] text-white/40 uppercase">
                    Background
                  </span>
                  <select
                    value={bgTheme}
                    onChange={(e) => setBgTheme(e.target.value as any)}
                    className="bg-black/80 border border-white/15 px-2 py-1.5 rounded-lg text-xs font-mono w-full focus:outline-none focus:border-white/30 cursor-pointer"
                  >
                    <option value="stars">Default</option>
                    <option value="stars_milky_way">Milky Way</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Planet List */}
            <div>
              <h3 className="text-xs font-mono font-bold tracking-widest uppercase text-white/60 mb-3 border-b border-white/5 pb-1">
                CELESTIAL BODIES
              </h3>
              <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                {planets.filter((p: Planet) => p.id !== "preview-planet").length === 0 ? (
                  <span className="text-[10px] text-white/30 italic">
                    No celestial bodies in orbit
                  </span>
                ) : (
                  planets
                    .filter((p: Planet) => p.id !== "preview-planet")
                    .map((planet) => {
                      const isSelected = selectedPlanet?.id === planet.id;
                      return (
                        <div
                          key={planet.id}
                          onClick={() => setSelectedPlanet(planet)}
                          className={`flex items-center justify-between p-2 rounded-xl border transition-all duration-200 cursor-pointer ${
                            isSelected
                              ? "bg-white/10 border-white/25 shadow-[0_0_4px_rgba(255,255,255,0.02)] text-white"
                              : "bg-black/25 border-white/5 hover:border-white/15 text-white/70 hover:text-white"
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            {/* Planet Icon */}
                            <div
                              className="w-6 h-6 rounded-full relative overflow-hidden bg-cover bg-center shrink-0 border border-white/10"
                              style={{
                                backgroundImage: `url(${TEXTURE_MAP[planet.textureKey]})`,
                              }}
                            >
                              <div className="absolute inset-0 bg-[radial-gradient(circle_at_35%_35%,rgba(255,255,255,0.1)_0%,rgba(0,0,0,0.6)_85%)]" />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[11px] font-mono leading-tight">
                                {planet.name}
                              </span>
                              <span className="text-[8px] font-mono text-white/35 uppercase leading-none">
                                {planet.type}
                              </span>
                            </div>
                          </div>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeletePlanet(planet.id);
                            }}
                            className="p-1 text-white/30 hover:text-red-400 hover:bg-white/5 rounded transition-colors cursor-pointer"
                            title="Delete body"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })
                )}
              </div>
            </div>

            {/* Creation Section */}
            <div>
              <h3 className="text-xs font-mono font-bold tracking-widest uppercase text-white/60 mb-3 border-b border-white/5 pb-1">
                Planet Creator
              </h3>

              {isAdding ? (
                <form
                  onSubmit={handleAddPlanet}
                  className="flex flex-col gap-3 font-mono text-[11px] bg-white/5 p-3.5 rounded-xl border border-white/5 animate-in slide-in-from-top-4 duration-300"
                >
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-white/40">
                      Planet Name
                    </label>
                    <input
                      type="text"
                      required
                      value={newPlanetName}
                      onChange={(e) => setNewPlanetName(e.target.value)}
                      className="bg-black/60 border border-white/10 rounded px-2 py-1 text-white text-xs focus:outline-none focus:border-white/30"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-white/40">
                        Texture
                      </label>
                      <select
                        value={newPlanetTexture}
                        onChange={(e) =>
                          setNewPlanetTexture(e.target.value as TextureKey)
                        }
                        className="bg-black/80 border border-white/10 rounded px-1.5 py-1 text-xs focus:outline-none cursor-pointer"
                      >
                        {TEXTURE_OPTIONS.map((opt) => (
                          <option key={opt.key} value={opt.key}>
                            {opt.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-white/40">
                        Planet Type
                      </label>
                      <select
                        value={newPlanetType}
                        onChange={(e) => setNewPlanetType(e.target.value)}
                        className="bg-black/80 border border-white/10 rounded px-1.5 py-1 text-xs focus:outline-none cursor-pointer"
                      >
                        {TYPE_OPTIONS.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex flex-col gap-0.5">
                    <div className="flex justify-between">
                      <label className="text-[10px] text-white/40">
                        Planet Size ({newPlanetSize}px)
                      </label>
                      <span className="text-[9px] text-white/30">
                        Relative Scale
                      </span>
                    </div>
                    <input
                      type="range"
                      min="6"
                      max="65"
                      value={newPlanetSize}
                      onChange={(e) =>
                        setNewPlanetSize(parseInt(e.target.value))
                      }
                      className="w-full h-1 bg-white/15 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:transition-all hover:[&::-webkit-slider-thumb]:scale-125"
                    />
                  </div>

                  <div className="flex flex-col gap-0.5">
                    <div className="flex justify-between">
                      <label className="text-[10px] text-white/40">
                        Orbit Radius ({Math.round(newPlanetOrbit / 2)}px)
                      </label>
                      <span className="text-[9px] text-white/30">Distance</span>
                    </div>
                    <input
                      type="range"
                      min="120"
                      max="850"
                      step="10"
                      value={newPlanetOrbit}
                      onChange={(e) =>
                        setNewPlanetOrbit(parseInt(e.target.value))
                      }
                      className="w-full h-1 bg-white/15 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:transition-all hover:[&::-webkit-slider-thumb]:scale-125"
                    />
                  </div>

                  <div className="flex flex-col gap-0.5">
                    <div className="flex justify-between">
                      <label className="text-[10px] text-white/45">
                        Orbital Speed ({newPlanetDuration}s)
                      </label>
                      <span className="text-[9px] text-white/30">
                        Slower &rarr; Faster
                      </span>
                    </div>
                    <input
                      type="range"
                      min="3"
                      max="120"
                      value={newPlanetDuration}
                      onChange={(e) =>
                        setNewPlanetDuration(parseInt(e.target.value))
                      }
                      className="w-full h-1 bg-white/15 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:transition-all hover:[&::-webkit-slider-thumb]:scale-125"
                    />
                  </div>

                  <div className="flex items-center justify-between gap-3 py-1.5 border-y border-white/5 my-1 text-[10px]">
                    <label
                      className={`flex items-center gap-1.5 px-2 py-1 rounded border cursor-pointer text-[10px] font-mono transition-all duration-300 ${
                        newPlanetHasMoon
                          ? "bg-white/10 border-white/30 text-white shadow-[0_0_6px_rgba(255,255,255,0.06)]"
                          : "bg-black/35 border-white/10 text-white/55 hover:border-white/20"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={newPlanetHasMoon}
                        onChange={(e) => setNewPlanetHasMoon(e.target.checked)}
                        className="sr-only"
                      />
                      Moon
                    </label>
                    <label
                      className={`flex items-center gap-1.5 px-2 py-1 rounded border cursor-pointer text-[10px] font-mono transition-all duration-300 ${
                        newPlanetHasRings
                          ? "bg-white/10 border-white/30 text-white shadow-[0_0_6px_rgba(255,255,255,0.06)]"
                          : "bg-black/35 border-white/10 text-white/55 hover:border-white/20"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={newPlanetHasRings}
                        onChange={(e) => setNewPlanetHasRings(e.target.checked)}
                        className="sr-only"
                      />
                      Rings
                    </label>
                    <div className="flex items-center gap-1.5 font-mono text-[10px]">
                      <span className="text-white/40 uppercase text-[9px] tracking-wider">
                        Temp:
                      </span>
                      <input
                        type="text"
                        value={newPlanetTemp}
                        onChange={(e) => setNewPlanetTemp(e.target.value)}
                        className="w-16 bg-black/60 border border-white/10 rounded px-1.5 py-0.5 text-xs text-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1 mt-1">
                    <label className="text-[9px] text-white/40">
                      Description
                    </label>
                    <textarea
                      value={newPlanetDesc}
                      onChange={(e) => setNewPlanetDesc(e.target.value)}
                      rows={2}
                      className="bg-black/60 border border-white/10 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-white/30 resize-y w-full font-sans leading-normal custom-scrollbar"
                    />
                  </div>

                  <div className="flex gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => setIsAdding(false)}
                      className="flex-1 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[10px] font-bold tracking-widest uppercase transition-colors cursor-pointer text-white/70"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-2 py-2 bg-white/15 hover:bg-white/25 border border-white/25 rounded-lg text-[10px] font-bold tracking-widest uppercase transition-colors cursor-pointer text-white"
                    >
                      Create Planet
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  onClick={() => {
                    setIsAdding(true);
                    setNewPlanetName(`Planet ${planets.length + 1}`);
                    setNewPlanetOrbit(
                      Math.min(
                        850,
                        Math.max(140, ...planets.map((p) => p.orbitSize), 100) +
                          70,
                      ),
                    );
                  }}
                  className="w-full py-3.5 text-[10px] font-bold tracking-widest uppercase bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all duration-300 hover:scale-[1.01] text-white/70 hover:text-white cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" /> Create a new Planet
                </button>
              )}
            </div>
          </div>
        )}
      </div>
      {/* Orbit Canvas System Viewport */}
      <div
        className="relative flex items-center justify-center transition-transform duration-300"
        style={{
          width: "900px",
          height: "900px",
          transform: `scale(${containerScale})`,
        }}
      >
        {/* Stellar Core: The Sun */}
        <div
          className="absolute w-24 h-24 rounded-full z-20 flex items-center justify-center planet-texture-spin-slow cursor-pointer"
          style={{
            backgroundImage: `url(${TEXTURE_MAP.sun})`,
            boxShadow: enableGlow
              ? `0 0 40px rgba(253, 184, 19, 0.25), 0 0 15px rgba(253, 184, 19, 0.15)`
              : "none",
            animationPlayState: paused ? "paused" : "running",
          }}
          onClick={() =>
            setSelectedPlanet({
              id: "sun",
              name: "The Sun",
              textureKey: "sun",
              size: 96,
              orbitSize: 0,
              duration: 0,
              type: "Yellow Dwarf Star",
              temp: "5,778 K",
              desc: "The yellow dwarf star at the gravitational heart of our system. It comprises roughly 99.8% of the system's total mass.",
            })
          }
        >
          {/* Subtle star atmospheric glow overlay */}
          <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_35%_35%,rgba(255,255,255,0.25)_0%,rgba(0,0,0,0.5)_95%)] mix-blend-overlay" />
        </div>

        {/* Dynamic Planets Render Loop */}
        {planets.map((planet) => (
          <div
            key={planet.id}
            ref={(el) => {
              if (el) {
                planetElements.current[planet.id] = el;
              } else {
                delete planetElements.current[planet.id];
              }
            }}
            className={`absolute rounded-full flex items-center justify-center pointer-events-none transition-colors duration-300 ${
              showOrbits
                ? "border border-white/10"
                : "border border-transparent"
            }`}
            style={{
              width: `${planet.orbitSize}px`,
              height: `${planet.orbitSize}px`,
            }}
          >
            {/* Planet Group Wrapper (positioned at the top edge of orbit circle) */}
            <div
              className="absolute left-1/2 flex flex-col items-center justify-center pointer-events-auto"
              style={{
                transform: `translate(-50%, -50%)`,
                top: 0,
                width: `${planet.size * 2 + 50}px`,
                height: `${planet.size * 2 + 50}px`,
              }}
            >
              {/* 1. BACK RING (renders behind the planet sphere) */}
              {planet.hasRings && (
                <div
                  className="absolute top-1/2 left-1/2 pointer-events-none origin-center rounded-full"
                  style={{
                    width: `${planet.size * (planet.textureKey === "saturn" ? 2.8 : planet.textureKey === "uranus" ? 2.2 : 2.4)}px`,
                    height: `${planet.size * (planet.textureKey === "saturn" ? 2.8 : planet.textureKey === "uranus" ? 2.2 : 2.4)}px`,
                    background: getRingGradient(planet.textureKey),
                    transform:
                      "translate(-50%, -50%) rotateX(72deg) rotateY(12deg)",
                    opacity: 0.8,
                    zIndex: 5,
                    clipPath: "inset(0 0 50% 0)",
                  }}
                />
              )}

              {/* Planet sphere */}
              <div
                className={`rounded-full relative transition-transform duration-300 cursor-pointer group planet-texture-spin`}
                style={{
                  width: `${planet.size}px`,
                  height: `${planet.size}px`,
                  backgroundImage: `url(${TEXTURE_MAP[planet.textureKey]})`,
                  boxShadow: enableGlow
                    ? `0 0 8px ${GLOW_COLORS[planet.textureKey] || "rgba(255,255,255,0.05)"}`
                    : "none",
                  animationPlayState: paused ? "paused" : "running",
                  animationDuration:
                    planet.textureKey === "jupiter"
                      ? "8s"
                      : planet.textureKey === "saturn"
                        ? "10s"
                        : planet.textureKey === "earth"
                          ? "16s"
                          : "22s",
                  zIndex: 10,
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (planet.id !== "preview-planet") {
                    setSelectedPlanet(planet);
                  }
                }}
              >
                {/* Real-time 3D Spherical Shadow Mask Overlay */}
                <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_35%_35%,rgba(255,255,255,0.12)_0%,rgba(0,0,0,0.88)_82%)] pointer-events-none" />
              </div>

              {/* 2. FRONT RING (renders in front of the planet sphere, clipped to bottom half) */}
              {planet.hasRings && (
                <div
                  className="absolute top-1/2 left-1/2 pointer-events-none origin-center rounded-full"
                  style={{
                    width: `${planet.size * (planet.textureKey === "saturn" ? 2.8 : planet.textureKey === "uranus" ? 2.2 : 2.4)}px`,
                    height: `${planet.size * (planet.textureKey === "saturn" ? 2.8 : planet.textureKey === "uranus" ? 2.2 : 2.4)}px`,
                    background: getRingGradient(planet.textureKey),
                    transform:
                      "translate(-50%, -50%) rotateX(72deg) rotateY(12deg)",
                    opacity: 0.8,
                    zIndex: 15,
                    clipPath: "inset(50% 0 0 0)",
                  }}
                />
              )}

              {/* Moon element orbiting Earth inside parent group */}
              {planet.hasMoon && showMoons && (
                <div
                  className="absolute rounded-full border border-white/5 pointer-events-none"
                  style={{
                    width: `${planet.size + 22}px`,
                    height: `${planet.size + 22}px`,
                  }}
                >
                  {/* Rotating carrying div representing Moon angular position */}
                  <div className="absolute inset-0 moon-carrier">
                    {/* Moon visual sphere */}
                    <div
                      className="absolute rounded-full planet-texture-spin"
                      style={{
                        width: "5px",
                        height: "5px",
                        top: 0,
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        backgroundImage: `url(${TEXTURE_MAP.moon})`,
                        animationPlayState: paused ? "paused" : "running",
                        animationDuration: "5s",
                      }}
                    >
                      <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_35%_35%,rgba(255,255,255,0.08)_0%,rgba(0,0,0,0.92)_88%)] pointer-events-none" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Right Control & Live Planet Editor Overlay */}
      {selectedPlanet && (
        <div className="absolute top-1/2 right-6 -translate-y-1/2 z-40 w-80 max-h-[80vh] overflow-y-auto custom-scrollbar bg-black/60 backdrop-blur-xl border border-white/10 p-6 text-left shadow-[0_15px_40px_rgba(0,0,0,0.7)] rounded-2xl animate-in slide-in-from-right-10 fade-in duration-300">
          {/* Close Panel Button */}
          <button
            onClick={() => setSelectedPlanet(null)}
            className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors p-1 hover:bg-white/10 rounded-full cursor-pointer"
            title="Close Panel"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Spherical Preview Icon */}
          <div
            className="w-16 h-16 rounded-full mb-4 shadow-2xl relative planet-texture-spin"
            style={{
              backgroundImage: `url(${TEXTURE_MAP[selectedPlanet.textureKey]})`,
              boxShadow: enableGlow
                ? `0 0 8px ${selectedPlanet.id === "sun" ? "rgba(253,184,19,0.12)" : selectedGlow}`
                : "none",
              animationPlayState: paused ? "paused" : "running",
            }}
          >
            <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_35%_35%,rgba(255,255,255,0.15)_0%,rgba(0,0,0,0.85)_82%)] pointer-events-none" />
          </div>

          <h2 className="text-2xl font-light uppercase tracking-widest text-white leading-tight">
            {selectedPlanet.name}
          </h2>
          <div className="text-[10px] font-mono text-white/45 mb-4 uppercase tracking-wider">
            {selectedPlanet.type}
          </div>

          <p className="text-[11px] leading-relaxed text-white/60 border-l-2 border-white/15 pl-3 mb-6">
            {selectedPlanet.desc}
          </p>

          {/* Live Planet Editing Console (Only for editable planets, not the star Sun) */}
          {selectedPlanet.id !== "sun" ? (
            <div className="space-y-4 border-t border-white/5 pt-5 font-mono text-[11px] text-white/80">
              <h3 className="text-[10px] text-white/45 uppercase tracking-widest font-bold mb-3">
                Properties
              </h3>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-white/45">Name</label>
                <input
                  type="text"
                  value={selectedPlanet.name}
                  onChange={(e) =>
                    handleUpdatePlanet(selectedPlanet.id, {
                      name: e.target.value,
                    })
                  }
                  className="bg-black/60 border border-white/10 rounded px-2.5 py-1.5 text-white text-xs w-full focus:outline-none focus:border-white/30"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-white/45">Type</label>
                  <select
                    value={selectedPlanet.textureKey}
                    onChange={(e) =>
                      handleUpdatePlanet(selectedPlanet.id, {
                        textureKey: e.target.value as TextureKey,
                      })
                    }
                    className="bg-black/80 border border-white/10 rounded px-2 py-1.5 text-xs w-full focus:outline-none cursor-pointer"
                  >
                    {TEXTURE_OPTIONS.map((opt) => (
                      <option key={opt.key} value={opt.key}>
                        {opt.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-white/45">Category</label>
                  <select
                    value={selectedPlanet.type}
                    onChange={(e) =>
                      handleUpdatePlanet(selectedPlanet.id, {
                        type: e.target.value,
                      })
                    }
                    className="bg-black/80 border border-white/10 rounded px-2 py-1.5 text-xs w-full focus:outline-none cursor-pointer"
                  >
                    {TYPE_OPTIONS.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex justify-between">
                  <label className="text-[10px] text-white/45">
                    Planet Radius
                  </label>
                  <span className="text-[10px] text-white/60">
                    {selectedPlanet.size}px
                  </span>
                </div>
                <input
                  type="range"
                  min="6"
                  max="65"
                  value={selectedPlanet.size}
                  onChange={(e) =>
                    handleUpdatePlanet(selectedPlanet.id, {
                      size: parseInt(e.target.value),
                    })
                  }
                  className="w-full h-1 bg-white/15 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:transition-all hover:[&::-webkit-slider-thumb]:scale-125"
                />
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex justify-between">
                  <label className="text-[10px] text-white/45">
                    Orbital Diameter
                  </label>
                  <span className="text-[10px] text-white/60">
                    {selectedPlanet.orbitSize}px
                  </span>
                </div>
                <input
                  type="range"
                  min="110"
                  max="850"
                  step="10"
                  value={selectedPlanet.orbitSize}
                  onChange={(e) =>
                    handleUpdatePlanet(selectedPlanet.id, {
                      orbitSize: parseInt(e.target.value),
                    })
                  }
                  className="w-full h-1 bg-white/15 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:transition-all hover:[&::-webkit-slider-thumb]:scale-125"
                />
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex justify-between">
                  <label className="text-[10px] text-white/45">
                    Year Duration (Period)
                  </label>
                  <span className="text-[10px] text-white/60">
                    {selectedPlanet.duration}s
                  </span>
                </div>
                <input
                  type="range"
                  min="3"
                  max="120"
                  value={selectedPlanet.duration}
                  onChange={(e) =>
                    handleUpdatePlanet(selectedPlanet.id, {
                      duration: parseInt(e.target.value),
                    })
                  }
                  className="w-full h-1 bg-white/15 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:transition-all hover:[&::-webkit-slider-thumb]:scale-125"
                />
              </div>

              <div className="flex items-center justify-between gap-3 py-1.5 border-y border-white/5 my-2 text-[10px]">
                <label
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border cursor-pointer text-[10px] font-mono transition-all duration-300 ${
                    selectedPlanet.hasMoon
                      ? "bg-white/15 border-white/35 text-white shadow-[0_0_8px_rgba(255,255,255,0.08)]"
                      : "bg-black/30 border-white/10 text-white/55 hover:border-white/20"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedPlanet.hasMoon || false}
                    onChange={(e) =>
                      handleUpdatePlanet(selectedPlanet.id, {
                        hasMoon: e.target.checked,
                      })
                    }
                    className="sr-only"
                  />
                  Moon
                </label>

                <label
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border cursor-pointer text-[10px] font-mono transition-all duration-300 ${
                    selectedPlanet.hasRings
                      ? "bg-white/15 border-white/35 text-white shadow-[0_0_8px_rgba(255,255,255,0.08)]"
                      : "bg-black/30 border-white/10 text-white/55 hover:border-white/20"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedPlanet.hasRings || false}
                    onChange={(e) =>
                      handleUpdatePlanet(selectedPlanet.id, {
                        hasRings: e.target.checked,
                      })
                    }
                    className="sr-only"
                  />
                  Rings
                </label>

                <div className="flex items-center gap-1.5 font-mono text-[10px]">
                  <span className="text-white/40 uppercase text-[9px] tracking-wider">
                    Temp:
                  </span>
                  <input
                    type="text"
                    value={selectedPlanet.temp}
                    onChange={(e) =>
                      handleUpdatePlanet(selectedPlanet.id, {
                        temp: e.target.value,
                      })
                    }
                    className="w-16 bg-black/60 border border-white/10 rounded px-1.5 py-0.5 text-xs text-white focus:outline-none focus:border-white/30"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-3.5 mt-2 border-t border-white/5">
                <button
                  onClick={() => handleDeletePlanet(selectedPlanet.id)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-red-950/40 hover:bg-red-900/60 border border-red-500/30 text-red-300 hover:text-white rounded-lg text-[9px] uppercase tracking-wider transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" /> Delete
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4 border-t border-white/5 pt-5 font-mono text-[11px] text-white/70">
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-white/40">AVG SURFACE TEMP</span>
                <span>{selectedPlanet.temp}</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-white/40">STELLAR CLASS</span>
                <span>G2V Dwarf Star</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-white/40">SYSTEM AGE</span>
                <span>4.6 Billion Years</span>
              </div>
            </div>
          )}

          {/* Label removed */}
        </div>
      )}

      {/* Bottom Timeline Controls */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-5 bg-black/50 backdrop-blur-md px-6 py-3 rounded-full border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
        <button
          onClick={togglePause}
          className="p-3 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-all hover:scale-105 group cursor-pointer"
          title={paused ? "Resume Simulation" : "Pause Simulation"}
        >
          {paused ? (
            <Play className="w-4 h-4 text-white/70 group-hover:text-white" />
          ) : (
            <Pause className="w-4 h-4 text-white/70 group-hover:text-white" />
          )}
        </button>

        <div className="h-4 w-px bg-white/10" />

        <div className="flex flex-col items-center gap-1 group">
          <label className="text-[9px] font-mono text-white/45 uppercase tracking-widest group-hover:text-white/80 transition-colors">
            Time Scale: {timeScale.toFixed(1)}x
          </label>
          <input
            type="range"
            min="0.1"
            max="6"
            step="0.1"
            value={timeScale}
            onChange={(e) => setTimeScale(parseFloat(e.target.value))}
            className="w-44 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:transition-all hover:[&::-webkit-slider-thumb]:scale-125"
          />
        </div>
      </div>

      {/* Attribution footer */}
      <div className="absolute bottom-4 right-4 z-40 font-mono text-[9px] text-white/25 hover:text-white/50 transition-colors pointer-events-auto">
        Planet texture maps by{" "}
        <a
          href="https://www.solarsystemscope.com/textures/"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-white/40 transition-colors"
        >
          Solar System Scope
        </a>
        , licensed under{" "}
        <a
          href="https://creativecommons.org/licenses/by/4.0/"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-white/40 transition-colors"
        >
          CC BY 4.0
        </a>
      </div>
    </div>
  );
}
