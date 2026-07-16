"use client";

import { useCallback, useEffect, useState, type RefObject } from "react";
import {
  ACCESSORY_OPTIONS,
  ACCESSORY_UNLOCK_LEVELS,
  BACKGROUND_OPTIONS,
  CARE_PACES,
  CARE_PACE_INTERVALS,
  HAT_OPTIONS,
  HAT_UNLOCK_LEVELS,
  LEVEL_REWARDS,
  SAVE_KEY,
  SKIN_OPTIONS,
  SKIN_UNLOCK_LEVELS,
} from "../data/options";
import { synth } from "../lib/audio";
import type {
  AccessoryStyle,
  BackgroundColor,
  CarePace,
  HatStyle,
  Menu,
  PetStatus,
  SavedProgress,
  ScreenMessage,
  SkinColor,
  SleepBubble,
} from "../types";
import { createSavedProgress, normalizeSavedProgress } from "../utils/progress";

export function usePet(saveFileInputRef: RefObject<HTMLInputElement | null>) {
  const [hunger, setHunger] = useState(70);
  const [happiness, setHappiness] = useState(80);
  const [energy, setEnergy] = useState(90);
  const [cleanliness, setCleanliness] = useState(85);
  const [level, setLevel] = useState(1);
  const [exp, setExp] = useState(0);
  const [status, setStatus] = useState<PetStatus>("IDLE");
  const [skin, setSkin] = useState<SkinColor>("cyber-cyan");
  const [hat, setHat] = useState<HatStyle>("NONE");
  const [accessory, setAccessory] = useState<AccessoryStyle>("NONE");
  const [isMuted, setIsMuted] = useState(false);
  const [petName, setPetName] = useState("CYBER-KITY");
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState("CYBER-KITY");
  const [hasLoadedSave, setHasLoadedSave] = useState(false);
  const [screenMessage, setScreenMessage] = useState<ScreenMessage | null>(
    null,
  );
  const [currentMenu, setCurrentMenu] = useState<Menu>("NONE");
  const [selectedStyleIndex, setSelectedStyleIndex] = useState(0);
  const [selectedSettingIndex, setSelectedSettingIndex] = useState(0);
  const [carePace, setCarePace] = useState<CarePace>("NORMAL");
  const [backgroundColor, setBackgroundColor] =
    useState<BackgroundColor>("BLUE");
  const [sleepBubbles, setSleepBubbles] = useState<SleepBubble[]>([]);

  const showMessage = useCallback((text: string) => {
    setScreenMessage((previous) => ({
      id: (previous?.id ?? 0) + 1,
      text,
    }));
  }, []);

  const awardCare = useCallback(
    (baseExp: number, currentNeed: number) => {
      const needBonus = Math.min(
        15,
        Math.floor(Math.max(0, 100 - currentNeed) / 20) * 3,
      );
      const earnedExp = baseExp + needBonus;

      setExp((previous) => previous + earnedExp);
      showMessage(
        needBonus > 0 ? `+${earnedExp} XP | NEED BONUS` : `+${earnedExp} XP`,
      );
    },
    [showMessage],
  );

  const restoreProgress = useCallback((saved: Partial<SavedProgress>) => {
    const progress = normalizeSavedProgress(saved);
    if (!progress) return false;

    setHunger(progress.hunger);
    setHappiness(progress.happiness);
    setEnergy(progress.energy);
    setCleanliness(progress.cleanliness);
    setLevel(progress.level);
    setExp(progress.exp);
    setStatus(progress.status);
    setSkin(progress.skin);
    setHat(progress.hat);
    setAccessory(progress.accessory);
    setIsMuted(progress.isMuted);
    setPetName(progress.petName);
    setTempName(progress.petName);
    setCarePace(progress.carePace);
    setBackgroundColor(progress.backgroundColor);
    synth.muted = progress.isMuted;
    return true;
  }, []);

  const createSnapshot = useCallback(
    () =>
      createSavedProgress({
        hunger,
        happiness,
        energy,
        cleanliness,
        level,
        exp,
        status,
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
    const saveBlob = new Blob([JSON.stringify(createSnapshot(), null, 2)], {
      type: "application/json",
    });
    const saveUrl = URL.createObjectURL(saveBlob);
    const downloadLink = document.createElement("a");
    downloadLink.href = saveUrl;
    downloadLink.download = "style-pet-save.json";
    downloadLink.click();
    URL.revokeObjectURL(saveUrl);
    setCurrentMenu("NONE");
    showMessage("SAVE EXPORTED");
  }, [createSnapshot, showMessage]);

  const handleImportSave = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      event.target.value = "";
      if (!file) return;

      try {
        const saved = JSON.parse(await file.text()) as Partial<SavedProgress>;
        if (!restoreProgress(saved)) {
          throw new Error("Unsupported save version");
        }
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

  const toggleMute = useCallback(() => {
    synth.muted = !isMuted;
    setIsMuted(!isMuted);
    synth.playSelect();
  }, [isMuted]);

  const adjustSetting = useCallback(
    (direction: number) => {
      if (selectedSettingIndex === 0) {
        toggleMute();
        return;
      }

      if (selectedSettingIndex === 1) {
        synth.playSelect();
        const index = CARE_PACES.indexOf(carePace);
        setCarePace(
          CARE_PACES[
            (index + direction + CARE_PACES.length) % CARE_PACES.length
          ],
        );
        return;
      }

      if (selectedSettingIndex === 2) {
        synth.playSelect();
        const index = BACKGROUND_OPTIONS.indexOf(backgroundColor);
        setBackgroundColor(
          BACKGROUND_OPTIONS[
            (index + direction + BACKGROUND_OPTIONS.length) %
              BACKGROUND_OPTIONS.length
          ],
        );
        return;
      }

      synth.playSelect();
      if (selectedSettingIndex === 3) exportSave();
      if (selectedSettingIndex === 4) saveFileInputRef.current?.click();
    },
    [
      backgroundColor,
      carePace,
      exportSave,
      saveFileInputRef,
      selectedSettingIndex,
      toggleMute,
    ],
  );

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      try {
        const rawProgress = window.localStorage.getItem(SAVE_KEY);
        if (rawProgress) {
          const saved = JSON.parse(rawProgress) as Partial<SavedProgress>;
          if (restoreProgress(saved)) showMessage("PROGRESS LOADED");
        }
      } catch (error) {
        console.warn("Could not restore Style Pet progress:", error);
      } finally {
        setHasLoadedSave(true);
      }
    });

    return () => cancelAnimationFrame(frame);
  }, [restoreProgress, showMessage]);

  useEffect(() => {
    if (!hasLoadedSave) return;
    const timeout = setTimeout(() => {
      try {
        window.localStorage.setItem(SAVE_KEY, JSON.stringify(createSnapshot()));
      } catch (error) {
        console.warn("Could not save Style Pet progress:", error);
      }
    }, 250);

    return () => clearTimeout(timeout);
  }, [createSnapshot, hasLoadedSave]);

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

  const handleFeed = useCallback(() => {
    if (status === "DEAD" || status === "SLEEPING") return;
    if (hunger >= 95) {
      showMessage("NOT HUNGRY");
      return;
    }
    synth.playFeed();
    setStatus("EATING");
    setHunger((value) => Math.min(100, value + 25));
    setCleanliness((value) => Math.max(0, value - 10));
    awardCare(15, hunger);
    setTimeout(() => setStatus("IDLE"), 2200);
  }, [awardCare, hunger, showMessage, status]);

  const handlePlay = useCallback(() => {
    if (status === "DEAD" || status === "SLEEPING") return;
    if (happiness >= 95) {
      showMessage("FEELS LOVED");
      return;
    }
    synth.playPet();
    setStatus("PLAYING");
    setHappiness((value) => Math.min(100, value + 25));
    setEnergy((value) => Math.max(0, value - 15));
    awardCare(20, happiness);
    setTimeout(() => setStatus("IDLE"), 2200);
  }, [awardCare, happiness, showMessage, status]);

  const handleClean = useCallback(() => {
    if (status === "DEAD" || status === "SLEEPING") return;
    if (cleanliness >= 98) {
      showMessage("ALREADY CLEAN");
      return;
    }
    synth.beep(650, "triangle", 0.1);
    setTimeout(() => synth.beep(750, "triangle", 0.1), 80);
    setStatus("CLEANING");
    setCleanliness(100);
    setHappiness((value) => Math.min(100, value + 5));
    awardCare(10, cleanliness);
    setTimeout(() => setStatus("IDLE"), 1300);
  }, [awardCare, cleanliness, showMessage, status]);

  const toggleSleep = useCallback(() => {
    if (status === "DEAD") return;
    if (status === "SLEEPING") {
      synth.playSelect();
      setStatus("IDLE");
      setSleepBubbles([]);
      return;
    }
    if (energy >= 98) {
      showMessage("ENERGY FULL");
      return;
    }
    synth.playSleep();
    setStatus("SLEEPING");
    setCurrentMenu("NONE");
    awardCare(12, energy);
  }, [awardCare, energy, showMessage, status]);

  const handleReset = useCallback(() => {
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
  }, [showMessage]);

  useEffect(() => {
    if (status === "DEAD") return;
    const interval = setInterval(() => {
      if (status === "SLEEPING") {
        setEnergy((value) => Math.min(100, value + 6));
        setHunger((value) => Math.max(0, value - 1));
      } else {
        setHunger((value) => {
          const next = Math.max(0, value - 3);
          if (next === 0) {
            setHappiness((happinessValue) => Math.max(0, happinessValue - 5));
          }
          return next;
        });
        setHappiness((value) => Math.max(0, value - 2));
        setEnergy((value) => Math.max(0, value - 1.5));
        setCleanliness((value) => Math.max(0, value - 2));
      }
    }, CARE_PACE_INTERVALS[carePace]);

    return () => clearInterval(interval);
  }, [carePace, status]);

  useEffect(() => {
    if (hunger === 0 && happiness === 0 && energy === 0 && status !== "DEAD") {
      const frame = requestAnimationFrame(() => {
        setStatus("DEAD");
        setSleepBubbles([]);
        synth.playDead();
      });
      return () => cancelAnimationFrame(frame);
    }
  }, [energy, happiness, hunger, status]);

  useEffect(() => {
    if (status !== "SLEEPING") return;
    const interval = setInterval(() => {
      setSleepBubbles((previous) => [
        ...previous.slice(-3),
        { id: Date.now(), x: Math.random() * 40 - 20, y: 0 },
      ]);
    }, 1500);
    return () => clearInterval(interval);
  }, [status]);

  const cycleSkin = useCallback(
    (direction = 1) => {
      synth.playSelect();
      const options = SKIN_OPTIONS.filter(
        (option) => SKIN_UNLOCK_LEVELS[option] <= level,
      );
      setSkin(
        options[
          (options.indexOf(skin) + direction + options.length) % options.length
        ],
      );
    },
    [level, skin],
  );

  const cycleHat = useCallback(
    (direction = 1) => {
      synth.playSelect();
      const options = HAT_OPTIONS.filter(
        (option) => HAT_UNLOCK_LEVELS[option] <= level,
      );
      setHat(
        options[
          (options.indexOf(hat) + direction + options.length) % options.length
        ],
      );
    },
    [hat, level],
  );

  const cycleAccessory = useCallback(
    (direction = 1) => {
      synth.playSelect();
      const options = ACCESSORY_OPTIONS.filter(
        (option) => ACCESSORY_UNLOCK_LEVELS[option] <= level,
      );
      setAccessory(
        options[
          (options.indexOf(accessory) + direction + options.length) %
            options.length
        ],
      );
    },
    [accessory, level],
  );

  const handleActionButton = useCallback(() => {
    if (currentMenu === "SETTINGS") return adjustSetting(1);
    if (currentMenu === "STYLE") {
      if (selectedStyleIndex === 0) cycleSkin(1);
      else if (selectedStyleIndex === 1) cycleHat(1);
      else cycleAccessory(1);
      return;
    }
    if (status === "DEAD") handleReset();
    else handleFeed();
  }, [
    adjustSetting,
    currentMenu,
    cycleAccessory,
    cycleHat,
    cycleSkin,
    handleFeed,
    handleReset,
    selectedStyleIndex,
    status,
  ]);

  const handleCancelButton = useCallback(() => {
    if (currentMenu !== "NONE") {
      synth.playSelect();
      setCurrentMenu("NONE");
      return;
    }
    handlePlay();
  }, [currentMenu, handlePlay]);

  const pressDirection = useCallback(
    (direction: "UP" | "DOWN" | "LEFT" | "RIGHT") => {
      if (direction === "UP") {
        if (currentMenu === "STYLE") {
          synth.playSelect();
          setSelectedStyleIndex((previous) => (previous + 2) % 3);
        } else if (currentMenu === "SETTINGS") {
          synth.playSelect();
          setSelectedSettingIndex((previous) =>
            previous === 0 ? 4 : previous - 1,
          );
        } else handleClean();
        return;
      }

      if (direction === "DOWN") {
        if (currentMenu === "STYLE") {
          synth.playSelect();
          setSelectedStyleIndex((previous) => (previous + 1) % 3);
        } else if (currentMenu === "SETTINGS") {
          synth.playSelect();
          setSelectedSettingIndex((previous) => (previous + 1) % 5);
        } else toggleSleep();
        return;
      }

      const amount = direction === "LEFT" ? -1 : 1;
      if (currentMenu === "SETTINGS") {
        if (selectedSettingIndex <= 2) adjustSetting(amount);
      } else if (currentMenu === "STYLE") {
        if (selectedStyleIndex === 0) cycleSkin(amount);
        else if (selectedStyleIndex === 1) cycleHat(amount);
        else cycleAccessory(amount);
      } else if (direction === "LEFT") cycleHat(-1);
      else cycleAccessory(1);
    },
    [
      adjustSetting,
      currentMenu,
      cycleAccessory,
      cycleHat,
      cycleSkin,
      handleClean,
      selectedSettingIndex,
      selectedStyleIndex,
      toggleSleep,
    ],
  );

  const toggleMenu = useCallback((menu: Exclude<Menu, "NONE">) => {
    synth.playSelect();
    setCurrentMenu((current) => (current === menu ? "NONE" : menu));
  }, []);

  const beginEditingName = useCallback(() => {
    setTempName(petName);
    setIsEditingName(true);
  }, [petName]);

  const updateTempName = useCallback((name: string) => {
    setTempName(name.toUpperCase().slice(0, 10));
  }, []);

  const commitPetName = useCallback(() => {
    setPetName(tempName || "BABY");
    setIsEditingName(false);
    synth.playSelect();
  }, [tempName]);

  return {
    hunger,
    happiness,
    energy,
    cleanliness,
    level,
    exp,
    status,
    skin,
    hat,
    accessory,
    isMuted,
    petName,
    isEditingName,
    tempName,
    screenMessage,
    currentMenu,
    selectedStyleIndex,
    selectedSettingIndex,
    carePace,
    backgroundColor,
    sleepBubbles,
    handleImportSave,
    handleActionButton,
    handleCancelButton,
    pressDirection,
    toggleMenu,
    beginEditingName,
    updateTempName,
    commitPetName,
  };
}

export type PetController = ReturnType<typeof usePet>;
