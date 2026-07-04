"use client";

import { useState, useEffect, useRef } from "react";
import { MousePointer2, RefreshCw, Trophy, Calendar, Zap, Award } from "lucide-react";

type RunResult = {
  id: string;
  clicks: number;
  cps: number;
  duration: number;
  pace: number[];
  timestamp: string;
};

type RecordEntry = {
  clicks: number;
  cps: number;
};

const MILESTONES_BY_DURATION: Record<number, { label: string; target: number; color: string }[]> = {
  5: [
    { label: "Bronze Clicker", target: 15, color: "text-amber-500 bg-amber-500/10 border-amber-500/30" },
    { label: "Silver Clicker", target: 25, color: "text-slate-400 bg-slate-400/10 border-slate-400/30" },
    { label: "Gold Clicker", target: 35, color: "text-yellow-400 bg-yellow-400/10 border-yellow-400/30" },
    { label: "Platinum Clicker", target: 45, color: "text-cyan-400 bg-cyan-400/10 border-cyan-400/30" },
    { label: "Diamond Clicker", target: 55, color: "text-indigo-400 bg-indigo-400/10 border-indigo-400/30" },
    { label: "Click Legend", target: 65, color: "text-rose-400 bg-rose-400/10 border-rose-400/30" },
  ],
  10: [
    { label: "Bronze Clicker", target: 30, color: "text-amber-500 bg-amber-500/10 border-amber-500/30" },
    { label: "Silver Clicker", target: 50, color: "text-slate-400 bg-slate-400/10 border-slate-400/30" },
    { label: "Gold Clicker", target: 70, color: "text-yellow-400 bg-yellow-400/10 border-yellow-400/30" },
    { label: "Platinum Clicker", target: 90, color: "text-cyan-400 bg-cyan-400/10 border-cyan-400/30" },
    { label: "Diamond Clicker", target: 110, color: "text-indigo-400 bg-indigo-400/10 border-indigo-400/30" },
    { label: "Click Legend", target: 130, color: "text-rose-400 bg-rose-400/10 border-rose-400/30" },
  ],
  30: [
    { label: "Bronze Clicker", target: 75, color: "text-amber-500 bg-amber-500/10 border-amber-500/30" },
    { label: "Silver Clicker", target: 120, color: "text-slate-400 bg-slate-400/10 border-slate-400/30" },
    { label: "Gold Clicker", target: 180, color: "text-yellow-400 bg-yellow-400/10 border-yellow-400/30" },
    { label: "Platinum Clicker", target: 240, color: "text-cyan-400 bg-cyan-400/10 border-cyan-400/30" },
    { label: "Diamond Clicker", target: 300, color: "text-indigo-400 bg-indigo-400/10 border-indigo-400/30" },
    { label: "Click Legend", target: 360, color: "text-rose-400 bg-rose-400/10 border-rose-400/30" },
  ],
};

export default function DarkDashboard() {
  const [clicks, setClicks] = useState(0);
  const [duration, setDuration] = useState(10); // Default to 10 seconds as requested
  const [timeLeft, setTimeLeft] = useState(10);
  const [isActive, setIsActive] = useState(false);
  const [cps, setCps] = useState(0);
  
  // Track high score records individually per duration
  const [records, setRecords] = useState<Record<number, RecordEntry>>({
    5: { clicks: 0, cps: 0 },
    10: { clicks: 0, cps: 0 },
    30: { clicks: 0, cps: 0 },
  });
  
  // Track clicking speed per second
  const [currentRunPace, setCurrentRunPace] = useState<number[]>([]);
  const lastClicksCountRef = useRef(0);
  const clicksRef = useRef(0);
  
  // Session History
  const [history, setHistory] = useState<RunResult[]>([]);

  const startTest = () => {
    setClicks(0);
    setTimeLeft(duration);
    setIsActive(true);
    setCps(0);
    setCurrentRunPace([]);
    lastClicksCountRef.current = 0;
  };

  const handleClick = () => {
    if (!isActive) {
      startTest();
      setClicks(1);
    } else {
      setClicks((c) => c + 1);
    }
  };

  // Sync clicks to ref to avoid stale closures in the timer interval
  useEffect(() => {
    clicksRef.current = clicks;
  }, [clicks]);

  // Timer interval for test countdown and pace tracking
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isActive) {
      interval = setInterval(() => {
        // Read clicks at the exact second tick (outside state updater)
        const currentClicks = clicksRef.current;
        const clicksThisSecond = currentClicks - lastClicksCountRef.current;
        
        setCurrentRunPace((prev) => [...prev, clicksThisSecond]);
        lastClicksCountRef.current = currentClicks;

        setTimeLeft((t) => {
          if (t <= 1) {
            clearInterval(interval);
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive]);

  // Test termination and score tracking
  useEffect(() => {
    if (timeLeft === 0 && isActive) {
      setIsActive(false);
      const newCps = clicks / duration;
      setCps(newCps);
      
      // Update duration-specific high score
      setRecords((prev) => {
        const currentRecord = prev[duration] || { clicks: 0, cps: 0 };
        if (clicks > currentRecord.clicks) {
          return {
            ...prev,
            [duration]: { clicks, cps: newCps },
          };
        }
        return prev;
      });
      
      // Calculate final pace array (handle batching lag)
      const totalLogged = currentRunPace.reduce((a, b) => a + b, 0);
      const lastSegment = clicks - totalLogged;
      const finalPace = [...currentRunPace, lastSegment].slice(0, duration);

      // Add to session history
      const newRun: RunResult = {
        id: Math.random().toString(36).substring(2, 9),
        clicks: clicks,
        cps: newCps,
        duration: duration,
        pace: finalPace,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
      };
      setHistory((prev) => [newRun, ...prev].slice(0, 5)); // Keep last 5 runs
    }
  }, [timeLeft, isActive, clicks, duration, currentRunPace]);

  // Get records and milestones for the selected duration
  const activeRecord = records[duration] || { clicks: 0, cps: 0 };
  const currentMilestones = MILESTONES_BY_DURATION[duration] || [];

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 font-sans p-4 md:p-8 flex flex-col gap-6 md:gap-8">
      <header className="flex justify-center items-center border-b border-slate-800 pb-4 shrink-0">
        <h1 className="text-2xl md:text-3xl font-black text-slate-100 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
            <MousePointer2 className="w-6 h-6" />
          </div>
          Click Speed Test
        </h1>
      </header>

      {/* Main Grid Wrapper */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* LEFT COLUMN: Settings & Targets */}
        <div className="lg:col-span-3 flex flex-col gap-6 order-2 lg:order-1 h-full">
          {/* Duration Selection */}
          <div className="bg-[#1e293b] p-6 rounded-xl border border-slate-700 shrink-0">
            <div className="text-slate-400 text-sm font-medium uppercase tracking-wider mb-3">
              Test Duration
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[5, 10, 30].map((d) => (
                <button
                  key={d}
                  disabled={isActive}
                  onClick={() => {
                    setDuration(d);
                    setTimeLeft(d);
                    setCps(0);
                    setClicks(0);
                  }}
                  className={`py-2 px-3 rounded-lg text-sm font-bold border transition-all ${
                    isActive ? "opacity-50 cursor-not-allowed" : ""
                  } ${
                    duration === d
                      ? "bg-blue-600 border-blue-500 text-white shadow-md shadow-blue-500/20"
                      : "bg-slate-800 border-slate-700 hover:border-slate-600 text-slate-300"
                  }`}
                >
                  {d}s
                </button>
              ))}
            </div>
          </div>

          {/* Milestones Panel */}
          <div className="bg-[#1e293b] p-6 rounded-xl border border-slate-700 flex-1 flex flex-col justify-between">
            <div className="text-slate-400 text-sm font-medium uppercase tracking-wider mb-4 flex items-center gap-1.5 shrink-0">
              <Award className="w-4 h-4 text-yellow-500" />
              Milestones ({duration}s mode)
            </div>
            <div className="flex-1 flex flex-col justify-between gap-2.5">
              {currentMilestones.map((m) => {
                const isAchieved = clicks >= m.target || activeRecord.clicks >= m.target;
                return (
                  <div
                    key={m.label}
                    className={`flex items-center justify-between p-2.5 rounded-lg border transition-all flex-1 ${
                      isAchieved
                        ? `${m.color} shadow-sm`
                        : "bg-slate-900/30 border-slate-800 text-slate-500"
                    }`}
                  >
                    <div className="flex flex-col justify-center">
                      <span className="font-bold text-xs leading-snug">{m.label}</span>
                      <span className="text-[10px] opacity-80">{m.target} clicks target</span>
                    </div>
                    <div className="flex items-center">
                      {isAchieved ? (
                        <span className="text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 rounded">
                          Unlocked
                        </span>
                      ) : (
                        <span className="text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 bg-slate-800 text-slate-600 rounded">
                          Locked
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* CENTER COLUMN: Live Stats & Main Click Area */}
        <div className="lg:col-span-6 flex flex-col gap-6 order-1 lg:order-2 h-full">
          
          {/* Responsive Stat Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 shrink-0">
            
            {/* Stat Card 1: CPS */}
            <div className="bg-[#1e293b] p-6 rounded-xl border border-slate-700 relative overflow-hidden">
              <div className="text-slate-400 text-sm font-medium uppercase tracking-wider mb-1">
                Current CPS
              </div>
              <div className="text-4xl font-bold text-blue-400">
                {isActive
                  ? (clicks / (duration - timeLeft + 0.1)).toFixed(1)
                  : cps.toFixed(1)}
              </div>
              <div className="absolute right-0 bottom-0 opacity-10">
                <MousePointer2 className="w-24 h-24 -mr-4 -mb-4" />
              </div>
            </div>

            {/* Stat Card 2: Timer */}
            <div className="bg-[#1e293b] p-6 rounded-xl border border-slate-700">
              <div className="text-slate-400 text-sm font-medium uppercase tracking-wider mb-1">
                Time Remaining
              </div>
              <div
                className={`text-4xl font-bold ${
                  timeLeft <= 2 && isActive ? "text-red-500" : "text-slate-200"
                }`}
              >
                {timeLeft}s
              </div>
            </div>

            {/* Stat Card 3: Session Record (Main Stat: Max Clicks, Sub Stat: Max CPS) */}
            <div className="bg-[#1e293b] p-6 rounded-xl border border-slate-700 relative overflow-hidden">
              <div className="text-slate-400 text-sm font-medium uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Trophy className="w-4 h-4 text-emerald-400" />
                Session Record ({duration}s)
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-emerald-400">
                  {activeRecord.clicks}
                </span>
                <span className="text-slate-400 text-sm font-medium">clicks</span>
                {activeRecord.clicks > 0 && (
                  <span className="text-emerald-500/80 text-[12px] font-semibold ml-1">
                    ({activeRecord.cps.toFixed(1)} CPS)
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Click Button Container */}
          <div className="bg-[#1e293b] rounded-2xl border border-slate-700 p-8 flex flex-col items-center justify-center flex-1 min-h-[420px] relative">
            <button
              onClick={handleClick}
              className={`w-64 h-64 rounded-full border-8 transition-all active:scale-95 flex flex-col items-center justify-center gap-2 select-none ${
                isActive
                  ? "bg-blue-600 border-blue-400 shadow-[0_0_50px_rgba(37,99,235,0.5)]"
                  : "bg-slate-800 border-slate-600 hover:border-slate-500"
              }`}
            >
              <span className="text-5xl font-black">
                {isActive ? "CLICK!" : "START"}
              </span>
              <span className="text-sm opacity-70">
                {isActive ? clicks : `${duration} Second Test`}
              </span>
            </button>

            {!isActive && cps > 0 && (
              <div className="mt-8 text-center animate-in slide-in-from-bottom-5 w-full">
                <p className="text-slate-400 mb-2">Result</p>
                <div className="text-3xl font-bold text-white mb-2">
                  {clicks} Clicks <span className="text-slate-500 text-xl">({cps.toFixed(2)} CPS)</span>
                </div>
                
                {/* SVG Pace Graph for the current run */}
                {currentRunPace.length > 0 && (
                  <div className="mt-4 bg-slate-900/50 p-4 rounded-lg border border-slate-800 w-full max-w-md text-left mx-auto">
                    <div className="text-xs text-slate-400 mb-2 font-medium flex items-center gap-1">
                      <Zap className="w-3.5 h-3.5 text-blue-400" />
                      Click Speed Flow (clicks per second)
                    </div>
                    <div className="flex items-end justify-between h-20 gap-1.5 px-1 pt-2">
                      {currentRunPace.slice(0, duration).map((val, idx) => {
                        const minVal = Math.min(...currentRunPace);
                        const maxVal = Math.max(...currentRunPace, 1);
                        const range = maxVal - minVal;
                        // Autoscale height from 15% to 100% to clearly show relative performance
                        const pct = range > 0 ? ((val - minVal) / range) * 80 + 15 : 100;
                        return (
                          <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                            <span className="text-[9px] text-slate-350 font-bold mb-1 shrink-0">
                              {val}
                            </span>
                            <div 
                              className="w-full bg-blue-500 rounded-t-sm hover:bg-blue-400 transition-all duration-300"
                              style={{ height: `${Math.max(8, pct)}%` }}
                            />
                            <span className="text-[8px] text-slate-500 mt-1">{idx + 1}s</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <button
                  onClick={() => {
                    setCps(0);
                    setClicks(0);
                    setCurrentRunPace([]);
                    setTimeLeft(duration);
                  }}
                  className="mt-4 flex items-center gap-2 text-blue-400 hover:text-blue-300 mx-auto"
                >
                  <RefreshCw className="w-4 h-4" /> Reset
                </button>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Session History */}
        <div className="lg:col-span-3 flex flex-col h-full order-3">
          <div className="bg-[#1e293b] p-6 rounded-xl border border-slate-700 flex-1 flex flex-col">
            <div className="text-slate-400 text-sm font-medium uppercase tracking-wider mb-4 flex items-center gap-1.5 shrink-0">
              <Calendar className="w-4 h-4 text-blue-400" />
              Session History
            </div>
            <div className="flex-1 overflow-y-auto pr-1 max-h-[550px] lg:max-h-none flex flex-col gap-3">
              {history.length === 0 ? (
                <div className="text-slate-500 text-sm text-center py-12 my-auto">
                  No runs recorded yet.
                </div>
              ) : (
                history.map((run) => (
                  <div
                    key={run.id}
                    className="p-3 bg-slate-900/30 border border-slate-800 rounded-lg flex flex-col gap-1.5 shrink-0"
                  >
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-300">
                        {run.clicks} clicks ({run.cps.toFixed(1)} CPS)
                      </span>
                      <span className="text-slate-500">{run.timestamp}</span>
                    </div>
                    {/* Small visual timeline for the history run */}
                    <div className="flex items-center gap-1 h-3">
                      {run.pace.map((pVal, pIdx) => {
                        const minVal = Math.min(...run.pace);
                        const maxVal = Math.max(...run.pace, 1);
                        const range = maxVal - minVal;
                        // Autoscale opacity/intensity from 0.15 to 1.0 to highlight pace changes
                        const intensity = range > 0 ? ((pVal - minVal) / range) * 0.85 + 0.15 : 1.0;
                        return (
                          <div
                            key={pIdx}
                            className="flex-1 h-full rounded-sm bg-blue-500/80"
                            style={{ opacity: intensity }}
                            title={`Sec ${pIdx + 1}: ${pVal} clicks`}
                          />
                        );
                      })}
                    </div>
                    <div className="text-[10px] text-slate-500 text-right">
                      {run.duration}s duration
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
