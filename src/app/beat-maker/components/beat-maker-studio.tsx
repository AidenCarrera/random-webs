"use client";

import { Smartphone } from "lucide-react";
import { INITIAL_TRACKS, EXTRA_TRACKS } from "../constants";
import { useBeatMakerController } from "../hooks/use-beat-maker-controller";
import { BassPianoRoll } from "./bass-piano-roll";
import { Mixer } from "./mixer";
import { SequencerGrid } from "./sequencer-grid";
import { StudioToolbar } from "./studio-toolbar";

export function BeatMakerStudio() {
  const studio = useBeatMakerController();

  return (
    <div
      className="min-h-screen select-none relative overflow-hidden"
      style={{ background: "#09090b" }}
    >
      <div
        className="fixed inset-0 z-50 flex-col items-center justify-center p-8 text-center hidden portrait:flex md:hidden"
        style={{ background: "#0a0a0f" }}
      >
        <Smartphone
          className="w-16 h-16 mb-6 animate-pulse"
          style={{ color: "#6366f1" }}
        />
        <h2 className="text-2xl font-bold text-white mb-4 tracking-widest">
          ROTATE DEVICE
        </h2>
        <p className="text-zinc-500 max-w-xs text-sm">
          Studio 808 requires a landscape view.
        </p>
      </div>
      <div className="relative z-10 py-3 px-4 md:py-4 md:px-6 flex flex-col items-center min-h-screen font-sans">
        <StudioToolbar
          isPlaying={studio.isPlaying}
          tempo={studio.tempo}
          swing={studio.swing}
          activeKit={studio.activeKit}
          kits={studio.drumKits}
          onTogglePlay={studio.togglePlay}
          onClear={studio.clearPattern}
          onTempoChange={studio.setTempo}
          onSwingChange={studio.setSwing}
          onPresetChange={studio.loadPreset}
          onKitChange={studio.loadDrumKit}
        />
        <SequencerGrid
          tracks={studio.tracks}
          grid={studio.grid}
          currentStep={studio.currentStep}
          onMouseDown={studio.beginPaint}
          onMouseEnter={studio.continuePaint}
          onAddTrack={studio.addTrack}
          showAddButton={
            studio.tracks.length < INITIAL_TRACKS.length + EXTRA_TRACKS.length
          }
        />
        <BassPianoRoll
          notes={studio.bassNotes}
          currentStep={studio.currentStep}
          onPreview={studio.previewBassNote}
          onAdd={studio.addBassNote}
          onRemove={studio.removeBassNote}
          onResize={studio.resizeBassNote}
          onMove={studio.moveBassNote}
        />
        <Mixer
          tracks={studio.tracks}
          volumes={studio.volumes}
          mutes={studio.mutes}
          solos={studio.solos}
          kits={studio.drumKits}
          assignments={studio.sampleAssignments}
          readMeterValues={studio.readMeterValues}
          onVolumeChange={studio.setVolume}
          onToggleMute={studio.toggleMute}
          onToggleSolo={studio.toggleSolo}
          onKitChange={studio.setTrackSample}
        />
      </div>
    </div>
  );
}
