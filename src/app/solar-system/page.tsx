"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  LoaderCircle,
  Pause,
  Play,
  Plus,
  Trash2,
  X,
  Download,
} from "lucide-react";
import { ExportPreviewModal } from "@/components/ExportPreviewModal";
import { canvasToBlob } from "@/lib/canvasExport";
import { ThreeSolarSystem } from "./ThreeSolarSystem";

// Asset texture mappings
const TEXTURE_MAP = {
  mercury: "/solar-system/2k_mercury.jpg",
  venus_surface: "/solar-system/2k_venus_surface.jpg",
  earth: "/solar-system/2k_earth_daymap.jpg",
  moon: "/solar-system/2k_moon.jpg",
  mars: "/solar-system/2k_mars.jpg",
  ceres: "/solar-system/2k_ceres_fictional.jpg",
  eris: "/solar-system/2k_eris_fictional.jpg",
  haumea: "/solar-system/2k_haumea_fictional.jpg",
  makemake: "/solar-system/2k_makemake_fictional.jpg",
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
  venus_surface: "rgba(204,119,34,0.12)",
  earth: "rgba(65,105,225,0.15)",
  moon: "rgba(200,200,200,0.1)",
  mars: "rgba(205,92,92,0.12)",
  ceres: "rgba(184,156,122,0.1)",
  eris: "rgba(217,232,245,0.12)",
  haumea: "rgba(181,220,236,0.12)",
  makemake: "rgba(190,118,82,0.12)",
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
    textureKey: "venus_surface",
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
  { key: "venus_surface", name: "Venus" },
  { key: "earth", name: "Earth" },
  { key: "mars", name: "Mars" },
  { key: "jupiter", name: "Jupiter" },
  { key: "saturn", name: "Saturn" },
  { key: "uranus", name: "Uranus" },
  { key: "neptune", name: "Neptune" },
  { key: "moon", name: "Moon" },
  { key: "ceres", name: "Ceres" },
  { key: "eris", name: "Eris" },
  { key: "haumea", name: "Haumea" },
  { key: "makemake", name: "Makemake" },
];

const TYPE_OPTIONS = [
  "Rocky",
  "Habitable",
  "Gas Giant",
  "Ice Giant",
  "Dwarf Planet",
  "Lava",
  "Exotic",
];

const AMBIENT_AUDIO_URL = "/solar-system/space-ambient.mp3";
const DEFAULT_AMBIENT_VOLUME = 0.20;

const getSuggestedPlanetType = (textureKey: TextureKey) => {
  switch (textureKey) {
    case "earth":
      return "Habitable";
    case "jupiter":
    case "saturn":
      return "Gas Giant";
    case "uranus":
    case "neptune":
      return "Ice Giant";
    case "ceres":
    case "eris":
    case "haumea":
    case "makemake":
      return "Dwarf Planet";
    default:
      return "Rocky";
  }
};

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
  const [ambientVolume, setAmbientVolume] = useState(DEFAULT_AMBIENT_VOLUME);
  const [selectedPlanet, setSelectedPlanet] = useState<Planet | null>(null);

  const [mounted, setMounted] = useState(false);
  const [systemLoaded, setSystemLoaded] = useState(false);

  // Customization Toggles
  const [showOrbits, setShowOrbits] = useState(true);
  const [showMoons, setShowMoons] = useState(true);
  const [enableGlow, setEnableGlow] = useState(true);
  const [bgTheme, setBgTheme] = useState<"stars" | "stars_milky_way">(
    "stars_milky_way",
  );
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Export Modal state
  const [exportImage, setExportImage] = useState<string | null>(null);
  const [exportFileName, setExportFileName] = useState(
    "helios-solar-system.png",
  );
  const [isExporting, setIsExporting] = useState(false);
  const [isGeneratingPng, setIsGeneratingPng] = useState(false);

  // Custom Planet Form State
  const [newPlanetName, setNewPlanetName] = useState("");
  const [newPlanetTexture, setNewPlanetTexture] = useState<TextureKey>("ceres");
  const [newPlanetSize, setNewPlanetSize] = useState(16);
  const [newPlanetOrbit, setNewPlanetOrbit] = useState(400);
  const [newPlanetDuration, setNewPlanetDuration] = useState(25);
  const [newPlanetType, setNewPlanetType] = useState(
    getSuggestedPlanetType("ceres"),
  );
  const [newPlanetTemp, setNewPlanetTemp] = useState("250 K");
  const [newPlanetDesc, setNewPlanetDesc] = useState(
    "A mysterious newly discovered celestial world.",
  );
  const [newPlanetHasMoon, setNewPlanetHasMoon] = useState(false);
  const [newPlanetHasRings, setNewPlanetHasRings] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  const previewPlanet = useMemo<Planet | null>(() => {
    if (!isAdding) return null;

    return {
      id: "preview-planet",
      name: newPlanetName.trim() || "New Planet",
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
  }, [
    isAdding,
    newPlanetDesc,
    newPlanetDuration,
    newPlanetHasMoon,
    newPlanetHasRings,
    newPlanetName,
    newPlanetOrbit,
    newPlanetSize,
    newPlanetTemp,
    newPlanetTexture,
    newPlanetType,
  ]);

  const displayedPlanets = useMemo(
    () => (previewPlanet ? [...planets, previewPlanet] : planets),
    [planets, previewPlanet],
  );

  // Scaler state for responsive fitting
  const [containerScale, setContainerScale] = useState(1);
  const [isMobileViewport, setIsMobileViewport] = useState(false);

  // Refs for animation loop updates (to prevent loop resets)
  const exportStageRef = useRef<HTMLDivElement>(null);
  const systemViewportRef = useRef<HTMLDivElement>(null);
  const threeCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const ambientAudioRef = useRef<HTMLAudioElement | null>(null);
  const exportObjectUrlRef = useRef<string | null>(null);
  const planetRotations = useRef<{ [id: string]: number }>({});
  const planetElements = useRef<{ [id: string]: HTMLDivElement | null }>({});
  const textureAssetCacheRef = useRef<Map<string, string> | null>(null);
  const textureAssetCachePromiseRef = useRef<Promise<
    Map<string, string>
  > | null>(null);
  const loadedImageCacheRef = useRef<
    Map<string, Promise<HTMLImageElement | null>>
  >(new Map());
  const ringTextureCacheRef = useRef<Map<TextureKey, HTMLCanvasElement>>(
    new Map(),
  );
  const requestRef = useRef<number>(0);
  const planetsRef = useRef(displayedPlanets);
  const pausedRef = useRef(paused);
  const timeScaleRef = useRef(timeScale);
  const lastMobileViewportRef = useRef<boolean | null>(null);

  // Sync state with refs to keep the frame loop up-to-date without restarting
  useEffect(() => {
    planetsRef.current = displayedPlanets;
  }, [displayedPlanets]);
  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);
  useEffect(() => {
    timeScaleRef.current = timeScale;
  }, [timeScale]);

  useEffect(() => {
    const audio = new Audio(AMBIENT_AUDIO_URL);
    audio.loop = true;
    audio.preload = "auto";
    audio.volume = DEFAULT_AMBIENT_VOLUME;
    ambientAudioRef.current = audio;

    const tryStartAmbientAudio = () => {
      audio.play().then(
        () => {
          window.removeEventListener("pointerdown", tryStartAmbientAudio);
          window.removeEventListener("keydown", tryStartAmbientAudio);
        },
        () => {},
      );
    };

    window.addEventListener("pointerdown", tryStartAmbientAudio);
    window.addEventListener("keydown", tryStartAmbientAudio);
    tryStartAmbientAudio();

    return () => {
      window.removeEventListener("pointerdown", tryStartAmbientAudio);
      window.removeEventListener("keydown", tryStartAmbientAudio);
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
      ambientAudioRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (ambientAudioRef.current) {
      ambientAudioRef.current.volume = ambientVolume;
    }
  }, [ambientVolume]);

  // Handle container resizing to fit on screen
  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const isMobile = w < 768;
      if (lastMobileViewportRef.current !== isMobile) {
        lastMobileViewportRef.current = isMobile;
        setIsMobileViewport(isMobile);
        setSidebarOpen(!isMobile);
      }

      if (isMobile) {
        const scaleX = (w - 12) / 760;
        const scaleY = (h - 260) / 760;
        const scale = Math.min(scaleX, scaleY);
        setContainerScale(Math.min(0.62, Math.max(0.42, scale)));
        return;
      }

      // We target fitting the 900px wide system orbits
      const scaleX = (w - (w < 1024 ? 40 : 380)) / 920;
      const scaleY = (h - 160) / 920;
      const scale = Math.min(scaleX, scaleY);
      setContainerScale(Math.min(1.2, Math.max(0.25, scale)));
    };

    const frame = requestAnimationFrame(() => {
      setMounted(true);
      handleResize();
    });
    window.addEventListener("resize", handleResize);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (exportObjectUrlRef.current) {
        URL.revokeObjectURL(exportObjectUrlRef.current);
      }
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const warmTextureExportCache = async () => {
      if (textureAssetCacheRef.current || textureAssetCachePromiseRef.current) {
        return;
      }

      const urlToDataUrl = async (url: string): Promise<string> => {
        try {
          const response = await fetch(url);
          const blob = await response.blob();

          return await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(String(reader.result));
            reader.readAsDataURL(blob);
          });
        } catch {
          return url;
        }
      };

      textureAssetCachePromiseRef.current = Promise.all(
        Object.values(TEXTURE_MAP).map(
          async (url): Promise<[string[], string]> => [
            [url, new URL(url, window.location.href).href],
            await urlToDataUrl(url),
          ],
        ),
      ).then((textureDataUrls) => {
        const nextCache = new Map<string, string>();
        textureDataUrls.forEach(([urls, dataUrl]) => {
          urls.forEach((url) => nextCache.set(url, dataUrl));
        });
        if (!cancelled) {
          textureAssetCacheRef.current = nextCache;
        }
        return nextCache;
      });
    };

    let idleCallbackId: number | null = null;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    if ("requestIdleCallback" in window) {
      idleCallbackId = window.requestIdleCallback(warmTextureExportCache);
    } else {
      timeoutId = setTimeout(warmTextureExportCache, 600);
    }

    return () => {
      cancelled = true;
      if (idleCallbackId !== null && "cancelIdleCallback" in window) {
        window.cancelIdleCallback(idleCallbackId);
      }
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }
    };
  }, []);

  // Frame animation loop
  useEffect(() => {
    // Seed initial rotations based on index to match inline starting styles
    planetsRef.current.forEach((planet, index) => {
      if (planetRotations.current[planet.id] === undefined) {
        planetRotations.current[planet.id] = (index * 45) % 360;
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

  // Toggle pause state
  const togglePause = () => setPaused(!paused);

  // Manage presets
  const handleLoadPreset = (key: keyof typeof PRESETS) => {
    const selectedPreset = PRESETS[key];
    setPlanets(selectedPreset);
    setSelectedPlanet(null);
  };

  // Capture the already-rendered DOM system into a square PNG.
  const captureSolarSystem = async (): Promise<string> => {
    // Three renders a complete, self-contained scene. Exporting its canvas is
    // deterministic and avoids the fragile DOM/CSS reconstruction previously
    // required for textures, gradients, clipping, and transforms.
    const rendererCanvas = threeCanvasRef.current;
    if (rendererCanvas) {
      if (exportObjectUrlRef.current) {
        URL.revokeObjectURL(exportObjectUrlRef.current);
        exportObjectUrlRef.current = null;
      }

      const blob = await canvasToBlob(rendererCanvas);
      const objectUrl = URL.createObjectURL(blob);
      exportObjectUrlRef.current = objectUrl;
      return objectUrl;
    }

    // This fallback only applies before WebGL has initialized.
    const systemViewport = systemViewportRef.current;
    if (!systemViewport) return "";

    const loadImage = (url: string): Promise<HTMLImageElement | null> => {
      const cachedPromise = loadedImageCacheRef.current.get(url);
      if (cachedPromise) return cachedPromise;

      const nextPromise = new Promise<HTMLImageElement | null>((resolve) => {
        const image = new Image();
        image.crossOrigin = "anonymous";
        image.src = url;
        image.onload = () => resolve(image);
        image.onerror = () => resolve(null);
      });
      loadedImageCacheRef.current.set(url, nextPromise);
      return nextPromise;
    };

    const urlToDataUrl = async (url: string): Promise<string> => {
      try {
        const response = await fetch(url);
        const blob = await response.blob();
        return await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(String(reader.result));
          reader.readAsDataURL(blob);
        });
      } catch {
        return url;
      }
    };

    const buildTextureAssetCache = async () => {
      if (textureAssetCacheRef.current) return textureAssetCacheRef.current;
      if (!textureAssetCachePromiseRef.current) {
        textureAssetCachePromiseRef.current = Promise.all(
          Object.values(TEXTURE_MAP).map(
            async (url): Promise<[string[], string]> => [
              [url, new URL(url, window.location.href).href],
              await urlToDataUrl(url),
            ],
          ),
        ).then((textureDataUrls) => {
          const nextCache = new Map<string, string>();
          textureDataUrls.forEach(([urls, dataUrl]) => {
            urls.forEach((url) => nextCache.set(url, dataUrl));
          });
          textureAssetCacheRef.current = nextCache;
          return nextCache;
        });
      }
      return textureAssetCachePromiseRef.current;
    };

    const textureDataUrlByUrl = await buildTextureAssetCache();

    const resolveTextureAssetUrl = (url: string) => {
      if (!url) return "";
      if (textureDataUrlByUrl.has(url)) {
        return textureDataUrlByUrl.get(url) || url;
      }
      try {
        const absoluteUrl = new URL(url, window.location.href).href;
        return textureDataUrlByUrl.get(absoluteUrl) || absoluteUrl;
      } catch {
        return url;
      }
    };

    const parseBackgroundLength = (
      value: string,
      containerSize: number,
      fallbackSize: number,
    ) => {
      const normalized = value.trim().toLowerCase();
      if (!normalized || normalized === "auto") return fallbackSize;
      if (normalized.endsWith("%")) {
        return (containerSize * Number.parseFloat(normalized)) / 100;
      }
      if (normalized.endsWith("px")) {
        return Number.parseFloat(normalized);
      }
      const numericValue = Number.parseFloat(normalized);
      return Number.isFinite(numericValue) ? numericValue : fallbackSize;
    };

    const parseBackgroundPosition = (
      value: string,
      containerSize: number,
      imageSize: number,
    ) => {
      const normalized = value.trim().toLowerCase();
      if (!normalized) return 0;
      if (normalized === "left" || normalized === "top") return 0;
      if (normalized === "center") return (containerSize - imageSize) / 2;
      if (normalized === "right" || normalized === "bottom") {
        return containerSize - imageSize;
      }
      if (normalized.endsWith("%")) {
        return (
          ((containerSize - imageSize) * Number.parseFloat(normalized)) / 100
        );
      }
      if (normalized.endsWith("px")) {
        return Number.parseFloat(normalized);
      }
      return 0;
    };

    const baseSize = 900;
    const exportResolution = isMobileViewport ? 960 : 1200;
    const renderScale = exportResolution / baseSize;
    const canvas = document.createElement("canvas");
    canvas.width = exportResolution;
    canvas.height = exportResolution;
    const ctx = canvas.getContext("2d");
    if (!ctx) return "";

    const drawOrbit = (diameter: number) => {
      if (!showOrbits) return;
      ctx.save();
      ctx.strokeStyle = "rgba(255,255,255,0.1)";
      ctx.lineWidth = Math.max(1, renderScale);
      ctx.beginPath();
      ctx.arc(
        450 * renderScale,
        450 * renderScale,
        (diameter / 2) * renderScale,
        0,
        Math.PI * 2,
      );
      ctx.stroke();
      ctx.restore();
    };

    const drawRingHalf = (
      x: number,
      y: number,
      size: number,
      textureKey: TextureKey,
      frontHalf: boolean,
    ) => {
      const ringDiameter =
        size *
        (textureKey === "saturn" ? 2.8 : textureKey === "uranus" ? 2.2 : 2.4);
      const scaleDiameter = ringDiameter * renderScale;
      const cx = x * renderScale;
      const cy = y * renderScale;
      const rotation = 12 * (Math.PI / 180);
      const verticalScale = textureKey === "uranus" ? 0.24 : 0.3;
      let ringTexture = ringTextureCacheRef.current.get(textureKey);
      if (!ringTexture) {
        ringTexture = document.createElement("canvas");
        ringTexture.width = 512;
        ringTexture.height = 512;
        const ringCtx = ringTexture.getContext("2d");
        if (ringCtx) {
          const gradient = ringCtx.createRadialGradient(
            256,
            256,
            0,
            256,
            256,
            256,
          );
          if (textureKey === "saturn") {
            gradient.addColorStop(0.38, "rgba(0,0,0,0)");
            gradient.addColorStop(0.39, "rgba(224,205,167,0.25)");
            gradient.addColorStop(0.42, "rgba(224,205,167,0.65)");
            gradient.addColorStop(0.46, "rgba(168,132,94,0.35)");
            gradient.addColorStop(0.48, "rgba(0,0,0,0)");
            gradient.addColorStop(0.5, "rgba(224,205,167,0.55)");
            gradient.addColorStop(0.55, "rgba(199,165,117,0.45)");
            gradient.addColorStop(0.62, "rgba(224,205,167,0.25)");
            gradient.addColorStop(0.65, "rgba(0,0,0,0)");
          } else if (textureKey === "uranus") {
            gradient.addColorStop(0.55, "rgba(0,0,0,0)");
            gradient.addColorStop(0.56, "rgba(173,216,230,0.4)");
            gradient.addColorStop(0.58, "rgba(173,216,230,0.1)");
            gradient.addColorStop(0.59, "rgba(0,0,0,0)");
          } else {
            gradient.addColorStop(0.42, "rgba(0,0,0,0)");
            gradient.addColorStop(0.43, "rgba(255,255,255,0.2)");
            gradient.addColorStop(0.46, "rgba(255,255,255,0.45)");
            gradient.addColorStop(0.48, "rgba(0,0,0,0)");
            gradient.addColorStop(0.52, "rgba(255,255,255,0.2)");
            gradient.addColorStop(0.56, "rgba(0,0,0,0)");
          }
          ringCtx.fillStyle = gradient;
          ringCtx.fillRect(0, 0, 512, 512);
        }
        ringTextureCacheRef.current.set(textureKey, ringTexture);
      }

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(rotation);
      ctx.scale(1, verticalScale);
      ctx.beginPath();
      if (frontHalf) {
        ctx.rect(-scaleDiameter, 0, scaleDiameter * 2, scaleDiameter);
      } else {
        ctx.rect(
          -scaleDiameter,
          -scaleDiameter,
          scaleDiameter * 2,
          scaleDiameter,
        );
      }
      ctx.clip();
      ctx.globalAlpha = frontHalf ? 0.8 : 0.68;
      ctx.drawImage(
        ringTexture,
        -scaleDiameter / 2,
        -scaleDiameter / 2,
        scaleDiameter,
        scaleDiameter,
      );
      ctx.restore();
    };

    const drawShadowOverlay = (
      x: number,
      y: number,
      size: number,
      highlightAlpha: number,
      shadowAlpha: number,
    ) => {
      const cx = x * renderScale;
      const cy = y * renderScale;
      const radius = (size / 2) * renderScale;
      const gradient = ctx.createRadialGradient(
        cx - radius * 0.25,
        cy - radius * 0.25,
        radius * 0.1,
        cx,
        cy,
        radius,
      );
      gradient.addColorStop(0, `rgba(255,255,255,${highlightAlpha})`);
      gradient.addColorStop(0.45, "rgba(255,255,255,0.02)");
      gradient.addColorStop(1, `rgba(0,0,0,${shadowAlpha})`);
      ctx.save();
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    const drawTexturedSphere = async (
      x: number,
      y: number,
      size: number,
      textureUrl: string,
      element: HTMLElement | null,
      glowColor?: string,
      highlightAlpha = 0.12,
      shadowAlpha = 0.88,
    ) => {
      const resolvedTextureUrl = resolveTextureAssetUrl(textureUrl);
      const textureImage = await loadImage(resolvedTextureUrl);
      const scaledSize = size * renderScale;
      const cx = x * renderScale;
      const cy = y * renderScale;
      const radius = scaledSize / 2;

      if (glowColor && enableGlow) {
        ctx.save();
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = radius * 0.45;
        ctx.fillStyle = "rgba(255,255,255,0.02)";
        ctx.beginPath();
        ctx.arc(cx, cy, radius * 0.96, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.clip();

      if (textureImage?.complete && textureImage.naturalWidth > 0) {
        const computedStyle = element ? window.getComputedStyle(element) : null;
        const backgroundSizeParts = computedStyle?.backgroundSize.split(
          " ",
        ) || ["200%", "140%"];
        const backgroundPositionParts = computedStyle?.backgroundPosition.split(
          " ",
        ) || ["0%", "50%"];
        const renderedWidth = parseBackgroundLength(
          backgroundSizeParts[0] || "200%",
          size,
          size * 2,
        );
        const renderedHeight = parseBackgroundLength(
          backgroundSizeParts[1] || "140%",
          size,
          size * 1.4,
        );
        const offsetX = parseBackgroundPosition(
          backgroundPositionParts[0] || "0%",
          size,
          renderedWidth,
        );
        const offsetY = parseBackgroundPosition(
          backgroundPositionParts[1] || "50%",
          size,
          renderedHeight,
        );

        const patternCanvas = document.createElement("canvas");
        patternCanvas.width = Math.max(
          1,
          Math.round(renderedWidth * renderScale),
        );
        patternCanvas.height = Math.max(
          1,
          Math.round(renderedHeight * renderScale),
        );
        const patternCtx = patternCanvas.getContext("2d");
        if (patternCtx) {
          patternCtx.drawImage(
            textureImage,
            0,
            0,
            patternCanvas.width,
            patternCanvas.height,
          );
          const pattern = ctx.createPattern(patternCanvas, "repeat");
          if (pattern) {
            pattern.setTransform(
              new DOMMatrix().translate(
                (x - size / 2 + offsetX) * renderScale,
                (y - size / 2 + offsetY) * renderScale,
              ),
            );
            ctx.fillStyle = pattern;
            ctx.fillRect(cx - radius, cy - radius, scaledSize, scaledSize);
          }
        }
      } else {
        ctx.fillStyle = "#555";
        ctx.fillRect(cx - radius, cy - radius, scaledSize, scaledSize);
      }

      drawShadowOverlay(x, y, size, highlightAlpha, shadowAlpha);
      ctx.restore();
    };

    const backgroundImage = await loadImage(
      resolveTextureAssetUrl(TEXTURE_MAP[bgTheme]),
    );
    ctx.fillStyle = "#03030b";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (backgroundImage?.complete && backgroundImage.naturalWidth > 0) {
      ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
    }
    ctx.fillStyle = "rgba(0,0,0,0.4)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (showOrbits) {
      displayedPlanets.forEach((planet) => drawOrbit(planet.orbitSize));
    }

    await drawTexturedSphere(
      450,
      450,
      96,
      TEXTURE_MAP.sun,
      systemViewport.querySelector(`[data-texture-url="${TEXTURE_MAP.sun}"]`),
      "rgba(253, 184, 19, 0.32)",
      0.25,
      0.5,
    );

    for (let index = 0; index < displayedPlanets.length; index += 1) {
      const planet = displayedPlanets[index];
      const angleDeg = planetRotations.current[planet.id] ?? (index * 45) % 360;
      const angle = (angleDeg * Math.PI) / 180;
      const orbitRadius = planet.orbitSize / 2;
      const x = 450 + Math.sin(angle) * orbitRadius;
      const y = 450 - Math.cos(angle) * orbitRadius;
      const orbitElement = planetElements.current[planet.id];
      const sphereElement = orbitElement?.querySelector(
        `[data-texture-url="${TEXTURE_MAP[planet.textureKey]}"]`,
      ) as HTMLElement | null;

      if (planet.hasRings) {
        drawRingHalf(x, y, planet.size, planet.textureKey, false);
      }

      await drawTexturedSphere(
        x,
        y,
        planet.size,
        TEXTURE_MAP[planet.textureKey],
        sphereElement,
        undefined,
        0.08,
        0.9,
      );

      if (planet.hasRings) {
        drawRingHalf(x, y, planet.size, planet.textureKey, true);
      }

      if (planet.hasMoon && showMoons) {
        const moonOrbitDiameter = planet.size + 22;
        const moonOrbitRadius = moonOrbitDiameter / 2;
        const moonAngle =
          ((planetRotations.current[planet.id] ?? angleDeg) * 4.5 * Math.PI) /
          180;

        ctx.save();
        ctx.strokeStyle = "rgba(255,255,255,0.05)";
        ctx.lineWidth = Math.max(1, renderScale * 0.75);
        ctx.beginPath();
        ctx.arc(
          x * renderScale,
          y * renderScale,
          moonOrbitRadius * renderScale,
          0,
          Math.PI * 2,
        );
        ctx.stroke();
        ctx.restore();

        const moonX = x + Math.sin(moonAngle) * moonOrbitRadius;
        const moonY = y - Math.cos(moonAngle) * moonOrbitRadius;
        const moonElement = orbitElement?.querySelector(
          `[data-texture-url="${TEXTURE_MAP.moon}"]`,
        ) as HTMLElement | null;
        await drawTexturedSphere(
          moonX,
          moonY,
          5,
          TEXTURE_MAP.moon,
          moonElement,
          undefined,
          0.08,
          0.92,
        );
      }
    }

    if (exportObjectUrlRef.current) {
      URL.revokeObjectURL(exportObjectUrlRef.current);
      exportObjectUrlRef.current = null;
    }

    const blob = await canvasToBlob(canvas);
    const objectUrl = URL.createObjectURL(blob);
    exportObjectUrlRef.current = objectUrl;
    return objectUrl;
  };

  // Add planet
  const handleAddPlanet = (e: React.FormEvent) => {
    e.preventDefault();
    const name =
      newPlanetName.trim() ||
      `Planet ${planets.filter((p: Planet) => p.id !== "preview-planet").length + 1}`;
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

  const handleThreePlanetSelect = useCallback((id: string) => {
    const planet = planetsRef.current.find((item) => item.id === id);
    if (planet && planet.id !== "preview-planet") setSelectedPlanet(planet);
  }, []);

  const handleThreeSunSelect = useCallback(() => {
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
    });
  }, []);

  const handleThreeCanvasReady = useCallback(
    (canvas: HTMLCanvasElement | null) => {
      threeCanvasRef.current = canvas;
    },
    [],
  );

  const selectedGlow =
    selectedPlanet?.id !== "sun" && selectedPlanet
      ? GLOW_COLORS[selectedPlanet.textureKey]
      : "rgba(253,184,19,0.15)";

  return (
    <div className="min-h-screen text-white font-sans relative select-none overflow-x-hidden overflow-y-auto md:overflow-hidden flex flex-col items-center md:justify-center px-3 pt-4 pb-6 md:px-0 md:pt-0 md:pb-0">
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
      <div className="relative z-40 w-full max-w-sm self-start px-1 pb-3 pointer-events-none md:absolute md:top-6 md:left-6 md:w-auto md:max-w-none md:px-0 md:pb-0">
        <h1 className="text-3xl font-extralight tracking-[0.2em] uppercase text-white/95 leading-none">
          Solar System Creator
        </h1>
        <p className="text-[10px] font-mono tracking-widest text-white/40 uppercase mt-1">
          Interactive Solar System Builder
        </p>
      </div>

      {/* Collapsible Settings & Creator Panel */}
      <div
        className={`order-2 relative z-40 mb-4 w-full max-w-sm self-stretch bg-black/50 backdrop-blur-xl border border-white/10 p-5 rounded-2xl flex flex-col shadow-[0_15px_40px_rgba(0,0,0,0.6)] ${
          mounted ? "transition-all duration-300" : ""
        } md:absolute md:top-1/2 md:left-6 md:mb-0 md:w-80 md:max-w-none md:-translate-y-1/2 ${
          sidebarOpen
            ? "max-h-[70vh] md:max-h-[80vh]"
            : "max-h-13.5 overflow-hidden"
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
          <div className="flex flex-col gap-6 mt-5 animate-in fade-in duration-300 overflow-y-auto custom-scrollbar pr-1 max-h-[calc(70vh-80px)] md:max-h-[calc(80vh-80px)]">
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
                    onChange={(e) => {
                      const theme = e.target.value;
                      if (theme === "stars" || theme === "stars_milky_way") {
                        setBgTheme(theme);
                      }
                    }}
                    className="bg-black/80 border border-white/15 px-2 py-1.5 rounded-lg text-xs font-mono w-full focus:outline-none focus:border-white/30 cursor-pointer"
                  >
                    <option value="stars">Default</option>
                    <option value="stars_milky_way">Milky Way</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5 mt-1">
                  <div className="flex items-center justify-between text-[10px] text-white/40 uppercase">
                    <label htmlFor="ambient-volume">Ambient Volume</label>
                    <span>{Math.round(ambientVolume * 100)}%</span>
                  </div>
                  <input
                    id="ambient-volume"
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={ambientVolume}
                    onChange={(e) => setAmbientVolume(Number(e.target.value))}
                    className="w-full h-1 bg-white/15 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:transition-all hover:[&::-webkit-slider-thumb]:scale-125"
                  />
                </div>

                <button
                  type="button"
                  onClick={async () => {
                    if (isGeneratingPng) return;

                    setIsGeneratingPng(true);
                    try {
                      await new Promise<void>((resolve) => {
                        requestAnimationFrame(() => {
                          setTimeout(resolve, 0);
                        });
                      });
                      const dataUrl = await captureSolarSystem();
                      if (!dataUrl) return;
                      setExportFileName(
                        `helios-solar-system-${Date.now()}.png`,
                      );
                      setExportImage(dataUrl);
                      setIsExporting(true);
                    } finally {
                      setIsGeneratingPng(false);
                    }
                  }}
                  disabled={isGeneratingPng}
                  className="mt-4 w-full py-3.5 bg-white/10 hover:bg-white/15 disabled:hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-bold tracking-widest uppercase transition-all hover:scale-[1.01] disabled:hover:scale-100 flex items-center justify-center gap-1.5 cursor-pointer disabled:cursor-wait text-white disabled:text-white/70"
                >
                  {isGeneratingPng ? (
                    <>
                      <LoaderCircle className="w-3.5 h-3.5 animate-spin" />
                      Generating PNG...
                    </>
                  ) : (
                    <>
                      <Download className="w-3.5 h-3.5" /> Download PNG
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Planet List */}
            <div>
              <h3 className="text-xs font-mono font-bold tracking-widest uppercase text-white/60 mb-3 border-b border-white/5 pb-1">
                CELESTIAL BODIES
              </h3>
              <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                {planets.filter((p: Planet) => p.id !== "preview-planet")
                  .length === 0 ? (
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
                        onChange={(e) => {
                          const textureKey = e.target.value as TextureKey;
                          setNewPlanetTexture(textureKey);
                          setNewPlanetType(getSuggestedPlanetType(textureKey));
                        }}
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
                  className="w-full py-3.5 bg-white/10 hover:bg-white/15 border border-white/10 rounded-xl text-[10px] font-bold tracking-widest uppercase transition-all hover:scale-[1.01] flex items-center justify-center gap-1.5 cursor-pointer text-white"
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
        className="order-5 relative z-10 flex w-full justify-center overflow-hidden px-1 pt-2 md:block md:w-auto md:overflow-visible md:px-0 md:pt-0"
        style={
          isMobileViewport
            ? { height: `${900 * containerScale + 56}px` }
            : undefined
        }
      >
        <div
          ref={exportStageRef}
          data-export-stage="true"
          className="relative shrink-0 overflow-hidden"
          style={{
            width: "900px",
            height: "900px",
            transform: `scale(${containerScale})`,
            transformOrigin: isMobileViewport ? "center top" : "center center",
          }}
        >
          {isGeneratingPng && (
            <>
              <div
                className="absolute inset-0 bg-cover bg-center transition-all duration-1000"
                style={{
                  backgroundImage: `url(${TEXTURE_MAP[bgTheme]})`,
                }}
              />
              <div className="absolute inset-0 bg-black/40" />
            </>
          )}
          {!systemLoaded && (
            <div className="absolute inset-0 flex flex-col items-center justify-center z-40 transition-opacity duration-500 pointer-events-none">
              <span className="text-xs font-mono tracking-[0.2em] uppercase text-white/80 animate-pulse">
                Initializing Simulation...
              </span>
            </div>
          )}
          <div
            ref={systemViewportRef}
            className="relative flex h-full w-full items-center justify-center transition-transform duration-300"
          >
            <div
              className={`absolute inset-0 z-30 transition-opacity duration-1000 ${systemLoaded ? "opacity-100" : "opacity-0"}`}
            >
              <ThreeSolarSystem
                planets={displayedPlanets}
                paused={paused}
                timeScale={timeScale}
                showOrbits={showOrbits}
                showMoons={showMoons}
                enableGlow={enableGlow}
                bgTheme={bgTheme}
                onPlanetSelect={handleThreePlanetSelect}
                onSunSelect={handleThreeSunSelect}
                onCanvasReady={handleThreeCanvasReady}
                isExporting={isGeneratingPng}
                onLoaded={() => setSystemLoaded(true)}
              />
            </div>
            <div className="hidden">
              {/* Stellar Core: The Sun */}
              <div
                data-texture-url={TEXTURE_MAP.sun}
                className="absolute w-24 h-24 rounded-full z-20 flex items-center justify-center planet-texture-spin-slow cursor-pointer"
                style={{
                  backgroundImage: `url(${TEXTURE_MAP.sun})`,
                  boxShadow: enableGlow
                    ? `0 0 60px rgba(253, 184, 19, 0.40), 0 0 25px rgba(253, 184, 19, 0.25)`
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
              {displayedPlanets.map((planet, index) => (
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
                    transform: `rotate(${(index * 45) % 360}deg)`,
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
                      data-texture-url={TEXTURE_MAP[planet.textureKey]}
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
                            data-texture-url={TEXTURE_MAP.moon}
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
          </div>
        </div>
      </div>

      {/* Right Control & Live Planet Editor Overlay */}
      {selectedPlanet && (
        <div className="order-3 relative z-40 -mt-1 mb-4 w-full max-w-sm self-stretch overflow-y-auto custom-scrollbar bg-black/60 backdrop-blur-xl border border-white/10 p-6 text-left shadow-[0_15px_40px_rgba(0,0,0,0.7)] rounded-2xl animate-in fade-in duration-300 md:absolute md:top-1/2 md:right-6 md:mb-0 md:mt-0 md:w-80 md:max-w-none md:max-h-[80vh] md:-translate-y-1/2 md:slide-in-from-right-10">
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
      <div className="order-4 relative z-40 -mt-1 mb-4 flex max-w-full flex-wrap items-center justify-center gap-4 rounded-[1.75rem] border border-white/10 bg-black/50 px-5 py-3 shadow-[0_8px_32px_rgba(0,0,0,0.5)] backdrop-blur-md md:absolute md:bottom-6 md:left-1/2 md:mb-0 md:mt-0 md:-translate-x-1/2 md:flex-nowrap md:gap-5 md:rounded-full md:px-6">
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
      <div className="order-6 mt-4 text-center font-mono text-[9px] text-white/25 transition-colors pointer-events-auto md:absolute md:bottom-4 md:right-4 md:mt-0 md:text-left hover:text-white/50">
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

      {/* Render Export Preview Modal */}
      {isExporting && exportImage && (
        <ExportPreviewModal
          imageSrc={exportImage}
          fileName={exportFileName}
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
              const pngFile = new File(
                [blob],
                exportFileName,
                {
                  type: "image/png",
                },
              );
              const canShareFile =
                typeof navigator !== "undefined" &&
                "share" in navigator &&
                "canShare" in navigator &&
                navigator.canShare({ files: [pngFile] });

              if (canShareFile) {
                await navigator.share({
                  files: [pngFile],
                  title: "Helios Solar System",
                  text: "Save this solar system snapshot.",
                });
                return;
              }

              window.open(exportImage, "_blank", "noopener,noreferrer");
            } catch {}
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
