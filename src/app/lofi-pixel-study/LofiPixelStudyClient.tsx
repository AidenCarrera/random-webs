"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Volume2,
  VolumeX,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Image as ImageIcon,
  Music,
  Repeat,
  Sparkles,
  Maximize2,
  Minimize2,
} from "lucide-react";

// Data structures
const BACKGROUNDS = [
  {
    id: "day-1",
    name: "Cozy Café (Sunny Day)",
    path: "/lofi-pixel-study/lofi-cafe-day-1.png",
  },
  {
    id: "day-2",
    name: "Greenhouse Café",
    path: "/lofi-pixel-study/lofi-cafe-day-2.png",
  },
  {
    id: "day-3",
    name: "Coffee Roastery",
    path: "/lofi-pixel-study/lofi-cafe-day-3.png",
  },
  {
    id: "night-1",
    name: "Quiet Café (Clear Night)",
    path: "/lofi-pixel-study/lofi-cafe-night-1.png",
  },
  {
    id: "night-2",
    name: "Neon Street Café",
    path: "/lofi-pixel-study/lofi-cafe-night-2.png",
  },
  {
    id: "rain-1",
    name: "Rainy Window Corner",
    path: "/lofi-pixel-study/lofi-cafe-rain-1.png",
  },
  {
    id: "rain-2",
    name: "Rainy Street View",
    path: "/lofi-pixel-study/lofi-cafe-rain-2.png",
  },
  {
    id: "rain-3",
    name: "Midnight Rain Bistro",
    path: "/lofi-pixel-study/lofi-cafe-rain-3.png",
  },
];

interface Track {
  id: string;
  title: string;
  artist: string;
  path: string;
}

interface LofiPixelStudyClientProps {
  initialTracks: Track[];
}

const DEFAULT_TRACK_ARTIST = "leberch";
const DEFAULT_TRACK_TITLE = "lofi hip hop";

export default function LofiPixelStudyClient({
  initialTracks,
}: LofiPixelStudyClientProps) {
  const router = useRouter();

  // Background state (with preview on hover support)
  const [selectedBg, setSelectedBg] = useState(BACKGROUNDS[0]);
  const [previewBg, setPreviewBg] = useState<(typeof BACKGROUNDS)[0] | null>(
    null,
  );
  const activeBg = previewBg || selectedBg;

  // Image dimension states for integer scaling calculation
  const [imgDimensions, setImgDimensions] = useState({ w: 640, h: 360 });
  const [scale, setScale] = useState(1);
  const [windowSize, setWindowSize] = useState({ w: 1920, h: 1080 });

  // Audio player state
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(() => {
    const defaultTrackIndex = initialTracks.findIndex(
      (track) =>
        track.artist.toLowerCase() === DEFAULT_TRACK_ARTIST &&
        track.title.toLowerCase() === DEFAULT_TRACK_TITLE,
    );

    return defaultTrackIndex >= 0 ? defaultTrackIndex : 0;
  });
  const [volume, setVolume] = useState(0.5);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isLooping, setIsLooping] = useState(false);

  // UI state
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [showIntro, setShowIntro] = useState(true);
  const [showRetroFilter, setShowRetroFilter] = useState(true);
  const [hoverActive, setHoverActive] = useState(false);

  // Timer State
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [timerActive, setTimerActive] = useState(false);
  const [timerDuration, setTimerDuration] = useState(25 * 60);
  const [timerMinimized, setTimerMinimized] = useState(false);

  // Safeguard in case initialTracks is empty
  const currentTrack = initialTracks[currentTrackIndex] || {
    id: "none",
    title: "No Tracks Available",
    artist: "Unknown",
    path: "",
  };

  // Monitor Window Resize
  useEffect(() => {
    if (typeof window === "undefined") return;
    setWindowSize({ w: window.innerWidth, h: window.innerHeight });

    const handleResize = () => {
      setWindowSize({ w: window.innerWidth, h: window.innerHeight });
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Delay enabling hover preview to prevent accidental triggers upon drawer open
  useEffect(() => {
    if (isPanelOpen) {
      const timer = setTimeout(() => {
        setHoverActive(true);
      }, 350);
      return () => clearTimeout(timer);
    } else {
      setHoverActive(false);
    }
  }, [isPanelOpen]);

  // Countdown Timer Hook
  useEffect(() => {
    let intervalId: any = null;
    if (timerActive && timeLeft > 0) {
      intervalId = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && timerActive) {
      setTimerActive(false);

      // Play a short retro synthesizer beep at completion
      if (typeof window !== "undefined") {
        try {
          const AudioContextClass =
            window.AudioContext || (window as any).webkitAudioContext;
          if (AudioContextClass) {
            const audioCtx = new AudioContextClass();
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = "square"; // 8-bit retro square wave
            osc.frequency.value = 587.33; // D5 note
            gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.35);
          }
        } catch (e) {
          console.error("Timer beep failed:", e);
        }
      }
    }
    return () => clearInterval(intervalId);
  }, [timerActive, timeLeft]);

  // Calculate Integer Scale: Cover viewport fully with 16:9 pixel-perfect scaling
  useEffect(() => {
    const scaleX = Math.ceil(windowSize.w / imgDimensions.w);
    const scaleY = Math.ceil(windowSize.h / imgDimensions.h);
    const calculatedScale = Math.max(1, Math.max(scaleX, scaleY));
    setScale(calculatedScale);
  }, [windowSize, imgDimensions]);

  // Audio Event Listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateProgress = () => {
      setProgress(audio.currentTime);
    };
    const updateDuration = () => {
      setDuration(audio.duration || 0);
    };
    const handleEnded = () => {
      if (isLooping) {
        audio.currentTime = 0;
        audio.play().catch(() => {});
      } else {
        handleNext();
      }
    };

    audio.addEventListener("timeupdate", updateProgress);
    audio.addEventListener("durationchange", updateDuration);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", updateProgress);
      audio.removeEventListener("durationchange", updateDuration);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [currentTrackIndex, isLooping, initialTracks]);

  // Apply volume changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted, currentTrackIndex, isPlaying]);

  // Sync source and state when track changes
  useEffect(() => {
    if (audioRef.current && currentTrack.path) {
      audioRef.current.src = currentTrack.path;
      audioRef.current.load();
      if (isPlaying) {
        audioRef.current.play().catch(() => setIsPlaying(false));
      }
    }
  }, [currentTrackIndex]);

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth, naturalHeight } = e.currentTarget;
    if (naturalWidth && naturalHeight) {
      setImgDimensions({ w: naturalWidth, h: naturalHeight });
    }
  };

  const handlePlayPause = () => {
    if (!audioRef.current || !currentTrack.path) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch((err) => console.log("Audio play blocked: ", err));
    }
  };

  // Global Spacebar Play/Pause
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName.toLowerCase();
      if (
        e.code === "Space" &&
        activeTag !== "input" &&
        activeTag !== "textarea"
      ) {
        e.preventDefault(); // prevent scroll
        handlePlayPause();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPlaying]);

  const handleNext = () => {
    if (initialTracks.length === 0) return;
    setCurrentTrackIndex((prev) => (prev + 1) % initialTracks.length);
  };

  const handlePrev = () => {
    if (initialTracks.length === 0) return;
    setCurrentTrackIndex(
      (prev) => (prev - 1 + initialTracks.length) % initialTracks.length,
    );
  };

  const handleSeek = (val: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = val;
      setProgress(val);
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black text-zinc-100 select-none font-pixel text-base md:text-lg">
      {/* HTML5 Audio Node */}
      {currentTrack.path && (
        <audio ref={audioRef} src={currentTrack.path} loop={isLooping} />
      )}

      {/* Retro scanline & subpixel animation styling */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=VT323&display=swap');
        
        .font-pixel {
          font-family: 'VT323', monospace;
        }
        
        @keyframes crt-roll {
          0% {
            background-position: 0 0, 0 0, 0 0;
          }
          100% {
            background-position: 0 400px, 0 0, 0 800px;
          }
        }
        
        .crt-overlay {
          background-image: 
            linear-gradient(rgba(18,16,16,0) 50%, rgba(0,0,0,0.22) 50%),
            linear-gradient(90deg, rgba(255,0,0,0.035), rgba(0,255,0,0.015), rgba(0,0,255,0.035)),
            linear-gradient(to bottom, rgba(18,16,16,0) 0%, rgba(18,16,16,0.12) 50%, rgba(18,16,16,0) 100%);
          background-size: 100% 4px, 6px 100%, 100% 800px;
          animation: crt-roll 22s linear infinite;
        }

        .pixel-box {
          background-color: #0d0714;
          border: 3px solid #3b2063;
          box-shadow: 4px 4px 0px #000;
        }

        .pixel-btn {
          background-color: #1e122b;
          border: 2px solid #5a3291;
          color: #d1c4e9;
          box-shadow: 3px 3px 0px #000;
          transition: all 0.05s steps(2);
        }

        .pixel-btn:hover {
          background-color: #2e1c42;
          border-color: #7b4cc4;
          color: #fff;
        }

        .pixel-btn:active {
          transform: translate(2px, 2px);
          box-shadow: 1px 1px 0px #000;
        }

        .pixel-btn-active {
          background-color: #6a1b9a;
          border-color: #ab47bc;
          color: #fff;
          box-shadow: inset 2px 2px 0px #000;
          transform: translate(1px, 1px);
        }

        .pixel-thumb::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 8px !important;
          height: 14px !important;
          background: #d1c4e9 !important;
          border: 2px solid #5a3291 !important;
          border-radius: 0px !important;
          box-shadow: 1px 1px 0px #000 !important;
        }

        .pixel-thumb::-moz-range-thumb {
          width: 8px !important;
          height: 14px !important;
          background: #d1c4e9 !important;
          border: 2px solid #5a3291 !important;
          border-radius: 0px !important;
          box-shadow: 1px 1px 0px #000 !important;
        }
      `}</style>

      {/* Background Container */}
      <div className="absolute inset-0 w-full h-full overflow-hidden flex items-center justify-center bg-zinc-950 z-0">
        <AnimatePresence initial={false}>
          <motion.img
            key={activeBg.id}
            src={activeBg.path}
            alt={activeBg.name}
            onLoad={handleImageLoad}
            initial={{ opacity: 0, scale: 1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1 }}
            transition={{
              opacity: { duration: 0.45, ease: "easeOut" },
              scale: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
            }}
            style={{
              width: `${imgDimensions.w * scale}px`,
              height: `${imgDimensions.h * scale}px`,
              imageRendering: "pixelated",
              position: "absolute",
              left: "50%",
              top: "50%",
              x: "-50%",
              y: "-50%",
              willChange: "opacity, transform",
            }}
          />
        </AnimatePresence>
        {/* Subtle Vignette Layer */}
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_55%,rgba(0,0,0,0.32)_100%)] z-1" />
        {/* Subtle grid pattern overlay to give CRT screen vibe */}
        {showRetroFilter && (
          <div className="absolute inset-0 pointer-events-none crt-overlay opacity-65 z-1" />
        )}
      </div>

      {/* Top Left Study Timer */}
      <div className="absolute top-4 left-4 z-10 pointer-events-none">
        {timerMinimized ? (
          <div className="pointer-events-auto pixel-box p-1.5 flex items-center gap-1.5 md:gap-2 text-zinc-200 text-xs md:text-sm">
            <span className="text-xs md:text-sm font-bold text-purple-400 uppercase tracking-widest leading-none">
              Timer:
            </span>
            <span className="text-xs md:text-sm font-pixel tracking-wide font-bold leading-none">
              {formatTime(timeLeft)}
            </span>
            <button
              onClick={() => setTimerMinimized(false)}
              className="p-1 pixel-btn cursor-pointer animate-pulse"
              title="Expand Timer"
            >
              <Maximize2 className="w-2.5 h-2.5 md:w-3 md:h-3 text-zinc-300" />
            </button>
          </div>
        ) : (
          <div className="pointer-events-auto pixel-box p-2.5 md:p-3 flex flex-col items-center gap-1.5 md:gap-2 min-w-33.75 sm:min-w-37.5 md:min-w-42.5 text-zinc-200">
            {/* Header with Minimize Button */}
            <div className="flex justify-between items-center w-full border-b border-zinc-800/85 pb-1 mb-0.5 gap-2">
              <span className="text-xs md:text-sm font-bold text-purple-400 uppercase tracking-widest leading-none">
                Timer
              </span>
              <button
                onClick={() => setTimerMinimized(true)}
                className="p-1 pixel-btn cursor-pointer"
                title="Minimize Timer"
              >
                <Minimize2 className="w-2.5 h-2.5 md:w-3 md:h-3 text-zinc-300" />
              </button>
            </div>

            {/* Time Display */}
            <span className="text-3xl sm:text-4xl md:text-5xl font-pixel tracking-wide font-black leading-none py-0.5 md:py-1">
              {formatTime(timeLeft)}
            </span>

            {/* Controls row */}
            <div className="flex gap-1.5 md:gap-2 w-full">
              <button
                onClick={() => setTimerActive(!timerActive)}
                className={`flex-1 py-0.5 md:py-1 text-xs md:text-sm pixel-btn uppercase cursor-pointer ${timerActive ? "pixel-btn-active" : ""}`}
              >
                {timerActive ? "Pause" : "Start"}
              </button>
              <button
                onClick={() => {
                  setTimerActive(false);
                  setTimeLeft(timerDuration);
                }}
                className="flex-1 py-0.5 md:py-1 text-xs md:text-sm pixel-btn uppercase cursor-pointer"
              >
                Reset
              </button>
            </div>

            {/* Presets and adjustment row */}
            <div className="flex gap-1 mt-0.5 border-t border-zinc-800/80 pt-1.5 md:pt-2 w-full justify-center">
              <button
                onClick={() => {
                  setTimerActive(false);
                  setTimerDuration(25 * 60);
                  setTimeLeft(25 * 60);
                }}
                className={`text-xs md:text-sm px-1 md:px-1.5 py-0.5 cursor-pointer pixel-btn ${timerDuration === 25 * 60 ? "pixel-btn-active" : ""}`}
              >
                25m
              </button>
              <button
                onClick={() => {
                  setTimerActive(false);
                  setTimerDuration(5 * 60);
                  setTimeLeft(5 * 60);
                }}
                className={`text-xs md:text-sm px-1 md:px-1.5 py-0.5 cursor-pointer pixel-btn ${timerDuration === 5 * 60 ? "pixel-btn-active" : ""}`}
              >
                5m
              </button>
              <button
                onClick={() => {
                  if (!timerActive) {
                    const newTime = Math.max(60, timerDuration - 60);
                    setTimerDuration(newTime);
                    setTimeLeft(newTime);
                  }
                }}
                disabled={timerActive}
                className="text-xs md:text-sm px-1.5 md:px-2 py-0.5 cursor-pointer pixel-btn disabled:opacity-40"
              >
                -
              </button>
              <button
                onClick={() => {
                  if (!timerActive) {
                    const newTime = Math.min(180 * 60, timerDuration + 60);
                    setTimerDuration(newTime);
                    setTimeLeft(newTime);
                  }
                }}
                disabled={timerActive}
                className="text-xs md:text-sm px-1.5 md:px-2 py-0.5 cursor-pointer pixel-btn disabled:opacity-40"
              >
                +
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Top Header Navigation & Scale Info */}
      <header className="absolute top-4 right-4 z-10 pointer-events-none">
        <button
          onClick={() => setShowRetroFilter(!showRetroFilter)}
          className="pointer-events-auto flex items-center px-3 py-1.5 pixel-btn text-sm uppercase tracking-wide cursor-pointer"
        >
          <span>Retro Filter: {showRetroFilter ? "ON" : "OFF"}</span>
        </button>
      </header>

      {/* Bottom Main UI Bar */}
      <div className="absolute bottom-6 left-4 right-4 flex flex-col items-center gap-3 md:gap-4 z-10 pointer-events-none">
        {/* Music Player & Background Selector Dock */}
        <div className="relative w-full max-w-2xl pointer-events-auto pixel-box p-3 md:p-4 flex flex-col md:flex-row gap-3 md:gap-4 items-center justify-between text-xs md:text-sm">
          {/* Active Track Info */}
          <div className="flex items-center gap-2.5 md:gap-3 min-w-0 w-full md:flex-1 md:pr-16">
            <div
              className={`shrink-0 p-2 md:p-2.5 rounded-xl bg-purple-900/30 border-2 border-purple-500/30 text-purple-400 ${isPlaying ? "animate-pulse" : ""}`}
            >
              <Music className="w-4 h-4 md:w-5 md:h-5" />
            </div>
            <div className="flex min-w-0 flex-col text-left">
              <span className="text-base md:text-lg font-bold text-zinc-200 tracking-wide line-clamp-1">
                {currentTrack.title}
              </span>
              <span className="text-xs md:text-sm text-zinc-400 font-medium tracking-wider uppercase">
                {currentTrack.artist}
              </span>
            </div>
          </div>

          {/* Audio Controls */}
          <div className="flex items-center justify-center gap-2.5 md:gap-3 md:absolute md:left-1/2 md:top-1/2 md:w-28 md:-translate-x-1/2 md:-translate-y-1/2">
            <button
              onClick={handlePrev}
              className="grid h-7 w-7 md:h-8 md:w-8 place-items-center pixel-btn cursor-pointer"
              title="Previous Track"
            >
              <SkipBack className="w-3.5 h-3.5 md:w-4 md:h-4" />
            </button>

            <button
              onClick={handlePlayPause}
              className="grid h-9 w-9 md:h-10 md:w-10 place-items-center bg-[#4a148c] border-2 border-purple-500 text-white transition-all cursor-pointer shadow-[2px_2px_0px_#000] active:translate-x-px active:translate-y-px active:shadow-none"
              title={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? (
                <Pause className="w-3.5 h-3.5 md:w-4 md:h-4 fill-white" />
              ) : (
                <Play className="w-3.5 h-3.5 md:w-4 md:h-4 fill-white translate-x-0.5" />
              )}
            </button>

            <button
              onClick={handleNext}
              className="grid h-7 w-7 md:h-8 md:w-8 place-items-center pixel-btn cursor-pointer"
              title="Next Track"
            >
              <SkipForward className="w-3.5 h-3.5 md:w-4 md:h-4" />
            </button>
          </div>

          {/* Buttons and Volume Slider */}
          <div className="flex items-center gap-2 md:gap-3 w-full md:flex-1 md:pl-16 justify-center md:justify-end text-[10px] md:text-xs">
            {/* Background Picker Trigger */}
            <button
              onClick={() => setIsPanelOpen(!isPanelOpen)}
              className={`flex items-center gap-1.5 px-2.5 py-1 md:px-3 md:py-1.5 uppercase cursor-pointer pixel-btn ${
                isPanelOpen ? "pixel-btn-active" : ""
              }`}
            >
              <ImageIcon className="w-3 md:w-3.5 h-3 md:h-3.5" />
              <span>Scenes</span>
            </button>

            {/* Loop Toggle */}
            <button
              onClick={() => setIsLooping(!isLooping)}
              className={`p-1 md:p-1.5 cursor-pointer pixel-btn ${
                isLooping ? "pixel-btn-active" : ""
              }`}
              title="Loop Single Track"
            >
              <Repeat className="w-3 md:w-3.5 h-3 md:h-3.5" />
            </button>

            {/* Volume controls */}
            <div className="flex items-center gap-1.5 md:gap-2 pl-1.5 md:pl-2 border-l border-zinc-800">
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-3.5 h-3.5 md:w-4 md:h-4" />
                ) : (
                  <Volume2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                )}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={isMuted ? 0 : volume}
                onChange={(e) => {
                  setVolume(parseFloat(e.target.value));
                  if (isMuted) setIsMuted(false);
                }}
                className="w-12 md:w-16 h-1.5 md:h-2 bg-zinc-950 border border-zinc-800 appearance-none cursor-pointer pixel-thumb"
              />
            </div>
          </div>
        </div>

        {/* Progress Seek Bar */}
        <div className="w-full max-w-2xl pointer-events-auto bg-black/60 border-2 border-zinc-900 px-3 md:px-4 py-1 md:py-2 rounded-none flex items-center gap-2.5 md:gap-3 text-[10px] md:text-xs text-zinc-400 shadow-md">
          <span>{formatTime(progress)}</span>
          <input
            type="range"
            min="0"
            max={duration || 100}
            value={progress}
            onChange={(e) => handleSeek(parseFloat(e.target.value))}
            className="flex-1 h-1.5 md:h-2 bg-zinc-950 border border-zinc-800 appearance-none cursor-pointer pixel-thumb"
          />
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Floating Background Selector drawer */}
      <AnimatePresence>
        {isPanelOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            className="absolute bottom-36 left-4 right-4 mx-auto max-w-2xl pixel-box p-3 md:p-4 z-10 text-xs md:text-sm"
          >
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs md:text-sm font-bold uppercase tracking-wider text-purple-400">
                Select Scene (Hover for instant preview)
              </span>
              <span className="text-[9px] md:text-[11px] text-zinc-500 font-medium">
                {BACKGROUNDS.length} scenes available
              </span>
            </div>

            {/* Thumbnail Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 md:gap-3 max-h-40 md:max-h-55 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
              {BACKGROUNDS.map((bg) => (
                <button
                  key={bg.id}
                  onClick={() => {
                    setSelectedBg(bg);
                    setPreviewBg(null);
                  }}
                  onMouseEnter={() => {
                    if (hoverActive) setPreviewBg(bg);
                  }}
                  onMouseLeave={() => setPreviewBg(null)}
                  className={`group relative flex flex-col gap-0.5 md:gap-1 p-1 border-2 text-left overflow-hidden cursor-pointer ${
                    selectedBg.id === bg.id
                      ? "bg-purple-950/40 border-purple-500 shadow-[1px_1px_0px_#000]"
                      : "bg-zinc-950 border-zinc-850 hover:border-zinc-700 shadow-[1px_1px_0px_#000]"
                  }`}
                >
                  {/* Thumbnail Image */}
                  <div className="relative aspect-video rounded-none overflow-hidden bg-zinc-950">
                    <img
                      src={bg.path}
                      alt={bg.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      style={{ imageRendering: "pixelated" }}
                    />
                  </div>
                  {/* Title */}
                  <span className="text-[9px] md:text-[11px] font-bold text-zinc-300 group-hover:text-white truncate px-1 font-pixel">
                    {bg.name}
                  </span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Discreet Retro Welcome dialogue */}
      <AnimatePresence>
        {showIntro && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/85 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="max-w-70 w-full pixel-box p-4 flex flex-col gap-3 text-center items-center font-pixel"
            >
              <h2 className="text-xl font-bold tracking-wider text-purple-400">
                LOFI STUDY
              </h2>
              <p className="text-base text-zinc-400 leading-normal">
                Click to load the radio and enter the pixel room.
              </p>
              <button
                onClick={() => {
                  setShowIntro(false);
                  handlePlayPause(); // Try auto-play on enter
                }}
                className="w-full py-1.5 text-sm font-bold uppercase tracking-wider pixel-btn cursor-pointer"
              >
                Enter Room
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
