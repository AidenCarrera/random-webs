"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Award, Calendar, MousePointer2, Trophy, Zap } from "lucide-react";

const DURATIONS = [5, 10, 30] as const;
const STORAGE_KEY = "click-speed-test-progress";
const RESULT_BUFFER_MS = 2500;
const EMPTY_RECORD = { clicks: 0, cps: 0 };
const PANEL = "rounded-xl border border-slate-700 bg-[#1e293b]";

type Duration = (typeof DURATIONS)[number];
type RecordEntry = typeof EMPTY_RECORD;
type Records = Record<Duration, RecordEntry>;

type RunResult = {
  id: string;
  clicks: number;
  cps: number;
  duration: Duration;
  pace: number[];
  timestamp: string;
};

type SavedProgress = {
  duration: Duration;
  records: Records;
  history: RunResult[];
};

type Milestone = {
  label: string;
  target: number;
  color: string;
};

const EMPTY_RECORDS: Records = {
  5: EMPTY_RECORD,
  10: EMPTY_RECORD,
  30: EMPTY_RECORD,
};

const MILESTONE_STYLES = [
  ["Bronze Clicker", "text-amber-500 bg-amber-500/10 border-amber-500/30"],
  ["Silver Clicker", "text-slate-400 bg-slate-400/10 border-slate-400/30"],
  ["Gold Clicker", "text-yellow-400 bg-yellow-400/10 border-yellow-400/30"],
  ["Platinum Clicker", "text-cyan-400 bg-cyan-400/10 border-cyan-400/30"],
  ["Diamond Clicker", "text-indigo-400 bg-indigo-400/10 border-indigo-400/30"],
  ["Click Legend", "text-rose-400 bg-rose-400/10 border-rose-400/30"],
] as const;

const TARGETS: Record<Duration, number[]> = {
  5: [15, 25, 35, 45, 55, 65],
  10: [30, 50, 70, 90, 110, 130],
  30: [75, 120, 180, 240, 300, 360],
};

const MILESTONES = Object.fromEntries(
  DURATIONS.map((duration) => [
    duration,
    MILESTONE_STYLES.map(([label, color], index) => ({
      label,
      color,
      target: TARGETS[duration][index],
    })),
  ]),
) as Record<Duration, Milestone[]>;

function isDuration(value: unknown): value is Duration {
  return DURATIONS.includes(value as Duration);
}

function scaleValues(values: number[], minOutput: number, maxOutput: number) {
  const min = Math.min(...values);
  const max = Math.max(...values, 1);
  const range = max - min;

  return values.map((value) =>
    range ? ((value - min) / range) * (maxOutput - minOutput) + minOutput : maxOutput,
  );
}

function formatTime() {
  return new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export default function ClickSpeedTest() {
  const [duration, setDuration] = useState<Duration>(10);
  const [timeLeft, setTimeLeft] = useState(10);
  const [clicks, setClicks] = useState(0);
  const [resultCps, setResultCps] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [canRestart, setCanRestart] = useState(true);
  const [pace, setPace] = useState<number[]>([]);
  const [records, setRecords] = useState<Records>(EMPTY_RECORDS);
  const [history, setHistory] = useState<RunResult[]>([]);
  const [hasLoaded, setHasLoaded] = useState(false);

  const createId = () =>
  globalThis.crypto?.randomUUID?.() ??
  `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

  const clicksRef = useRef(0);
  const lastPaceClicksRef = useRef(0);
  const restartTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeRecord = records[duration];
  const elapsed = duration - timeLeft;
  const liveCps = isActive ? clicks / Math.max(elapsed, 0.1) : resultCps;
  const paceHeights = useMemo(() => scaleValues(pace, 15, 100), [pace]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as Partial<SavedProgress>;

        if (isDuration(saved.duration)) {
          setDuration(saved.duration);
          setTimeLeft(saved.duration);
        }

        if (saved.records) {
          setRecords({
            5: saved.records[5] ?? EMPTY_RECORD,
            10: saved.records[10] ?? EMPTY_RECORD,
            30: saved.records[30] ?? EMPTY_RECORD,
          });
        }

        if (Array.isArray(saved.history)) setHistory(saved.history.slice(0, 5));
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    } finally {
      setHasLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!hasLoaded) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ duration, records, history }));
  }, [duration, hasLoaded, history, records]);

  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      const currentClicks = clicksRef.current;
      setPace((current) => [...current, currentClicks - lastPaceClicksRef.current]);
      lastPaceClicksRef.current = currentClicks;
      setTimeLeft((current) => Math.max(0, current - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive]);

  useEffect(() => {
    if (!isActive || timeLeft > 0) return;

    const finalClicks = clicksRef.current;
    const cps = finalClicks / duration;

    setIsActive(false);
    setCanRestart(false);
    setResultCps(cps);
    setRecords((current) =>
      finalClicks > current[duration].clicks
        ? { ...current, [duration]: { clicks: finalClicks, cps } }
        : current,
    );

    setPace((current) => {
      // React may batch the final click with the timer tick, so reconcile the unlogged remainder.
      const loggedClicks = current.reduce((sum, value) => sum + value, 0);
      const finalPace = [...current, finalClicks - loggedClicks].slice(0, duration);

      setHistory((runs) => [
        {
          id: createId(),
          clicks: finalClicks,
          cps,
          duration,
          pace: finalPace,
          timestamp: formatTime(),
        },
        ...runs,
      ].slice(0, 5));

      return finalPace;
    });

    restartTimeoutRef.current = setTimeout(() => {
      setCanRestart(true);
      restartTimeoutRef.current = null;
    }, RESULT_BUFFER_MS);
  }, [duration, isActive, timeLeft]);

  useEffect(
    () => () => {
      if (restartTimeoutRef.current) clearTimeout(restartTimeoutRef.current);
    },
    [],
  );

  function clearRun(nextDuration = duration) {
    setIsActive(false);
    setClicks(0);
    setTimeLeft(nextDuration);
    setResultCps(0);
    setPace([]);
    setCanRestart(true);
    clicksRef.current = 0;
    lastPaceClicksRef.current = 0;

    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
      restartTimeoutRef.current = null;
    }
  }

  function startTest() {
    if (!canRestart) return false;
    clearRun();
    setIsActive(true);
    return true;
  }

  function handleMainClick() {
    if (!isActive && !startTest()) return;

    clicksRef.current += 1;
    setClicks(clicksRef.current);
  }

  function changeDuration(nextDuration: Duration) {
    setDuration(nextDuration);
    clearRun(nextDuration);
  }

  return (
    <main className="flex min-h-screen flex-col gap-6 bg-[#0f172a] p-4 font-sans text-slate-200 md:gap-8 md:p-8">
      <header className="flex shrink-0 items-center justify-center border-b border-slate-800 pb-4">
        <h1 className="flex items-center gap-3 text-2xl font-black text-slate-100 md:text-3xl">
          <span className="flex size-10 items-center justify-center rounded-xl bg-blue-600">
            <MousePointer2 className="size-6" />
          </span>
          Click Speed Test
        </h1>
      </header>

      <div className="grid flex-1 grid-cols-1 items-stretch gap-6 lg:grid-cols-12">
        <aside className="order-2 flex h-full flex-col gap-6 lg:order-1 lg:col-span-3">
          <section className={`${PANEL} shrink-0 p-6`}>
            <PanelTitle>Test Duration</PanelTitle>
            <div className="grid grid-cols-3 gap-2">
              {DURATIONS.map((value) => (
                <button
                  key={value}
                  disabled={isActive}
                  onClick={() => changeDuration(value)}
                  className={`rounded-lg border px-3 py-2 text-sm font-bold transition-all disabled:cursor-not-allowed disabled:opacity-50 ${
                    duration === value
                      ? "border-blue-500 bg-blue-600 text-white shadow-md shadow-blue-500/20"
                      : "border-slate-700 bg-slate-800 text-slate-300 hover:border-slate-600"
                  }`}
                >
                  {value}s
                </button>
              ))}
            </div>
          </section>

          <section className={`${PANEL} flex flex-1 flex-col justify-between p-6`}>
            <PanelTitle icon={<Award className="size-4 text-yellow-500" />}>
              Milestones ({duration}s mode)
            </PanelTitle>
            <div className="flex flex-1 flex-col justify-between gap-2.5">
              {MILESTONES[duration].map((milestone) => {
                const achieved = Math.max(clicks, activeRecord.clicks) >= milestone.target;
                return (
                  <div
                    key={milestone.label}
                    className={`flex flex-1 items-center justify-between rounded-lg border p-2.5 transition-all ${
                      achieved
                        ? `${milestone.color} shadow-sm`
                        : "border-slate-800 bg-slate-900/30 text-slate-500"
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold leading-snug">{milestone.label}</div>
                      <div className="text-[10px] opacity-80">{milestone.target} clicks target</div>
                    </div>
                    <span
                      className={`rounded px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider ${
                        achieved
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "bg-slate-800 text-slate-600"
                      }`}
                    >
                      {achieved ? "Unlocked" : "Locked"}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        </aside>

        <section className="order-1 flex h-full flex-col gap-6 lg:order-2 lg:col-span-6">
          <div className="grid shrink-0 grid-cols-1 gap-6 md:grid-cols-3">
            <StatCard label="Current CPS" value={liveCps.toFixed(1)} valueClass="text-blue-400">
              <MousePointer2 className="absolute -bottom-4 -right-4 size-24 opacity-10" />
            </StatCard>
            <StatCard
              className="hidden md:block"
              label="Time Remaining"
              value={`${timeLeft}s`}
              valueClass={timeLeft <= 2 && isActive ? "text-red-500" : "text-slate-200"}
            />
            <RecordCard className="hidden md:block" record={activeRecord} duration={duration} />
          </div>

          <div className={`${PANEL} shrink-0 overflow-hidden md:hidden`}>
            <div className="grid grid-cols-2 divide-x divide-slate-700">
              <CompactStat
                label="Time Remaining"
                value={`${timeLeft}s`}
                valueClass={timeLeft <= 2 && isActive ? "text-red-500" : "text-slate-200"}
              />
              <CompactRecord record={activeRecord} />
            </div>
          </div>

          <div className={`${PANEL} relative flex min-h-105 flex-1 flex-col items-center justify-center rounded-2xl p-8`}>
            {isActive && (
              <button
                onClick={() => clearRun()}
                className="absolute right-4 top-4 rounded-lg border border-slate-600 bg-slate-900/70 px-3 py-2 text-sm font-semibold text-slate-200 transition-colors hover:border-slate-500 hover:bg-slate-800"
              >
                Reset Test
              </button>
            )}

            <button
              onClick={handleMainClick}
              disabled={!isActive && !canRestart}
              className={`flex size-64 select-none flex-col items-center justify-center gap-2 rounded-full border-8 transition-all active:scale-95 ${
                isActive
                  ? "border-blue-400 bg-blue-600 shadow-[0_0_50px_rgba(37,99,235,0.5)]"
                  : canRestart
                    ? "border-slate-600 bg-slate-800 hover:border-slate-500"
                    : "cursor-not-allowed border-slate-700 bg-slate-800/80"
              }`}
            >
              <span className="text-5xl font-black">{isActive ? "CLICK!" : "START"}</span>
              <span className="text-sm opacity-70">
                {isActive ? clicks : `${duration} Second Test`}
              </span>
            </button>

            {!isActive && resultCps > 0 && (
              <div className="mt-8 w-full animate-in text-center slide-in-from-bottom-5">
                <p className="mb-2 text-slate-400">Result</p>
                <div className="mb-2 text-3xl font-bold text-white">
                  {clicks} Clicks{" "}
                  <span className="text-xl text-slate-500">({resultCps.toFixed(2)} CPS)</span>
                </div>
                <PaceChart pace={pace} heights={paceHeights} />
              </div>
            )}
          </div>
        </section>

        <aside className="order-3 flex h-full flex-col lg:col-span-3">
          <section className={`${PANEL} flex flex-1 flex-col p-6`}>
            <PanelTitle icon={<Calendar className="size-4 text-blue-400" />}>
              Session History
            </PanelTitle>
            <div className="flex max-h-137.5 flex-1 flex-col gap-3 overflow-y-auto pr-1 lg:max-h-none">
              {history.length ? (
                history.map((run) => <HistoryCard key={run.id} run={run} />)
              ) : (
                <div className="my-auto py-12 text-center text-sm text-slate-500">
                  No runs recorded yet.
                </div>
              )}
            </div>
          </section>
        </aside>
      </div>
    </main>
  );
}

function PanelTitle({ children, icon }: { children: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <div className="mb-4 flex shrink-0 items-center gap-1.5 text-sm font-medium uppercase tracking-wider text-slate-400">
      {icon}
      {children}
    </div>
  );
}

function StatCard({
  label,
  value,
  valueClass,
  className = "",
  children,
}: {
  label: string;
  value: string;
  valueClass: string;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className={`${PANEL} relative overflow-hidden p-6 ${className}`}>
      <div className="mb-1 text-sm font-medium uppercase tracking-wider text-slate-400">{label}</div>
      <div className={`text-4xl font-bold ${valueClass}`}>{value}</div>
      {children}
    </div>
  );
}

function RecordCard({ record, duration, className = "" }: { record: RecordEntry; duration: Duration; className?: string }) {
  return (
    <div className={`${PANEL} relative overflow-hidden p-6 ${className}`}>
      <div className="mb-1 flex items-center gap-1.5 text-sm font-medium uppercase tracking-wider text-slate-400">
        <Trophy className="size-4 text-emerald-400" />
        Session Record ({duration}s)
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-4xl font-bold text-emerald-400">{record.clicks}</span>
        <span className="text-sm font-medium text-slate-400">clicks</span>
        {record.clicks > 0 && (
          <span className="ml-1 text-xs font-semibold text-emerald-500/80">
            ({record.cps.toFixed(1)} CPS)
          </span>
        )}
      </div>
    </div>
  );
}

function CompactStat({ label, value, valueClass }: { label: string; value: string; valueClass: string }) {
  return (
    <div className="p-4">
      <div className="mb-1 text-[11px] font-medium uppercase tracking-wider text-slate-400">{label}</div>
      <div className={`text-2xl font-bold ${valueClass}`}>{value}</div>
    </div>
  );
}

function CompactRecord({ record }: { record: RecordEntry }) {
  return (
    <div className="p-4">
      <div className="mb-1 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-slate-400">
        <Trophy className="size-3.5 text-emerald-400" /> Record
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="text-2xl font-bold text-emerald-400">{record.clicks}</span>
        <span className="text-xs text-slate-400">clicks</span>
      </div>
      {record.clicks > 0 && (
        <div className="text-[11px] font-semibold text-emerald-500/80">{record.cps.toFixed(1)} CPS</div>
      )}
    </div>
  );
}

function PaceChart({ pace, heights }: { pace: number[]; heights: number[] }) {
  if (!pace.length) return null;

  return (
    <div className="mx-auto mt-4 w-full max-w-md rounded-lg border border-slate-800 bg-slate-900/50 p-4 text-left">
      <div className="mb-2 flex items-center gap-1 text-xs font-medium text-slate-400">
        <Zap className="size-3.5 text-blue-400" /> Click Speed Flow (clicks per second)
      </div>
      <div className="flex h-20 items-end justify-between gap-1.5 px-1 pt-2">
        {pace.map((value, index) => (
          <div key={index} className="flex h-full flex-1 flex-col items-center justify-end">
            <span className="mb-1 shrink-0 text-[9px] font-bold text-slate-300">{value}</span>
            <div
              className="w-full rounded-t-sm bg-blue-500 transition-all duration-300 hover:bg-blue-400"
              style={{ height: `${Math.max(8, heights[index])}%` }}
            />
            <span className="mt-1 text-[8px] text-slate-500">{index + 1}s</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function HistoryCard({ run }: { run: RunResult }) {
  const intensities = scaleValues(run.pace, 0.15, 1);

  return (
    <div className="flex shrink-0 flex-col gap-1.5 rounded-lg border border-slate-800 bg-slate-900/30 p-3">
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-slate-300">
          {run.clicks} clicks ({run.cps.toFixed(1)} CPS)
        </span>
        <span className="text-slate-500">{run.timestamp}</span>
      </div>
      <div className="flex h-3 items-center gap-1">
        {run.pace.map((value, index) => (
          <div
            key={index}
            className="h-full flex-1 rounded-sm bg-blue-500/80"
            style={{ opacity: intensities[index] }}
            title={`Sec ${index + 1}: ${value} clicks`}
          />
        ))}
      </div>
      <div className="text-right text-[10px] text-slate-500">{run.duration}s duration</div>
    </div>
  );
}