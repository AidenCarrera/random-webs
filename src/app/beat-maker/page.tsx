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
import { PRESETS } from "./presets";

const STEPS = 16;

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
    id: "rim",
    name: "RIM",
    color: "bg-teal-400",
    text: "text-teal-400",
    accent: "#2dd4bf",
    glow: "rgba(45,212,191,0.4)",
  },
];

class AudioEngine {
  instruments: Record<
    string,
    Tone.MembraneSynth | Tone.NoiseSynth | Tone.MetalSynth | Tone.Sampler
  > = {};
  channels: Record<string, Tone.Channel> = {};
  meters: Record<string, Tone.Meter> = {};
  master: Tone.Volume | null = null;
  masterMeter: Tone.Meter | null = null;
  limit: Tone.Limiter | null = null;

  async init() {
    await Tone.start();
    this.limit = new Tone.Limiter(-1).toDestination();
    this.master = new Tone.Volume({ volume: 0, mute: false }).connect(
      this.limit,
    );
    this.masterMeter = new Tone.Meter();
    this.master.connect(this.masterMeter);
    INITIAL_TRACKS.forEach((t) => this.initTrack(t.id));
  }

  addTrack(id: string) {
    if (!this.instruments[id]) this.initTrack(id);
  }

  initTrack(id: string) {
    if (!this.master) return;
    const channel = new Tone.Channel({ volume: -6 }).connect(this.master);
    const meter = new Tone.Meter();
    channel.connect(meter);
    this.channels[id] = channel;
    this.meters[id] = meter;
    let inst;
    switch (id) {
      case "kick":
        inst = new Tone.MembraneSynth({
          pitchDecay: 0.06,
          octaves: 7,
          oscillator: { type: "sine" },
          envelope: { attack: 0.001, decay: 0.5, sustain: 0.02, release: 1.4 },
        });
        inst.volume.value = 2;
        break;
      case "snare":
        inst = new Tone.NoiseSynth({
          noise: { type: "white" },
          envelope: { attack: 0.001, decay: 0.2, sustain: 0.01, release: 1.2 },
        });
        inst.volume.value = 0;
        break;
      case "hihat":
        inst = new Tone.MetalSynth({
          envelope: { attack: 0.001, decay: 0.05, release: 0.01 },
          harmonicity: 4.1,
          modulationIndex: 40,
          resonance: 3000,
          octaves: 1,
        });
        inst.frequency.value = 250;
        inst.volume.value = -10;
        break;
      case "clap": {
        const filter = new Tone.Filter(1500, "bandpass");
        inst = new Tone.NoiseSynth({
          noise: { type: "white" },
          envelope: { attack: 0.001, decay: 0.18, sustain: 0, release: 0.08 },
        });
        inst.volume.value = 2;
        inst.connect(filter);
        filter.connect(channel);
        this.instruments[id] = inst;
        return;
      }
      case "openhat":
        inst = new Tone.MetalSynth({
          envelope: { attack: 0.001, decay: 0.2, release: 1.0 },
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
          envelope: { attack: 0.001, decay: 1.0, release: 1.2 },
          harmonicity: 3.1,
          modulationIndex: 20,
          resonance: 2800,
          octaves: 1.5,
        });
        inst.volume.value = -20;
        break;
      case "cowbell":
        inst = new Tone.MetalSynth({
          envelope: { attack: 0.001, decay: 0.1, release: 0.2 },
          harmonicity: 8,
          modulationIndex: 12,
          resonance: 1500,
          octaves: 1,
        });
        inst.frequency.value = 750;
        inst.volume.value = -10;
        break;
      case "rim":
        inst = new Tone.MembraneSynth({
          pitchDecay: 0.01,
          octaves: 2,
          oscillator: { type: "sine" },
          envelope: { attack: 0.001, decay: 0.1, sustain: 0, release: 0.1 },
        });
        inst.volume.value = -4;
        break;
    }
    if (inst) {
      inst.connect(channel);
      this.instruments[id] = inst;
    }
  }

  trigger(id: string, time: number) {
    const inst = this.instruments[id];
    if (!inst) return;
    if (inst instanceof Tone.MembraneSynth) {
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

  setVolume(id: string, dB: number) {
    if (id === "master") {
      if (this.master) this.master.volume.rampTo(dB, 0.1);
    } else {
      const ch = this.channels[id];
      if (ch) ch.volume.rampTo(dB, 0.1);
    }
  }

  setSwing(amount: number) {
    Tone.Transport.swing = amount;
    Tone.Transport.swingSubdivision = "16n";
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
      this.setVolume(id, volumes[id] ?? -6);
      const ch = this.channels[id];
      if (ch) {
        ch.mute = mutes[id] || false || (activeSolos && !(solos[id] || false));
        ch.solo = false;
      }
    });
  }
}

const engine = new AudioEngine();

export default function BeatMaker() {
  const [tracks, setTracks] = useState(INITIAL_TRACKS);
  const [grid, setGrid] = useState(() =>
    Array(INITIAL_TRACKS.length)
      .fill(null)
      .map(() => Array(STEPS).fill(false)),
  );
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
    kick: -6,
    snare: -6,
    hihat: -6,
    clap: -6,
    openhat: -6,
    ride: -6,
    cowbell: -6,
    rim: -6,
    master: 0,
  });
  const [meterValues, setMeterValues] = useState<Record<string, number>>({});
  const [mutes, setMutes] = useState<Record<string, boolean>>({});
  const [solos, setSolos] = useState<Record<string, boolean>>({});
  const [swing, setSwing] = useState(50);
  const isPainting = useRef(false);
  const paintState = useRef(false);
  const seqRef = useRef<Tone.Sequence | null>(null);
  const meterRaf = useRef<number | null>(null);

  const gridRef = useRef(grid);
  const tracksRef = useRef(tracks);
  useEffect(() => {
    gridRef.current = grid;
    tracksRef.current = tracks;
  }, [grid, tracks]);

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

  const loadPreset = (key: string) => {
    if (!PRESETS[key]) return;
    const p = PRESETS[key];
    const all = [...INITIAL_TRACKS, ...EXTRA_TRACKS];
    const cnt = Math.min(p.grid.length, all.length);
    const newTracks = all.slice(0, cnt);
    if (engine.master) newTracks.forEach((t) => engine.addTrack(t.id));
    setTracks(newTracks);
    setGrid(p.grid.slice(0, cnt).map((row) => row.map((c) => c === 1)));
    handleSwingChange(p.swing);
    setTempo(p.tempo);
    setVolumes((prev) => {
      const n: Record<string, number> = { ...prev };
      newTracks.forEach((t) => {
        if (n[t.id] === undefined) n[t.id] = -6;
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
    return () => {
      Tone.Transport.stop();
      Tone.Draw.cancel();
    };
  }, []);

  useEffect(() => {
    const seq = new Tone.Sequence(
      (time, step) => {
        Tone.Draw.schedule(() => {
          setCurrentStep(step);
        }, time);
        tracksRef.current.forEach((track, ti) => {
          if (gridRef.current[ti] && gridRef.current[ti][step]) {
            engine.trigger(track.id, time);
          }
        });
      },
      Array.from({ length: STEPS }, (_, i) => i),
      "16n",
    );
    seq.start(0);
    seqRef.current = seq;
    return () => {
      seq.dispose();
      Tone.Draw.cancel();
    };
  }, []);

  useEffect(() => {
    Tone.Transport.bpm.value = tempo;
  }, [tempo]);

  const togglePlay = useCallback(async () => {
    if (!engine.master) {
      await engine.init();
      tracks.forEach((t) => engine.addTrack(t.id));
      engine.syncState(volumes, mutes, solos);
    }
    if (Tone.getContext().state !== "running") await Tone.start();
    if (isPlaying) {
      Tone.Transport.pause();
      setIsPlaying(false);
    } else {
      Tone.Transport.start();
      setIsPlaying(true);
    }
  }, [isPlaying, volumes, mutes, solos, tracks]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        togglePlay();
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [togglePlay]);

  const clearGrid = () =>
    setGrid(
      Array(tracks.length)
        .fill(null)
        .map(() => Array(STEPS).fill(false)),
    );

  const handleAddTrack = useCallback(() => {
    const idx = tracks.length - INITIAL_TRACKS.length;
    if (idx < EXTRA_TRACKS.length) {
      const t = EXTRA_TRACKS[idx];
      engine.addTrack(t.id);
      setTracks((p) => [...p, t]);
      setGrid((p) => [...p, Array(STEPS).fill(false)]);
      setVolumes((p) => ({ ...p, [t.id]: -6 }));
    }
  }, [tracks.length]);

  const updateStep = useCallback((ti: number, si: number, val: boolean) => {
    setGrid((p) => {
      const g = p.map((r) => [...r]);
      g[ti][si] = val;
      return g;
    });
  }, []);

  const handleMouseDown = useCallback(
    (ti: number, si: number) => {
      isPainting.current = true;
      // Read from ref so this callback never needs to depend on grid state
      const ns = !gridRef.current[ti]?.[si];
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
                  {Object.entries(PRESETS).map(([k, p]) => (
                    <option
                      key={k}
                      value={k}
                      style={{ background: "#0d0d14", color: "#e4e4e7" }}
                    >
                      {p.name}
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
            {tracks.map((track) => {
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
                    {(volumes[track.id] ?? -6).toFixed(0)}
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
                    {renderFader(track.id, volumes[track.id] ?? -6)}
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

interface SequencerGridProps {
  tracks: TrackConfig[];
  grid: boolean[][];
  currentStep: number;
  onMouseDown: (ti: number, si: number) => void;
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
      className="w-full max-w-6xl rounded-2xl border border-white/6 p-3 md:p-4 mb-3 md:mb-4"
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
                  className="aspect-square relative touch-none cursor-pointer"
                  data-track={ti}
                  data-step={si}
                  onMouseDown={() => onMouseDown(ti, si)}
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
