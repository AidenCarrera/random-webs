"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as Tone from "tone";
import {
  CircleDot,
  Clock3,
  Gauge,
  Pause,
  Play,
  RotateCcw,
  Rows3,
  Volume2,
  VolumeX,
} from "lucide-react";

type ViewMode = "circle" | "timeline";
type PulseKey = `${number}-${number}`;

type Rhythm = {
  count: number;
  color: string;
  glow: string;
  tone: string;
};

const RHYTHMS: Rhythm[] = [
  { count: 1, color: "#ffffff", glow: "rgba(255,255,255,0.45)", tone: "B4" },
  { count: 2, color: "#ef4444", glow: "rgba(239,68,68,0.45)", tone: "C5" },
  { count: 3, color: "#f97316", glow: "rgba(249,115,22,0.45)", tone: "D5" },
  { count: 4, color: "#facc15", glow: "rgba(250,204,21,0.45)", tone: "E5" },
  { count: 5, color: "#84cc16", glow: "rgba(132,204,22,0.45)", tone: "F5" },
  { count: 6, color: "#22c55e", glow: "rgba(34,197,94,0.45)", tone: "G5" },
  { count: 7, color: "#14b8a6", glow: "rgba(20,184,166,0.45)", tone: "A5" },
  { count: 8, color: "#06b6d4", glow: "rgba(6,182,212,0.45)", tone: "B5" },
  { count: 9, color: "#3b82f6", glow: "rgba(59,130,246,0.45)", tone: "C6" },
  { count: 10, color: "#6366f1", glow: "rgba(99,102,241,0.45)", tone: "D6" },
  { count: 11, color: "#a855f7", glow: "rgba(168,85,247,0.45)", tone: "E6" },
  { count: 12, color: "#581c87", glow: "rgba(88,28,135,0.55)", tone: "F6" },
];

const DEFAULT_RHYTHMS = [3, 4];
const CYCLE_BEATS = 4;

const clampBpm = (value: number) => Math.min(220, Math.max(40, value));
const getCycleSeconds = (bpm: number) => (60 / bpm) * CYCLE_BEATS;
const getPulseKey = (rhythm: number, pulse: number): PulseKey =>
  `${rhythm}-${pulse}`;

class ClickEngine {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private activeNodes = new Set<AudioScheduledSourceNode | GainNode>();

  async init() {
    await Tone.start();
    if (this.audioContext && this.masterGain) return;

    this.audioContext = Tone.getContext().rawContext as AudioContext;
    this.masterGain = this.audioContext.createGain();
    this.masterGain.gain.value = 0.34;
    this.masterGain.connect(this.audioContext.destination);
  }

  playClick(rhythm: Rhythm, isDownbeat: boolean) {
    if (!this.audioContext || !this.masterGain) return;

    const start = this.audioContext.currentTime;
    const duration = isDownbeat ? 0.055 : 0.035;
    const oscillator = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    const baseFrequency = Tone.Frequency(rhythm.tone).toFrequency();

    oscillator.type = isDownbeat ? "triangle" : "sine";
    oscillator.frequency.setValueAtTime(
      isDownbeat ? baseFrequency * 0.72 : baseFrequency,
      start,
    );
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(isDownbeat ? 0.5 : 0.26, start + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

    oscillator.connect(gain);
    gain.connect(this.masterGain);
    this.activeNodes.add(oscillator);
    this.activeNodes.add(gain);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.01);
    oscillator.onended = () => {
      oscillator.disconnect();
      gain.disconnect();
      this.activeNodes.delete(oscillator);
      this.activeNodes.delete(gain);
    };
  }

  getCurrentTime() {
    return this.audioContext?.currentTime ?? 0;
  }

  getOutputLatencySeconds() {
    if (!this.audioContext) return 0;

    return Math.min(
      0.12,
      Math.max(
        0,
        this.audioContext.baseLatency +
          (this.audioContext.outputLatency ?? 0),
      ),
    );
  }

  setMuted(isMuted: boolean) {
    if (this.masterGain) {
      this.masterGain.gain.setTargetAtTime(
        isMuted ? 0 : 0.34,
        this.audioContext?.currentTime ?? 0,
        0.01,
      );
    }
  }

  silence() {
    const now = this.audioContext?.currentTime ?? 0;

    this.activeNodes.forEach((node) => {
      if (node instanceof GainNode) {
        node.gain.cancelScheduledValues(now);
        node.gain.setTargetAtTime(0.0001, now, 0.005);
        return;
      }

      try {
        node.stop(now + 0.01);
      } catch {
        // Some nodes may already have ended naturally.
      }
    });
  }

  dispose() {
    this.silence();
    this.masterGain?.disconnect();
    this.masterGain = null;
    this.audioContext = null;
    this.activeNodes.clear();
  }
}

export default function PolyrhythmVisualizer() {
  const [activeRhythms, setActiveRhythms] = useState(DEFAULT_RHYTHMS);
  const [bpm, setBpm] = useState(90);
  const [bpmInput, setBpmInput] = useState("90");
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [mode, setMode] = useState<ViewMode>("circle");
  const [progress, setProgress] = useState(0);
  const [activePulses, setActivePulses] = useState<Set<PulseKey>>(new Set());

  const engineRef = useRef<ClickEngine | null>(null);
  const activeRhythmsRef = useRef(activeRhythms);
  const bpmRef = useRef(bpm);
  const isMutedRef = useRef(isMuted);
  const isPlayingRef = useRef(isPlaying);
  const rafRef = useRef<number | null>(null);
  const audioStartTimeRef = useRef(0);
  const cyclePositionRef = useRef(0);
  const currentProgressRef = useRef(0);
  const lastElapsedRef = useRef(0);
  const pulseTimersRef = useRef<number[]>([]);

  const activeRhythmData = useMemo(
    () =>
      RHYTHMS.filter((rhythm) => activeRhythms.includes(rhythm.count)).sort(
        (a, b) => a.count - b.count,
      ),
    [activeRhythms],
  );

  useEffect(() => {
    activeRhythmsRef.current = activeRhythms;
  }, [activeRhythms]);

  useEffect(() => {
    bpmRef.current = bpm;
    setBpmInput(bpm.toString());

    const cycleSeconds = getCycleSeconds(bpm);
    const nextCyclePosition = currentProgressRef.current * cycleSeconds;
    cyclePositionRef.current = nextCyclePosition;
    lastElapsedRef.current = nextCyclePosition;

    if (isPlayingRef.current && engineRef.current) {
      audioStartTimeRef.current =
        engineRef.current.getCurrentTime() - nextCyclePosition;
    }
  }, [bpm]);

  useEffect(() => {
    isMutedRef.current = isMuted;
    engineRef.current?.setMuted(isMuted);
  }, [isMuted]);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  const flashPulse = useCallback(
    (rhythm: number, pulse: number, isDownbeat: boolean) => {
      const key = getPulseKey(rhythm, pulse);
      setActivePulses((prev) => new Set(prev).add(key));

      if (isDownbeat) {
        activeRhythmsRef.current.forEach((count) => {
          setActivePulses((prev) => new Set(prev).add(getPulseKey(count, 0)));
        });
      }

      const timer = window.setTimeout(
        () => {
          setActivePulses((prev) => {
            const next = new Set(prev);
            next.delete(key);
            if (isDownbeat) {
              activeRhythmsRef.current.forEach((count) =>
                next.delete(getPulseKey(count, 0)),
              );
            }
            return next;
          });
        },
        isDownbeat ? 170 : 130,
      );
      pulseTimersRef.current.push(timer);
    },
    [],
  );

  const stopVisualLoop = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const triggerPulsesBetween = useCallback(
    (fromElapsed: number, toElapsed: number) => {
      const engine = engineRef.current;
      if (!engine || toElapsed < fromElapsed) return;

      const cycleSeconds = getCycleSeconds(bpmRef.current);

      activeRhythmsRef.current.forEach((count) => {
        const rhythm = RHYTHMS.find((item) => item.count === count);
        if (!rhythm) return;

        const pulseInterval = cycleSeconds / count;
        const firstPulseIndex = Math.floor(fromElapsed / pulseInterval) + 1;
        const lastPulseIndex = Math.floor(toElapsed / pulseInterval);

        for (
          let pulseIndex = firstPulseIndex;
          pulseIndex <= lastPulseIndex;
          pulseIndex += 1
        ) {
          const pulse = ((pulseIndex % count) + count) % count;
          const isDownbeat = pulse === 0;

          if (!isMutedRef.current) {
            engine.playClick(rhythm, isDownbeat);
          }

          flashPulse(count, pulse, isDownbeat);
        }
      });
    },
    [flashPulse],
  );

  const startVisualLoop = useCallback(() => {
    stopVisualLoop();

    const tick = () => {
      const engine = engineRef.current;
      if (!engine) return;

      const cycleSeconds = getCycleSeconds(bpmRef.current);
      const rawElapsed = Math.max(
        0,
        engine.getCurrentTime() - audioStartTimeRef.current,
      );
      const visualElapsed = Math.max(
        0,
        rawElapsed - engine.getOutputLatencySeconds(),
      );
      const seconds = ((visualElapsed % cycleSeconds) + cycleSeconds) % cycleSeconds;
      const nextProgress = seconds / cycleSeconds;

      triggerPulsesBetween(lastElapsedRef.current, rawElapsed);
      lastElapsedRef.current = rawElapsed;
      currentProgressRef.current = nextProgress;
      setProgress(nextProgress);
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
  }, [stopVisualLoop, triggerPulsesBetween]);

  const clearPulseTimers = useCallback(() => {
    pulseTimersRef.current.forEach((timer) => window.clearTimeout(timer));
    pulseTimersRef.current = [];
  }, []);

  const togglePlay = useCallback(async () => {
    if (!engineRef.current) {
      engineRef.current = new ClickEngine();
    }

    await engineRef.current.init();
    engineRef.current.setMuted(isMutedRef.current);

    if (isPlaying) {
      const cycleSeconds = getCycleSeconds(bpmRef.current);
      cyclePositionRef.current = currentProgressRef.current * cycleSeconds;
      lastElapsedRef.current = cyclePositionRef.current;
      engineRef.current.silence();
      clearPulseTimers();
      setActivePulses(new Set());
      stopVisualLoop();
      setIsPlaying(false);
      return;
    }

    audioStartTimeRef.current =
      engineRef.current.getCurrentTime() - cyclePositionRef.current;
    lastElapsedRef.current =
      cyclePositionRef.current === 0
        ? -0.001
        : cyclePositionRef.current;
    startVisualLoop();
    setIsPlaying(true);
  }, [clearPulseTimers, isPlaying, startVisualLoop, stopVisualLoop]);

  const reset = useCallback(() => {
    const engine = engineRef.current;
    cyclePositionRef.current = 0;
    lastElapsedRef.current = isPlaying ? -0.001 : 0;
    currentProgressRef.current = 0;
    setProgress(0);
    clearPulseTimers();
    setActivePulses(new Set());
    engine?.silence();
    if (isPlaying) {
      audioStartTimeRef.current = engine?.getCurrentTime() ?? 0;
      startVisualLoop();
    }
  }, [clearPulseTimers, isPlaying, startVisualLoop]);

  const toggleRhythm = (count: number) => {
    setActiveRhythms((prev) => {
      if (prev.includes(count)) {
        return prev.length === 1 ? prev : prev.filter((item) => item !== count);
      }
      return [...prev, count].sort((a, b) => a - b);
    });
  };

  const commitBpm = () => {
    const parsed = parseInt(bpmInput, 10);
    const nextBpm = clampBpm(Number.isNaN(parsed) ? 90 : parsed);
    setBpm(nextBpm);
    setBpmInput(nextBpm.toString());
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isTypingTarget =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target?.isContentEditable;

      if (isTypingTarget) return;

      if (event.code === "Space") {
        event.preventDefault();
        void togglePlay();
        return;
      }

      if (event.key === "m" || event.key === "M") {
        event.preventDefault();
        setIsMuted((prev) => !prev);
        return;
      }

      if (event.key === "r" || event.key === "R") {
        event.preventDefault();
        reset();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [reset, togglePlay]);

  useEffect(() => {
    return () => {
      stopVisualLoop();
      clearPulseTimers();
      engineRef.current?.dispose();
    };
  }, [clearPulseTimers, stopVisualLoop]);

  return (
    <div className="min-h-screen overflow-hidden bg-[#08090d] text-white font-sans">
      <div className="fixed inset-0 pointer-events-none opacity-60">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.14),transparent_32%),radial-gradient(circle_at_80%_20%,rgba(249,115,22,0.13),transparent_30%),linear-gradient(135deg,rgba(8,9,13,1),rgba(18,20,28,1))]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:42px_42px]" />
      </div>

      <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-3 rounded-lg border border-white/10 bg-black/35 p-4 shadow-2xl shadow-black/35 backdrop-blur md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="mt-1 text-3xl font-black uppercase tracking-[0.12em] sm:text-4xl">
              Polyrhythm Visualizer
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <IconButton
              label={isPlaying ? "Pause" : "Play"}
              isActive={isPlaying}
              onClick={togglePlay}
            >
              {isPlaying ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </IconButton>
            <IconButton label="Reset" onClick={reset}>
              <RotateCcw className="h-4 w-4" />
            </IconButton>
            <IconButton
              label={isMuted ? "Unmute" : "Mute"}
              isActive={isMuted}
              onClick={() => setIsMuted((prev) => !prev)}
            >
              {isMuted ? (
                <VolumeX className="h-4 w-4" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
            </IconButton>
          </div>
        </header>

        <section className="grid flex-1 gap-4 lg:grid-cols-[300px_minmax(0,1fr)] xl:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="flex flex-col gap-4">
            <div className="rounded-lg border border-white/10 bg-white/[0.055] p-4 backdrop-blur">
              <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.24em] text-white/55">
                <Gauge className="h-4 w-4 text-white" />
                BPM
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="40"
                  max="220"
                  value={bpm}
                  onChange={(event) => setBpm(Number(event.target.value))}
                  className="poly-slider w-full"
                  aria-label="BPM"
                />
                <div className="flex h-11 w-24 items-center rounded-lg border border-white/10 bg-black/35 px-2">
                  <input
                    value={bpmInput}
                    onChange={(event) => setBpmInput(event.target.value)}
                    onBlur={commitBpm}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        commitBpm();
                        event.currentTarget.blur();
                      }
                    }}
                    className="w-full bg-transparent text-center text-lg font-black tabular-nums text-white outline-none"
                    inputMode="numeric"
                    aria-label="BPM value"
                  />
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-white/10 bg-white/[0.055] p-4 backdrop-blur">
              <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.24em] text-white/55">
                <Clock3 className="h-4 w-4 text-white" />
                Rhythms
              </div>
              <div className="grid grid-cols-3 gap-2">
                {RHYTHMS.map((rhythm) => {
                  const selected = activeRhythms.includes(rhythm.count);
                  return (
                    <button
                      key={rhythm.count}
                      onClick={() => toggleRhythm(rhythm.count)}
                      className="relative h-12 rounded-lg border text-base font-black tabular-nums transition-all"
                      style={{
                        color: selected ? "#050608" : rhythm.color,
                        background: selected ? rhythm.color : "rgba(0,0,0,0.28)",
                        borderColor: selected
                          ? rhythm.color
                          : "rgba(255,255,255,0.1)",
                        boxShadow: selected ? `0 0 18px ${rhythm.glow}` : "none",
                      }}
                      title={`${rhythm.count} pulses`}
                    >
                      {rhythm.count}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="rounded-lg border border-white/10 bg-white/[0.055] p-4 backdrop-blur">
              <div className="mb-3 text-xs font-bold uppercase tracking-[0.24em] text-white/55">
                View
              </div>
              <div className="grid grid-cols-2 gap-2">
                <ModeButton
                  label="Circle"
                  active={mode === "circle"}
                  onClick={() => setMode("circle")}
                >
                  <CircleDot className="h-4 w-4" />
                </ModeButton>
                <ModeButton
                  label="Timeline"
                  active={mode === "timeline"}
                  onClick={() => setMode("timeline")}
                >
                  <Rows3 className="h-4 w-4" />
                </ModeButton>
              </div>
            </div>
          </aside>

          <section className="flex min-h-[700px] flex-col rounded-lg border border-white/10 bg-white/[0.045] p-4 shadow-2xl shadow-black/40 backdrop-blur sm:p-6">
            <div className="mb-2 flex justify-end">
              <div className="text-xs font-mono text-white/45">
                Cycle {(progress * 100).toFixed(1)}%
              </div>
            </div>

            <div className="flex flex-1 items-center justify-center rounded-lg border border-white/6 bg-black/20 px-2 py-4 sm:px-4">
              {mode === "circle" ? (
                <CircularVisualizer
                  rhythms={activeRhythmData}
                  progress={progress}
                  activePulses={activePulses}
                />
              ) : (
                <TimelineVisualizer
                  rhythms={activeRhythmData}
                  progress={progress}
                  activePulses={activePulses}
                />
              )}
            </div>
          </section>
        </section>
      </main>

      <style jsx>{`
        .poly-slider {
          appearance: none;
          height: 6px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.16);
          outline: none;
        }

        .poly-slider::-webkit-slider-thumb {
          appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 999px;
          border: 2px solid rgba(0, 0, 0, 0.8);
          background: #ffffff;
          box-shadow: 0 0 16px rgba(255, 255, 255, 0.45);
          cursor: pointer;
        }

        .poly-slider::-moz-range-thumb {
          width: 18px;
          height: 18px;
          border: 2px solid rgba(0, 0, 0, 0.8);
          border-radius: 999px;
          background: #ffffff;
          box-shadow: 0 0 16px rgba(255, 255, 255, 0.45);
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}

function CircularVisualizer({
  rhythms,
  progress,
  activePulses,
}: {
  rhythms: Rhythm[];
  progress: number;
  activePulses: Set<PulseKey>;
}) {
  const size = 760;
  const center = size / 2;
  const maxRadius = 300;
  const minRadius = 96;
  const ringGap =
    rhythms.length > 1 ? (maxRadius - minRadius) / (rhythms.length - 1) : 0;
  const playheadAngle = progress * Math.PI * 2 - Math.PI / 2;
  const playheadX = center + Math.cos(playheadAngle) * (maxRadius + 26);
  const playheadY = center + Math.sin(playheadAngle) * (maxRadius + 26);

  return (
    <div className="flex h-full w-full flex-col items-center justify-center">
      <div className="mb-4 text-center">
        <div className="text-2xl font-black tracking-[0.16em] text-white sm:text-3xl">
          {rhythms.map((rhythm) => rhythm.count).join(":")}
        </div>
        <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.28em] text-white/45">
          cycle
        </div>
      </div>
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="aspect-square w-full max-w-[780px]"
        role="img"
        aria-label="Circular polyrhythm visualization"
      >
        <circle
          cx={center}
          cy={center}
          r={maxRadius + 46}
          fill="rgba(255,255,255,0.018)"
          stroke="rgba(255,255,255,0.08)"
        />
        <line
          x1={center}
          y1={center}
          x2={playheadX}
          y2={playheadY}
          stroke="rgba(255,255,255,0.82)"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <circle cx={playheadX} cy={playheadY} r="8" fill="#ffffff" />

        {rhythms.map((rhythm, rhythmIndex) => {
          const radius = maxRadius - rhythmIndex * ringGap;
          return (
            <g key={rhythm.count}>
              <circle
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke={rhythm.color}
                strokeOpacity="0.26"
                strokeWidth="2"
              />
              {Array.from({ length: rhythm.count }, (_, pulse) => {
                const angle =
                  (pulse / rhythm.count) * Math.PI * 2 - Math.PI / 2;
                const x = center + Math.cos(angle) * radius;
                const y = center + Math.sin(angle) * radius;
                const isDownbeat = pulse === 0;
                const isActive = activePulses.has(
                  getPulseKey(rhythm.count, pulse),
                );

                return (
                  <g key={pulse}>
                    <circle
                      cx={x}
                      cy={y}
                      r={isActive ? 18 : isDownbeat ? 12 : 9}
                      fill={isDownbeat ? "#ffffff" : rhythm.color}
                      fillOpacity={isActive ? 0.95 : isDownbeat ? 0.85 : 0.74}
                      stroke={isDownbeat ? rhythm.color : "rgba(255,255,255,0.5)"}
                      strokeWidth={isDownbeat ? 3 : 1}
                      style={{
                        filter: isActive
                          ? `drop-shadow(0 0 18px ${rhythm.color})`
                          : isDownbeat
                            ? "drop-shadow(0 0 14px rgba(255,255,255,0.6))"
                            : "none",
                        transition: "r 90ms ease, fill-opacity 90ms ease",
                      }}
                    />
                    {isDownbeat && (
                      <text
                        x={x}
                        y={y - 22}
                        textAnchor="middle"
                        className="fill-white/65 text-[15px] font-bold"
                      >
                        {rhythm.count}
                      </text>
                    )}
                  </g>
                );
              })}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function TimelineVisualizer({
  rhythms,
  progress,
  activePulses,
}: {
  rhythms: Rhythm[];
  progress: number;
  activePulses: Set<PulseKey>;
}) {
  return (
    <div className="relative flex min-h-[560px] w-full max-w-[980px] flex-col justify-center gap-5 overflow-hidden rounded-lg border border-white/8 bg-white/[0.025] p-5 sm:p-8">
      <div
        className="absolute bottom-8 top-8 w-px bg-white shadow-[0_0_18px_rgba(255,255,255,0.75)]"
        style={{ left: `calc(96px + (100% - 128px) * ${progress})` }}
      />
      <div
        className="absolute bottom-8 top-8 w-px bg-white/30"
        style={{ left: "96px" }}
      />

      {rhythms.map((rhythm) => (
        <div key={rhythm.count} className="grid grid-cols-[80px_1fr] gap-6">
          <div className="flex items-center justify-end gap-2">
            <span
              className="h-2 w-2 rounded-full"
              style={{
                background: rhythm.color,
                boxShadow: `0 0 10px ${rhythm.glow}`,
              }}
            />
            <span className="font-mono text-base font-black text-white/75">
              /{rhythm.count}
            </span>
          </div>
          <div className="relative h-16 rounded-lg border border-white/8 bg-black/24">
            <div className="absolute left-0 right-0 top-1/2 h-px -translate-y-1/2 bg-white/12" />
            {Array.from({ length: rhythm.count }, (_, pulse) => {
              const left = rhythm.count === 1 ? 0 : (pulse / rhythm.count) * 100;
              const isDownbeat = pulse === 0;
              const isActive = activePulses.has(
                getPulseKey(rhythm.count, pulse),
              );

              return (
                <div
                  key={pulse}
                  className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full transition-all"
                  style={{
                    left: `${left}%`,
                    width: isActive ? 26 : isDownbeat ? 20 : 14,
                    height: isActive ? 26 : isDownbeat ? 20 : 14,
                    background: isDownbeat ? "#ffffff" : rhythm.color,
                    border: `2px solid ${isDownbeat ? rhythm.color : "rgba(255,255,255,0.42)"}`,
                    boxShadow: isActive
                      ? `0 0 20px ${rhythm.color}`
                      : isDownbeat
                        ? "0 0 14px rgba(255,255,255,0.55)"
                        : "none",
                  }}
                />
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function IconButton({
  children,
  label,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  isActive?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      className="flex h-11 w-11 items-center justify-center rounded-lg border border-white/10 bg-white/[0.055] text-white transition-all hover:border-white/25 hover:bg-white/10"
    >
      {children}
    </button>
  );
}

function ModeButton({
  children,
  label,
  active,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center justify-center gap-2 rounded-lg border px-3 py-3 text-xs font-black uppercase tracking-[0.18em] transition-all"
      style={{
        background: active ? "rgba(255,255,255,0.9)" : "rgba(0,0,0,0.26)",
        borderColor: active ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.1)",
        color: active ? "#08090d" : "rgba(255,255,255,0.68)",
      }}
    >
      {children}
      <span>{label}</span>
    </button>
  );
}
