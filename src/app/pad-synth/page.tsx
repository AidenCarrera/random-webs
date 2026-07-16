"use client";

import { Activity, Music } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import * as Tone from "tone";

import styles from "./styles.module.css";

const createScale = (notes: readonly string[]) =>
  Array.from({ length: 16 }, (_, index) => {
    const octave = 4 + Math.floor(index / notes.length);
    return `${notes[index % notes.length]}${octave}`;
  });

const SCALES = {
  Major: createScale(["C", "D", "E", "F", "G", "A", "B"]),
  Minor: createScale(["C", "D", "Eb", "F", "G", "Ab", "Bb"]),
  Pentatonic: createScale(["C", "D", "E", "G", "A"]),
  Blues: createScale(["C", "Eb", "F", "Gb", "G", "Bb"]),
};

const DEFAULT_REVERB_AMT = 0.2;
const DEFAULT_DELAY_AMT = 0.05;

const OSCILLATOR_TYPES = ["sine", "triangle", "square", "sawtooth"] as const;
type OscillatorType = (typeof OSCILLATOR_TYPES)[number];

const OSCILLATOR_VOLUME_OFFSETS: Record<OscillatorType, number> = {
  sine: 3,
  triangle: 5,
  square: -2,
  sawtooth: 0,
};

const OSCILLATOR_ACTIVE_CLASSES: Record<OscillatorType, string> = {
  sine: "bg-blue-500 text-white shadow-[inset_3px_3px_6px_#2563eb,inset_-3px_-3px_6px_#60a5fa]",
  triangle:
    "bg-emerald-500 text-white shadow-[inset_3px_3px_6px_#059669,inset_-3px_-3px_6px_#34d399]",
  square:
    "bg-amber-500 text-white shadow-[inset_3px_3px_6px_#d97706,inset_-3px_-3px_6px_#fbbf24]",
  sawtooth:
    "bg-red-500 text-white shadow-[inset_3px_3px_6px_#dc2626,inset_-3px_-3px_6px_#f87171]",
};

const NOTE_COLOR_CLASSES: Record<
  OscillatorType,
  readonly [active: string, hover: string]
> = {
  sine: ["text-blue-500", "hover:text-blue-400"],
  triangle: ["text-emerald-500", "hover:text-emerald-400"],
  square: ["text-amber-500", "hover:text-amber-400"],
  sawtooth: ["text-red-500", "hover:text-red-400"],
};

const DELAY_TIMES = ["16n", "8n", "4n"] as const;
type DelayTime = (typeof DELAY_TIMES)[number];

const DELAY_TIME_LABELS: Record<DelayTime, string> = {
  "16n": "1/16",
  "8n": "1/8",
  "4n": "1/4",
};

export default function PadSynth() {
  const [isReady, setIsReady] = useState(false);
  const [activeNote, setActiveNote] = useState<string | null>(null);
  const [volume, setVolume] = useState(-10);
  const [oscType, setOscType] = useState<OscillatorType>("triangle");
  const [currentScale, setCurrentScale] =
    useState<keyof typeof SCALES>("Major");
  const [reverbAmt, setReverbAmt] = useState(DEFAULT_REVERB_AMT);
  const [delayAmt, setDelayAmt] = useState(DEFAULT_DELAY_AMT);
  const [delayTime, setDelayTime] = useState<DelayTime>("8n");
  const [stylesReady, setStylesReady] = useState(false);

  const synthRef = useRef<Tone.PolySynth | null>(null);
  const reverbRef = useRef<Tone.Reverb | null>(null);
  const delayRef = useRef<Tone.FeedbackDelay | null>(null);

  const isMouseDown = useRef(false);
  const lastPlayedNote = useRef<string | null>(null);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setStylesReady(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    const handleMouseUp = () => {
      isMouseDown.current = false;
      lastPlayedNote.current = null;
    };

    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mouseup", handleMouseUp);
      synthRef.current?.dispose();
      reverbRef.current?.dispose();
      delayRef.current?.dispose();
    };
  }, []);

  const initAudio = async () => {
    await Tone.start();

    if (Tone.getContext().state !== "running") {
      await Tone.getContext().resume();
    }

    if (synthRef.current && reverbRef.current && delayRef.current) {
      setIsReady(true);
      return;
    }

    const reverb = new Tone.Reverb(3).toDestination();
    reverb.wet.value = reverbAmt;
    reverbRef.current = reverb;

    const delay = new Tone.FeedbackDelay(delayTime, 0.5);
    delay.wet.value = delayAmt;
    delayRef.current = delay;

    delay.connect(reverb);

    const synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: {
        type: oscType,
      },
      envelope: {
        attack: 0.05,
        decay: 0.2,
        sustain: 0.3,
        release: 1,
      },
    }).connect(delay);

    synth.volume.value = volume + OSCILLATOR_VOLUME_OFFSETS[oscType];
    synthRef.current = synth;
    setIsReady(true);
  };

  const playNote = async (note: string) => {
    if (!isReady || !synthRef.current) {
      await initAudio();
    }

    if (synthRef.current) {
      if (lastPlayedNote.current === note) return;

      synthRef.current.triggerAttackRelease(note, "8n");
      setActiveNote(note);
      lastPlayedNote.current = note;

      setTimeout(() => {
        setActiveNote((prev) => (prev === note ? null : prev));
      }, 200);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    const note = element?.getAttribute("data-note");

    if (note) {
      playNote(note);
    } else {
      lastPlayedNote.current = null;
    }
  };

  const handleVolumeChange = (val: number) => {
    setVolume(val);

    if (synthRef.current) {
      synthRef.current.volume.value = val + OSCILLATOR_VOLUME_OFFSETS[oscType];
    }
  };

  const handleOscChange = (type: OscillatorType) => {
    setOscType(type);

    if (synthRef.current) {
      synthRef.current.set({ oscillator: { type } });
      synthRef.current.volume.value = volume + OSCILLATOR_VOLUME_OFFSETS[type];
    }
  };

  const handleReverbChange = (val: number) => {
    setReverbAmt(val);

    if (reverbRef.current) {
      reverbRef.current.wet.value = val;
    }
  };

  const handleDelayChange = (val: number) => {
    setDelayAmt(val);

    if (delayRef.current) {
      delayRef.current.wet.value = val;
    }
  };

  const toggleDelayTime = () => {
    const currentIndex = DELAY_TIMES.indexOf(delayTime);
    const nextIndex = (currentIndex + 1) % DELAY_TIMES.length;
    const nextTime = DELAY_TIMES[nextIndex];

    setDelayTime(nextTime);

    if (delayRef.current) {
      delayRef.current.delayTime.value = nextTime;
    }
  };

  const [activeNoteColor, hoverNoteColor] = NOTE_COLOR_CLASSES[oscType];

  return (
    <main
      className={`${styles.root} min-h-screen bg-[#e0e5ec] text-slate-600 font-sans flex items-center justify-center p-3 sm:p-6 select-none transition-opacity duration-150 ${
        stylesReady ? "opacity-100" : "opacity-0"
      }`}
    >
      <div className="bg-[#e0e5ec] rounded-4xl sm:rounded-[3rem] p-4 sm:p-8 md:p-12 shadow-[20px_20px_60px_#bebebe,-20px_-20px_60px_#ffffff] max-w-4xl w-full mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 sm:mb-10 gap-4 sm:gap-6">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-[#e0e5ec] shadow-[5px_5px_10px_#bebebe,-5px_-5px_10px_#ffffff] flex items-center justify-center text-blue-400">
              <Music className="w-6 h-6 sm:w-8 sm:h-8" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-700">
                PAD SYNTH
              </h1>
              <p className="text-xs sm:text-sm font-medium text-slate-400">
                Soft Tactile Interface
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => setIsReady(!isReady)}
              className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                isReady
                  ? "shadow-[inset_5px_5px_10px_#bebebe,inset_-5px_-5px_10px_#ffffff] text-blue-500"
                  : "shadow-[5px_5px_10px_#bebebe,-5px_-5px_10px_#ffffff] text-slate-400 hover:text-blue-400"
              }`}
              title="Power Toggle"
            >
              <Activity className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-8 mb-6 sm:mb-10">
          <div className="bg-[#e0e5ec] p-3 sm:p-4 rounded-xl sm:rounded-2xl shadow-[inset_5px_5px_10px_#bebebe,inset_-5px_-5px_10px_#ffffff]">
            <label className="text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-2 sm:mb-3 block text-center text-slate-500">
              Scale Mode
            </label>
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              {Object.keys(SCALES).map((s) => (
                <button
                  key={s}
                  onClick={() => setCurrentScale(s as keyof typeof SCALES)}
                  className={`py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-bold transition-all duration-200 ${
                    currentScale === s
                      ? "shadow-[inset_3px_3px_6px_#bebebe,inset_-3px_-3px_6px_#ffffff] text-blue-500"
                      : "shadow-[3px_3px_6px_#bebebe,-3px_-3px_6px_#ffffff] hover:-translate-y-0.5"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-[#e0e5ec] p-3 sm:p-4 rounded-xl sm:rounded-2xl shadow-[inset_5px_5px_10px_#bebebe,inset_-5px_-5px_10px_#ffffff]">
            <label className="text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-2 sm:mb-3 block text-center text-slate-500">
              Waveform
            </label>
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              {OSCILLATOR_TYPES.map((type) => (
                <button
                  key={type}
                  onClick={() => handleOscChange(type)}
                  className={`py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-bold capitalize transition-all duration-200 ${
                    oscType === type
                      ? OSCILLATOR_ACTIVE_CLASSES[type]
                      : "shadow-[3px_3px_6px_#bebebe,-3px_-3px_6px_#ffffff] hover:-translate-y-0.5"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-[#e0e5ec] p-3 sm:p-4 rounded-xl sm:rounded-2xl shadow-[inset_5px_5px_10px_#bebebe,inset_-5px_-5px_10px_#ffffff] flex flex-col justify-center gap-3 sm:gap-4 col-span-1 sm:col-span-2 md:col-span-1">
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] sm:text-xs font-bold text-slate-500">
                <span>VOLUME</span>
                <span>{Math.round((volume + 30) / 0.3)}%</span>
              </div>
              <input
                type="range"
                min="-30"
                max="0"
                value={volume}
                onChange={(e) => handleVolumeChange(Number(e.target.value))}
                className="w-full appearance-none outline-none bg-transparent"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-[10px] sm:text-xs font-bold text-slate-500">
                <span>REVERB</span>
                <span>{Math.round(reverbAmt * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={reverbAmt}
                onChange={(e) => handleReverbChange(Number(e.target.value))}
                className="w-full appearance-none outline-none bg-transparent"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-[10px] sm:text-xs font-bold text-slate-500 items-center">
                <span className="flex items-center gap-1.5 sm:gap-2">
                  ECHO
                  <button
                    onClick={toggleDelayTime}
                    className="bg-[#e0e5ec] shadow-[3px_3px_6px_#bebebe,-3px_-3px_6px_#ffffff] active:shadow-[inset_2px_2px_5px_#bebebe,inset_-2px_-2px_5px_#ffffff] px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] hover:text-blue-500 transition-all font-mono"
                    title="Toggle Delay Time"
                  >
                    {DELAY_TIME_LABELS[delayTime]}
                  </button>
                </span>
                <span>{Math.round(delayAmt * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="0.6"
                step="0.05"
                value={delayAmt}
                onChange={(e) => handleDelayChange(Number(e.target.value))}
                className="w-full appearance-none outline-none bg-transparent"
              />
            </div>
          </div>
        </div>

        <div
          className="grid grid-cols-4 gap-2 sm:gap-4 md:gap-6 touch-none"
          onTouchMove={(e) => {
            e.preventDefault();
            handleTouchMove(e);
          }}
        >
          {SCALES[currentScale].map((note) => (
            <button
              key={note}
              data-note={note}
              onMouseDown={() => {
                isMouseDown.current = true;
                playNote(note);
              }}
              onMouseEnter={() => {
                if (isMouseDown.current) playNote(note);
              }}
              onTouchStart={(e) => {
                e.preventDefault();
                playNote(note);
              }}
              className={`
                  aspect-square rounded-xl sm:rounded-2xl md:rounded-3xl flex items-center justify-center
                  text-sm sm:text-lg font-bold transition-all duration-150 touch-none select-none
                  ${
                    activeNote === note
                      ? `shadow-[inset_5px_5px_10px_#bebebe,inset_-5px_-5px_10px_#ffffff] ${activeNoteColor} scale-95`
                      : `shadow-[8px_8px_16px_#bebebe,-8px_-8px_16px_#ffffff] text-slate-500 ${hoverNoteColor} active:scale-95`
                  }
                `}
            >
              {note}
            </button>
          ))}
        </div>
      </div>
    </main>
  );
}
