"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Award } from "lucide-react";

// --- Types ---
type PetStatus =
  "IDLE" | "EATING" | "SLEEPING" | "PLAYING" | "CLEANING" | "DEAD";
type SkinColor =
  | "cyber-cyan"
  | "neon-pink"
  | "gameboy-olive"
  | "golden-orange"
  | "ocean-blue"
  | "slime-green"
  | "lavender"
  | "peach"
  | "moon-gray"
  | "berry-purple";
type HatStyle =
  | "NONE"
  | "COWBOY"
  | "BEANIE"
  | "CROWN"
  | "PARTY"
  | "WIZARD"
  | "FLOWER"
  | "BOW"
  | "TOPHAT"
  | "CHEF"
  | "PIRATE"
  | "SPACE";
type AccessoryStyle =
  | "NONE"
  | "SHADES"
  | "SCARF"
  | "BOWTIE"
  | "MONOCLE"
  | "HALO"
  | "HEADPHONES"
  | "WINGS"
  | "MUSTACHE"
  | "EARRINGS";
type CarePace = "COZY" | "NORMAL" | "ACTIVE";
type BackgroundColor = "BLUE" | "FOREST" | "BURGUNDY" | "CHARCOAL" | "PLUM";
type Menu = "NONE" | "STYLE" | "SETTINGS";

type SavedProgress = {
  version: 1;
  hunger: number;
  happiness: number;
  energy: number;
  cleanliness: number;
  level: number;
  exp: number;
  status: PetStatus;
  skin: SkinColor;
  hat: HatStyle;
  accessory: AccessoryStyle;
  isMuted: boolean;
  petName: string;
  carePace: CarePace;
  backgroundColor: BackgroundColor;
};

type WindowWithWebkitAudio = Window &
  typeof globalThis & {
    webkitAudioContext?: typeof AudioContext;
  };

const SKIN_COLORS: Record<
  SkinColor,
  { base: string; dark: string; light: string }
> = {
  "cyber-cyan": { base: "#06b6d4", dark: "#0891b2", light: "#22d3ee" },
  "neon-pink": { base: "#ec4899", dark: "#db2777", light: "#f472b6" },
  "gameboy-olive": { base: "#8da45e", dark: "#657a42", light: "#b6c779" },
  "golden-orange": { base: "#f97316", dark: "#ea580c", light: "#fb923c" },
  "ocean-blue": { base: "#3b82b5", dark: "#285f89", light: "#67a9cf" },
  "slime-green": { base: "#22c55e", dark: "#16a34a", light: "#4ade80" },
  lavender: { base: "#9b87c7", dark: "#7562a4", light: "#c0afe0" },
  peach: { base: "#e99472", dark: "#bf684c", light: "#f3b49a" },
  "moon-gray": { base: "#9aa3a1", dark: "#6c7675", light: "#c3cac5" },
  "berry-purple": { base: "#8f4f83", dark: "#66375e", light: "#bd79ae" },
};

const SKIN_LABELS: Record<SkinColor, string> = {
  "cyber-cyan": "CYAN",
  "neon-pink": "PINK",
  "gameboy-olive": "OLIVE",
  "golden-orange": "ORANGE",
  "ocean-blue": "OCEAN",
  "slime-green": "GREEN",
  lavender: "LAVENDER",
  peach: "PEACH",
  "moon-gray": "MOON GRAY",
  "berry-purple": "BERRY",
};

const SKIN_OPTIONS: SkinColor[] = [
  "cyber-cyan",
  "neon-pink",
  "gameboy-olive",
  "golden-orange",
  "ocean-blue",
  "slime-green",
  "lavender",
  "peach",
  "moon-gray",
  "berry-purple",
];

const HAT_OPTIONS: HatStyle[] = [
  "NONE",
  "COWBOY",
  "BEANIE",
  "CROWN",
  "PARTY",
  "WIZARD",
  "FLOWER",
  "BOW",
  "TOPHAT",
  "CHEF",
  "PIRATE",
  "SPACE",
];

const ACCESSORY_OPTIONS: AccessoryStyle[] = [
  "NONE",
  "SHADES",
  "SCARF",
  "BOWTIE",
  "MONOCLE",
  "HALO",
  "HEADPHONES",
  "WINGS",
  "MUSTACHE",
  "EARRINGS",
];

const PET_STATUSES: PetStatus[] = [
  "IDLE",
  "EATING",
  "SLEEPING",
  "PLAYING",
  "CLEANING",
  "DEAD",
];

const SKIN_UNLOCK_LEVELS: Record<SkinColor, number> = {
  "cyber-cyan": 1,
  "neon-pink": 1,
  "gameboy-olive": 1,
  "golden-orange": 2,
  "ocean-blue": 2,
  "slime-green": 3,
  lavender: 3,
  peach: 4,
  "moon-gray": 4,
  "berry-purple": 5,
};

const HAT_UNLOCK_LEVELS: Record<HatStyle, number> = {
  NONE: 1,
  COWBOY: 1,
  BEANIE: 1,
  CROWN: 2,
  PARTY: 2,
  WIZARD: 3,
  FLOWER: 3,
  BOW: 4,
  TOPHAT: 4,
  CHEF: 5,
  PIRATE: 5,
  SPACE: 6,
};

const ACCESSORY_UNLOCK_LEVELS: Record<AccessoryStyle, number> = {
  NONE: 1,
  SHADES: 1,
  SCARF: 1,
  BOWTIE: 2,
  MONOCLE: 2,
  HALO: 3,
  HEADPHONES: 3,
  WINGS: 4,
  MUSTACHE: 4,
  EARRINGS: 5,
};

const LEVEL_REWARDS: Record<number, string> = {
  2: "OCEAN SET",
  3: "MAGIC SET",
  4: "ROYAL SET",
  5: "CHEF + PIRATE SET",
  6: "SPACE HAT",
};

const SAVED_PROGRESS_KEY = "style-pet-progress-v1";

const includesOption = <T extends string>(
  options: readonly T[],
  value: unknown,
): value is T => typeof value === "string" && options.includes(value as T);

const readSavedNumber = (
  value: unknown,
  fallback: number,
  minimum: number,
  maximum: number,
) =>
  typeof value === "number" && Number.isFinite(value)
    ? Math.min(maximum, Math.max(minimum, value))
    : fallback;

const CARE_PACES: CarePace[] = ["COZY", "NORMAL", "ACTIVE"];
const BACKGROUND_OPTIONS: BackgroundColor[] = [
  "BLUE",
  "FOREST",
  "BURGUNDY",
  "CHARCOAL",
  "PLUM",
];
const BACKGROUND_COLORS: Record<BackgroundColor, string> = {
  BLUE: "#172a33",
  FOREST: "#20342b",
  BURGUNDY: "#3a2229",
  CHARCOAL: "#242a2c",
  PLUM: "#35283a",
};
const CARE_PACE_INTERVALS: Record<CarePace, number> = {
  COZY: 10000,
  NORMAL: 7500,
  ACTIVE: 5000,
};

// --- Web Audio 8-bit Retro Sound Generator ---
class AudioSynth {
  ctx: AudioContext | null = null;
  muted: boolean = false;

  init() {
    if (this.ctx) return;
    const AudioContextClass =
      window.AudioContext ||
      (window as WindowWithWebkitAudio).webkitAudioContext;
    if (!AudioContextClass) return;
    this.ctx = new AudioContextClass();
  }

  beep(freq: number, type: OscillatorType = "square", duration = 0.12) {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.04, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(
        0.001,
        this.ctx.currentTime + duration,
      );
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {
      console.warn("Audio Context init block:", e);
    }
  }

  playSelect() {
    this.beep(880, "square", 0.05);
  }

  playFeed() {
    this.beep(261.63, "sine", 0.06);
    setTimeout(() => this.beep(329.63, "sine", 0.06), 60);
    setTimeout(() => this.beep(392.0, "sine", 0.06), 120);
    setTimeout(() => this.beep(523.25, "sine", 0.12), 180);
  }

  playPet() {
    this.beep(587.33, "triangle", 0.08);
    setTimeout(() => this.beep(698.46, "triangle", 0.08), 80);
    setTimeout(() => this.beep(880.0, "triangle", 0.12), 160);
  }

  playSleep() {
    this.beep(523.25, "sine", 0.15);
    setTimeout(() => this.beep(392.0, "sine", 0.2), 150);
    setTimeout(() => this.beep(261.63, "sine", 0.35), 350);
  }

  playLevelUp() {
    const scale = [523.25, 587.33, 659.25, 698.46, 783.99, 880, 987.77, 1046.5];
    scale.forEach((freq, idx) => {
      setTimeout(() => this.beep(freq, "square", 0.07), idx * 60);
    });
  }

  playDead() {
    this.beep(293.66, "sawtooth", 0.2);
    setTimeout(() => this.beep(220.0, "sawtooth", 0.25), 180);
    setTimeout(() => this.beep(146.83, "sawtooth", 0.45), 360);
  }
}

const synth = new AudioSynth();

export default function StylePet() {
  const reduceMotion = useReducedMotion();

  // Stats
  const [hunger, setHunger] = useState(70);
  const [happiness, setHappiness] = useState(80);
  const [energy, setEnergy] = useState(90);
  const [cleanliness, setCleanliness] = useState(85);
  const [level, setLevel] = useState(1);
  const [exp, setExp] = useState(0);

  // Status/Customizations
  const [status, setStatus] = useState<PetStatus>("IDLE");
  const [skin, setSkin] = useState<SkinColor>("cyber-cyan");
  const [hat, setHat] = useState<HatStyle>("NONE");
  const [accessory, setAccessory] = useState<AccessoryStyle>("NONE");
  const [isMuted, setIsMuted] = useState(false);
  const [petName, setPetName] = useState("CYBER-KITY");
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState("CYBER-KITY");
  const [hasLoadedSave, setHasLoadedSave] = useState(false);
  const saveFileInputRef = useRef<HTMLInputElement>(null);

  // Progression
  const [screenMessage, setScreenMessage] = useState<{
    id: number;
    text: string;
  } | null>(null);

  // Menu toggles
  const [currentMenu, setCurrentMenu] = useState<Menu>("NONE");
  const [selectedStyleIndex, setSelectedStyleIndex] = useState(0); // 0 = SKIN, 1 = HAT, 2 = ACC
  const [selectedSettingIndex, setSelectedSettingIndex] = useState(0);
  const [carePace, setCarePace] = useState<CarePace>("NORMAL");
  const [backgroundColor, setBackgroundColor] =
    useState<BackgroundColor>("BLUE");

  // Zzz sleep floaters
  const [sleepBubbles, setSleepBubbles] = useState<
    { id: number; x: number; y: number }[]
  >([]);

  // Sound toggling
  const toggleMute = () => {
    synth.muted = !isMuted;
    setIsMuted(!isMuted);
    synth.playSelect();
  };

  const showMessage = useCallback((text: string) => {
    setScreenMessage((previous) => ({
      id: (previous?.id ?? 0) + 1,
      text,
    }));
  }, []);

  const gainExp = useCallback((amount: number) => {
    setExp((previous) => previous + amount);
  }, []);

  const awardCare = useCallback(
    (baseExp: number, currentNeed: number) => {
      const needBonus = Math.min(
        15,
        Math.floor(Math.max(0, 100 - currentNeed) / 20) * 3,
      );
      const earnedExp = baseExp + needBonus;

      gainExp(earnedExp);
      showMessage(
        needBonus > 0 ? `+${earnedExp} XP | NEED BONUS` : `+${earnedExp} XP`,
      );
    },
    [gainExp, showMessage],
  );

  const restoreProgress = useCallback((saved: Partial<SavedProgress>) => {
    if (saved.version !== 1) return false;

    const savedLevel = readSavedNumber(saved.level, 1, 1, 999);
    const savedStatus = includesOption(PET_STATUSES, saved.status)
      ? saved.status === "EATING" ||
        saved.status === "PLAYING" ||
        saved.status === "CLEANING"
        ? "IDLE"
        : saved.status
      : "IDLE";
    const savedSkin =
      includesOption(SKIN_OPTIONS, saved.skin) &&
      SKIN_UNLOCK_LEVELS[saved.skin] <= savedLevel
        ? saved.skin
        : "cyber-cyan";
    const savedHat =
      includesOption(HAT_OPTIONS, saved.hat) &&
      HAT_UNLOCK_LEVELS[saved.hat] <= savedLevel
        ? saved.hat
        : "NONE";
    const savedAccessory =
      includesOption(ACCESSORY_OPTIONS, saved.accessory) &&
      ACCESSORY_UNLOCK_LEVELS[saved.accessory] <= savedLevel
        ? saved.accessory
        : "NONE";
    const savedName =
      typeof saved.petName === "string"
        ? saved.petName.toUpperCase().slice(0, 10) || "BABY"
        : "CYBER-KITY";
    const savedPace = includesOption(CARE_PACES, saved.carePace)
      ? saved.carePace
      : "NORMAL";
    const savedBackground = includesOption(
      BACKGROUND_OPTIONS,
      saved.backgroundColor,
    )
      ? saved.backgroundColor
      : "BLUE";
    const savedMuted = saved.isMuted === true;

    setHunger(readSavedNumber(saved.hunger, 70, 0, 100));
    setHappiness(readSavedNumber(saved.happiness, 80, 0, 100));
    setEnergy(readSavedNumber(saved.energy, 90, 0, 100));
    setCleanliness(readSavedNumber(saved.cleanliness, 85, 0, 100));
    setLevel(savedLevel);
    setExp(readSavedNumber(saved.exp, 0, 0, 999999));
    setStatus(savedStatus);
    setSkin(savedSkin);
    setHat(savedHat);
    setAccessory(savedAccessory);
    setIsMuted(savedMuted);
    setPetName(savedName);
    setTempName(savedName);
    setCarePace(savedPace);
    setBackgroundColor(savedBackground);
    synth.muted = savedMuted;
    return true;
  }, []);

  const createSavedProgress = useCallback(
    (): SavedProgress => ({
      version: 1,
      hunger,
      happiness,
      energy,
      cleanliness,
      level,
      exp,
      status:
        status === "EATING" || status === "PLAYING" || status === "CLEANING"
          ? "IDLE"
          : status,
      skin,
      hat,
      accessory,
      isMuted,
      petName,
      carePace,
      backgroundColor,
    }),
    [
      accessory,
      backgroundColor,
      carePace,
      cleanliness,
      energy,
      exp,
      happiness,
      hat,
      hunger,
      isMuted,
      level,
      petName,
      skin,
      status,
    ],
  );

  const exportSave = useCallback(() => {
    const saveBlob = new Blob(
      [JSON.stringify(createSavedProgress(), null, 2)],
      { type: "application/json" },
    );
    const saveUrl = URL.createObjectURL(saveBlob);
    const downloadLink = document.createElement("a");
    downloadLink.href = saveUrl;
    downloadLink.download = "style-pet-save.json";
    downloadLink.click();
    URL.revokeObjectURL(saveUrl);
    setCurrentMenu("NONE");
    showMessage("SAVE EXPORTED");
  }, [createSavedProgress, showMessage]);

  const handleImportSave = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      event.target.value = "";
      if (!file) return;

      try {
        const saved = JSON.parse(await file.text()) as Partial<SavedProgress>;
        if (!restoreProgress(saved))
          throw new Error("Unsupported save version");
        setHasLoadedSave(true);
        setCurrentMenu("NONE");
        showMessage("SAVE LOADED");
      } catch (error) {
        console.warn("Could not load selected Style Pet save:", error);
        setCurrentMenu("NONE");
        showMessage("INVALID SAVE");
      }
    },
    [restoreProgress, showMessage],
  );

  const adjustSetting = (direction: number) => {
    if (selectedSettingIndex === 0) {
      toggleMute();
      return;
    }

    if (selectedSettingIndex === 1) {
      synth.playSelect();
      const paceIndex = CARE_PACES.indexOf(carePace);
      const nextPace =
        CARE_PACES[
          (paceIndex + direction + CARE_PACES.length) % CARE_PACES.length
        ];
      setCarePace(nextPace);
      return;
    }

    if (selectedSettingIndex === 2) {
      synth.playSelect();
      const backgroundIndex = BACKGROUND_OPTIONS.indexOf(backgroundColor);
      const nextBackground =
        BACKGROUND_OPTIONS[
          (backgroundIndex + direction + BACKGROUND_OPTIONS.length) %
            BACKGROUND_OPTIONS.length
        ];
      setBackgroundColor(nextBackground);
      return;
    }

    synth.playSelect();
    if (selectedSettingIndex === 3) exportSave();
    if (selectedSettingIndex === 4) saveFileInputRef.current?.click();
  };

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      try {
        const rawProgress = window.localStorage.getItem(SAVED_PROGRESS_KEY);
        if (!rawProgress) {
          setHasLoadedSave(true);
          return;
        }

        const saved = JSON.parse(rawProgress) as Partial<SavedProgress>;
        if (!restoreProgress(saved)) {
          setHasLoadedSave(true);
          return;
        }
        setHasLoadedSave(true);
        showMessage("PROGRESS LOADED");
      } catch (error) {
        console.warn("Could not restore Style Pet progress:", error);
        setHasLoadedSave(true);
      }
    });

    return () => cancelAnimationFrame(frame);
  }, [restoreProgress, showMessage]);

  useEffect(() => {
    if (!hasLoadedSave) return;

    const timeout = setTimeout(() => {
      try {
        window.localStorage.setItem(
          SAVED_PROGRESS_KEY,
          JSON.stringify(createSavedProgress()),
        );
      } catch (error) {
        console.warn("Could not save Style Pet progress:", error);
      }
    }, 250);

    return () => clearTimeout(timeout);
  }, [createSavedProgress, hasLoadedSave]);

  useEffect(() => {
    if (!screenMessage) return;
    const timeout = setTimeout(() => setScreenMessage(null), 2200);
    return () => clearTimeout(timeout);
  }, [screenMessage]);

  useEffect(() => {
    const needed = level * 100;
    if (exp < needed) return;

    const frame = requestAnimationFrame(() => {
      const nextLevel = level + 1;
      const reward = LEVEL_REWARDS[nextLevel];

      setExp((previous) => Math.max(0, previous - needed));
      setLevel(nextLevel);
      setHunger((previous) => Math.min(100, previous + 15));
      setHappiness((previous) => Math.min(100, previous + 15));
      setEnergy((previous) => Math.min(100, previous + 15));
      setCleanliness((previous) => Math.min(100, previous + 15));
      showMessage(
        reward
          ? `LEVEL ${nextLevel} | ${reward}`
          : `LEVEL ${nextLevel} | NEEDS BOOSTED`,
      );
      synth.playLevelUp();
    });

    return () => cancelAnimationFrame(frame);
  }, [exp, level, showMessage]);

  // --- Actions ---
  const handleFeed = () => {
    if (status === "DEAD" || status === "SLEEPING") return;
    if (hunger >= 95) {
      showMessage("NOT HUNGRY");
      return;
    }
    synth.playFeed();
    setStatus("EATING");
    setHunger((h) => Math.min(100, h + 25));
    setCleanliness((c) => Math.max(0, c - 10));
    awardCare(15, hunger);
    setTimeout(() => setStatus("IDLE"), 2200);
  };

  const handlePlay = () => {
    if (status === "DEAD" || status === "SLEEPING") return;
    if (happiness >= 95) {
      showMessage("FEELS LOVED");
      return;
    }
    synth.playPet();
    setStatus("PLAYING");
    setHappiness((h) => Math.min(100, h + 25));
    setEnergy((e) => Math.max(0, e - 15));
    awardCare(20, happiness);
    setTimeout(() => setStatus("IDLE"), 2200);
  };

  const handleClean = () => {
    if (status === "DEAD" || status === "SLEEPING") return;
    if (cleanliness >= 98) {
      showMessage("ALREADY CLEAN");
      return;
    }
    synth.beep(650, "triangle", 0.1);
    setTimeout(() => synth.beep(750, "triangle", 0.1), 80);
    setStatus("CLEANING");
    setCleanliness(100);
    setHappiness((h) => Math.min(100, h + 5));
    awardCare(10, cleanliness);
    setTimeout(() => setStatus("IDLE"), 1300);
  };

  const toggleSleep = () => {
    if (status === "DEAD") return;
    if (status === "SLEEPING") {
      synth.playSelect();
      setStatus("IDLE");
      setSleepBubbles([]);
    } else {
      if (energy >= 98) {
        showMessage("ENERGY FULL");
        return;
      }
      synth.playSleep();
      setStatus("SLEEPING");
      setCurrentMenu("NONE");
      awardCare(12, energy);
    }
  };

  const handleReset = () => {
    synth.playLevelUp();
    setHunger(75);
    setHappiness(80);
    setEnergy(90);
    setCleanliness(85);
    setLevel(1);
    setExp(0);
    setStatus("IDLE");
    setSleepBubbles([]);
    setSkin("cyber-cyan");
    setHat("NONE");
    setAccessory("NONE");
    setCurrentMenu("NONE");
    showMessage("NEW PET READY");
  };

  // --- Real-time Loop (Stat decays) ---
  useEffect(() => {
    if (status === "DEAD") return;
    const interval = setInterval(() => {
      if (status === "SLEEPING") {
        setEnergy((e) => Math.min(100, e + 6));
        setHunger((h) => Math.max(0, h - 1));
      } else {
        setHunger((h) => {
          const next = Math.max(0, h - 3);
          if (next === 0) setHappiness((hap) => Math.max(0, hap - 5));
          return next;
        });
        setHappiness((h) => Math.max(0, h - 2));
        setEnergy((e) => Math.max(0, e - 1.5));
        setCleanliness((c) => Math.max(0, c - 2));
      }
    }, CARE_PACE_INTERVALS[carePace]);

    return () => clearInterval(interval);
  }, [carePace, status]);

  // Handle death condition
  useEffect(() => {
    if (hunger === 0 && happiness === 0 && energy === 0 && status !== "DEAD") {
      const frame = requestAnimationFrame(() => {
        setStatus("DEAD");
        setSleepBubbles([]);
        synth.playDead();
      });
      return () => cancelAnimationFrame(frame);
    }
  }, [hunger, happiness, energy, status]);

  // Zzz Animation Loop
  useEffect(() => {
    if (status !== "SLEEPING") return;
    const interval = setInterval(() => {
      setSleepBubbles((prev) => [
        ...prev.slice(-3),
        { id: Date.now(), x: Math.random() * 40 - 20, y: 0 },
      ]);
    }, 1500);
    return () => clearInterval(interval);
  }, [status]);

  // Customization rotation helpers
  const cycleSkin = (dir = 1) => {
    synth.playSelect();
    const keys = SKIN_OPTIONS.filter(
      (option) => SKIN_UNLOCK_LEVELS[option] <= level,
    );
    const next = keys[(keys.indexOf(skin) + dir + keys.length) % keys.length];
    setSkin(next);
  };

  const cycleHat = (dir = 1) => {
    synth.playSelect();
    const hats = HAT_OPTIONS.filter(
      (option) => HAT_UNLOCK_LEVELS[option] <= level,
    );
    const next = hats[(hats.indexOf(hat) + dir + hats.length) % hats.length];
    setHat(next);
  };

  const cycleAccessory = (dir = 1) => {
    synth.playSelect();
    const accs = ACCESSORY_OPTIONS.filter(
      (option) => ACCESSORY_UNLOCK_LEVELS[option] <= level,
    );
    const next =
      accs[(accs.indexOf(accessory) + dir + accs.length) % accs.length];
    setAccessory(next);
  };

  const handleActionButton = () => {
    if (currentMenu === "SETTINGS") {
      adjustSetting(1);
      return;
    }

    if (currentMenu === "STYLE") {
      if (selectedStyleIndex === 0) cycleSkin(1);
      else if (selectedStyleIndex === 1) cycleHat(1);
      else cycleAccessory(1);
      return;
    }

    if (status === "DEAD") handleReset();
    else handleFeed();
  };

  const handleCancelButton = () => {
    if (currentMenu !== "NONE") {
      synth.playSelect();
      setCurrentMenu("NONE");
      return;
    }

    handlePlay();
  };

  // Render customizable pet vector shapes (Clean crisp pixel art styling)
  const colors = SKIN_COLORS[skin];
  const statItems = [
    { label: "FOOD", value: hunger },
    { label: "JOY", value: happiness },
    { label: "ENERGY", value: energy },
    { label: "CLEAN", value: cleanliness },
  ];

  return (
    <div
      className="relative flex min-h-dvh select-none flex-col items-center justify-center overflow-hidden p-4 font-mono text-zinc-300 transition-colors duration-300 sm:p-6"
      style={{ backgroundColor: BACKGROUND_COLORS[backgroundColor] }}
    >
      <input
        ref={saveFileInputRef}
        type="file"
        accept=".json,application/json"
        onChange={handleImportSave}
        className="hidden"
        tabIndex={-1}
        aria-hidden="true"
      />
      {/* Main Console Container */}
      <div className="relative z-10 flex w-full flex-col items-center">
        {/* Device Outer Frame */}
        <div className="relative flex w-[min(100%,420px)] flex-col items-center rounded-[50px] border-4 border-[#8f928d] bg-[#c8cac5] p-6 pb-16 pt-16 shadow-[0_30px_70px_rgba(8,24,31,0.5),inset_0_4px_8px_rgba(255,255,255,0.75),inset_0_-8px_14px_rgba(85,90,88,0.28)] animate-fade-in sm:p-8 sm:pb-18 sm:pt-16 md:w-125">
          {/* Handheld LCD Screen Area */}
          <div
            className="relative aspect-11/10 w-full overflow-hidden rounded-2xl border-solid border-[#676b69] bg-[#87977a] p-4 text-zinc-900 shadow-[inset_0_4px_12px_rgba(0,0,0,0.32),0_2px_4px_rgba(255,255,255,0.3)] flex flex-col"
            style={{ borderWidth: "18px 26px" }}
          >
            {/* CRT Screen scanline layer */}
            <div
              className="absolute inset-0 pointer-events-none z-30 opacity-[0.08]"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(0deg, transparent, transparent 2px, #000 2px, #000 4px)",
              }}
            />
            {/* Glare reflection layer */}
            <div
              className="absolute inset-0 pointer-events-none z-30"
              style={{
                background:
                  "linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0) 50%, rgba(0,0,0,0.04) 100%)",
              }}
            />

            {/* LCD Screen UI */}
            {/* Header info */}
            <div className="flex justify-between items-center text-[10px] font-bold border-b border-zinc-800/20 pb-1.5 z-10">
              <div className="flex items-center gap-1">
                <Award size={10} />
                <span>LEVEL {level}</span>
              </div>
              <div className="relative">
                {isEditingName ? (
                  <input
                    type="text"
                    value={tempName}
                    onChange={(e) =>
                      setTempName(e.target.value.toUpperCase().slice(0, 10))
                    }
                    onBlur={() => {
                      setPetName(tempName || "BABY");
                      setIsEditingName(false);
                      synth.playSelect();
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        setPetName(tempName || "BABY");
                        setIsEditingName(false);
                        synth.playSelect();
                      }
                    }}
                    className="bg-zinc-800/10 text-center w-24 focus:outline-none border-b border-zinc-800 font-bold text-[10px]"
                    autoFocus
                  />
                ) : (
                  <span
                    onClick={() => {
                      setTempName(petName);
                      setIsEditingName(true);
                    }}
                    className="cursor-pointer border-b border-dotted border-zinc-800/40 hover:border-zinc-800 tracking-wider"
                  >
                    {petName}
                  </span>
                )}
              </div>
              <div className="text-[9px] tabular-nums font-medium tracking-tight">
                XP {Math.floor(exp)}/{level * 100}
              </div>
            </div>

            {/* Dynamic Zzz particles for sleeping */}
            {status === "SLEEPING" && !reduceMotion && (
              <div className="absolute inset-0 overflow-hidden pointer-events-none z-20">
                <AnimatePresence>
                  {sleepBubbles.map((bubble) => (
                    <motion.div
                      key={bubble.id}
                      initial={{
                        opacity: 0,
                        scale: 0.6,
                        y: 150,
                        x: 120 + bubble.x,
                      }}
                      animate={{
                        opacity: 1,
                        scale: 1.1,
                        y: 50,
                        x: 130 + bubble.x * 1.5,
                      }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ duration: 3.5, ease: "easeOut" }}
                      className="absolute font-bold text-base text-zinc-900/70"
                    >
                      Z
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}

            {/* Screen Inner Grid overlay for pixel texture */}
            <div
              className="absolute inset-0 opacity-[0.06] pointer-events-none z-0"
              style={{
                backgroundImage: `
                  linear-gradient(to right, #000 1px, transparent 1px),
                  linear-gradient(to bottom, #000 1px, transparent 1px)
                `,
                backgroundSize: "2px 2px",
              }}
            />

            {/* Main Visual Display */}
            <div className="relative z-10 flex flex-1 flex-col items-center justify-center pb-7">
              <motion.div
                animate={
                  reduceMotion
                    ? { y: 0, scaleY: 1, rotate: 0 }
                    : status === "DEAD"
                      ? { y: [0, 4, 0], rotate: [0, -10, -10] }
                      : status === "SLEEPING"
                        ? { y: [0, 2, 0], scaleY: [1, 0.95, 1], rotate: 0 }
                        : status === "EATING"
                          ? {
                              scaleY: [1, 0.9, 1.1, 1],
                              y: [0, 4, -4, 0],
                              rotate: 0,
                            }
                          : status === "PLAYING"
                            ? {
                                y: [0, -35, 0],
                                rotate: [0, 15, -15, 0],
                                scaleY: [0.85, 1.1, 0.9, 1],
                              }
                            : status === "CLEANING"
                              ? {
                                  y: [0, -3, 1, -2, 0],
                                  rotate: [0, -5, 5, -3, 0],
                                  scaleY: [1, 0.95, 1.04, 0.98, 1],
                                }
                              : {
                                  y: [0, -3, 0],
                                  scaleY: [1, 0.97, 1],
                                  rotate: 0,
                                }
                }
                transition={
                  reduceMotion
                    ? { duration: 0 }
                    : status === "SLEEPING"
                      ? {
                          y: {
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut",
                          },
                          scaleY: {
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut",
                          },
                          rotate: { duration: 0.3 },
                        }
                      : status === "IDLE"
                        ? {
                            y: {
                              duration: 1.5,
                              repeat: Infinity,
                              ease: "easeInOut",
                            },
                            scaleY: {
                              duration: 1.5,
                              repeat: Infinity,
                              ease: "easeInOut",
                            },
                            rotate: { duration: 0.3 },
                          }
                        : { duration: 0.5, repeat: 4, ease: "easeInOut" }
                }
                className="relative flex h-40 w-40 items-center justify-center sm:h-44 sm:w-44"
              >
                {status === "CLEANING" && !reduceMotion && (
                  <div
                    className="pointer-events-none absolute inset-0 z-20"
                    aria-hidden="true"
                  >
                    {[
                      { left: "17%", top: "26%", delay: 0 },
                      { left: "74%", top: "36%", delay: 0.14 },
                      { left: "24%", top: "67%", delay: 0.28 },
                      { left: "70%", top: "70%", delay: 0.4 },
                    ].map((bubble, index) => (
                      <motion.span
                        key={index}
                        className="absolute h-3 w-3 rounded-full border-2 border-zinc-100/80 bg-white/30"
                        style={{ left: bubble.left, top: bubble.top }}
                        initial={{ opacity: 0, scale: 0.4, y: 4 }}
                        animate={{
                          opacity: [0, 1, 0],
                          scale: [0.4, 1, 1.25],
                          y: [4, -8, -16],
                        }}
                        transition={{
                          duration: 0.75,
                          delay: bubble.delay,
                          repeat: 1,
                          ease: "easeOut",
                        }}
                      />
                    ))}
                  </div>
                )}
                {/* SVG Character Model with pixel-perfect shapes */}
                <svg
                  viewBox="0 0 32 32"
                  className="w-full h-full drop-shadow-[0_4px_4px_rgba(0,0,0,0.15)]"
                  style={{ shapeRendering: "crispEdges" }}
                >
                  {/* Accessory: Halo (renders behind/above) */}
                  {accessory === "HALO" && status !== "DEAD" && (
                    <ellipse
                      cx="16"
                      cy="3"
                      rx="6"
                      ry="1.5"
                      fill="none"
                      stroke="#fef08a"
                      strokeWidth="1"
                    />
                  )}

                  {/* Accessories rendered behind the pet */}
                  {accessory === "WINGS" && (
                    <path
                      d="M 7 14 h -3 v 2 h -2 v 5 h 2 v 2 h 4 v -3 h 2 v -4 h -3 z M 25 14 h 3 v 2 h 2 v 5 h -2 v 2 h -4 v -3 h -2 v -4 h 3 z"
                      fill="#d8dde0"
                      stroke="#677277"
                      strokeWidth="0.7"
                    />
                  )}

                  {accessory === "HEADPHONES" && (
                    <>
                      <path
                        d="M 7 14 v -3 q 0 -7 9 -7 q 9 0 9 7 v 3"
                        fill="none"
                        stroke="#263238"
                        strokeWidth="2"
                      />
                      <rect x="5" y="12" width="4" height="7" fill="#47545a" />
                      <rect x="23" y="12" width="4" height="7" fill="#47545a" />
                    </>
                  )}

                  {/* Ear back details */}
                  <rect x="5" y="6" width="4" height="4" fill={colors.dark} />
                  <rect x="23" y="6" width="4" height="4" fill={colors.dark} />

                  {/* Main Slime/Cat Body */}
                  <path
                    d="
                      M 8 9 h 16 v 2 h 2 v 14 h -2 v 2 h -16 v -2 h -2 v -14 h 2 z
                      M 6 10 h 2 v 2 h -2 z
                      M 24 10 h 2 v 2 h -2 z
                    "
                    fill={colors.base}
                  />

                  {/* Inner lighter belly */}
                  <path
                    d="
                      M 11 15 h 10 v 1 h 2 v 8 h -2 v 1 h -10 v -1 h -2 v -8 h 2 z
                    "
                    fill={colors.light}
                    opacity="0.75"
                  />

                  {/* EYES rendering */}
                  {status === "DEAD" ? (
                    // Dead eyes (X X)
                    <>
                      <path
                        d="M 9 12 l 2 2 M 11 12 l -2 2"
                        stroke="#0f172a"
                        strokeWidth="1.5"
                      />
                      <path
                        d="M 21 12 l 2 2 M 23 12 l -2 2"
                        stroke="#0f172a"
                        strokeWidth="1.5"
                      />
                    </>
                  ) : status === "SLEEPING" ? (
                    // Sleeping eyes (- -)
                    <>
                      <rect x="9" y="13" width="4" height="1" fill="#0f172a" />
                      <rect x="19" y="13" width="4" height="1" fill="#0f172a" />
                    </>
                  ) : status === "PLAYING" ? (
                    // Happy eyes (^ ^)
                    <>
                      <path
                        d="M 9 14 l 2 -2 l 2 2"
                        fill="none"
                        stroke="#0f172a"
                        strokeWidth="1.5"
                      />
                      <path
                        d="M 19 14 l 2 -2 l 2 2"
                        fill="none"
                        stroke="#0f172a"
                        strokeWidth="1.5"
                      />
                    </>
                  ) : (
                    // Regular blinkable eyes
                    <>
                      <rect x="9" y="11" width="3" height="4" fill="#0f172a" />
                      <rect x="20" y="11" width="3" height="4" fill="#0f172a" />
                      {/* Pupils */}
                      <rect x="9" y="11" width="1" height="2" fill="#fff" />
                      <rect x="20" y="11" width="1" height="2" fill="#fff" />
                    </>
                  )}

                  {/* MOUTH rendering */}
                  {status === "DEAD" ? (
                    // Sad curve
                    <path
                      d="M 14 20 q 2 -2 4 0"
                      fill="none"
                      stroke="#0f172a"
                      strokeWidth="1.5"
                    />
                  ) : status === "EATING" ? (
                    // Open eating mouth
                    <rect x="14" y="17" width="4" height="3" fill="#0f172a" />
                  ) : status === "PLAYING" ? (
                    // Big wide smile
                    <path d="M 13 17 h 6 v 2 h -6 z" fill="#0f172a" />
                  ) : (
                    // Tiny cat mouth
                    <path
                      d="M 14 17 q 1 1 2 0 q 1 1 2 0"
                      fill="none"
                      stroke="#0f172a"
                      strokeWidth="1.5"
                    />
                  )}

                  {/* Blush Cheeks */}
                  {status === "PLAYING" && (
                    <>
                      <rect
                        x="7"
                        y="15"
                        width="2"
                        height="1"
                        fill="#f43f5e"
                        opacity="0.6"
                      />
                      <rect
                        x="23"
                        y="15"
                        width="2"
                        height="1"
                        fill="#f43f5e"
                        opacity="0.6"
                      />
                    </>
                  )}

                  {/* Accessory: Shades */}
                  {accessory === "SHADES" && (
                    <path
                      d="M 7 11 h 18 v 3 h -3 v -1 h -4 v 1 h -4 v -1 h -4 v 1 h -3 z"
                      fill="#1e293b"
                    />
                  )}

                  {/* Accessory: Scarf */}
                  {accessory === "SCARF" && (
                    <path
                      d="M 9 21 h 14 v 3 h -5 v 5 h -3 v -5 h -6 z"
                      fill="#b84655"
                    />
                  )}

                  {/* Accessory: Bowtie */}
                  {accessory === "BOWTIE" && (
                    <path
                      d="M 13 22 h 6 l -1 2 h -4 z M 12 21 h 2 v 3 h -2 z M 18 21 h 2 v 3 h -2 z"
                      fill="#ec4899"
                    />
                  )}

                  {/* Accessory: Monocle */}
                  {accessory === "MONOCLE" && (
                    <>
                      <circle
                        cx="21.5"
                        cy="13"
                        r="3"
                        fill="none"
                        stroke="#554a2b"
                        strokeWidth="1"
                      />
                      <path
                        d="M 24 15 l 1 7"
                        fill="none"
                        stroke="#554a2b"
                        strokeWidth="0.8"
                      />
                    </>
                  )}

                  {/* Accessory: Mustache */}
                  {accessory === "MUSTACHE" && (
                    <path
                      d="M 16 18 q -2 -3 -6 0 q 2 3 6 1 q 4 2 6 -1 q -4 -3 -6 0 z"
                      fill="#3b2b25"
                    />
                  )}

                  {/* Accessory: Earrings */}
                  {accessory === "EARRINGS" && (
                    <>
                      <circle cx="7" cy="17" r="1.2" fill="#e8c75b" />
                      <circle cx="25" cy="17" r="1.2" fill="#e8c75b" />
                    </>
                  )}

                  {/* Hat: Cowboy */}
                  {hat === "COWBOY" && (
                    <path
                      d="M 7 8 h 18 v 2 h -18 z M 9 5 h 14 v 3 h -14 z M 12 2 h 8 v 3 h -8 z"
                      fill="#78350f"
                    />
                  )}

                  {/* Hat: Beanie */}
                  {hat === "BEANIE" && (
                    <path
                      d="M 8 7 h 16 v 3 h -16 z M 10 4 h 12 v 3 h -12 z M 15 2 h 3 v 2 h -3 z"
                      fill="#5d6b76"
                    />
                  )}

                  {/* Hat: Crown */}
                  {hat === "CROWN" && (
                    <path
                      d="M 9 8 h 14 v 2 h -14 z M 9 4 l 2 3 l 3 -3 l 2 3 l 3 -3 l 3 3 v 1 h -13 z"
                      fill="#fbbf24"
                    />
                  )}

                  {/* Hat: Party */}
                  {hat === "PARTY" && (
                    <>
                      <path d="M 10 8 l 6 -8 l 6 8 z" fill="#cc526d" />
                      <rect x="9" y="8" width="14" height="2" fill="#e6c45a" />
                      <circle cx="16" cy="1" r="1.2" fill="#e6c45a" />
                    </>
                  )}

                  {/* Hat: Wizard */}
                  {hat === "WIZARD" && (
                    <path
                      d="M 7 7 h 18 v 2 h -18 z M 9 5 h 14 v 2 h -14 z M 12 2 h 8 v 3 h -8 z"
                      fill="#4f46e5"
                    />
                  )}

                  {/* Hat: Flower */}
                  {hat === "FLOWER" && (
                    <>
                      <circle cx="20" cy="6" r="2" fill="#d76a89" />
                      <circle cx="24" cy="6" r="2" fill="#d76a89" />
                      <circle cx="22" cy="4" r="2" fill="#d76a89" />
                      <circle cx="22" cy="8" r="2" fill="#d76a89" />
                      <circle cx="22" cy="6" r="1.4" fill="#e7c45f" />
                    </>
                  )}

                  {/* Hat: Bow */}
                  {hat === "BOW" && (
                    <path
                      d="M 15 6 h 2 v 2 h -2 z M 11 5 h 4 v 4 h -4 z M 17 5 h 4 v 4 h -4 z"
                      fill="#ec4899"
                    />
                  )}

                  {/* Hat: Top hat */}
                  {hat === "TOPHAT" && (
                    <path
                      d="M 7 8 h 18 v 2 h -18 z M 11 1 h 10 v 7 h -10 z M 11 6 h 10 v 2 h -10 z"
                      fill="#293136"
                    />
                  )}

                  {/* Hat: Chef */}
                  {hat === "CHEF" && (
                    <path
                      d="M 9 8 h 14 v 2 h -14 z M 10 4 h 12 v 4 h -12 z M 10 4 q 0 -4 4 -3 q 2 -2 4 0 q 4 -1 4 3 z"
                      fill="#e8e9e2"
                      stroke="#78807d"
                      strokeWidth="0.5"
                    />
                  )}

                  {/* Hat: Pirate */}
                  {hat === "PIRATE" && (
                    <>
                      <path
                        d="M 7 8 h 18 v 2 h -18 z M 9 5 q 7 -5 14 0 v 3 h -14 z"
                        fill="#30373a"
                      />
                      <path d="M 14 4 h 4 v 1 h -4 z" fill="#d5d8d2" />
                    </>
                  )}

                  {/* Hat: Space helmet */}
                  {hat === "SPACE" && (
                    <>
                      <path
                        d="M 8 9 v -2 q 0 -7 8 -7 q 8 0 8 7 v 2"
                        fill="#9aa7ad"
                        stroke="#536168"
                        strokeWidth="1"
                      />
                      <path d="M 10 6 h 12 v 3 h -12 z" fill="#52788a" />
                    </>
                  )}
                </svg>
              </motion.div>
            </div>

            {/* Custom interactive dashboard overlays inside screen */}
            {currentMenu === "STYLE" && (
              <div className="absolute inset-x-2 bottom-9.5 z-30 flex flex-col gap-1 rounded-lg border border-zinc-800 bg-zinc-900/95 p-2.5 text-[9px] text-zinc-300">
                <div className="mb-1.5 border-b border-zinc-800/60 px-1 pb-0.5 text-center font-bold uppercase tracking-wider text-zinc-400">
                  <span>STYLE CUSTOMIZER</span>
                </div>

                {/* Skin item */}
                <div
                  className={`flex justify-between items-center px-1.5 py-0.5 rounded transition-all ${selectedStyleIndex === 0 ? "bg-zinc-800/40 text-cyan-400 font-bold" : "opacity-80"}`}
                >
                  <span className="flex items-center gap-1">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${selectedStyleIndex === 0 ? "bg-cyan-400 animate-pulse" : "bg-transparent"}`}
                    />
                    <span>PET COLOR</span>
                  </span>
                  <span>{SKIN_LABELS[skin]}</span>
                </div>

                {/* Hat item */}
                <div
                  className={`flex justify-between items-center px-1.5 py-0.5 rounded transition-all ${selectedStyleIndex === 1 ? "bg-zinc-800/40 text-cyan-400 font-bold" : "opacity-80"}`}
                >
                  <span className="flex items-center gap-1">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${selectedStyleIndex === 1 ? "bg-cyan-400 animate-pulse" : "bg-transparent"}`}
                    />
                    <span>HAT STYLE</span>
                  </span>
                  <span>{hat}</span>
                </div>

                {/* Accessory item */}
                <div
                  className={`flex justify-between items-center px-1.5 py-0.5 rounded transition-all ${selectedStyleIndex === 2 ? "bg-zinc-800/40 text-cyan-400 font-bold" : "opacity-80"}`}
                >
                  <span className="flex items-center gap-1">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${selectedStyleIndex === 2 ? "bg-cyan-400 animate-pulse" : "bg-transparent"}`}
                    />
                    <span>ACCESSORY</span>
                  </span>
                  <span>{accessory}</span>
                </div>

                <div className="mt-1 border-t border-zinc-800/60 px-1 pt-1 text-center text-[8px] text-zinc-500">
                  {LEVEL_REWARDS[level + 1]
                    ? `NEXT L${level + 1}: ${LEVEL_REWARDS[level + 1]}`
                    : "ALL GEAR UNLOCKED"}
                </div>
              </div>
            )}

            {currentMenu === "SETTINGS" && (
              <div className="absolute inset-x-2 bottom-9.5 z-30 flex flex-col gap-0.5 rounded-lg border border-zinc-800 bg-zinc-900/95 p-2 text-[9px] text-zinc-300">
                <div className="mb-0.5 border-b border-zinc-800/60 px-1 pb-1 font-bold uppercase tracking-wider text-zinc-400">
                  <span>SETTINGS</span>
                </div>
                <div
                  className={`flex items-center justify-between rounded px-2 py-0.5 ${selectedSettingIndex === 0 ? "bg-zinc-700/70 font-bold text-[#b8c8a9]" : "text-zinc-400"}`}
                >
                  <span>SOUND</span>
                  <span>{isMuted ? "OFF" : "ON"}</span>
                </div>
                <div
                  className={`flex items-center justify-between rounded px-2 py-0.5 ${selectedSettingIndex === 1 ? "bg-zinc-700/70 font-bold text-[#b8c8a9]" : "text-zinc-400"}`}
                >
                  <span>CARE PACE</span>
                  <span>{carePace}</span>
                </div>
                <div
                  className={`flex items-center justify-between rounded px-2 py-0.5 ${selectedSettingIndex === 2 ? "bg-zinc-700/70 font-bold text-[#b8c8a9]" : "text-zinc-400"}`}
                >
                  <span>BACKGROUND</span>
                  <span>{backgroundColor}</span>
                </div>
                <div
                  className={`flex items-center justify-between rounded px-2 py-0.5 ${selectedSettingIndex === 3 ? "bg-zinc-700/70 font-bold text-[#b8c8a9]" : "text-zinc-400"}`}
                >
                  <span>EXPORT SAVE</span>
                  <span>RUN</span>
                </div>
                <div
                  className={`flex items-center justify-between rounded px-2 py-0.5 ${selectedSettingIndex === 4 ? "bg-zinc-700/70 font-bold text-[#b8c8a9]" : "text-zinc-400"}`}
                >
                  <span>LOAD SAVE</span>
                  <span>RUN</span>
                </div>
              </div>
            )}

            <AnimatePresence mode="wait">
              {screenMessage && currentMenu === "NONE" && (
                <motion.div
                  key={screenMessage.id}
                  initial={reduceMotion ? false : { opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduceMotion ? undefined : { opacity: 0, y: -4 }}
                  className="pointer-events-none absolute inset-x-4 bottom-10 z-20 text-center text-[8px] font-black tracking-wide text-zinc-900 drop-shadow-[0_1px_0_rgba(255,255,255,0.2)]"
                >
                  {screenMessage.text}
                </motion.div>
              )}
            </AnimatePresence>

            {/* All four needs remain visible at the bottom of the LCD. */}
            <div
              className="absolute inset-x-2 bottom-2 z-20 grid grid-cols-4 gap-2"
              aria-label="Pet needs"
              role="group"
            >
              {statItems.map((item) => {
                const roundedValue = Math.round(item.value);

                return (
                  <div
                    key={item.label}
                    className="min-w-0 text-zinc-900"
                    aria-label={item.label}
                    aria-valuemax={100}
                    aria-valuemin={0}
                    aria-valuenow={roundedValue}
                    role="meter"
                  >
                    <div className="flex items-baseline justify-between gap-0.5">
                      <span className="truncate text-[7px] font-black">
                        {item.label}
                      </span>
                      <span className="text-[8px] font-black tabular-nums">
                        {roundedValue}
                      </span>
                    </div>
                    <div className="mt-0.5 grid grid-cols-5 gap-px">
                      {Array.from({ length: 5 }).map((_, index) => (
                        <span
                          key={index}
                          className={`h-1 ${roundedValue >= (index + 1) * 20 ? "bg-zinc-900" : "bg-zinc-900/20"}`}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Console Physical Buttons */}
          <div className="mt-16 flex w-full items-center justify-between px-2 max-[420px]:scale-[0.82]">
            {/* D-Pad Layout */}
            <div className="relative w-28 h-28 flex items-center justify-center shrink-0">
              {/* Center connector */}
              <div className="absolute h-8 w-8 rounded bg-[#303638]" />
              {/* Up Button */}
              <button
                onClick={() => {
                  if (currentMenu === "STYLE") {
                    synth.playSelect();
                    setSelectedStyleIndex((prev) => (prev - 1 + 3) % 3);
                  } else if (currentMenu === "SETTINGS") {
                    synth.playSelect();
                    setSelectedSettingIndex((previous) =>
                      previous === 0 ? 4 : previous - 1,
                    );
                  } else {
                    handleClean();
                  }
                }}
                aria-label={
                  currentMenu === "STYLE"
                    ? "Previous style category"
                    : currentMenu === "SETTINGS"
                      ? "Previous setting"
                      : "Clean pet"
                }
                className="absolute top-0 flex h-11 w-8 items-center justify-center rounded-t bg-[#303638] shadow-[inset_0_2px_0_rgba(255,255,255,0.13)] transition-colors hover:bg-[#282e30] active:translate-y-px active:shadow-none"
              >
                <div className="w-0 h-0 border-l-5 border-l-transparent border-r-5 border-r-transparent border-b-7 border-b-zinc-400" />
              </button>
              {/* Down Button */}
              <button
                onClick={() => {
                  if (currentMenu === "STYLE") {
                    synth.playSelect();
                    setSelectedStyleIndex((prev) => (prev + 1) % 3);
                  } else if (currentMenu === "SETTINGS") {
                    synth.playSelect();
                    setSelectedSettingIndex((previous) => (previous + 1) % 5);
                  } else {
                    toggleSleep();
                  }
                }}
                aria-label={
                  currentMenu === "STYLE"
                    ? "Next style category"
                    : currentMenu === "SETTINGS"
                      ? "Next setting"
                      : status === "SLEEPING"
                        ? "Wake pet"
                        : "Put pet to sleep"
                }
                className="absolute bottom-0 flex h-11 w-8 items-center justify-center rounded-b bg-[#303638] shadow-[inset_0_-2px_0_rgba(0,0,0,0.32)] transition-colors hover:bg-[#282e30] active:translate-y-px active:shadow-none"
              >
                <div className="w-0 h-0 border-l-5 border-l-transparent border-r-5 border-r-transparent border-t-7 border-t-zinc-400" />
              </button>
              {/* Left Button */}
              <button
                onClick={() => {
                  if (currentMenu === "SETTINGS") {
                    if (selectedSettingIndex <= 2) adjustSetting(-1);
                  } else if (currentMenu === "STYLE") {
                    if (selectedStyleIndex === 0) cycleSkin(-1);
                    else if (selectedStyleIndex === 1) cycleHat(-1);
                    else if (selectedStyleIndex === 2) cycleAccessory(-1);
                  } else {
                    cycleHat(-1);
                  }
                }}
                aria-label={
                  currentMenu === "STYLE"
                    ? "Previous style option"
                    : currentMenu === "SETTINGS"
                      ? "Previous setting value"
                      : "Previous hat"
                }
                className="absolute left-0 flex h-8 w-11 items-center justify-center rounded-l bg-[#303638] shadow-[inset_2px_0_0_rgba(255,255,255,0.13)] transition-colors hover:bg-[#282e30] active:translate-x-px active:shadow-none"
              >
                <div className="w-0 h-0 border-t-5 border-t-transparent border-b-5 border-b-transparent border-r-7 border-r-zinc-400" />
              </button>
              {/* Right Button */}
              <button
                onClick={() => {
                  if (currentMenu === "SETTINGS") {
                    if (selectedSettingIndex <= 2) adjustSetting(1);
                  } else if (currentMenu === "STYLE") {
                    if (selectedStyleIndex === 0) cycleSkin(1);
                    else if (selectedStyleIndex === 1) cycleHat(1);
                    else if (selectedStyleIndex === 2) cycleAccessory(1);
                  } else {
                    cycleAccessory(1);
                  }
                }}
                aria-label={
                  currentMenu === "STYLE"
                    ? "Next style option"
                    : currentMenu === "SETTINGS"
                      ? "Next setting value"
                      : "Next accessory"
                }
                className="absolute right-0 flex h-8 w-11 items-center justify-center rounded-r bg-[#303638] shadow-[inset_-2px_0_0_rgba(0,0,0,0.32)] transition-colors hover:bg-[#282e30] active:translate-x-px active:shadow-none"
              >
                <div className="w-0 h-0 border-t-5 border-t-transparent border-b-5 border-b-transparent border-l-7 border-l-zinc-400" />
              </button>
            </div>

            {/* Menu Labels */}
            <div className="flex min-w-25 flex-col items-center gap-1 text-center text-[9px] font-bold uppercase tracking-wider text-[#505556]">
              {currentMenu === "STYLE" ? (
                <>
                  <span className="animate-pulse text-[#7b2946]">
                    ▲▼ - SELECT
                  </span>
                  <span className="text-[#7b2946]">A / ◀▶ - CHANGE</span>
                  <span className="text-[#686d6d]">B - CLOSE</span>
                </>
              ) : currentMenu === "SETTINGS" ? (
                <>
                  <span className="text-[#7b2946]">▲▼ - SELECT</span>
                  <span className="text-[#7b2946]">A - CHANGE / RUN</span>
                  <span className="text-[#686d6d]">B - BACK</span>
                </>
              ) : status === "DEAD" ? (
                <>
                  <span className="text-[#7b2946]">A - REVIVE</span>
                  <span>START - SETTINGS</span>
                </>
              ) : (
                <>
                  <span>▲ - CLEAN</span>
                  <span>◀ - HATS</span>
                  <span>▶ - ACCESSORIES</span>
                  <span>▼ - {status === "SLEEPING" ? "WAKE" : "SLEEP"}</span>
                </>
              )}
            </div>

            {/* Tactile B and A action buttons */}
            <div className="flex gap-4 shrink-0 rotate-[-25deg] -translate-y-2 mr-2">
              <div className="flex flex-col items-center gap-1">
                <button
                  onClick={handleCancelButton}
                  disabled={
                    currentMenu === "NONE" &&
                    (status === "DEAD" || status === "SLEEPING")
                  }
                  aria-label={
                    currentMenu === "NONE" ? "Pet companion" : "Close menu"
                  }
                  className="flex h-12 w-12 items-center justify-center rounded-full bg-[#93425f] text-sm font-bold text-[#f5e8ed] shadow-[0_4px_0_#65263e,inset_0_2px_4px_rgba(255,255,255,0.24)] transition-all hover:bg-[#a44c6a] active:translate-y-1 active:shadow-none disabled:translate-y-0 disabled:opacity-40"
                >
                  B
                </button>
                <span className="text-[9px] font-bold tracking-wider text-[#505556]">
                  {currentMenu === "NONE" ? "PET" : "BACK"}
                </span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <button
                  onClick={handleActionButton}
                  disabled={currentMenu === "NONE" && status === "SLEEPING"}
                  aria-label={
                    currentMenu === "SETTINGS"
                      ? "Use selected setting"
                      : currentMenu === "STYLE"
                        ? "Change selected style"
                        : status === "DEAD"
                          ? "Revive pet"
                          : "Feed pet"
                  }
                  className="flex h-12 w-12 items-center justify-center rounded-full bg-[#93425f] text-sm font-bold text-[#f5e8ed] shadow-[0_4px_0_#65263e,inset_0_2px_4px_rgba(255,255,255,0.24)] transition-all hover:bg-[#a44c6a] active:translate-y-1 active:shadow-none disabled:translate-y-0 disabled:opacity-40"
                >
                  A
                </button>
                <span className="text-[9px] font-bold tracking-wider text-[#505556]">
                  {currentMenu === "NONE"
                    ? status === "DEAD"
                      ? "REVIVE"
                      : "FEED"
                    : "ACTION"}
                </span>
              </div>
            </div>
          </div>

          {/* Lower hardware row */}
          <div className="relative mt-10 flex min-h-14 w-full items-center px-4">
            {/* Select and Start controls */}
            <div className="absolute left-1/2 top-0 flex -translate-x-1/2 -rotate-12 gap-3">
              <div className="flex flex-col items-center gap-1.5">
                <button
                  onClick={() => {
                    synth.playSelect();
                    setCurrentMenu((prev) =>
                      prev === "STYLE" ? "NONE" : "STYLE",
                    );
                  }}
                  aria-label="Select style menu"
                  className="h-4 w-12 rounded-full border border-[#454b4d] bg-[#565c5f] shadow-[0_2px_0_#3d4345,inset_0_1px_0_rgba(255,255,255,0.16)] transition-all hover:bg-[#4d5356] active:translate-y-0.5 active:shadow-none"
                />
                <span className="text-[8px] font-bold tracking-wider text-[#505556]">
                  SELECT
                </span>
              </div>
              <div className="flex flex-col items-center gap-1.5">
                <button
                  onClick={() => {
                    synth.playSelect();
                    setCurrentMenu((previous) =>
                      previous === "SETTINGS" ? "NONE" : "SETTINGS",
                    );
                  }}
                  aria-label="Start settings menu"
                  className="h-4 w-12 rounded-full border border-[#454b4d] bg-[#565c5f] shadow-[0_2px_0_#3d4345,inset_0_1px_0_rgba(255,255,255,0.16)] transition-all hover:bg-[#4d5356] active:translate-y-0.5 active:shadow-none"
                />
                <span className="text-[8px] font-bold tracking-wider text-[#505556]">
                  START
                </span>
              </div>
            </div>

            {/* Game Boy-style angled speaker grille */}
            <div
              aria-hidden="true"
              className="ml-auto flex rotate-[-28deg] gap-2"
            >
              <div className="h-9 w-1.5 rounded-full bg-[#777d7a]/70" />
              <div className="h-9 w-1.5 rounded-full bg-[#777d7a]/70" />
              <div className="h-9 w-1.5 rounded-full bg-[#777d7a]/70" />
              <div className="h-9 w-1.5 rounded-full bg-[#777d7a]/70" />
              <div className="h-9 w-1.5 rounded-full bg-[#777d7a]/70" />
              <div className="h-9 w-1.5 rounded-full bg-[#777d7a]/70" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
