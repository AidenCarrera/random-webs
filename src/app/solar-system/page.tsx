"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  Download,
  LoaderCircle,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Trash2,
  X,
} from "lucide-react";
import { ExportPreviewModal } from "@/components/ExportPreviewModal";
import { canvasToBlob } from "@/lib/canvasExport";
import {
  ThreeSolarSystem,
  type ScenePlanet,
  type SolarTextureKey,
} from "./ThreeSolarSystem";

type PlanetTextureKey = Exclude<
  SolarTextureKey,
  "sun" | "stars" | "stars_milky_way" | "saturn_ring"
>;

type BackgroundTheme = Extract<
  SolarTextureKey,
  "stars" | "stars_milky_way"
>;

type DisplayTextureKey = PlanetTextureKey | "sun";

interface Planet extends Omit<ScenePlanet, "textureKey"> {
  textureKey: PlanetTextureKey;
  name: string;
  type: string;
  temp: string;
  desc: string;
}

type PlanetDraft = Omit<Planet, "id">;

type DisplayBody = Pick<
  Planet,
  | "id"
  | "name"
  | "size"
  | "orbitSize"
  | "duration"
  | "type"
  | "temp"
  | "desc"
  | "hasRings"
  | "hasMoon"
> & {
  textureKey: DisplayTextureKey;
};

const TEXTURE_MAP: Record<SolarTextureKey, string> = {
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

const GLOW_COLORS: Record<DisplayTextureKey, string> = {
  mercury: "rgba(139,137,137,0.28)",
  venus_atmosphere: "rgba(229,196,146,0.34)",
  venus_surface: "rgba(204,119,34,0.32)",
  earth: "rgba(65,105,225,0.38)",
  earth_night: "rgba(100,149,237,0.3)",
  moon: "rgba(200,200,200,0.24)",
  mars: "rgba(205,92,92,0.32)",
  jupiter: "rgba(199,165,117,0.32)",
  saturn: "rgba(224,205,167,0.3)",
  uranus: "rgba(0,206,209,0.32)",
  neptune: "rgba(30,144,255,0.4)",
  sun: "rgba(253,184,19,0.52)",
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
} satisfies Record<string, Planet[]>;

const TEXTURE_OPTIONS: { key: PlanetTextureKey; name: string }[] = [
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

const TEXTURE_LABEL = Object.fromEntries(
  TEXTURE_OPTIONS.map(({ key, name }) => [key, name]),
) as Record<PlanetTextureKey, string>;

const TYPE_OPTIONS = [
  "Rocky",
  "Habitable",
  "Gas Giant",
  "Ice Giant",
  "Lava",
  "Exotic",
];

const DEFAULT_DRAFT: PlanetDraft = {
  name: "",
  textureKey: "mars",
  size: 16,
  orbitSize: 400,
  duration: 25,
  type: "Rocky",
  temp: "250 K",
  desc: "A mysterious newly discovered celestial world.",
  hasMoon: false,
  hasRings: false,
};

const SUN_BODY: DisplayBody = {
  id: "sun",
  name: "The Sun",
  textureKey: "sun",
  size: 96,
  orbitSize: 0,
  duration: 0,
  type: "Yellow Dwarf Star",
  temp: "5,778 K",
  desc: "The yellow dwarf star at the gravitational heart of our system. It comprises roughly 99.8% of the system's total mass.",
};

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

function clonePlanets(planets: Planet[]) {
  return planets.map((planet) => ({ ...planet }));
}

function getNextOrbit(planets: Planet[]) {
  const furthestOrbit = Math.max(100, ...planets.map((planet) => planet.orbitSize));
  return Math.min(850, Math.max(140, furthestOrbit + 70));
}

function createPlanetId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `planet_${crypto.randomUUID()}`;
  }

  return `planet_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function getRingGradient(textureKey: DisplayTextureKey) {
  if (textureKey === "saturn") {
    return `radial-gradient(
      circle,
      transparent 38%,
      rgba(224, 205, 167, 0.18) 39%,
      rgba(224, 205, 167, 0.7) 42%,
      rgba(168, 132, 94, 0.38) 46%,
      transparent 48%,
      rgba(224, 205, 167, 0.62) 50%,
      rgba(199, 165, 117, 0.5) 55%,
      rgba(224, 205, 167, 0.24) 62%,
      transparent 65%
    )`;
  }

  if (textureKey === "uranus") {
    return `radial-gradient(
      circle,
      transparent 54%,
      rgba(173, 216, 230, 0.16) 55%,
      rgba(173, 216, 230, 0.56) 56%,
      rgba(173, 216, 230, 0.12) 58%,
      transparent 59%
    )`;
  }

  return `radial-gradient(
    circle,
    transparent 42%,
    rgba(255, 255, 255, 0.18) 43%,
    rgba(255, 255, 255, 0.5) 46%,
    transparent 48%,
    rgba(255, 255, 255, 0.2) 52%,
    transparent 56%
  )`;
}

function previewSpinDuration(textureKey: DisplayTextureKey) {
  if (textureKey === "sun") return 34;
  if (textureKey === "jupiter") return 9;
  if (textureKey === "saturn") return 12;
  if (textureKey === "earth") return 16;
  if (textureKey === "venus_atmosphere") return 22;
  return 25;
}

function BodyPreview({
  body,
  variant,
  paused,
  showMoons,
  enableGlow,
}: {
  body: DisplayBody;
  variant: "list" | "panel" | "creator";
  paused: boolean;
  showMoons: boolean;
  enableGlow: boolean;
}) {
  const isList = variant === "list";
  const isPanel = variant === "panel";
  const frameSize = isList ? 50 : isPanel ? 132 : 76;
  const diameter =
    body.textureKey === "sun"
      ? isList
        ? 31
        : isPanel
          ? 80
          : 48
      : isList
        ? Math.round(clamp(21 + body.size * 0.22, 23, 35))
        : isPanel
          ? Math.round(clamp(49 + body.size * 0.52, 52, 82))
          : Math.round(clamp(36 + body.size * 0.28, 39, 56));
  const ringScale =
    body.textureKey === "saturn"
      ? 2.5
      : body.textureKey === "uranus"
        ? 2.05
        : 2.25;
  const ringDiameter = diameter * ringScale;
  const moonOrbitDiameter = diameter + (isList ? 13 : isPanel ? 31 : 21);
  const moonSize = isList ? 4 : isPanel ? 7 : 5;
  const animationState = paused ? "paused" : "running";

  return (
    <div
      className="relative grid shrink-0 place-items-center overflow-visible"
      style={{ width: frameSize, height: frameSize }}
      aria-hidden="true"
    >
      {isPanel && (
        <>
          <div className="absolute inset-1 rounded-full border border-white/6" />
          <div className="absolute inset-[18%] rounded-full border border-white/5" />
          <div className="absolute left-1/2 top-1/2 h-px w-[92%] -translate-x-1/2 -translate-y-1/2 bg-linear-to-r from-transparent via-white/5 to-transparent" />
        </>
      )}

      {body.hasRings && (
        <div
          className="absolute left-1/2 top-1/2 rounded-full opacity-80"
          style={{
            width: ringDiameter,
            height: ringDiameter,
            background: getRingGradient(body.textureKey),
            transform:
              "translate(-50%, -50%) rotateX(72deg) rotateY(10deg) rotateZ(4deg)",
            clipPath: "inset(0 0 50% 0)",
            zIndex: 1,
          }}
        />
      )}

      {body.hasMoon && showMoons && (
        <div
          className="absolute rounded-full border border-white/8 body-preview-moon-orbit"
          style={{
            width: moonOrbitDiameter,
            height: moonOrbitDiameter,
            animationPlayState: animationState,
            zIndex: 2,
          }}
        >
          <div
            className="absolute left-1/2 top-0 overflow-hidden rounded-full border border-white/15 bg-cover"
            style={{
              width: moonSize,
              height: moonSize,
              transform: "translate(-50%, -50%)",
              backgroundImage: `url(${TEXTURE_MAP.moon})`,
              boxShadow: "0 0 6px rgba(255,255,255,0.18)",
            }}
          >
            <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_32%_28%,rgba(255,255,255,0.25),rgba(0,0,0,0.82)_82%)]" />
          </div>
        </div>
      )}

      <div
        className="body-preview-texture relative overflow-hidden rounded-full border border-white/12 bg-cover"
        style={{
          width: diameter,
          height: diameter,
          backgroundImage: `url(${TEXTURE_MAP[body.textureKey]})`,
          backgroundSize: "200% 100%",
          animationDuration: `${previewSpinDuration(body.textureKey)}s`,
          animationPlayState: animationState,
          boxShadow: enableGlow
            ? `0 0 ${isPanel ? 24 : 11}px ${GLOW_COLORS[body.textureKey]}`
            : "none",
          zIndex: 3,
        }}
      >
        <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_32%_27%,rgba(255,255,255,0.32)_0%,rgba(255,255,255,0.08)_24%,rgba(0,0,0,0.12)_45%,rgba(0,0,0,0.86)_100%)]" />
        <div className="absolute inset-[5%] rounded-full border border-white/5" />
      </div>

      {body.hasRings && (
        <div
          className="absolute left-1/2 top-1/2 rounded-full opacity-90"
          style={{
            width: ringDiameter,
            height: ringDiameter,
            background: getRingGradient(body.textureKey),
            transform:
              "translate(-50%, -50%) rotateX(72deg) rotateY(10deg) rotateZ(4deg)",
            clipPath: "inset(50% 0 0 0)",
            zIndex: 4,
          }}
        />
      )}
    </div>
  );
}

function SectionHeading({ children }: { children: ReactNode }) {
  return (
    <h3 className="mb-3 border-b border-white/5 pb-1 text-xs font-bold uppercase tracking-widest text-white/60 font-mono">
      {children}
    </h3>
  );
}

function TogglePill({
  checked,
  onChange,
  children,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  children: ReactNode;
}) {
  return (
    <label
      className={`flex cursor-pointer items-center justify-center rounded-lg border px-2.5 py-1.5 text-[10px] font-mono transition-all duration-200 ${
        checked
          ? "border-white/30 bg-white/12 text-white shadow-[0_0_8px_rgba(255,255,255,0.06)]"
          : "border-white/10 bg-black/30 text-white/55 hover:border-white/20 hover:text-white/75"
      }`}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="sr-only"
      />
      {children}
    </label>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/[0.07] bg-black/25 px-2.5 py-2">
      <div className="text-[8px] uppercase tracking-wider text-white/30 font-mono">
        {label}
      </div>
      <div className="mt-0.5 text-[10px] text-white/75 font-mono">{value}</div>
    </div>
  );
}

export default function SolarSystem() {
  const [planets, setPlanets] = useState<Planet[]>(() =>
    clonePlanets(DEFAULT_PLANETS),
  );
  const [paused, setPaused] = useState(false);
  const [timeScale, setTimeScale] = useState(1);
  const [selectedBodyId, setSelectedBodyId] = useState<string | null>(null);

  const [showOrbits, setShowOrbits] = useState(true);
  const [showMoons, setShowMoons] = useState(true);
  const [enableGlow, setEnableGlow] = useState(true);
  const [bgTheme, setBgTheme] = useState<BackgroundTheme>("stars");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [exportImage, setExportImage] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isGeneratingPng, setIsGeneratingPng] = useState(false);

  const [draft, setDraft] = useState<PlanetDraft>(DEFAULT_DRAFT);
  const [isAdding, setIsAdding] = useState(false);

  const [containerScale, setContainerScale] = useState(1);
  const [isMobileViewport, setIsMobileViewport] = useState(false);

  const threeCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const exportObjectUrlRef = useRef<string | null>(null);
  const planetsRef = useRef(planets);

  planetsRef.current = planets;

  const selectedBody = useMemo<DisplayBody | null>(() => {
    if (selectedBodyId === "sun") return SUN_BODY;
    if (!selectedBodyId) return null;
    return planets.find((planet) => planet.id === selectedBodyId) ?? null;
  }, [planets, selectedBodyId]);

  const previewPlanet = useMemo<Planet | null>(() => {
    if (!isAdding) return null;

    return {
      id: "preview-planet",
      ...draft,
      name: draft.name.trim() || "New Planet",
    };
  }, [draft, isAdding]);

  const scenePlanets = useMemo<ScenePlanet[]>(
    () => (previewPlanet ? [...planets, previewPlanet] : planets),
    [planets, previewPlanet],
  );

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const isMobile = width < 768;
      setIsMobileViewport(isMobile);

      if (isMobile) {
        const scaleX = (width - 20) / 900;
        const scaleY = (height - 270) / 900;
        const scale = Math.min(scaleX, Math.max(0.3, scaleY));
        setContainerScale(clamp(scale, 0.3, 0.62));
        return;
      }

      const reservedWidth = width >= 1180 ? 390 : 80;
      const scaleX = (width - reservedWidth) / 920;
      const scaleY = (height - 145) / 920;
      setContainerScale(clamp(Math.min(scaleX, scaleY), 0.32, 1.15));
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    setSidebarOpen(!isMobileViewport);
  }, [isMobileViewport]);

  useEffect(() => {
    if (
      selectedBodyId &&
      selectedBodyId !== "sun" &&
      !planets.some((planet) => planet.id === selectedBodyId)
    ) {
      setSelectedBodyId(null);
    }
  }, [planets, selectedBodyId]);

  useEffect(() => {
    return () => {
      if (exportObjectUrlRef.current) {
        URL.revokeObjectURL(exportObjectUrlRef.current);
      }
    };
  }, []);

  const handleLoadPreset = (key: keyof typeof PRESETS) => {
    setPlanets(clonePlanets(PRESETS[key]));
    setSelectedBodyId(null);
    setIsAdding(false);
  };

  const handleReset = () => {
    setPlanets(clonePlanets(DEFAULT_PLANETS));
    setSelectedBodyId(null);
    setIsAdding(false);
    setPaused(false);
    setTimeScale(1);
  };

  const openCreator = () => {
    const nextNumber = planets.length + 1;
    setDraft({
      ...DEFAULT_DRAFT,
      name: `Planet ${nextNumber}`,
      orbitSize: getNextOrbit(planets),
    });
    setIsAdding(true);
  };

  const handleAddPlanet = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const id = createPlanetId();
    const newPlanet: Planet = {
      id,
      ...draft,
      name: draft.name.trim() || `Planet ${planets.length + 1}`,
      size: clamp(Math.round(draft.size), 6, 65),
      orbitSize: clamp(Math.round(draft.orbitSize), 120, 850),
      duration: clamp(Math.round(draft.duration), 3, 120),
    };

    setPlanets((current) => [...current, newPlanet]);
    setSelectedBodyId(id);
    setIsAdding(false);
    setDraft(DEFAULT_DRAFT);
  };

  const handleDeletePlanet = (id: string) => {
    setPlanets((current) => current.filter((planet) => planet.id !== id));
    if (selectedBodyId === id) setSelectedBodyId(null);
  };

  const handleUpdatePlanet = (id: string, fields: Partial<Planet>) => {
    setPlanets((current) =>
      current.map((planet) =>
        planet.id === id ? { ...planet, ...fields } : planet,
      ),
    );
  };

  const handleThreePlanetSelect = useCallback((id: string) => {
    if (id === "preview-planet") return;
    if (planetsRef.current.some((planet) => planet.id === id)) {
      setSelectedBodyId(id);
    }
  }, []);

  const handleThreeSunSelect = useCallback(() => {
    setSelectedBodyId("sun");
  }, []);

  const handleThreeCanvasReady = useCallback(
    (canvas: HTMLCanvasElement | null) => {
      threeCanvasRef.current = canvas;
    },
    [],
  );

  const captureSolarSystem = async () => {
    const canvas = threeCanvasRef.current;
    if (!canvas) return "";

    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    });

    if (exportObjectUrlRef.current) {
      URL.revokeObjectURL(exportObjectUrlRef.current);
      exportObjectUrlRef.current = null;
    }

    const blob = await canvasToBlob(canvas);
    const objectUrl = URL.createObjectURL(blob);
    exportObjectUrlRef.current = objectUrl;
    return objectUrl;
  };

  const handleExport = async () => {
    if (isGeneratingPng) return;

    setIsGeneratingPng(true);
    try {
      const imageUrl = await captureSolarSystem();
      if (!imageUrl) return;
      setExportImage(imageUrl);
      setIsExporting(true);
    } finally {
      setIsGeneratingPng(false);
    }
  };

  const stageSize = Math.round(900 * containerScale);

  return (
    <div className="relative flex min-h-screen select-none flex-col items-center overflow-x-hidden overflow-y-auto px-3 pb-6 pt-4 font-sans text-white md:justify-center md:overflow-hidden md:px-0 md:pb-0 md:pt-0">
      <style>{`
        @keyframes body-preview-texture-spin {
          from { background-position: 0% 50%; }
          to { background-position: -200% 50%; }
        }

        @keyframes body-preview-moon-orbit {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .body-preview-texture {
          animation-name: body-preview-texture-spin;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
        }

        .body-preview-moon-orbit {
          animation: body-preview-moon-orbit 7s linear infinite;
        }

        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 999px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.24);
        }

        @media (prefers-reduced-motion: reduce) {
          .body-preview-texture,
          .body-preview-moon-orbit {
            animation: none !important;
          }
        }
      `}</style>

      <div
        className="absolute inset-0 -z-20 bg-cover bg-center transition-all duration-1000"
        style={{ backgroundImage: `url(${TEXTURE_MAP[bgTheme]})` }}
      />
      <div className="absolute inset-0 -z-10 bg-black/45" />

      <div className="relative z-40 w-full max-w-sm self-start px-1 pb-3 pointer-events-none md:absolute md:left-6 md:top-6 md:w-auto md:max-w-none md:px-0 md:pb-0">
        <h1 className="text-3xl font-extralight uppercase leading-none tracking-[0.2em] text-white/95">
          Solar System Creator
        </h1>
        <p className="mt-1 text-[10px] uppercase tracking-widest text-white/40 font-mono">
          Interactive Solar System Builder
        </p>
      </div>

      <div
        className={`order-2 relative z-40 mb-4 flex w-full max-w-sm self-stretch flex-col rounded-2xl border border-white/10 bg-black/50 p-5 shadow-[0_15px_40px_rgba(0,0,0,0.6)] backdrop-blur-xl transition-all duration-300 md:absolute md:left-6 md:top-1/2 md:mb-0 md:w-80 md:max-w-none md:-translate-y-1/2 ${
          sidebarOpen
            ? "max-h-[70vh] md:max-h-[80vh]"
            : "max-h-13.5 overflow-hidden"
        }`}
      >
        <button
          type="button"
          onClick={() => setSidebarOpen((open) => !open)}
          className="group flex cursor-pointer items-center justify-between pb-1 text-left"
          aria-expanded={sidebarOpen}
        >
          <span className="text-xs font-bold uppercase tracking-[0.15em] text-white/60 transition-colors group-hover:text-white font-mono">
            Control Panel
          </span>
          <span
            className={`text-[9px] text-white/40 transition-transform duration-300 group-hover:text-white/80 font-mono ${
              sidebarOpen ? "rotate-180" : ""
            }`}
          >
            ▼
          </span>
        </button>

        {sidebarOpen && (
          <div className="custom-scrollbar mt-5 flex max-h-[calc(70vh-80px)] flex-col gap-6 overflow-y-auto pr-1 animate-in fade-in duration-300 md:max-h-[calc(80vh-80px)]">
            <div>
              <SectionHeading>Presets</SectionHeading>
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    ["full", "Solar System"],
                    ["inner", "Rocky Planets"],
                    ["outer", "Giants"],
                    ["empty", "Empty Star"],
                  ] as const
                ).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleLoadPreset(key)}
                    className="cursor-pointer rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-left text-[10px] uppercase tracking-wider transition-colors hover:bg-white/10 font-mono"
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <SectionHeading>Visual Settings</SectionHeading>
              <div className="flex flex-col gap-3 text-[11px] text-white/70 font-mono">
                <label className="flex cursor-pointer items-center gap-2.5">
                  <input
                    type="checkbox"
                    checked={showOrbits}
                    onChange={(event) => setShowOrbits(event.target.checked)}
                    className="h-4 w-4 cursor-pointer rounded border-white/20 bg-white/5 text-white focus:ring-0 focus:ring-offset-0"
                  />
                  Show Orbital Rings
                </label>
                <label className="flex cursor-pointer items-center gap-2.5">
                  <input
                    type="checkbox"
                    checked={showMoons}
                    onChange={(event) => setShowMoons(event.target.checked)}
                    className="h-4 w-4 cursor-pointer rounded border-white/20 bg-white/5 text-white focus:ring-0 focus:ring-offset-0"
                  />
                  Show Moons
                </label>
                <label className="flex cursor-pointer items-center gap-2.5">
                  <input
                    type="checkbox"
                    checked={enableGlow}
                    onChange={(event) => setEnableGlow(event.target.checked)}
                    className="h-4 w-4 cursor-pointer rounded border-white/20 bg-white/5 text-white focus:ring-0 focus:ring-offset-0"
                  />
                  Enable Glow Effects
                </label>

                <div className="mt-1 flex flex-col gap-1.5">
                  <span className="text-[10px] uppercase text-white/40">
                    Background
                  </span>
                  <select
                    value={bgTheme}
                    onChange={(event) =>
                      setBgTheme(event.target.value as BackgroundTheme)
                    }
                    className="w-full cursor-pointer rounded-lg border border-white/15 bg-black/80 px-2 py-1.5 text-xs focus:border-white/30 focus:outline-none font-mono"
                  >
                    <option value="stars">Default</option>
                    <option value="stars_milky_way">Milky Way</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={handleExport}
                  disabled={isGeneratingPng}
                  className="mt-4 flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/10 py-3.5 text-[10px] font-bold uppercase tracking-widest text-white transition-all hover:scale-[1.01] hover:bg-white/15 disabled:cursor-wait disabled:text-white/70 disabled:hover:scale-100 disabled:hover:bg-white/10"
                >
                  {isGeneratingPng ? (
                    <>
                      <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                      Generating PNG...
                    </>
                  ) : (
                    <>
                      <Download className="h-3.5 w-3.5" />
                      Download PNG
                    </>
                  )}
                </button>
              </div>
            </div>

            <div>
              <SectionHeading>Celestial Bodies</SectionHeading>
              <div className="custom-scrollbar flex max-h-64 flex-col gap-1.5 overflow-y-auto pr-1">
                {planets.length === 0 ? (
                  <span className="rounded-xl border border-dashed border-white/10 px-3 py-4 text-center text-[10px] italic text-white/30">
                    No celestial bodies in orbit
                  </span>
                ) : (
                  planets.map((planet) => {
                    const isSelected = selectedBodyId === planet.id;

                    return (
                      <div
                        key={planet.id}
                        className={`group flex items-center rounded-xl border transition-all duration-200 ${
                          isSelected
                            ? "border-white/25 bg-white/10 shadow-[0_0_12px_rgba(255,255,255,0.035)]"
                            : "border-white/5 bg-black/25 hover:border-white/15 hover:bg-white/4.5"
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => setSelectedBodyId(planet.id)}
                          className="flex min-w-0 flex-1 cursor-pointer items-center gap-2.5 p-1.5 text-left"
                        >
                          <div
                            className={`rounded-xl transition-colors ${
                              isSelected ? "bg-white/5.5" : "bg-black/15"
                            }`}
                          >
                            <BodyPreview
                              body={planet}
                              variant="list"
                              paused={paused}
                              showMoons={showMoons}
                              enableGlow={enableGlow}
                            />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="truncate text-[11px] leading-tight text-white/85 font-mono">
                              {planet.name}
                            </div>
                            <div className="mt-0.5 truncate text-[8px] uppercase leading-none tracking-wider text-white/35 font-mono">
                              {planet.type}
                            </div>
                            <div className="mt-1.5 flex gap-2 text-[8px] text-white/28 font-mono">
                              <span>{planet.size}px body</span>
                              <span>{Math.round(planet.orbitSize / 2)}px orbit</span>
                            </div>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeletePlanet(planet.id)}
                          className="mr-1.5 cursor-pointer rounded-lg p-1.5 text-white/25 transition-colors hover:bg-red-500/10 hover:text-red-300"
                          title={`Delete ${planet.name}`}
                          aria-label={`Delete ${planet.name}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div>
              <SectionHeading>Planet Creator</SectionHeading>

              {isAdding && previewPlanet ? (
                <form
                  onSubmit={handleAddPlanet}
                  className="flex flex-col gap-3 rounded-xl border border-white/5 bg-white/5 p-3.5 text-[11px] animate-in slide-in-from-top-4 duration-300 font-mono"
                >
                  <div className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-black/25 p-2.5">
                    <BodyPreview
                      body={previewPlanet}
                      variant="creator"
                      paused={paused}
                      showMoons={showMoons}
                      enableGlow={enableGlow}
                    />
                    <div className="min-w-0">
                      <div className="truncate text-xs text-white/85">
                        {previewPlanet.name}
                      </div>
                      <div className="mt-0.5 text-[9px] uppercase tracking-wider text-white/35">
                        Live system preview
                      </div>
                      <div className="mt-2 text-[9px] text-white/45">
                        {previewPlanet.size}px body · {Math.round(previewPlanet.orbitSize / 2)}px orbit
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-white/40">
                      Planet Name
                    </label>
                    <input
                      type="text"
                      required
                      value={draft.name}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          name: event.target.value,
                        }))
                      }
                      className="rounded border border-white/10 bg-black/60 px-2 py-1 text-xs text-white focus:border-white/30 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-white/40">
                        Texture
                      </label>
                      <select
                        value={draft.textureKey}
                        onChange={(event) =>
                          setDraft((current) => ({
                            ...current,
                            textureKey: event.target.value as PlanetTextureKey,
                          }))
                        }
                        className="cursor-pointer rounded border border-white/10 bg-black/80 px-1.5 py-1 text-xs focus:outline-none"
                      >
                        {TEXTURE_OPTIONS.map((option) => (
                          <option key={option.key} value={option.key}>
                            {option.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-white/40">
                        Planet Type
                      </label>
                      <select
                        value={draft.type}
                        onChange={(event) =>
                          setDraft((current) => ({
                            ...current,
                            type: event.target.value,
                          }))
                        }
                        className="cursor-pointer rounded border border-white/10 bg-black/80 px-1.5 py-1 text-xs focus:outline-none"
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
                        Planet Diameter ({draft.size}px)
                      </label>
                      <span className="text-[9px] text-white/30">
                        Relative scale
                      </span>
                    </div>
                    <input
                      type="range"
                      min="6"
                      max="65"
                      value={draft.size}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          size: Number.parseInt(event.target.value, 10),
                        }))
                      }
                      className="h-1 w-full cursor-pointer appearance-none rounded-lg bg-white/15 [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:transition-all hover:[&::-webkit-slider-thumb]:scale-125"
                    />
                  </div>

                  <div className="flex flex-col gap-0.5">
                    <div className="flex justify-between">
                      <label className="text-[10px] text-white/40">
                        Orbit Radius ({Math.round(draft.orbitSize / 2)}px)
                      </label>
                      <span className="text-[9px] text-white/30">Distance</span>
                    </div>
                    <input
                      type="range"
                      min="120"
                      max="850"
                      step="10"
                      value={draft.orbitSize}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          orbitSize: Number.parseInt(event.target.value, 10),
                        }))
                      }
                      className="h-1 w-full cursor-pointer appearance-none rounded-lg bg-white/15 [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:transition-all hover:[&::-webkit-slider-thumb]:scale-125"
                    />
                  </div>

                  <div className="flex flex-col gap-0.5">
                    <div className="flex justify-between">
                      <label className="text-[10px] text-white/45">
                        Orbital Period ({draft.duration}s)
                      </label>
                      <span className="text-[9px] text-white/30">
                        Faster ← → Slower
                      </span>
                    </div>
                    <input
                      type="range"
                      min="3"
                      max="120"
                      value={draft.duration}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          duration: Number.parseInt(event.target.value, 10),
                        }))
                      }
                      className="h-1 w-full cursor-pointer appearance-none rounded-lg bg-white/15 [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:transition-all hover:[&::-webkit-slider-thumb]:scale-125"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2 border-y border-white/5 py-2">
                    <TogglePill
                      checked={Boolean(draft.hasMoon)}
                      onChange={(hasMoon) =>
                        setDraft((current) => ({ ...current, hasMoon }))
                      }
                    >
                      Moon
                    </TogglePill>
                    <TogglePill
                      checked={Boolean(draft.hasRings)}
                      onChange={(hasRings) =>
                        setDraft((current) => ({ ...current, hasRings }))
                      }
                    >
                      Rings
                    </TogglePill>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] text-white/40">
                      Global Temperature
                    </label>
                    <input
                      type="text"
                      value={draft.temp}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          temp: event.target.value,
                        }))
                      }
                      className="rounded border border-white/10 bg-black/60 px-2 py-1.5 text-xs text-white focus:border-white/30 focus:outline-none"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] text-white/40">
                      Description
                    </label>
                    <textarea
                      value={draft.desc}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          desc: event.target.value,
                        }))
                      }
                      rows={3}
                      className="custom-scrollbar w-full resize-y rounded border border-white/10 bg-black/60 px-2 py-1.5 text-xs leading-normal text-white focus:border-white/30 focus:outline-none font-sans"
                    />
                  </div>

                  <div className="mt-2 flex gap-2">
                    <button
                      type="button"
                      onClick={() => setIsAdding(false)}
                      className="flex-1 cursor-pointer rounded-lg border border-white/10 bg-white/5 py-2 text-[10px] font-bold uppercase tracking-widest text-white/70 transition-colors hover:bg-white/10"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-2 cursor-pointer rounded-lg border border-white/25 bg-white/15 py-2 text-[10px] font-bold uppercase tracking-widest text-white transition-colors hover:bg-white/25"
                    >
                      Create Planet
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  type="button"
                  onClick={openCreator}
                  className="flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/10 py-3.5 text-[10px] font-bold uppercase tracking-widest text-white transition-all hover:scale-[1.01] hover:bg-white/15"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Create a New Planet
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="order-5 relative z-10 flex w-full justify-center overflow-hidden px-1 pt-2 md:block md:w-auto md:overflow-visible md:px-0 md:pt-0">
        <div
          className="relative shrink-0 overflow-hidden bg-black"
          style={{ width: stageSize, height: stageSize }}
        >
          <div
            className="absolute left-0 top-0 h-225 w-225"
            style={{
              transform: `scale(${containerScale})`,
              transformOrigin: "top left",
            }}
          >
            <ThreeSolarSystem
              planets={scenePlanets}
              paused={paused}
              timeScale={timeScale}
              showOrbits={showOrbits}
              showMoons={showMoons}
              enableGlow={enableGlow}
              bgTheme={bgTheme}
              onPlanetSelect={handleThreePlanetSelect}
              onSunSelect={handleThreeSunSelect}
              onCanvasReady={handleThreeCanvasReady}
            />
          </div>
        </div>
      </div>

      {selectedBody && (
        <div className="custom-scrollbar order-3 relative z-40 -mt-1 mb-4 w-full max-w-sm self-stretch overflow-y-auto rounded-2xl border border-white/10 bg-black/60 p-5 text-left shadow-[0_15px_40px_rgba(0,0,0,0.7)] backdrop-blur-xl animate-in fade-in duration-300 md:absolute md:right-6 md:top-1/2 md:mb-0 md:mt-0 md:max-h-[80vh] md:w-80 md:max-w-none md:-translate-y-1/2 md:slide-in-from-right-10">
          <button
            type="button"
            onClick={() => setSelectedBodyId(null)}
            className="absolute right-3 top-3 z-10 cursor-pointer rounded-full p-1.5 text-white/40 transition-colors hover:bg-white/10 hover:text-white"
            title="Close Panel"
            aria-label="Close properties"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="relative mb-5 overflow-hidden rounded-2xl border border-white/8 bg-[radial-gradient(circle_at_28%_18%,rgba(255,255,255,0.08),rgba(255,255,255,0.02)_38%,rgba(0,0,0,0.28)_100%)] p-3.5">
            <div className="absolute inset-0 bg-[linear-gradient(115deg,transparent_0%,rgba(255,255,255,0.025)_48%,transparent_70%)]" />
            <div className="relative flex items-center gap-3">
              <BodyPreview
                body={selectedBody}
                variant="panel"
                paused={paused}
                showMoons={showMoons}
                enableGlow={enableGlow}
              />

              <div className="min-w-0 flex-1 pr-4">
                <div className="text-[9px] uppercase tracking-[0.18em] text-white/35 font-mono">
                  {selectedBody.id === "sun" ? "Stellar Core" : "Selected Body"}
                </div>
                <h2 className="mt-1 wrap-break-word text-xl font-light uppercase leading-tight tracking-widest text-white">
                  {selectedBody.name}
                </h2>
                <div className="mt-1 text-[9px] uppercase tracking-wider text-white/45 font-mono">
                  {selectedBody.type}
                </div>
              </div>
            </div>

            <div className="relative mt-3 grid grid-cols-3 gap-1.5">
              {selectedBody.id === "sun" ? (
                <>
                  <Metric label="Temperature" value={selectedBody.temp} />
                  <Metric label="Class" value="G2V" />
                  <Metric label="Age" value="4.6B yr" />
                </>
              ) : (
                <>
                  <Metric label="Diameter" value={`${selectedBody.size}px`} />
                  <Metric
                    label="Orbit"
                    value={`${Math.round(selectedBody.orbitSize / 2)}px`}
                  />
                  <Metric label="Period" value={`${selectedBody.duration}s`} />
                </>
              )}
            </div>
          </div>

          <p className="mb-5 border-l-2 border-white/15 pl-3 text-[11px] leading-relaxed text-white/60">
            {selectedBody.desc}
          </p>

          {selectedBody.id !== "sun" ? (
            <div className="space-y-4 border-t border-white/5 pt-5 text-[11px] text-white/80 font-mono">
              <h3 className="mb-3 text-[10px] font-bold uppercase tracking-widest text-white/45">
                Properties
              </h3>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-white/45">Name</label>
                <input
                  type="text"
                  value={selectedBody.name}
                  onChange={(event) =>
                    handleUpdatePlanet(selectedBody.id, {
                      name: event.target.value,
                    })
                  }
                  className="w-full rounded border border-white/10 bg-black/60 px-2.5 py-1.5 text-xs text-white focus:border-white/30 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-white/45">Texture</label>
                  <select
                    value={selectedBody.textureKey}
                    onChange={(event) =>
                      handleUpdatePlanet(selectedBody.id, {
                        textureKey: event.target.value as PlanetTextureKey,
                      })
                    }
                    className="w-full cursor-pointer rounded border border-white/10 bg-black/80 px-2 py-1.5 text-xs focus:outline-none"
                  >
                    {TEXTURE_OPTIONS.map((option) => (
                      <option key={option.key} value={option.key}>
                        {option.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-white/45">Category</label>
                  <select
                    value={selectedBody.type}
                    onChange={(event) =>
                      handleUpdatePlanet(selectedBody.id, {
                        type: event.target.value,
                      })
                    }
                    className="w-full cursor-pointer rounded border border-white/10 bg-black/80 px-2 py-1.5 text-xs focus:outline-none"
                  >
                    {TYPE_OPTIONS.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="rounded-lg border border-white/6 bg-black/20 px-2.5 py-2 text-[9px] text-white/35">
                Texture preview: {TEXTURE_LABEL[selectedBody.textureKey as PlanetTextureKey]}
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex justify-between">
                  <label className="text-[10px] text-white/45">
                    Planet Diameter
                  </label>
                  <span className="text-[10px] text-white/60">
                    {selectedBody.size}px
                  </span>
                </div>
                <input
                  type="range"
                  min="6"
                  max="65"
                  value={selectedBody.size}
                  onChange={(event) =>
                    handleUpdatePlanet(selectedBody.id, {
                      size: Number.parseInt(event.target.value, 10),
                    })
                  }
                  className="h-1 w-full cursor-pointer appearance-none rounded-lg bg-white/15 [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:transition-all hover:[&::-webkit-slider-thumb]:scale-125"
                />
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex justify-between">
                  <label className="text-[10px] text-white/45">
                    Orbit Radius
                  </label>
                  <span className="text-[10px] text-white/60">
                    {Math.round(selectedBody.orbitSize / 2)}px
                  </span>
                </div>
                <input
                  type="range"
                  min="120"
                  max="850"
                  step="10"
                  value={selectedBody.orbitSize}
                  onChange={(event) =>
                    handleUpdatePlanet(selectedBody.id, {
                      orbitSize: Number.parseInt(event.target.value, 10),
                    })
                  }
                  className="h-1 w-full cursor-pointer appearance-none rounded-lg bg-white/15 [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:transition-all hover:[&::-webkit-slider-thumb]:scale-125"
                />
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex justify-between">
                  <label className="text-[10px] text-white/45">
                    Orbital Period
                  </label>
                  <span className="text-[10px] text-white/60">
                    {selectedBody.duration}s
                  </span>
                </div>
                <input
                  type="range"
                  min="3"
                  max="120"
                  value={selectedBody.duration}
                  onChange={(event) =>
                    handleUpdatePlanet(selectedBody.id, {
                      duration: Number.parseInt(event.target.value, 10),
                    })
                  }
                  className="h-1 w-full cursor-pointer appearance-none rounded-lg bg-white/15 [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:transition-all hover:[&::-webkit-slider-thumb]:scale-125"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 border-y border-white/5 py-2">
                <TogglePill
                  checked={Boolean(selectedBody.hasMoon)}
                  onChange={(hasMoon) =>
                    handleUpdatePlanet(selectedBody.id, { hasMoon })
                  }
                >
                  Moon
                </TogglePill>
                <TogglePill
                  checked={Boolean(selectedBody.hasRings)}
                  onChange={(hasRings) =>
                    handleUpdatePlanet(selectedBody.id, { hasRings })
                  }
                >
                  Rings
                </TogglePill>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-white/45">
                  Global Temperature
                </label>
                <input
                  type="text"
                  value={selectedBody.temp}
                  onChange={(event) =>
                    handleUpdatePlanet(selectedBody.id, {
                      temp: event.target.value,
                    })
                  }
                  className="w-full rounded border border-white/10 bg-black/60 px-2.5 py-1.5 text-xs text-white focus:border-white/30 focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-white/45">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={selectedBody.desc}
                  onChange={(event) =>
                    handleUpdatePlanet(selectedBody.id, {
                      desc: event.target.value,
                    })
                  }
                  className="custom-scrollbar w-full resize-y rounded border border-white/10 bg-black/60 px-2.5 py-1.5 text-xs leading-normal text-white focus:border-white/30 focus:outline-none font-sans"
                />
              </div>

              <div className="mt-2 flex justify-end border-t border-white/5 pt-3.5">
                <button
                  type="button"
                  onClick={() => handleDeletePlanet(selectedBody.id)}
                  className="flex cursor-pointer items-center gap-1 rounded-lg border border-red-500/30 bg-red-950/40 px-3 py-1.5 text-[9px] uppercase tracking-wider text-red-300 transition-colors hover:bg-red-900/60 hover:text-white"
                >
                  <Trash2 className="h-3 w-3" />
                  Delete
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4 border-t border-white/5 pt-5 text-[11px] text-white/70 font-mono">
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-white/40">AVG SURFACE TEMP</span>
                <span>{SUN_BODY.temp}</span>
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
        </div>
      )}

      <div className="order-4 relative z-40 -mt-1 mb-4 flex max-w-full flex-wrap items-center justify-center gap-3 rounded-[1.75rem] border border-white/10 bg-black/50 px-5 py-3 shadow-[0_8px_32px_rgba(0,0,0,0.5)] backdrop-blur-md md:absolute md:bottom-6 md:left-1/2 md:mb-0 md:mt-0 md:-translate-x-1/2 md:flex-nowrap md:gap-4 md:rounded-full md:px-6">
        <button
          type="button"
          onClick={() => setPaused((current) => !current)}
          className="group cursor-pointer rounded-full border border-white/10 bg-white/5 p-3 transition-all hover:scale-105 hover:bg-white/10"
          title={paused ? "Resume Simulation" : "Pause Simulation"}
        >
          {paused ? (
            <Play className="h-4 w-4 text-white/70 group-hover:text-white" />
          ) : (
            <Pause className="h-4 w-4 text-white/70 group-hover:text-white" />
          )}
        </button>

        <button
          type="button"
          onClick={handleReset}
          className="group cursor-pointer rounded-full border border-white/10 bg-white/5 p-3 transition-all hover:scale-105 hover:bg-white/10"
          title="Reset Solar System"
        >
          <RotateCcw className="h-4 w-4 text-white/55 group-hover:text-white" />
        </button>

        <div className="h-4 w-px bg-white/10" />

        <div className="group flex flex-col items-center gap-1">
          <label className="text-[9px] uppercase tracking-widest text-white/45 transition-colors group-hover:text-white/80 font-mono">
            Time Scale: {timeScale.toFixed(1)}x
          </label>
          <input
            type="range"
            min="0.1"
            max="6"
            step="0.1"
            value={timeScale}
            onChange={(event) =>
              setTimeScale(Number.parseFloat(event.target.value))
            }
            className="h-1 w-40 cursor-pointer appearance-none rounded-lg bg-white/20 sm:w-44 [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:transition-all hover:[&::-webkit-slider-thumb]:scale-125"
          />
        </div>
      </div>

      <div className="order-6 mt-4 text-center text-[9px] text-white/25 transition-colors pointer-events-auto font-mono hover:text-white/50 md:absolute md:bottom-4 md:right-4 md:mt-0 md:text-left">
        Planet texture maps by{" "}
        <a
          href="https://www.solarsystemscope.com/textures/"
          target="_blank"
          rel="noopener noreferrer"
          className="underline transition-colors hover:text-white/40"
        >
          Solar System Scope
        </a>
        , licensed under{" "}
        <a
          href="https://creativecommons.org/licenses/by/4.0/"
          target="_blank"
          rel="noopener noreferrer"
          className="underline transition-colors hover:text-white/40"
        >
          CC BY 4.0
        </a>
      </div>

      {isExporting && exportImage && (
        <ExportPreviewModal
          imageSrc={exportImage}
          fileName={`helios-solar-system-${Date.now()}.png`}
          imageAlt="Helios Solar System Export"
          title="Helios System Snapshot"
          description="Capture of your custom simulated celestial alignment."
          isTouchDevice={
            typeof window !== "undefined" &&
            ("ontouchstart" in window || navigator.maxTouchPoints > 0)
          }
          onSaveImage={async () => {
            try {
              const response = await fetch(exportImage);
              const blob = await response.blob();
              const file = new File(
                [blob],
                `helios-solar-system-${Date.now()}.png`,
                { type: "image/png" },
              );

              const canShareFile =
                typeof navigator !== "undefined" &&
                typeof navigator.share === "function" &&
                typeof navigator.canShare === "function" &&
                navigator.canShare({ files: [file] });

              if (canShareFile) {
                await navigator.share({
                  files: [file],
                  title: "Helios Solar System",
                  text: "Save this solar system snapshot.",
                });
                return;
              }

              window.open(exportImage, "_blank", "noopener,noreferrer");
            } catch {
              window.open(exportImage, "_blank", "noopener,noreferrer");
            }
          }}
          shareUrl={typeof window !== "undefined" ? window.location.href : ""}
          onClose={() => {
            if (exportObjectUrlRef.current) {
              URL.revokeObjectURL(exportObjectUrlRef.current);
              exportObjectUrlRef.current = null;
            }
            setIsExporting(false);
            setExportImage(null);
          }}
        />
      )}
    </div>
  );
}
