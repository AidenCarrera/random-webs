"use client";

import { useState } from "react";

import { usePolyrhythmTransport } from "../hooks/use-polyrhythm-transport";
import styles from "../styles.module.css";
import type { ViewMode } from "../types";
import { AmbientBackdrop } from "./ambient-backdrop";
import { RhythmPanel } from "./rhythm-panel";
import { ShortcutHints } from "./shortcut-hints";
import { TempoPanel } from "./tempo-panel";
import { TransportHeader } from "./transport-header";
import { VisualizerStage } from "./visualizer-stage";

export function PolyrhythmVisualizer() {
  const [mode, setMode] = useState<ViewMode>("circle");
  const transport = usePolyrhythmTransport();

  return (
    <div className="min-h-screen overflow-hidden bg-[#0d0c12] font-sans text-[#faf9f6]">
      <AmbientBackdrop />

      <main
        className={`${styles.shell} relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-5 px-4 py-5 sm:px-6 sm:py-6 lg:grid lg:min-h-0 lg:gap-4 lg:px-8 lg:py-5`}
      >
        <aside className="flex flex-col gap-5 lg:min-h-0 lg:gap-4">
          <TransportHeader
            isPlaying={transport.isPlaying}
            isMuted={transport.isMuted}
            onTogglePlay={transport.togglePlay}
            onReset={transport.reset}
            onToggleMute={transport.toggleMute}
          />
          <TempoPanel
            bpm={transport.bpm}
            bpmInput={transport.bpmInput}
            onBpmInputChange={transport.editBpmInput}
            onBpmInputCommit={transport.commitBpm}
            onBpmChange={transport.changeBpm}
          />
          <RhythmPanel
            activeCounts={transport.activeCounts}
            onToggleRhythm={transport.toggleRhythm}
          />
          <ShortcutHints />
        </aside>

        {/* A size container, so the stage can be the largest square that fits. */}
        <div className="lg:flex lg:items-start lg:justify-center lg:[container-type:size]">
          <VisualizerStage
            mode={mode}
            onModeChange={setMode}
            bpm={transport.bpm}
            rhythms={transport.rhythms}
            progress={transport.progress}
            turns={transport.turns}
            activePulses={transport.activePulses}
          />
        </div>
      </main>
    </div>
  );
}
