import { useEffect, useRef, useState } from "react";
import type {
  MouseEvent as ReactMouseEvent,
  TouchEvent as ReactTouchEvent,
} from "react";
import { EMOJI_CATEGORIES, THEMES } from "../constants";
import type {
  Atmosphere,
  GardenTool,
  Plant,
  Stroke,
  VisualRipple,
} from "../types";
import {
  createExportFileName,
  createRandomId,
  dataUrlToBlob,
  encodeGardenLayout,
  getActiveBackgroundColor,
  getEmojiScaleFactor,
  parseGardenLayout,
  randomUnit,
} from "../utils";
import { useGardenCanvas } from "./useGardenCanvas";
import { useGardenHistory } from "./useGardenHistory";
import { useTransientToast } from "./useTransientToast";
import { useZenAudio } from "./useZenAudio";

const DEFAULT_ATMOSPHERE: Atmosphere = "day";

export function useZenGarden() {
  const {
    plants,
    setPlants,
    strokes,
    setStrokes,
    ripples,
    setRipples,
    history,
    historyIndex,
    plantsRef,
    strokesRef,
    ripplesRef,
    saveToHistory,
    undo,
    redo,
  } = useGardenHistory();
  const { audioRef, soundEnabled, setSoundEnabled } = useZenAudio();
  const { toastMessage, showToast } = useTransientToast();

  const [visualRipples, setVisualRipples] = useState<VisualRipple[]>([]);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [previewFileName, setPreviewFileName] = useState("");
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [activeTab, setActiveTab] = useState("flora");
  const [selectedEmoji, setSelectedEmoji] = useState("🌱");
  const [randomMode, setRandomMode] = useState(false);
  const [activeTool, setActiveTool] = useState<GardenTool>("plant");
  const [selectedTheme, setSelectedTheme] = useState("shirakawa");
  const [emojiSize, setEmojiSize] = useState(1.2);
  const [rakeSize, setRakeSize] = useState(6);
  const [waterBrushSize, setWaterBrushSize] = useState(16);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importString, setImportString] = useState("");
  const [currentStroke, setCurrentStroke] = useState<Stroke | null>(null);
  const [draggingPlantId, setDraggingPlantId] = useState<string | null>(null);
  const [isShoveling, setIsShoveling] = useState(false);
  const rippleTimeoutsRef = useRef(new Set<ReturnType<typeof setTimeout>>());

  const atmosphere = DEFAULT_ATMOSPHERE;
  const activeTheme =
    THEMES.find((theme) => theme.id === selectedTheme) ?? THEMES[0];
  const { canvasRef, containerRef, drawCanvas } = useGardenCanvas({
    atmosphere,
    currentStroke,
    ripples,
    strokes,
    theme: activeTheme,
  });

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setIsTouchDevice(
        window.matchMedia("(pointer: coarse)").matches ||
          navigator.maxTouchPoints > 0,
      );
      setShareUrl(window.location.href);
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(
    () => () => {
      rippleTimeoutsRef.current.forEach(clearTimeout);
    },
    [],
  );

  const triggerVisualRipple = (x: number, y: number) => {
    const id = createRandomId();
    setVisualRipples((current) => [...current, { id, x, y }]);
    const timeout = setTimeout(() => {
      setVisualRipples((current) =>
        current.filter((ripple) => ripple.id !== id),
      );
      rippleTimeoutsRef.current.delete(timeout);
    }, 1000);
    rippleTimeoutsRef.current.add(timeout);
  };

  const triggerUndo = () => {
    if (!undo()) return;
    audioRef.current?.playPruneSound();
    showToast("Undone last action");
  };

  const triggerRedo = () => {
    if (!redo()) return;
    audioRef.current?.playPlantSound();
    showToast("Redone action");
  };

  const shovelEmojiAt = (x: number, y: number) => {
    let deletedAny = false;
    setPlants((current) => {
      const nextPlants = current.filter((plant) => {
        const dx = plant.x - x;
        const dy = plant.y - y;
        const isNear = Math.sqrt(dx * dx + dy * dy) < 0.055;
        if (isNear) deletedAny = true;
        return !isNear;
      });
      if (deletedAny) audioRef.current?.playPruneSound();
      return nextPlants;
    });
  };

  const plantEmojiAt = (x: number, y: number) => {
    let emoji = selectedEmoji;
    if (randomMode) {
      const category =
        EMOJI_CATEGORIES.find(({ id }) => id === activeTab) ??
        EMOJI_CATEGORIES[0];
      emoji =
        category.emojis[Math.floor(randomUnit() * category.emojis.length)];
    }

    const plant: Plant = {
      id: createRandomId(),
      x,
      y,
      type: emoji,
      rotation: Math.floor(randomUnit() * 32) - 16,
      scale:
        emojiSize * getEmojiScaleFactor(emoji) * (0.85 + randomUnit() * 0.3),
    };
    const nextPlants = [...plants, plant];
    setPlants(nextPlants);
    audioRef.current?.playPlantSound();
    audioRef.current?.playChime();
    triggerVisualRipple(x, y);
    saveToHistory(nextPlants, strokes, ripples);
  };

  const startStroke = (x: number, y: number) => {
    if (activeTool === "rake") {
      setCurrentStroke({
        points: [{ x, y }],
        brushSize: rakeSize,
        brushType: "standard",
      });
      audioRef.current?.playRakeSound();
    } else if (activeTool === "water") {
      setCurrentStroke({
        points: [{ x, y }],
        brushSize: waterBrushSize,
        brushType: "water",
      });
      audioRef.current?.playWaterSound();
      triggerVisualRipple(x, y);
    }
  };

  const handleContainerMouseDown = (event: ReactMouseEvent) => {
    if (draggingPlantId) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;

    if (activeTool === "plant") plantEmojiAt(x, y);
    else if (activeTool === "prune") {
      setIsShoveling(true);
      shovelEmojiAt(x, y);
    } else startStroke(x, y);
  };

  const finishInteraction = () => {
    if (draggingPlantId) {
      setDraggingPlantId(null);
      saveToHistory(plantsRef.current, strokesRef.current, ripplesRef.current);
      return;
    }
    if (isShoveling) {
      setIsShoveling(false);
      saveToHistory(plantsRef.current, strokesRef.current, ripplesRef.current);
      return;
    }
    if (!currentStroke) return;
    if (currentStroke.points.length > 1) {
      const nextStrokes = [...strokes, currentStroke];
      setStrokes(nextStrokes);
      saveToHistory(plants, nextStrokes, ripples);
    }
    setCurrentStroke(null);
  };

  const appendStrokePoint = (x: number, y: number) => {
    if (!currentStroke) return;
    const lastPoint = currentStroke.points[currentStroke.points.length - 1];
    const dx = x - lastPoint.x;
    const dy = y - lastPoint.y;
    if (Math.sqrt(dx * dx + dy * dy) <= 0.006) return;

    setCurrentStroke({
      ...currentStroke,
      points: [...currentStroke.points, { x, y }],
    });
    if (randomUnit() >= 0.22) return;
    if (currentStroke.brushType === "water") {
      audioRef.current?.playWaterSound();
      triggerVisualRipple(x, y);
    } else {
      audioRef.current?.playRakeSound();
    }
  };

  const handleContainerMouseMove = (event: ReactMouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = Math.max(
      0,
      Math.min(1, (event.clientX - rect.left) / rect.width),
    );
    const y = Math.max(
      0,
      Math.min(1, (event.clientY - rect.top) / rect.height),
    );

    if (draggingPlantId) {
      if (event.buttons !== 1) return finishInteraction();
      setPlants((current) =>
        current.map((plant) =>
          plant.id === draggingPlantId ? { ...plant, x, y } : plant,
        ),
      );
    } else if (isShoveling) {
      if (event.buttons !== 1) return finishInteraction();
      shovelEmojiAt(x, y);
    } else {
      if (currentStroke && event.buttons !== 1) return finishInteraction();
      appendStrokePoint(x, y);
    }
  };

  const handleTouchStart = (
    event: ReactTouchEvent | ReactMouseEvent,
    plantId?: string,
  ) => {
    if (plantId) {
      event.stopPropagation();
      if (activeTool === "prune") {
        setIsShoveling(true);
        const plant = plants.find(({ id }) => id === plantId);
        if (plant) shovelEmojiAt(plant.x, plant.y);
        return;
      }

      setDraggingPlantId(plantId);
      const rect = containerRef.current?.getBoundingClientRect();
      const pointer = "touches" in event ? event.touches[0] : event;
      if (!rect || !pointer) return;
      const x = Math.max(
        0,
        Math.min(1, (pointer.clientX - rect.left) / rect.width),
      );
      const y = Math.max(
        0,
        Math.min(1, (pointer.clientY - rect.top) / rect.height),
      );
      setPlants((current) =>
        current.map((plant) =>
          plant.id === plantId ? { ...plant, x, y } : plant,
        ),
      );
      return;
    }

    if (!("touches" in event)) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    const touch = event.touches[0];
    if (!rect || !touch) return;
    const x = (touch.clientX - rect.left) / rect.width;
    const y = (touch.clientY - rect.top) / rect.height;

    if (activeTool === "plant") plantEmojiAt(x, y);
    else if (activeTool === "prune") {
      setIsShoveling(true);
      shovelEmojiAt(x, y);
    } else startStroke(x, y);
  };

  const handleTouchMove = (event: ReactTouchEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    const touch = event.touches[0];
    if (!rect || !touch) return;
    const x = Math.max(
      0,
      Math.min(1, (touch.clientX - rect.left) / rect.width),
    );
    const y = Math.max(
      0,
      Math.min(1, (touch.clientY - rect.top) / rect.height),
    );

    if (draggingPlantId) {
      setPlants((current) =>
        current.map((plant) =>
          plant.id === draggingPlantId ? { ...plant, x, y } : plant,
        ),
      );
    } else if (isShoveling) shovelEmojiAt(x, y);
    else appendStrokePoint(x, y);
  };

  const handlePlantClick = (event: ReactMouseEvent, plantId: string) => {
    event.stopPropagation();
    if (activeTool !== "prune") {
      audioRef.current?.playChime();
      return;
    }

    const nextPlants = plants.filter(({ id }) => id !== plantId);
    setPlants(nextPlants);
    saveToHistory(nextPlants, strokes, ripples);
    audioRef.current?.playPruneSound();
    showToast("Pruned emoji");
  };

  const selectEmoji = (emoji: string) => {
    setSelectedEmoji(emoji);
    setRandomMode(false);
    setActiveTool("plant");
    audioRef.current?.playPlantSound();
  };

  const selectCategory = (categoryId: string) => {
    const category = EMOJI_CATEGORIES.find(({ id }) => id === categoryId);
    setActiveTab(categoryId);
    if (!category?.emojis.length) return;
    if (randomMode) {
      setSelectedEmoji(category.emojis[0]);
      setActiveTool("plant");
    } else {
      selectEmoji(category.emojis[0]);
    }
  };

  const clearAllPlants = () => {
    setPlants([]);
    saveToHistory([], strokes, ripples);
    audioRef.current?.playPruneSound();
    showToast("Cleared all plants");
  };

  const clearRake = () => {
    setStrokes([]);
    setRipples([]);
    saveToHistory(plants, [], []);
    audioRef.current?.playPruneSound();
    showToast("Raked sand flat");
  };

  const exportLayout = () => {
    try {
      const encodedLayout = encodeGardenLayout({
        plants,
        strokes,
        ripples,
        theme: selectedTheme,
        atmosphere,
      });
      const file = new Blob([encodedLayout], {
        type: "text/plain;charset=utf-8",
      });
      const url = URL.createObjectURL(file);
      const link = document.createElement("a");
      link.href = url;
      link.download = "zen-garden-layout.txt";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      showToast("Layout text file downloaded!");
    } catch {
      showToast("Failed to export garden.");
    }
  };

  const importLayoutFromString = (code: string) => {
    try {
      const imported = parseGardenLayout(code);
      setPlants(imported.plants);
      setStrokes(imported.strokes);
      setRipples(imported.ripples);
      if (imported.theme) setSelectedTheme(imported.theme);
      saveToHistory(imported.plants, imported.strokes, imported.ripples);
      audioRef.current?.playPlantSound();
      audioRef.current?.playChime();
      setShowImportDialog(false);
      setImportString("");
      showToast("Garden loaded successfully!");
    } catch {
      showToast("Invalid code or file format.");
    }
  };

  const downloadGardenAsImage = () => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    const devicePixelRatio = window.devicePixelRatio || 1;
    drawCanvas();
    plants.forEach((plant) => {
      context.save();
      context.translate(plant.x * canvas.width, plant.y * canvas.height);
      context.rotate((plant.rotation * Math.PI) / 180);
      const isMobileSize =
        window.innerWidth < 640 ||
        (window.innerHeight < 520 && window.innerWidth > window.innerHeight);
      context.font = `${(isMobileSize ? 32 : 56) * plant.scale * devicePixelRatio}px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif`;
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillText(plant.type, 0, 0);
      context.restore();
    });

    try {
      const dataUrl = canvas.toDataURL("image/png");
      setPreviewFileName(createExportFileName());
      setPreviewImage(dataUrl);
      showToast("Preparing image preview...");
    } catch (error) {
      console.error("Failed to export image:", error);
      showToast("Failed to prepare image preview.");
    }
    drawCanvas();
  };

  const savePreviewImage = async () => {
    if (!previewImage) return;
    try {
      const file = new File([dataUrlToBlob(previewImage)], previewFileName, {
        type: "image/png",
      });
      const canShareFile =
        "share" in navigator &&
        "canShare" in navigator &&
        navigator.canShare({ files: [file] });
      if (canShareFile) {
        await navigator.share({
          files: [file],
          title: "Zen Garden",
          text: "Check out my Zen Garden sanctuary!",
        });
      } else {
        window.open(previewImage, "_blank", "noopener,noreferrer");
      }
    } catch (error) {
      console.error(error);
    }
  };

  return {
    activeTab,
    activeTheme,
    activeTool,
    atmosphere,
    backgroundColor: getActiveBackgroundColor(activeTheme, atmosphere),
    canvasRef,
    clearAllPlants,
    clearRake,
    containerRef,
    downloadGardenAsImage,
    emojiSize,
    exportLayout,
    finishInteraction,
    handleContainerMouseDown,
    handleContainerMouseMove,
    handlePlantClick,
    handleTouchMove,
    handleTouchStart,
    history,
    historyIndex,
    importLayout: () => importLayoutFromString(importString),
    importLayoutFromString,
    importString,
    isTouchDevice,
    plants,
    previewFileName,
    previewImage,
    rakeSize,
    randomMode,
    savePreviewImage,
    selectCategory,
    selectedEmoji,
    selectedTheme,
    selectEmoji,
    setActiveTool,
    setEmojiSize,
    setImportString,
    setPreviewImage,
    setRakeSize,
    setRandomMode,
    setSelectedTheme,
    setShowImportDialog,
    setSidebarOpen,
    setSoundEnabled,
    setWaterBrushSize,
    shareUrl,
    showImportDialog,
    showToast,
    sidebarOpen,
    soundEnabled,
    toastMessage,
    triggerRedo,
    triggerUndo,
    visualRipples,
    waterBrushSize,
  };
}

export type ZenGardenController = ReturnType<typeof useZenGarden>;
