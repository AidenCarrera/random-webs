"use client";

import { useState, useEffect, useRef, useCallback, memo } from "react";
import * as Tone from "tone";
import {
  Play,
  Pause,
  Trash2,
  Music,
  Plus,
  Smartphone,
  Volume2,
} from "lucide-react";
import { PRESETS, type BeatPreset } from "./presets";

const STEPS = 16;
const BASS_NOTES = [
  "C2",
  "B1",
  "A#1",
  "A1",
  "G#1",
  "G1",
  "F#1",
  "F1",
  "E1",
  "D#1",
  "D1",
  "C#1",
  "C1",
];

type BassNote = {
  id: number;
  pitchIndex: number;
  start: number;
  length: number;
};

type KitDefinition = {
  id: string;
  name: string;
  folder: string | null;
  samples: Record<string, string>;
};

type DrumKit = string;

const SYNTH_KIT: KitDefinition = {
  id: "synth",
  name: "Synth Kit",
  folder: null,
  samples: {},
};

const sampleFiles = {
  kick: "kick.wav",
  snare: "snare.wav",
  hihat: "hi-hat.wav",
  clap: "clap.wav",
  openhat: "open-hat.wav",
  ride: "ride.wav",
  cowbell: "cowbell.wav",
  perc: "perc.wav",
  bass: "808.wav",
};

const KIT_ORDER = ["808", "edm", "house", "trap"];

const FALLBACK_KITS: KitDefinition[] = [
  ...["808", "EDM", "House", "Trap"].map((folder) => ({
    id: folder.toLowerCase(),
    name: `${folder} Kit`,
    folder,
    samples: sampleFiles,
  })),
  SYNTH_KIT,
];

let kitRegistry = Object.fromEntries(FALLBACK_KITS.map((kit) => [kit.id, kit]));

const PRESET_KITS: Record<string, DrumKit> = {
  default: "808",
  house: "house",
  techno: "edm",
  hiphop: "808",
  trap: "trap",
  fullkit: "edm",
};

const sampleUrl = (kitId: DrumKit, trackId: string) => {
  const kit = kitRegistry[kitId];
  const file = kit?.samples[trackId];
  if (!kit?.folder || !file) return null;
  return `/beat-maker/${encodeURIComponent(kit.folder)}/${encodeURIComponent(file)}`;
};

type TrackConfig = {
  id: string;
  name: string;
  color: string;
  text: string;
  accent: string;
  glow: string;
};

const INITIAL_TRACKS: TrackConfig[] = [
  {
    id: "kick",
    name: "KICK",
    color: "bg-rose-500",
    text: "text-rose-400",
    accent: "#f43f5e",
    glow: "rgba(244,63,94,0.4)",
  },
  {
    id: "snare",
    name: "SNARE",
    color: "bg-sky-500",
    text: "text-sky-400",
    accent: "#38bdf8",
    glow: "rgba(56,189,248,0.4)",
  },
  {
    id: "hihat",
    name: "HIHAT",
    color: "bg-amber-400",
    text: "text-amber-400",
    accent: "#fbbf24",
    glow: "rgba(251,191,36,0.4)",
  },
  {
    id: "clap",
    name: "CLAP",
    color: "bg-violet-500",
    text: "text-violet-400",
    accent: "#a78bfa",
    glow: "rgba(167,139,250,0.4)",
  },
];

const EXTRA_TRACKS: TrackConfig[] = [
  {
    id: "openhat",
    name: "OPEN HAT",
    color: "bg-yellow-300",
    text: "text-yellow-300",
    accent: "#fde047",
    glow: "rgba(253,224,71,0.4)",
  },
  {
    id: "ride",
    name: "RIDE",
    color: "bg-orange-500",
    text: "text-orange-400",
    accent: "#fb923c",
    glow: "rgba(251,146,60,0.4)",
  },
  {
    id: "cowbell",
    name: "COWBELL",
    color: "bg-pink-500",
    text: "text-pink-400",
    accent: "#f472b6",
    glow: "rgba(244,114,182,0.4)",
  },
  {
    id: "perc",
    name: "PERC",
    color: "bg-teal-400",
    text: "text-teal-400",
    accent: "#2dd4bf",
    glow: "rgba(45,212,191,0.4)",
  },
];

const BASS_MIXER_TRACK: TrackConfig = {
  id: "bass",
  name: "808 BASS",
  color: "bg-indigo-500",
  text: "text-indigo-400",
  accent: "#818cf8",
  glow: "rgba(99,102,241,0.5)",
};

class AudioEngine {
  private context: Tone.Context | null = null;
  private initTask: Promise<void> | null = null;
  private generation = 0;
  instruments: Record<
    string,
    Tone.Player | Tone.MembraneSynth | Tone.NoiseSynth | Tone.MetalSynth
  > = {};
  filters: Record<string, Tone.Filter> = {};
  channels: Record<string, Tone.Channel> = {};
  meters: Record<string, Tone.Meter> = {};
  master: Tone.Volume | null = null;
  masterMeter: Tone.Meter | null = null;
  limit: Tone.Limiter | null = null;
  bass: Tone.Sampler | Tone.MembraneSynth | null = null;
  bassDistortion: Tone.Distortion | null = null;

  mount() {
    if (this.context) return;
    this.context = new Tone.Context();
    this.generation += 1;
  }

  private requireContext() {
    if (!this.context) throw new Error("Audio engine is not mounted");
    return this.context;
  }

  init() {
    if (this.master) return Promise.resolve();
    if (!this.initTask) {
      const generation = this.generation;
      this.initTask = this.initialize(generation).catch((error) => {
        this.initTask = null;
        throw error;
      });
    }
    return this.initTask;
  }

  private async initialize(generation: number) {
    const context = this.context;
    if (!context) return;
    await context.resume();
    if (generation !== this.generation || context !== this.context) return;

    this.limit = new Tone.Limiter({ context, threshold: -1 }).connect(
      context.destination,
    );
    this.master = new Tone.Volume({ context, volume: 0, mute: false }).connect(
      this.limit,
    );
    this.masterMeter = new Tone.Meter({ context });
    this.master.connect(this.masterMeter);
    INITIAL_TRACKS.forEach((t) => this.initTrack(t.id));
    const bassChannel = new Tone.Channel({ context, volume: 0 }).connect(
      this.master,
    );
    const bassMeter = new Tone.Meter({ context });
    bassChannel.connect(bassMeter);
    this.channels.bass = bassChannel;
    this.meters.bass = bassMeter;
    this.setBassSample("808");
  }

  addTrack(id: string) {
    if (!this.instruments[id]) this.initTrack(id);
  }

  initTrack(id: string, kit: DrumKit = "808") {
    if (!this.master) return;
    const context = this.requireContext();
    const channel = new Tone.Channel({ context, volume: 0 }).connect(
      this.master,
    );
    const meter = new Tone.Meter({ context });
    channel.connect(meter);
    this.channels[id] = channel;
    this.meters[id] = meter;
    this.setKit(id, kit);
  }

  trigger(id: string, time: number) {
    const inst = this.instruments[id];
    if (inst instanceof Tone.Player) {
      if (inst.loaded) inst.start(time);
    } else if (inst instanceof Tone.MembraneSynth) {
      inst.triggerAttackRelease("C1", "8n", time);
    } else if (inst instanceof Tone.MetalSynth) {
      inst.triggerAttackRelease("C5", "32n", time, 1);
    } else if (inst instanceof Tone.NoiseSynth) {
      if (id === "clap") {
        inst.triggerAttackRelease("32n", time, 1);
        inst.triggerAttackRelease("32n", time + 0.01, 0.7);
        inst.triggerAttackRelease("32n", time + 0.02, 0.5);
      } else {
        inst.triggerAttackRelease("32n", time, 0.8);
      }
    }
  }

  triggerBass(note: string, time: number, steps = 1) {
    const bpm = this.requireContext().transport.bpm.value;
    const duration = (60 / bpm / 4) * steps;
    if (this.bass instanceof Tone.Sampler) {
      if (this.bass.loaded)
        this.bass.triggerAttackRelease(note, duration, time, 0.95);
    } else {
      this.bass?.triggerAttackRelease(note, duration, time, 0.95);
    }
  }

  setBassSample(kit: DrumKit) {
    const channel = this.channels.bass;
    if (!channel) return;
    this.bass?.dispose();
    this.bassDistortion?.dispose();
    this.bass = null;
    this.bassDistortion = null;
    const context = this.requireContext();

    if (kit === "synth") {
      const distortion = new Tone.Distortion({
        context,
        distortion: 0.4,
        oversample: "4x",
      });
      this.bassDistortion = distortion;

      this.bass = new Tone.MembraneSynth({
        context,
        pitchDecay: 0.05,
        octaves: 2,
        oscillator: {
          type: "triangle",
        },
        envelope: {
          attack: 0.001,
          decay: 0.4,
          sustain: 0.4,
          release: 0.8,
        },
      });

      this.bass.chain(distortion, channel);
      this.bass.volume.value = -6;
    } else {
      const url = sampleUrl(kit, "bass");
      if (!url) return;

      this.bass = new Tone.Sampler({
        context,
        urls: { C1: url },
      }).connect(channel);
      this.bass.volume.value = -4;
    }
  }

  setKit(id: string, kit: DrumKit) {
    const old = this.instruments[id];
    const channel = this.channels[id];
    if (!channel) return;
    const context = this.requireContext();
    old?.dispose();
    this.filters[id]?.dispose();
    delete this.filters[id];
    if (kit !== "synth") {
      const url = sampleUrl(kit, id);
      if (!url) return;
      this.instruments[id] = new Tone.Player({ context, url }).connect(channel);
      return;
    }

    let inst: Tone.MembraneSynth | Tone.NoiseSynth | Tone.MetalSynth;
    switch (id) {
      case "kick":
        inst = new Tone.MembraneSynth({
          context,
          pitchDecay: 0.06,
          octaves: 7,
          oscillator: { type: "sine" },
          envelope: { attack: 0.001, decay: 0.5, sustain: 0.02, release: 1.4 },
        });
        inst.volume.value = 2;
        break;
      case "snare":
        inst = new Tone.NoiseSynth({
          context,
          noise: { type: "white" },
          envelope: { attack: 0.001, decay: 0.2, sustain: 0.01, release: 1.2 },
        });
        inst.volume.value = 0;
        break;
      case "hihat":
        inst = new Tone.MetalSynth({
          context,
          envelope: { attack: 0.001, decay: 0.05, release: 0.01 },
          harmonicity: 4.1,
          modulationIndex: 40,
          resonance: 3000,
          octaves: 1,
        });
        inst.frequency.value = 250;
        inst.volume.value = -10;
        break;
      case "clap":
        inst = new Tone.NoiseSynth({
          context,
          noise: { type: "white" },
          envelope: { attack: 0.001, decay: 0.18, sustain: 0, release: 0.08 },
        });
        inst.volume.value = 2;
        this.filters[id] = new Tone.Filter({
          context,
          frequency: 1500,
          type: "bandpass",
        });
        inst.connect(this.filters[id]);
        this.filters[id].connect(channel);
        this.instruments[id] = inst;
        return;
      case "openhat":
        inst = new Tone.MetalSynth({
          context,
          envelope: { attack: 0.001, decay: 0.2, release: 1 },
          harmonicity: 5.1,
          modulationIndex: 32,
          resonance: 4000,
          octaves: 1,
        });
        inst.frequency.value = 200;
        inst.volume.value = -12;
        break;
      case "ride":
        inst = new Tone.MetalSynth({
          context,
          envelope: { attack: 0.001, decay: 1, release: 1.2 },
          harmonicity: 3.1,
          modulationIndex: 20,
          resonance: 2800,
          octaves: 1.5,
        });
        inst.volume.value = -20;
        break;
      case "cowbell":
        inst = new Tone.MetalSynth({
          context,
          envelope: { attack: 0.001, decay: 0.1, release: 0.2 },
          harmonicity: 8,
          modulationIndex: 12,
          resonance: 1500,
          octaves: 1,
        });
        inst.frequency.value = 750;
        inst.volume.value = -10;
        break;
      default:
        inst = new Tone.MembraneSynth({
          context,
          pitchDecay: 0.01,
          octaves: 2,
          oscillator: { type: "sine" },
          envelope: { attack: 0.001, decay: 0.1, sustain: 0, release: 0.1 },
        });
        inst.volume.value = -4;
    }
    inst.connect(channel);
    this.instruments[id] = inst;
  }

  setVolume(id: string, dB: number) {
    if (id === "master") {
      if (this.master) this.master.volume.rampTo(dB, 0.1);
    } else {
      const ch = this.channels[id];
      if (ch) ch.volume.rampTo(dB, 0.1);
    }
  }

  setSwing(amount: number) {
    const transport = this.requireContext().transport;
    transport.swing = amount;
    transport.swingSubdivision = "16n";
  }

  setTempo(tempo: number) {
    this.requireContext().transport.bpm.value = tempo;
  }

  createSequence(callback: (time: number, step: number) => void) {
    return new Tone.Sequence({
      context: this.requireContext(),
      callback,
      events: Array.from({ length: STEPS }, (_, index) => index),
      subdivision: "16n",
    });
  }

  scheduleDraw(callback: () => void, time: number) {
    this.requireContext().draw.schedule(callback, time);
  }

  now() {
    return this.requireContext().now();
  }

  async toggleTransport() {
    const context = this.context;
    if (!context || !this.master) return false;
    if (context.state !== "running") await context.resume();
    if (context !== this.context) return false;

    const transport = context.transport;
    const shouldPlay = transport.state !== "started";
    if (shouldPlay) transport.start();
    else transport.pause();
    return shouldPlay;
  }

  getMeterValues(): Record<string, number> {
    const values: Record<string, number> = {};
    for (const [id, meter] of Object.entries(this.meters)) {
      values[id] = meter.getValue() as number;
    }
    if (this.masterMeter) {
      values["master"] = this.masterMeter.getValue() as number;
    }
    return values;
  }

  syncState(
    volumes: Record<string, number>,
    mutes: Record<string, boolean>,
    solos: Record<string, boolean>,
  ) {
    if (!this.master) return;
    this.setVolume("master", volumes["master"] ?? 0);
    this.master.mute = mutes["master"] || false;
    const activeSolos = Object.values(solos).some((s) => s);
    Object.keys(this.channels).forEach((id) => {
      this.setVolume(id, volumes[id] ?? 0);
      const ch = this.channels[id];
      if (ch) {
        ch.mute = mutes[id] || false || (activeSolos && !(solos[id] || false));
        ch.solo = false;
      }
    });
  }

  dispose() {
    this.generation += 1;
    this.initTask = null;

    const context = this.context;
    context?.transport.stop();
    context?.draw.cancel();

    Object.values(this.instruments).forEach((node) => node.dispose());
    Object.values(this.filters).forEach((node) => node.dispose());
    this.bass?.dispose();
    this.bassDistortion?.dispose();
    Object.values(this.meters).forEach((node) => node.dispose());
    Object.values(this.channels).forEach((node) => node.dispose());
    this.masterMeter?.dispose();
    this.master?.dispose();
    this.limit?.dispose();

    this.instruments = {};
    this.filters = {};
    this.channels = {};
    this.meters = {};
    this.bass = null;
    this.bassDistortion = null;
    this.masterMeter = null;
    this.master = null;
    this.limit = null;
    this.context = null;
    void context?.close();
  }
}

export default function BeatMaker() {
  const engineRef = useRef<AudioEngine | null>(null);
  engineRef.current ??= new AudioEngine();
  const engine = engineRef.current;
  const [tracks, setTracks] = useState(INITIAL_TRACKS);
  const [grid, setGrid] = useState(() =>
    Array(INITIAL_TRACKS.length)
      .fill(null)
      .map(() => Array(STEPS).fill(false)),
  );
  const [bassNotes, setBassNotes] = useState<BassNote[]>([]);
  const bassNoteId = useRef(0);
  const lastBassNoteLength = useRef(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [tempo, setTempo] = useState(120);
  const [tempoInput, setTempoInput] = useState("120");
  useEffect(() => {
    setTempoInput(tempo.toString());
  }, [tempo]);
  const handleTempoChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setTempoInput(e.target.value);
  const commitTempo = () => {
    let val = parseInt(tempoInput);
    if (isNaN(val)) val = 120;
    val = Math.min(300, Math.max(40, val));
    setTempo(val);
    setTempoInput(val.toString());
  };
  const [volumes, setVolumes] = useState<Record<string, number>>({
    kick: 0,
    snare: 0,
    hihat: 0,
    clap: 0,
    openhat: 0,
    ride: 0,
    cowbell: 0,
    perc: 0,
    bass: 0,
    master: 0,
  });
  const [meterValues, setMeterValues] = useState<Record<string, number>>({});
  const [mutes, setMutes] = useState<Record<string, boolean>>({});
  const [solos, setSolos] = useState<Record<string, boolean>>({});
  const [swing, setSwing] = useState(50);
  const [drumKits, setDrumKits] = useState<KitDefinition[]>(FALLBACK_KITS);
  const [activeKit, setActiveKit] = useState<DrumKit>("808");
  const [sampleAssignments, setSampleAssignments] = useState<
    Record<string, DrumKit>
  >(() =>
    Object.fromEntries(
      [...INITIAL_TRACKS, ...EXTRA_TRACKS, BASS_MIXER_TRACK].map((track) => [
        track.id,
        "808",
      ]),
    ),
  );
  const isPainting = useRef(false);
  const paintState = useRef(false);
  const seqRef = useRef<Tone.Sequence | null>(null);
  const meterRaf = useRef<number | null>(null);
  const transportToggleInFlight = useRef(false);

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
        kitRegistry = Object.fromEntries(kits.map((kit) => [kit.id, kit]));
        setDrumKits(kits);
      })
      .catch(() => undefined);
    return () => controller.abort();
  }, []);

  const gridRef = useRef(grid);
  const bassNotesRef = useRef(bassNotes);
  const tracksRef = useRef(tracks);
  useEffect(() => {
    gridRef.current = grid;
    bassNotesRef.current = bassNotes;
    tracksRef.current = tracks;
  }, [grid, bassNotes, tracks]);

  useEffect(() => {
    const update = () => {
      setMeterValues(engine.getMeterValues());
      meterRaf.current = requestAnimationFrame(update);
    };
    meterRaf.current = requestAnimationFrame(update);
    return () => {
      if (meterRaf.current) cancelAnimationFrame(meterRaf.current);
    };
  }, []);

  const handleVolumeChange = (id: string, val: number) => {
    setVolumes((p) => ({ ...p, [id]: val }));
    engine.setVolume(id, val);
  };
  const toggleMute = (id: string) => {
    setMutes((p) => {
      const n = { ...p, [id]: !p[id] };
      engine.syncState(volumes, n, solos);
      return n;
    });
  };
  const toggleSolo = (id: string) => {
    if (id === "master") return;
    setSolos((p) => {
      const n = { ...p, [id]: !p[id] };
      engine.syncState(volumes, mutes, n);
      return n;
    });
  };
  const handleSwingChange = (val: number) => {
    setSwing(val);
    engine.setSwing(Math.max(0, (val - 50) / 25));
  };

  const loadDrumKit = (kit: DrumKit) => {
    setActiveKit(kit);
    const assignments = Object.fromEntries(
      [...INITIAL_TRACKS, ...EXTRA_TRACKS, BASS_MIXER_TRACK].map((track) => [
        track.id,
        kit,
      ]),
    ) as Record<string, DrumKit>;
    setSampleAssignments(assignments);
    if (engine.master) {
      engine.setBassSample(kit);
      Object.entries(assignments).forEach(([id, selectedKit]) => {
        if (id !== "bass") engine.setKit(id, selectedKit);
      });
    }
  };

  const setTrackSample = (id: string, kit: DrumKit) => {
    setSampleAssignments((previous) => ({ ...previous, [id]: kit }));
    if (engine.master) {
      if (id === "bass") engine.setBassSample(kit);
      else engine.setKit(id, kit);
    }
  };

  const loadPreset = (key: string) => {
    if (!PRESETS[key]) return;
    const p = PRESETS[key];
    loadDrumKit(PRESET_KITS[key] ?? "808");
    const all = [...INITIAL_TRACKS, ...EXTRA_TRACKS];
    const cnt = Math.min(p.grid.length, all.length);
    const newTracks = all.slice(0, cnt);
    if (engine.master) newTracks.forEach((t) => engine.addTrack(t.id));
    setTracks(newTracks);
    setGrid(
      p.grid
        .slice(0, cnt)
        .map((row: number[]) => row.map((c: number) => c === 1)),
    );
    setBassNotes(
      p.bass.map((note) => ({
        id: ++bassNoteId.current,
        pitchIndex: Math.max(0, BASS_NOTES.indexOf(note.pitch)),
        start: note.start,
        length: note.length,
      })),
    );
    handleSwingChange(p.swing);
    setTempo(p.tempo);
    setVolumes((prev) => {
      const n: Record<string, number> = { ...prev };
      newTracks.forEach((t) => {
        if (n[t.id] === undefined) n[t.id] = 0;
      });
      // Sync audio engine with the freshly computed volumes
      const nm: Record<string, boolean> = {};
      const ns: Record<string, boolean> = {};
      if (engine.master) engine.syncState(n, nm, ns);
      return n;
    });
    setMutes({});
    setSolos({});
  };

  useEffect(() => {
    engine.mount();
    const seq = engine.createSequence((time, step) => {
      engine.scheduleDraw(() => {
        setCurrentStep(step);
      }, time);
      tracksRef.current.forEach((track, ti) => {
        if (gridRef.current[ti] && gridRef.current[ti][step]) {
          engine.trigger(track.id, time);
        }
      });
      bassNotesRef.current.forEach((note) => {
        if (note.start === step)
          engine.triggerBass(BASS_NOTES[note.pitchIndex], time, note.length);
      });
    });
    seq.start(0);
    seqRef.current = seq;
    return () => {
      seq.dispose();
      seqRef.current = null;
      engine.dispose();
    };
  }, [engine]);

  useEffect(() => {
    engine.setTempo(tempo);
  }, [engine, tempo]);

  const togglePlay = useCallback(async () => {
    if (transportToggleInFlight.current) return;
    transportToggleInFlight.current = true;
    try {
      if (!engine.master) {
        await engine.init();
        engine.setBassSample(sampleAssignments.bass ?? activeKit);
        tracks.forEach((t) => engine.addTrack(t.id));
        tracks.forEach((t) =>
          engine.setKit(t.id, sampleAssignments[t.id] ?? "808"),
        );
        engine.syncState(volumes, mutes, solos);
      }
      setIsPlaying(await engine.toggleTransport());
    } finally {
      transportToggleInFlight.current = false;
    }
  }, [engine, volumes, mutes, solos, tracks, sampleAssignments, activeKit]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.code !== "Space") return;
      e.preventDefault();
      e.stopPropagation();
      if (!e.repeat) void togglePlay();
    };
    window.addEventListener("keydown", h, { capture: true });
    return () => window.removeEventListener("keydown", h, { capture: true });
  }, [togglePlay]);

  const clearGrid = () => {
    setGrid(
      Array(tracks.length)
        .fill(null)
        .map(() => Array(STEPS).fill(false)),
    );
    setBassNotes([]);
  };

  const handleAddTrack = useCallback(() => {
    const idx = tracks.length - INITIAL_TRACKS.length;
    if (idx < EXTRA_TRACKS.length) {
      const t = EXTRA_TRACKS[idx];
      engine.addTrack(t.id);
      if (engine.master)
        engine.setKit(t.id, sampleAssignments[t.id] ?? activeKit);
      setTracks((p) => [...p, t]);
      setGrid((p) => [...p, Array(STEPS).fill(false)]);
      setVolumes((p) => ({ ...p, [t.id]: 0 }));
    }
  }, [tracks.length, sampleAssignments, activeKit]);

  const updateStep = useCallback((ti: number, si: number, val: boolean) => {
    setGrid((p) => {
      const g = p.map((r) => [...r]);
      g[ti][si] = val;
      return g;
    });
  }, []);

  const addBassNote = useCallback((pitchIndex: number, start: number) => {
    setBassNotes((previous) => {
      const occupied = previous.some(
        (note) =>
          note.pitchIndex === pitchIndex &&
          start >= note.start &&
          start < note.start + note.length,
      );
      if (occupied) return previous;
      const nextNoteStart = Math.min(
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
          nextNoteStart - start,
        ),
      );
      return [
        ...previous,
        { id: ++bassNoteId.current, pitchIndex, start, length },
      ];
    });
  }, []);

  const removeBassNote = useCallback((id: number) => {
    setBassNotes((previous) => previous.filter((note) => note.id !== id));
  }, []);

  const resizeBassNote = useCallback(
    (id: number, proposedStart: number, proposedLength: number) => {
      setBassNotes((previous) => {
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
    [],
  );

  const moveBassNote = useCallback(
    (id: number, pitchIndex: number, start: number) => {
      setBassNotes((previous) => {
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
    [],
  );

  const previewBassNote = useCallback(
    (note: string) => {
      if (!engine.master) return;
      engine.triggerBass(note, engine.now());
    },
    [engine],
  );

  const handleMouseDown = useCallback(
    (ti: number, si: number, active?: boolean) => {
      isPainting.current = true;
      // Read from ref so this callback never needs to depend on grid state
      const ns = active ?? !gridRef.current[ti]?.[si];
      paintState.current = ns;
      updateStep(ti, si, ns);
    },
    [updateStep],
  );

  const handleMouseEnter = useCallback(
    (ti: number, si: number) => {
      if (isPainting.current) updateStep(ti, si, paintState.current);
    },
    [updateStep],
  );

  useEffect(() => {
    const up = () => (isPainting.current = false);
    window.addEventListener("mouseup", up);
    return () => window.removeEventListener("mouseup", up);
  }, []);

  const masterLevel = Math.max(-60, meterValues["master"] || -60);
  const masterHeight = ((masterLevel + 60) / 60) * 100;

  const renderFader = (id: string, vol: number) => {
    const thumbPct = ((vol + 60) / 66) * 100;
    const ismaster = id === "master";
    return (
      <div className="relative h-full w-5 md:w-6">
        <input
          type="range"
          min="-60"
          max="6"
          step="1"
          value={vol}
          onChange={(e) => handleVolumeChange(id, parseInt(e.target.value))}
          onDoubleClick={() => handleVolumeChange(id, 0)}
          title="Double-click to reset to 0 dB"
          className="absolute inset-0 w-36 md:w-44 h-6 origin-top-left -rotate-90 translate-y-36 md:translate-y-44 opacity-0 cursor-pointer z-20 touch-none"
        />
        <div
          className="absolute left-1/2 -translate-x-1/2 top-2 bottom-2 w-px rounded-full"
          style={{ background: "rgba(255,255,255,0.08)" }}
        />
        <div
          className="absolute left-0 right-0 h-6 rounded-lg pointer-events-none z-10"
          style={{
            bottom: `${thumbPct}%`,
            transform: "translateY(50%)",
            background: ismaster
              ? "linear-gradient(180deg,rgba(255,255,255,0.18) 0%,rgba(255,255,255,0.08) 100%)"
              : "linear-gradient(180deg,rgba(255,255,255,0.12) 0%,rgba(255,255,255,0.05) 100%)",
            boxShadow:
              "0 2px 8px rgba(0,0,0,0.5),inset 0 1px 0 rgba(255,255,255,0.15)",
            border: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          <div
            className="absolute inset-x-2 top-1/2 -translate-y-1/2 h-px rounded-full"
            style={{
              background: ismaster
                ? "rgba(255,255,255,0.3)"
                : "rgba(255,255,255,0.2)",
            }}
          />
        </div>
      </div>
    );
  };

  return (
    <div
      className="min-h-screen select-none relative overflow-hidden"
      style={{
        background: "#09090b",
      }}
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
        <div className="w-full max-w-6xl mb-3 md:mb-4">
          <div className="flex items-center justify-between mb-2.5 md:mb-3">
            <div>
              <h1
                className="text-2xl md:text-4xl font-black tracking-[0.2em] text-white"
                style={{ textShadow: "0 0 40px rgba(99,102,241,0.3)" }}
              >
                STUDIO <span style={{ color: "#6366f1" }}>808</span>
              </h1>
              <p className="text-[10px] md:text-xs tracking-[0.3em] text-zinc-600 uppercase mt-0.5">
                Drum Machine &amp; Sequencer
              </p>
            </div>
          </div>
          <div
            className="rounded-2xl border border-white/6 py-2.5 px-3 md:py-3 md:px-4 flex flex-wrap gap-2.5 md:gap-3.5 justify-between items-center"
            style={{
              background: "#121218",
            }}
          >
            <div className="flex items-center gap-2 md:gap-3">
              <button
                onClick={togglePlay}
                className="flex items-center gap-2 md:gap-2.5 px-4 py-2 md:px-6 md:py-2.5 rounded-xl font-bold text-xs md:text-sm tracking-wider transition-all duration-200"
                style={{
                  background: isPlaying
                    ? "linear-gradient(135deg,#10b981,#059669)"
                    : "linear-gradient(135deg,#6366f1,#4f46e5)",
                  boxShadow: isPlaying
                    ? "0 0 12px rgba(16,185,129,0.2),inset 0 1px 0 rgba(255,255,255,0.15)"
                    : "0 0 12px rgba(99,102,241,0.2),inset 0 1px 0 rgba(255,255,255,0.15)",
                  color: "#fff",
                }}
              >
                {isPlaying ? (
                  <Pause className="w-3.5 h-3.5 md:w-4 md:h-4" />
                ) : (
                  <Play className="w-3.5 h-3.5 md:w-4 md:h-4" />
                )}
                {isPlaying ? "PAUSE" : "PLAY"}
              </button>
              <button
                onClick={clearGrid}
                className="p-2 md:p-2.5 rounded-xl border border-white/6 hover:border-rose-500/40 hover:bg-rose-500/10 transition-all text-zinc-500 hover:text-rose-400"
                title="Clear"
              >
                <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-2 md:gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-[9px] md:text-[10px] text-zinc-400 font-bold uppercase tracking-widest px-1">
                  Tempo
                </label>
                <div
                  className="flex items-center gap-1.5 px-3 py-1.5 md:py-2 rounded-xl border border-white/6"
                  style={{ background: "#0d0d14" }}
                >
                  <Music className="w-3 h-3 text-zinc-600" />
                  <input
                    type="number"
                    value={tempoInput}
                    onChange={handleTempoChange}
                    onBlur={commitTempo}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        commitTempo();
                        (e.target as HTMLInputElement).blur();
                      }
                    }}
                    className="w-8 md:w-12 bg-transparent text-center focus:outline-none font-bold text-zinc-200 text-xs md:text-sm"
                  />
                  <span className="text-[9px] md:text-xs text-zinc-600">
                    BPM
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[9px] md:text-[10px] text-zinc-400 font-bold uppercase tracking-widest px-1">
                  Swing
                </label>
                <div
                  className="flex items-center gap-3 px-3 py-1.5 md:py-2 rounded-xl border border-white/6"
                  style={{ background: "#0d0d14" }}
                >
                  {/* Custom slider */}
                  <div className="relative flex items-center w-20 md:w-28 h-5 cursor-pointer group">
                    <input
                      type="range"
                      min="50"
                      max="75"
                      value={swing}
                      onChange={(e) =>
                        handleSwingChange(parseInt(e.target.value))
                      }
                      className="absolute inset-0 w-full opacity-0 cursor-pointer z-10 h-full"
                    />
                    {/* Track background */}
                    <div
                      className="absolute inset-x-0 h-1 rounded-full"
                      style={{ background: "rgba(255,255,255,0.08)" }}
                    />
                    {/* Filled portion */}
                    <div
                      className="absolute left-0 h-1 rounded-full"
                      style={{
                        width: `${((swing - 50) / 25) * 100}%`,
                        background: "linear-gradient(90deg,#6366f1,#818cf8)",
                        boxShadow: "0 0 6px rgba(99,102,241,0.5)",
                      }}
                    />
                    {/* Thumb */}
                    <div
                      className="absolute w-3 h-3 rounded-full pointer-events-none transition-transform duration-75 group-hover:scale-110"
                      style={{
                        left: `calc(${((swing - 50) / 25) * 100}% - 6px)`,
                        background: "#fff",
                        boxShadow:
                          "0 0 6px rgba(99,102,241,0.7), 0 1px 3px rgba(0,0,0,0.5)",
                      }}
                    />
                  </div>
                  <span className="text-[9px] md:text-xs text-zinc-200 w-7 tabular-nums text-right shrink-0">
                    {swing}%
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[9px] md:text-[10px] text-zinc-400 font-bold uppercase tracking-widest px-1">
                  Preset
                </label>
                <select
                  title="Preset"
                  className="text-[10px] md:text-xs font-bold px-3 py-1.5 md:py-2 rounded-xl border border-white/6 focus:outline-none cursor-pointer"
                  style={{ background: "#0d0d14", color: "#e4e4e7" }}
                  onChange={(e) => {
                    if (e.target.value) loadPreset(e.target.value);
                  }}
                  defaultValue=""
                >
                  <option
                    value=""
                    disabled
                    style={{ background: "#0d0d14", color: "#52525b" }}
                  >
                    LOAD...
                  </option>
                  {(Object.entries(PRESETS) as [string, BeatPreset][]).map(
                    ([k, p]) => (
                      <option
                        key={k}
                        value={k}
                        style={{ background: "#0d0d14", color: "#e4e4e7" }}
                      >
                        {p.name}
                      </option>
                    ),
                  )}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[9px] md:text-[10px] text-zinc-400 font-bold uppercase tracking-widest px-1">
                  Drum Kit
                </label>
                <select
                  title="Drum sample kit"
                  value={activeKit}
                  onChange={(e) => loadDrumKit(e.target.value as DrumKit)}
                  className="text-[10px] md:text-xs font-bold px-3 py-1.5 md:py-2 rounded-xl border border-indigo-400/25 focus:outline-none cursor-pointer"
                  style={{ background: "#0d0d14", color: "#c7d2fe" }}
                >
                  {drumKits.map((kit) => (
                    <option
                      key={kit.id}
                      value={kit.id}
                      style={{ background: "#0d0d14", color: "#e4e4e7" }}
                    >
                      {kit.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        <SequencerGrid
          tracks={tracks}
          grid={grid}
          currentStep={currentStep}
          onMouseDown={handleMouseDown}
          onMouseEnter={handleMouseEnter}
          onAddTrack={handleAddTrack}
          showAddButton={
            tracks.length < INITIAL_TRACKS.length + EXTRA_TRACKS.length
          }
        />

        <BassPianoRoll
          notes={bassNotes}
          currentStep={currentStep}
          onPreview={previewBassNote}
          onAdd={addBassNote}
          onRemove={removeBassNote}
          onResize={resizeBassNote}
          onMove={moveBassNote}
        />

        <div
          className="w-full max-w-6xl rounded-2xl border border-white/6 p-3.5 md:p-4.5"
          style={{
            background: "#121218",
          }}
        >
          <div className="flex items-center gap-3 mb-3 md:mb-4">
            <Volume2 className="w-3.5 h-3.5 text-zinc-400" />
            <h2 className="text-zinc-400 font-bold text-[10px] uppercase tracking-[0.3em]">
              Mixer
            </h2>
            <div
              className="flex-1 h-px"
              style={{
                background:
                  "linear-gradient(to right,rgba(255,255,255,0.05),transparent)",
              }}
            />
          </div>
          <div className="flex justify-start lg:justify-center gap-3 md:gap-6 px-2 overflow-x-auto pb-2 w-full">
            {[...tracks, BASS_MIXER_TRACK].map((track) => {
              const lvl = Math.max(-60, meterValues[track.id] || -60);
              const ht = ((lvl + 60) / 60) * 100;
              const meterBg =
                lvl > -3
                  ? "linear-gradient(to top,#f43f5e,#fb923c)"
                  : lvl > -12
                    ? "linear-gradient(to top,#fbbf24,#84cc16)"
                    : `linear-gradient(to top,${track.accent},${track.accent}88)`;
              return (
                <div
                  key={track.id}
                  className="flex flex-col items-center gap-2 w-12 md:w-14 shrink-0"
                >
                  <span
                    className="text-[9px] font-mono tabular-nums"
                    style={{ color: "rgba(161,161,170,0.5)" }}
                  >
                    {(volumes[track.id] ?? 0).toFixed(0)}
                  </span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => toggleMute(track.id)}
                      className="w-5 h-5 md:w-6 md:h-6 rounded-md flex items-center justify-center text-[9px] font-black transition-all"
                      style={{
                        background: mutes[track.id]
                          ? "rgba(245,158,11,0.2)"
                          : "rgba(255,255,255,0.04)",
                        border: mutes[track.id]
                          ? "1px solid rgba(245,158,11,0.5)"
                          : "1px solid rgba(255,255,255,0.06)",
                        color: mutes[track.id] ? "#fbbf24" : "#52525b",
                        boxShadow: mutes[track.id]
                          ? "0 0 10px rgba(245,158,11,0.3)"
                          : "none",
                      }}
                    >
                      M
                    </button>
                    <button
                      onClick={() => toggleSolo(track.id)}
                      className="w-5 h-5 md:w-6 md:h-6 rounded-md flex items-center justify-center text-[9px] font-black transition-all"
                      style={{
                        background: solos[track.id]
                          ? "rgba(99,102,241,0.2)"
                          : "rgba(255,255,255,0.04)",
                        border: solos[track.id]
                          ? "1px solid rgba(99,102,241,0.5)"
                          : "1px solid rgba(255,255,255,0.06)",
                        color: solos[track.id] ? "#818cf8" : "#52525b",
                        boxShadow: solos[track.id]
                          ? "0 0 10px rgba(99,102,241,0.3)"
                          : "none",
                      }}
                    >
                      S
                    </button>
                  </div>
                  <div
                    className="flex gap-1.5 md:gap-2 h-36 md:h-44 p-1.5 rounded-xl border border-white/4"
                    style={{ background: "rgba(0,0,0,0.3)" }}
                  >
                    {renderFader(track.id, volumes[track.id] ?? 0)}
                    <div
                      className="w-1.5 h-full rounded-full relative overflow-hidden"
                      style={{ background: "rgba(255,255,255,0.04)" }}
                    >
                      <div
                        className="absolute bottom-0 w-full rounded-full transition-all duration-75 ease-out"
                        style={{
                          height: `${Math.min(100, Math.max(0, ht))}%`,
                          background: meterBg,
                          boxShadow:
                            lvl > -12 ? `0 0 6px ${track.glow}` : "none",
                        }}
                      />
                    </div>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <div
                      className="w-1.5 h-1.5 rounded-full"
                      style={{
                        background: track.accent,
                        boxShadow: `0 0 6px ${track.glow}`,
                      }}
                    />
                    <span
                      className="text-[8px] md:text-[9px] font-bold tracking-wider text-center leading-tight"
                      style={{ color: "rgba(161,161,170,0.7)" }}
                    >
                      {track.name}
                    </span>
                    <select
                      aria-label={`${track.name} sample`}
                      title={`Change ${track.name} sample`}
                      value={sampleAssignments[track.id] ?? "808"}
                      onChange={(e) =>
                        setTrackSample(track.id, e.target.value as DrumKit)
                      }
                      className="w-12 md:w-14 px-1 py-0.5 rounded border border-white/10 bg-transparent text-[7px] md:text-[8px] font-bold text-zinc-400 cursor-pointer focus:outline-none focus:border-indigo-400"
                    >
                      {drumKits.map((kit) => (
                        <option
                          key={kit.id}
                          value={kit.id}
                          style={{ background: "#0d0d14" }}
                        >
                          {kit.name.replace(" Kit", "")}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              );
            })}
            <div
              className="w-px mx-2 rounded-full self-stretch"
              style={{ background: "rgba(255,255,255,0.05)" }}
            />
            <div className="flex flex-col items-center gap-2 w-12 md:w-14 shrink-0">
              <span
                className="text-[9px] font-mono tabular-nums"
                style={{ color: "rgba(161,161,170,0.5)" }}
              >
                {(volumes["master"] ?? 0).toFixed(0)}
              </span>
              <div className="flex gap-1 opacity-0 pointer-events-none">
                <div className="w-5 h-5 md:w-6 md:h-6" />
                <div className="w-5 h-5 md:w-6 md:h-6" />
              </div>
              <div
                className="flex gap-1.5 md:gap-2 h-36 md:h-44 p-1.5 rounded-xl border border-white/6"
                style={{ background: "rgba(0,0,0,0.3)" }}
              >
                {renderFader("master", volumes["master"] ?? 0)}
                <div
                  className="w-1.5 h-full rounded-full relative overflow-hidden"
                  style={{ background: "rgba(255,255,255,0.04)" }}
                >
                  <div
                    className="absolute bottom-0 w-full rounded-full transition-all duration-75 ease-out"
                    style={{
                      height: `${Math.min(100, Math.max(0, masterHeight))}%`,
                      background:
                        masterLevel > -3
                          ? "linear-gradient(to top,#f43f5e,#fb923c)"
                          : "linear-gradient(to top,#6366f1,#8b5cf6)",
                      boxShadow:
                        masterLevel > -3
                          ? "0 0 8px rgba(244,63,94,0.5)"
                          : "0 0 8px rgba(99,102,241,0.4)",
                    }}
                  />
                </div>
              </div>
              <div className="flex flex-col items-center gap-1">
                <div
                  className="w-1.5 h-1.5 rounded-full"
                  style={{
                    background: "#6366f1",
                    boxShadow: "0 0 6px rgba(99,102,241,0.6)",
                  }}
                />
                <span className="text-[8px] md:text-[9px] font-bold tracking-wider text-white/60">
                  MASTER
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface BassPianoRollProps {
  notes: BassNote[];
  currentStep: number;
  onPreview: (note: string) => void;
  onAdd: (pitchIndex: number, step: number) => void;
  onRemove: (id: number) => void;
  onResize: (id: number, start: number, length: number) => void;
  onMove: (id: number, pitchIndex: number, start: number) => void;
}

const BassPianoRoll = memo(function BassPianoRoll({
  notes,
  currentStep,
  onPreview,
  onAdd,
  onRemove,
  onResize,
  onMove,
}: BassPianoRollProps) {
  const isErasing = useRef(false);
  const [eraseMode, setEraseMode] = useState(false);
  const resizing = useRef<{
    id: number;
    edge: "left" | "right";
    start: number;
    end: number;
    rowLeft: number;
    rowWidth: number;
  } | null>(null);
  const moving = useRef<{
    id: number;
    pitchIndex: number;
    start: number;
    pointerX: number;
    pointerY: number;
    rowWidth: number;
    rowHeight: number;
  } | null>(null);

  useEffect(() => {
    const resize = (event: MouseEvent) => {
      const active = resizing.current;
      if (active) {
        const step = Math.max(
          0,
          Math.min(
            STEPS - 1,
            Math.floor(
              ((event.clientX - active.rowLeft) / active.rowWidth) * STEPS,
            ),
          ),
        );
        if (active.edge === "left") {
          const start = Math.min(step, active.end - 1);
          onResize(active.id, start, active.end - start);
        } else {
          const end = Math.max(active.start + 1, step + 1);
          onResize(active.id, active.start, end - active.start);
        }
        return;
      }

      const dragged = moving.current;
      if (dragged) {
        const stepDelta = Math.round(
          (event.clientX - dragged.pointerX) / (dragged.rowWidth / STEPS),
        );
        const pitchDelta = Math.round(
          (event.clientY - dragged.pointerY) / dragged.rowHeight,
        );
        onMove(
          dragged.id,
          Math.max(
            0,
            Math.min(BASS_NOTES.length - 1, dragged.pitchIndex + pitchDelta),
          ),
          dragged.start + stepDelta,
        );
      }
    };
    const stop = () => {
      isErasing.current = false;
      setEraseMode(false);
      resizing.current = null;
      moving.current = null;
    };
    window.addEventListener("mousemove", resize);
    window.addEventListener("mouseup", stop);
    return () => {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stop);
    };
  }, [onMove, onResize]);

  const beginResize = (
    event: React.MouseEvent,
    note: BassNote,
    edge: "left" | "right",
  ) => {
    event.preventDefault();
    event.stopPropagation();
    if (event.button !== 0) return;
    const row = event.currentTarget.closest("[data-bass-row]");
    if (!row) return;
    const bounds = row.getBoundingClientRect();
    resizing.current = {
      id: note.id,
      edge,
      start: note.start,
      end: note.start + note.length,
      rowLeft: bounds.left,
      rowWidth: bounds.width,
    };
  };

  const beginMove = (event: React.MouseEvent, note: BassNote) => {
    if (event.button !== 0) return;
    event.preventDefault();
    const row = event.currentTarget.closest("[data-bass-row]");
    const rows = event.currentTarget.closest("[data-piano-rows]");
    if (!row || !rows) return;
    const rowBounds = row.getBoundingClientRect();
    const rowsBounds = rows.getBoundingClientRect();
    moving.current = {
      id: note.id,
      pitchIndex: note.pitchIndex,
      start: note.start,
      pointerX: event.clientX,
      pointerY: event.clientY,
      rowWidth: rowBounds.width,
      rowHeight: rowsBounds.height / BASS_NOTES.length,
    };
  };
  return (
    <div
      className={`w-full max-w-6xl rounded-2xl border border-indigo-400/20 p-3 md:p-4 mb-3 md:mb-4 overflow-hidden ${eraseMode ? "cursor-not-allowed" : ""}`}
      style={{ background: "linear-gradient(135deg,#101018,#0b0b12)" }}
      onContextMenu={(event) => event.preventDefault()}
      onMouseDownCapture={(event) => {
        if (event.button === 2) {
          event.preventDefault();
          isErasing.current = true;
          setEraseMode(true);
        }
      }}
    >
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <div>
            <h2 className="text-zinc-200 font-bold text-[10px] uppercase tracking-[0.3em]">
              808 Bass Piano Roll
            </h2>
            <p className="hidden">Piano roll · choose a pitch for each step</p>
          </div>
        </div>
      </div>
      <div
        className="rounded-xl overflow-hidden"
        style={{ background: "rgba(0,0,0,0.22)" }}
        data-piano-rows
      >
        {BASS_NOTES.map((note, noteIndex) => {
          const blackKey = note.includes("#");
          return (
            <div
              key={note}
              className="flex items-stretch gap-3 md:gap-4 min-h-6 md:min-h-7"
            >
              <button
                type="button"
                onDoubleClick={() => onPreview(note)}
                className="w-16 md:w-20 shrink-0 py-1 text-left px-2 md:px-3 text-[9px] md:text-[10px] font-bold tracking-widest transition-colors"
                style={{
                  background: blackKey
                    ? "#09090d"
                    : "linear-gradient(90deg,#e4e4e7,#b8b8c1)",
                  color: blackKey ? "#71717a" : "#18181b",
                }}
                title={`Double-click to preview ${note}`}
              >
                {note}
              </button>
              <div className="relative flex-1 grid grid-cols-16" data-bass-row>
                {Array.from({ length: STEPS }, (_, step) => (
                  <button
                    type="button"
                    key={step}
                    aria-label={`Add ${note} at step ${step + 1}`}
                    onClick={() => onAdd(noteIndex, step)}
                    className="min-h-6 md:min-h-7 border-r border-b border-white/5"
                    style={{
                      background: blackKey
                        ? "rgba(0,0,0,0.25)"
                        : step % 4 === 0
                          ? "rgba(255,255,255,0.075)"
                          : "rgba(255,255,255,0.03)",
                      boxShadow:
                        currentStep === step
                          ? "inset 0 0 0 1px rgba(255,255,255,0.5)"
                          : "none",
                    }}
                  />
                ))}
                {notes
                  .filter((bassNote) => bassNote.pitchIndex === noteIndex)
                  .map((bassNote) => (
                    <div
                      key={bassNote.id}
                      className={`absolute top-0 bottom-0 z-10 rounded-sm border border-indigo-200 select-none ${eraseMode ? "cursor-not-allowed" : "cursor-grab active:cursor-grabbing"}`}
                      style={{
                        left: `calc(${(bassNote.start / STEPS) * 100}% + 1px)`,
                        width: `calc(${(bassNote.length / STEPS) * 100}% - 2px)`,
                        background: "linear-gradient(135deg,#a5b4fc,#4f46e5)",
                        boxShadow:
                          "inset 0 0 12px rgba(255,255,255,0.22),0 0 8px rgba(99,102,241,0.55)",
                      }}
                      onMouseDownCapture={(event) => {
                        if (event.button === 2) {
                          event.preventDefault();
                          onRemove(bassNote.id);
                        }
                      }}
                      onMouseDown={(event) => beginMove(event, bassNote)}
                      onMouseEnter={() => {
                        if (isErasing.current) onRemove(bassNote.id);
                      }}
                      onDoubleClick={() => onRemove(bassNote.id)}
                      onContextMenu={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        onRemove(bassNote.id);
                      }}
                      title="Left-drag either edge to resize. Right-click to remove."
                    >
                      <span
                        onMouseDown={(event) =>
                          beginResize(event, bassNote, "left")
                        }
                        className={`absolute left-0 top-0 bottom-0 w-2 ${eraseMode ? "cursor-not-allowed" : "cursor-ew-resize"}`}
                      />
                      <span
                        onMouseDown={(event) =>
                          beginResize(event, bassNote, "right")
                        }
                        className={`absolute right-0 top-0 bottom-0 w-2 ${eraseMode ? "cursor-not-allowed" : "cursor-ew-resize"}`}
                      />
                    </div>
                  ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});

interface SequencerGridProps {
  tracks: TrackConfig[];
  grid: boolean[][];
  currentStep: number;
  onMouseDown: (ti: number, si: number, active?: boolean) => void;
  onMouseEnter: (ti: number, si: number) => void;
  onAddTrack: () => void;
  showAddButton: boolean;
}

const SequencerGrid = memo(function SequencerGrid({
  tracks,
  grid,
  currentStep,
  onMouseDown,
  onMouseEnter,
  onAddTrack,
  showAddButton,
}: SequencerGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const lastTouchRef = useRef<{ track: number; step: number } | null>(null);
  const [eraseMode, setEraseMode] = useState(false);

  useEffect(() => {
    const stopErasing = () => setEraseMode(false);
    window.addEventListener("mouseup", stopErasing);
    return () => window.removeEventListener("mouseup", stopErasing);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ts = (e: TouchEvent) => {
      if (e.cancelable) e.preventDefault();
      const t = e.touches[0];
      const cell = document
        .elementFromPoint(t.clientX, t.clientY)
        ?.closest("[data-track][data-step]") as HTMLElement | null;
      if (cell) {
        const ti = parseInt(cell.dataset.track!),
          si = parseInt(cell.dataset.step!);
        lastTouchRef.current = { track: ti, step: si };
        onMouseDown(ti, si);
      }
    };
    const tm = (e: TouchEvent) => {
      if (e.cancelable) e.preventDefault();
      const t = e.touches[0];
      const cell = document
        .elementFromPoint(t.clientX, t.clientY)
        ?.closest("[data-track][data-step]") as HTMLElement | null;
      if (cell) {
        const ti = parseInt(cell.dataset.track!),
          si = parseInt(cell.dataset.step!);
        if (
          !lastTouchRef.current ||
          lastTouchRef.current.track !== ti ||
          lastTouchRef.current.step !== si
        ) {
          lastTouchRef.current = { track: ti, step: si };
          onMouseEnter(ti, si);
        }
      }
    };
    el.addEventListener("touchstart", ts, { passive: false });
    el.addEventListener("touchmove", tm, { passive: false });
    return () => {
      el.removeEventListener("touchstart", ts);
      el.removeEventListener("touchmove", tm);
    };
  }, [onMouseDown, onMouseEnter]);

  return (
    <div
      ref={containerRef}
      onContextMenu={(event) => event.preventDefault()}
      className={`w-full max-w-6xl rounded-2xl border border-white/6 p-3 md:p-4 mb-3 md:mb-4 ${eraseMode ? "cursor-not-allowed" : ""}`}
      style={{
        background: "#121218",
      }}
    >
      {tracks.map((track, ti) => (
        <div
          key={track.id}
          className="flex items-center gap-3 md:gap-4 mb-1.5 md:mb-2 last:mb-0"
        >
          <div className="w-16 md:w-20 shrink-0 flex flex-col gap-1">
            <span
              className={`text-[9px] md:text-[10px] font-black tracking-[0.15em] uppercase ${track.text}`}
            >
              {track.name}
            </span>
            <div
              className="h-px w-full rounded-full opacity-30"
              style={{ background: track.accent }}
            />
          </div>
          <div className="flex-1 grid grid-cols-16 gap-1">
            {grid[ti].map((isActive, si) => {
              const isDown = si % 4 === 0;
              const isCur = currentStep === si;
              return (
                <div
                  key={si}
                  className={`aspect-square relative touch-none ${eraseMode ? "cursor-not-allowed" : "cursor-pointer"}`}
                  data-track={ti}
                  data-step={si}
                  onMouseDown={(event) => {
                    event.preventDefault();
                    if (event.button === 0) onMouseDown(ti, si, true);
                    if (event.button === 2) {
                      setEraseMode(true);
                      onMouseDown(ti, si, false);
                    }
                  }}
                  onMouseEnter={() => onMouseEnter(ti, si)}
                >
                  <div
                    className="absolute inset-0 rounded-md"
                    style={{
                      transition:
                        "background 75ms ease, border-color 75ms ease, box-shadow 75ms ease",
                      background: isActive
                        ? track.accent
                        : isDown
                          ? "rgba(255,255,255,0.06)"
                          : "rgba(255,255,255,0.025)",
                      border: isActive
                        ? `1px solid ${track.accent}`
                        : "1px solid rgba(255,255,255,0.04)",
                      boxShadow: isActive
                        ? `0 0 10px ${track.glow},inset 0 1px 0 rgba(255,255,255,0.25)`
                        : isCur
                          ? "0 0 10px rgba(255,255,255,0.2)"
                          : "none",
                      transform: isCur ? "scale(1.08)" : "scale(1)",
                      opacity: isCur && !isActive ? 0.95 : 1,
                      outline: isCur
                        ? "1.5px solid rgba(255,255,255,0.65)"
                        : "none",
                      outlineOffset: "1px",
                    }}
                  />
                </div>
              );
            })}
          </div>
        </div>
      ))}
      {showAddButton && (
        <div className="flex justify-center mt-4">
          <button
            onClick={onAddTrack}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.06)",
              color: "rgba(161,161,170,0.6)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "rgba(99,102,241,0.4)";
              e.currentTarget.style.color = "#818cf8";
              e.currentTarget.style.background = "rgba(99,102,241,0.08)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)";
              e.currentTarget.style.color = "rgba(161,161,170,0.6)";
              e.currentTarget.style.background = "rgba(255,255,255,0.03)";
            }}
          >
            <Plus className="w-3.5 h-3.5" />
            Add Track
          </button>
        </div>
      )}
    </div>
  );
});
