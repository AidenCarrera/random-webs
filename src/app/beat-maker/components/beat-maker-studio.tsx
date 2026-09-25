"use client";

import { Smartphone } from "lucide-react";
import { INITIAL_TRACKS, EXTRA_TRACKS } from "../constants";
import { useBeatMakerController } from "../hooks/use-beat-maker-controller";
import { BassPianoRoll } from "./bass-piano-roll";
import { Mixer } from "./mixer";
import { SequencerGrid } from "./sequencer-grid";
import { StudioToolbar } from "./studio-toolbar";
import styles from "../studio.module.css";

export function BeatMakerStudio() {
  const studio = useBeatMakerController();

  return (
    <div
      className="relative min-h-screen select-none overflow-hidden"
      style={{ background: "#09090b" }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            "radial-gradient(60rem 30rem at 50% -8rem, rgba(99,102,241,0.16), transparent 70%), radial-gradient(40rem 30rem at 100% 100%, rgba(244,63,94,0.06), transparent 70%)",
        }}
      />
      <div
        className="fixed inset-0 z-50 hidden flex-col items-center justify-center p-8 text-center portrait:flex md:hidden"
        style={{
          background:
            "radial-gradient(circle at 50% 40%, #16162a 0%, #0a0a0f 70%)",
        }}
      >
        <div className="relative mb-8">
          <span className="absolute inset-0 -m-4 rounded-full bg-indigo-500/20 blur-2xl motion-safe:animate-pulse" />
          <Smartphone
            className={`relative h-16 w-16 ${styles.rotateHint}`}
            style={{ color: "#818cf8" }}
          />
        </div>
        <h2 className="mb-4 text-2xl font-black tracking-[0.3em] text-white">
          ROTATE DEVICE
        </h2>
        <p className="max-w-xs text-sm text-zinc-500">
          Studio 808 requires a landscape view.
        </p>
      </div>
      <div className="relative z-10 flex min-h-screen flex-col items-center px-4 py-3 font-sans md:px-6 md:py-5">
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
          isPlaying={studio.isPlaying}
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
          isPlaying={studio.isPlaying}
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
