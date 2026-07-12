"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ALL_DRUM_TRACKS,
  ALL_MIXER_TRACKS,
  BASS_NOTES,
  EXTRA_TRACKS,
  FALLBACK_KITS,
  INITIAL_TRACKS,
  KIT_ORDER,
  PRESET_KITS,
  STEPS,
  SYNTH_KIT,
  resolveSampleUrl,
} from "../constants";
import { AudioEngine } from "../lib/audio-engine";
import { PRESETS } from "../presets";
import type { BassNote, DrumKit, KitDefinition, TrackConfig } from "../types";

export function useBeatMakerController() {
  const [kitRegistry] = useState(() =>
    Object.fromEntries(FALLBACK_KITS.map((kit) => [kit.id, kit])),
  );
  const sampleUrl = useCallback(
    (kit: DrumKit, trackId: string) =>
      resolveSampleUrl(kitRegistry, kit, trackId),
    [kitRegistry],
  );
  const [engine] = useState(() => new AudioEngine(sampleUrl));

  const [tracks, setTracks] = useState(INITIAL_TRACKS);
  const [grid, setGrid] = useState(() =>
    Array.from({ length: INITIAL_TRACKS.length }, () =>
      Array(STEPS).fill(false),
    ),
  );
  const [bassNotes, setBassNotes] = useState<BassNote[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [tempo, setTempoState] = useState(120);
  const [volumes, setVolumes] = useState<Record<string, number>>(() =>
    Object.fromEntries(
      ALL_MIXER_TRACKS.map(({ id }) => [id, 0]).concat([["master", 0]]),
    ),
  );
  const [mutes, setMutes] = useState<Record<string, boolean>>({});
  const [solos, setSolos] = useState<Record<string, boolean>>({});
  const [swing, setSwingState] = useState(50);
  const [drumKits, setDrumKits] = useState<KitDefinition[]>(FALLBACK_KITS);
  const [activeKit, setActiveKitState] = useState<DrumKit>("808");
  const [sampleAssignments, setSampleAssignments] = useState<
    Record<string, DrumKit>
  >(() => Object.fromEntries(ALL_MIXER_TRACKS.map(({ id }) => [id, "808"])));

  const tracksRef = useRef(tracks);
  const gridRef = useRef(grid);
  const bassNotesRef = useRef(bassNotes);
  const volumesRef = useRef(volumes);
  const mutesRef = useRef(mutes);
  const solosRef = useRef(solos);
  const activeKitRef = useRef(activeKit);
  const sampleAssignmentsRef = useRef(sampleAssignments);
  const bassNoteId = useRef(0);
  const lastBassNoteLength = useRef(1);
  const isPainting = useRef(false);
  const paintState = useRef(false);
  const sequenceRef = useRef<ReturnType<AudioEngine["createSequence"]> | null>(
    null,
  );
  const transportToggleInFlight = useRef(false);

  const commitTracks = useCallback((next: TrackConfig[]) => {
    tracksRef.current = next;
    setTracks(next);
  }, []);
  const commitGrid = useCallback((next: boolean[][]) => {
    gridRef.current = next;
    setGrid(next);
  }, []);
  const updateGrid = useCallback(
    (update: (current: boolean[][]) => boolean[][]) => {
      commitGrid(update(gridRef.current));
    },
    [commitGrid],
  );
  const commitBassNotes = useCallback((next: BassNote[]) => {
    bassNotesRef.current = next;
    setBassNotes(next);
  }, []);
  const updateBassNotes = useCallback(
    (update: (current: BassNote[]) => BassNote[]) => {
      const current = bassNotesRef.current;
      const next = update(current);
      if (next !== current) commitBassNotes(next);
    },
    [commitBassNotes],
  );
  const updateVolumes = useCallback(
    (update: (current: Record<string, number>) => Record<string, number>) => {
      const next = update(volumesRef.current);
      volumesRef.current = next;
      setVolumes(next);
    },
    [],
  );
  const updateMutes = useCallback(
    (update: (current: Record<string, boolean>) => Record<string, boolean>) => {
      const next = update(mutesRef.current);
      mutesRef.current = next;
      setMutes(next);
    },
    [],
  );
  const updateSolos = useCallback(
    (update: (current: Record<string, boolean>) => Record<string, boolean>) => {
      const next = update(solosRef.current);
      solosRef.current = next;
      setSolos(next);
    },
    [],
  );
  const commitAssignments = useCallback((next: Record<string, DrumKit>) => {
    sampleAssignmentsRef.current = next;
    setSampleAssignments(next);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/beat-maker/kits", { signal: controller.signal })
      .then((response) => response.json() as Promise<KitDefinition[]>)
      .then((loadedKits) => {
        const kits = [
          ...loadedKits.sort((a, b) => {
            const aRank = KIT_ORDER.indexOf(a.id);
            const bRank = KIT_ORDER.indexOf(b.id);
            return (
              (aRank === -1 ? KIT_ORDER.length : aRank) -
              (bRank === -1 ? KIT_ORDER.length : bRank)
            );
          }),
          SYNTH_KIT,
        ];
        Object.assign(
          kitRegistry,
          Object.fromEntries(kits.map((kit) => [kit.id, kit])),
        );
        setDrumKits(kits);
      })
      .catch(() => undefined);
    return () => controller.abort();
  }, [kitRegistry]);

  useEffect(() => {
    engine.mount();
    const sequence = engine.createSequence((time, step) => {
      engine.scheduleDraw(() => setCurrentStep(step), time);
      tracksRef.current.forEach((track, trackIndex) => {
        if (gridRef.current[trackIndex]?.[step]) engine.trigger(track.id, time);
      });
      bassNotesRef.current.forEach((note) => {
        if (note.start === step) {
          engine.triggerBass(BASS_NOTES[note.pitchIndex], time, note.length);
        }
      });
    });
    sequence.start(0);
    sequenceRef.current = sequence;
    return () => {
      sequence.dispose();
      sequenceRef.current = null;
      engine.dispose();
    };
  }, [engine]);

  useEffect(() => engine.setTempo(tempo), [engine, tempo]);
  useEffect(
    () => engine.setSwing(Math.max(0, (swing - 50) / 25)),
    [engine, swing],
  );
  useEffect(
    () => engine.syncState(volumes, mutes, solos),
    [engine, mutes, solos, volumes],
  );
  useEffect(() => {
    if (!engine.ready) return;
    void Promise.all([
      engine.reconcileTracks(tracks, sampleAssignments),
      engine.setBassSample(sampleAssignments.bass ?? activeKit),
    ]);
  }, [activeKit, engine, sampleAssignments, tracks]);

  const togglePlay = useCallback(async () => {
    if (transportToggleInFlight.current) return;
    transportToggleInFlight.current = true;
    try {
      const assignments = sampleAssignmentsRef.current;
      if (!engine.ready) {
        await engine.init({
          tracks: tracksRef.current.map(({ id }) => ({
            id,
            kit: assignments[id] ?? "808",
          })),
          bassKit: assignments.bass ?? activeKitRef.current,
        });
      }
      engine.syncState(volumesRef.current, mutesRef.current, solosRef.current);
      setIsPlaying(await engine.toggleTransport());
    } finally {
      transportToggleInFlight.current = false;
    }
  }, [engine]);

  useEffect(() => {
    const handleSpace = (event: KeyboardEvent) => {
      if (event.code !== "Space") return;
      event.preventDefault();
      event.stopPropagation();
      if (!event.repeat) void togglePlay();
    };
    window.addEventListener("keydown", handleSpace, { capture: true });
    return () =>
      window.removeEventListener("keydown", handleSpace, { capture: true });
  }, [togglePlay]);

  useEffect(() => {
    const stopPainting = () => (isPainting.current = false);
    window.addEventListener("mouseup", stopPainting);
    return () => window.removeEventListener("mouseup", stopPainting);
  }, []);

  const setTempo = useCallback((value: number) => {
    setTempoState(Math.min(300, Math.max(40, value)));
  }, []);
  const setSwing = useCallback((value: number) => setSwingState(value), []);
  const loadDrumKit = useCallback(
    (kit: DrumKit) => {
      activeKitRef.current = kit;
      setActiveKitState(kit);
      commitAssignments(
        Object.fromEntries(ALL_MIXER_TRACKS.map(({ id }) => [id, kit])),
      );
    },
    [commitAssignments],
  );
  const setTrackSample = useCallback(
    (id: string, kit: DrumKit) => {
      commitAssignments({ ...sampleAssignmentsRef.current, [id]: kit });
    },
    [commitAssignments],
  );
  const loadPreset = useCallback(
    (key: string) => {
      const preset = PRESETS[key];
      if (!preset) return;
      loadDrumKit(PRESET_KITS[key] ?? "808");
      const count = Math.min(preset.grid.length, ALL_DRUM_TRACKS.length);
      const nextTracks = ALL_DRUM_TRACKS.slice(0, count);
      commitTracks(nextTracks);
      commitGrid(
        preset.grid.slice(0, count).map((row) => row.map((cell) => cell === 1)),
      );
      commitBassNotes(
        preset.bass.map((note) => ({
          id: ++bassNoteId.current,
          pitchIndex: Math.max(
            0,
            BASS_NOTES.findIndex((pitch) => pitch === note.pitch),
          ),
          start: note.start,
          length: note.length,
        })),
      );
      setSwingState(preset.swing);
      setTempoState(preset.tempo);
      updateVolumes((previous) => {
        const next = { ...previous };
        nextTracks.forEach(({ id }) => (next[id] ??= 0));
        return next;
      });
      updateMutes(() => ({}));
      updateSolos(() => ({}));
    },
    [
      commitBassNotes,
      commitGrid,
      commitTracks,
      loadDrumKit,
      updateMutes,
      updateSolos,
      updateVolumes,
    ],
  );
  const clearPattern = useCallback(() => {
    commitGrid(
      Array.from({ length: tracksRef.current.length }, () =>
        Array(STEPS).fill(false),
      ),
    );
    commitBassNotes([]);
  }, [commitBassNotes, commitGrid]);
  const addTrack = useCallback(() => {
    const current = tracksRef.current;
    const index = current.length - INITIAL_TRACKS.length;
    if (index >= EXTRA_TRACKS.length) return;
    const track = EXTRA_TRACKS[index];
    commitTracks([...current, track]);
    updateGrid((rows) => [...rows, Array(STEPS).fill(false)]);
    updateVolumes((levels) => ({ ...levels, [track.id]: 0 }));
  }, [commitTracks, updateGrid, updateVolumes]);
  const updateStep = useCallback(
    (trackIndex: number, stepIndex: number, active: boolean) => {
      updateGrid((current) => {
        const next = current.map((row) => [...row]);
        next[trackIndex][stepIndex] = active;
        return next;
      });
    },
    [updateGrid],
  );
  const beginPaint = useCallback(
    (trackIndex: number, stepIndex: number, active?: boolean) => {
      isPainting.current = true;
      const next = active ?? !gridRef.current[trackIndex]?.[stepIndex];
      paintState.current = next;
      updateStep(trackIndex, stepIndex, next);
    },
    [updateStep],
  );
  const continuePaint = useCallback(
    (trackIndex: number, stepIndex: number) => {
      if (isPainting.current) {
        updateStep(trackIndex, stepIndex, paintState.current);
      }
    },
    [updateStep],
  );

  const addBassNote = useCallback(
    (pitchIndex: number, start: number) => {
      updateBassNotes((previous) => {
        const occupied = previous.some(
          (note) =>
            note.pitchIndex === pitchIndex &&
            start >= note.start &&
            start < note.start + note.length,
        );
        if (occupied) return previous;
        const nextStart = Math.min(
          STEPS,
          ...previous
            .filter(
              (note) => note.pitchIndex === pitchIndex && note.start > start,
            )
            .map((note) => note.start),
        );
        const length = Math.max(
          1,
          Math.min(
            lastBassNoteLength.current,
            STEPS - start,
            nextStart - start,
          ),
        );
        return [
          ...previous,
          { id: ++bassNoteId.current, pitchIndex, start, length },
        ];
      });
    },
    [updateBassNotes],
  );
  const removeBassNote = useCallback(
    (id: number) =>
      updateBassNotes((notes) => notes.filter((note) => note.id !== id)),
    [updateBassNotes],
  );
  const resizeBassNote = useCallback(
    (id: number, proposedStart: number, proposedLength: number) => {
      updateBassNotes((previous) => {
        const target = previous.find((note) => note.id === id);
        if (!target) return previous;
        const samePitch = previous.filter(
          (note) => note.pitchIndex === target.pitchIndex && note.id !== id,
        );
        const previousEnd = Math.max(
          0,
          ...samePitch
            .filter((note) => note.start < target.start)
            .map((note) => note.start + note.length),
        );
        const nextStart = Math.min(
          STEPS,
          ...samePitch
            .filter((note) => note.start > target.start)
            .map((note) => note.start),
        );
        const start = Math.max(previousEnd, Math.min(proposedStart, STEPS - 1));
        const end = Math.max(
          start + 1,
          Math.min(nextStart, proposedStart + proposedLength),
        );
        lastBassNoteLength.current = end - start;
        return previous.map((note) =>
          note.id === id ? { ...note, start, length: end - start } : note,
        );
      });
    },
    [updateBassNotes],
  );
  const moveBassNote = useCallback(
    (id: number, pitchIndex: number, start: number) => {
      updateBassNotes((previous) => {
        const target = previous.find((note) => note.id === id);
        if (!target) return previous;
        const nextStart = Math.max(0, Math.min(STEPS - target.length, start));
        const overlaps = previous.some(
          (note) =>
            note.id !== id &&
            note.pitchIndex === pitchIndex &&
            nextStart < note.start + note.length &&
            nextStart + target.length > note.start,
        );
        if (overlaps) return previous;
        return previous.map((note) =>
          note.id === id ? { ...note, pitchIndex, start: nextStart } : note,
        );
      });
    },
    [updateBassNotes],
  );
  const previewBassNote = useCallback(
    (note: string) => {
      if (engine.ready) engine.triggerBass(note, engine.now());
    },
    [engine],
  );
  const setVolume = useCallback(
    (id: string, value: number) =>
      updateVolumes((current) => ({ ...current, [id]: value })),
    [updateVolumes],
  );
  const toggleMute = useCallback(
    (id: string) =>
      updateMutes((current) => ({ ...current, [id]: !current[id] })),
    [updateMutes],
  );
  const toggleSolo = useCallback(
    (id: string) => {
      if (id !== "master") {
        updateSolos((current) => ({ ...current, [id]: !current[id] }));
      }
    },
    [updateSolos],
  );
  const readMeterValues = useCallback(() => engine.getMeterValues(), [engine]);

  return {
    tracks,
    grid,
    bassNotes,
    isPlaying,
    currentStep,
    tempo,
    swing,
    drumKits,
    activeKit,
    sampleAssignments,
    volumes,
    mutes,
    solos,
    togglePlay,
    clearPattern,
    setTempo,
    setSwing,
    loadPreset,
    loadDrumKit,
    addTrack,
    beginPaint,
    continuePaint,
    addBassNote,
    removeBassNote,
    resizeBassNote,
    moveBassNote,
    previewBassNote,
    setVolume,
    toggleMute,
    toggleSolo,
    setTrackSample,
    readMeterValues,
  };
}

export type BeatMakerController = ReturnType<typeof useBeatMakerController>;
