"use client";

import { useState } from "react";
import { ExportPreviewModal } from "@/components/ExportPreviewModal";
import { DEFAULT_AMBIENT_VOLUME, DEFAULT_BACKGROUND_THEME } from "../constants";
import { useAmbientAudio } from "../hooks/useAmbientAudio";
import { useDomOrbitAnimation } from "../hooks/useDomOrbitAnimation";
import { usePlanetEditor } from "../hooks/usePlanetEditor";
import { useSolarSystemExport } from "../hooks/useSolarSystemExport";
import { useSolarSystemViewport } from "../hooks/useSolarSystemViewport";
import type { BackgroundTheme } from "../types";
import { ControlPanel } from "./ControlPanel";
import {
  SolarSystemBackdrop,
  SolarSystemHeader,
  TextureAttribution,
} from "./PageChrome";
import { PlanetEditorPanel } from "./PlanetEditorPanel";
import { SolarSystemViewport } from "./SolarSystemViewport";
import { TimelineControls } from "./TimelineControls";

export function SolarSystemCreator() {
  const planetEditor = usePlanetEditor();
  const {
    selectedPlanet,
    setSelectedPlanet,
    displayedPlanets,
    handleDeletePlanet,
    handleUpdatePlanet,
    handleThreePlanetSelect,
    handleThreeSunSelect,
  } = planetEditor;
  const [paused, setPaused] = useState(false);
  const [timeScale, setTimeScale] = useState(1);
  const [ambientVolume, setAmbientVolume] = useState(DEFAULT_AMBIENT_VOLUME);
  const [systemLoaded, setSystemLoaded] = useState(false);

  // Customization Toggles
  const [showOrbits, setShowOrbits] = useState(true);
  const [showMoons, setShowMoons] = useState(true);
  const [enableGlow, setEnableGlow] = useState(true);
  const [bgTheme, setBgTheme] = useState<BackgroundTheme>(
    DEFAULT_BACKGROUND_THEME,
  );
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const { mounted, containerScale, isMobileViewport } =
    useSolarSystemViewport(setSidebarOpen);
  useAmbientAudio(ambientVolume);
  const { planetElements, planetRotations } = useDomOrbitAnimation(
    displayedPlanets,
    paused,
    timeScale,
  );
  const {
    exportStageRef,
    systemViewportRef,
    exportImage,
    exportFileName,
    isExporting,
    isGeneratingPng,
    handleExport,
    handleCanvasReady,
    closeExport,
    saveExportImage,
  } = useSolarSystemExport({
    planets: displayedPlanets,
    planetRotations,
    planetElements,
    isMobileViewport,
    showOrbits,
    showMoons,
    enableGlow,
    bgTheme,
  });

  // Toggle pause state
  const togglePause = () => setPaused((current) => !current);

  return (
    <div className="min-h-screen text-white font-sans relative select-none overflow-x-hidden overflow-y-auto md:overflow-hidden flex flex-col items-center md:justify-center px-3 pt-4 pb-6 md:px-0 md:pt-0 md:pb-0">
      <SolarSystemBackdrop theme={bgTheme} />
      <SolarSystemHeader />

      <ControlPanel
        editor={planetEditor}
        mounted={mounted}
        sidebarOpen={sidebarOpen}
        onSidebarOpenChange={setSidebarOpen}
        showOrbits={showOrbits}
        onShowOrbitsChange={setShowOrbits}
        showMoons={showMoons}
        onShowMoonsChange={setShowMoons}
        enableGlow={enableGlow}
        onEnableGlowChange={setEnableGlow}
        bgTheme={bgTheme}
        onBackgroundThemeChange={setBgTheme}
        ambientVolume={ambientVolume}
        onAmbientVolumeChange={setAmbientVolume}
        isGeneratingPng={isGeneratingPng}
        onExport={handleExport}
      />
      <SolarSystemViewport
        planets={displayedPlanets}
        paused={paused}
        timeScale={timeScale}
        showOrbits={showOrbits}
        showMoons={showMoons}
        enableGlow={enableGlow}
        bgTheme={bgTheme}
        isGeneratingPng={isGeneratingPng}
        systemLoaded={systemLoaded}
        containerScale={containerScale}
        isMobileViewport={isMobileViewport}
        exportStageRef={exportStageRef}
        systemViewportRef={systemViewportRef}
        planetElements={planetElements}
        onPlanetSelect={handleThreePlanetSelect}
        onSunSelect={handleThreeSunSelect}
        onCanvasReady={handleCanvasReady}
        onLoaded={() => setSystemLoaded(true)}
      />

      <PlanetEditorPanel
        selectedPlanet={selectedPlanet}
        enableGlow={enableGlow}
        paused={paused}
        onClose={() => setSelectedPlanet(null)}
        onUpdate={handleUpdatePlanet}
        onDelete={handleDeletePlanet}
      />
      <TimelineControls
        paused={paused}
        timeScale={timeScale}
        onTogglePause={togglePause}
        onTimeScaleChange={setTimeScale}
      />

      <TextureAttribution />

      {/* Render Export Preview Modal */}
      {isExporting && exportImage && (
        <ExportPreviewModal
          imageSrc={exportImage}
          fileName={exportFileName}
          imageAlt="Solar System Creator Export"
          title="Solar System Snapshot"
          description="Capture of your custom simulated celestial alignment."
          isTouchDevice={
            typeof window !== "undefined" &&
            ("ontouchstart" in window || navigator.maxTouchPoints > 0)
          }
          onSaveImage={saveExportImage}
          shareUrl={typeof window !== "undefined" ? window.location.href : ""}
          onClose={closeExport}
        />
      )}
    </div>
  );
}
