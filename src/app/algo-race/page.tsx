"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Play, Pause, RotateCcw, Trophy } from "lucide-react";

type SortName =
  | "Bubble Sort"
  | "Selection Sort"
  | "Insertion Sort"
  | "Quick Sort"
  | "Merge Sort"
  | "Heap Sort";

type RaceStat = {
  name: SortName;
  durationMs: number;
  operationsPerItem: number;
};

const SORT_NAMES: SortName[] = [
  "Bubble Sort",
  "Selection Sort",
  "Insertion Sort",
  "Quick Sort",
  "Merge Sort",
  "Heap Sort",
];

const generateRandomData = (size: number) =>
  Array.from({ length: size }, () => Math.floor(Math.random() * 100) + 5);

// Algorithms
const bubbleSort = async (
  arr: number[],
  update: (arr: number[]) => void,
  checkStop: () => boolean,
  checkPause: () => Promise<void>,
  delay: number,
) => {
  const a = [...arr];
  for (let i = 0; i < a.length; i++) {
    for (let j = 0; j < a.length - i - 1; j++) {
      if (checkStop()) return;
      await checkPause();
      if (a[j] > a[j + 1]) {
        [a[j], a[j + 1]] = [a[j + 1], a[j]];
        update([...a]);
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }
  return a;
};

const selectionSort = async (
  arr: number[],
  update: (arr: number[]) => void,
  checkStop: () => boolean,
  checkPause: () => Promise<void>,
  delay: number,
) => {
  const a = [...arr];
  for (let i = 0; i < a.length; i++) {
    let min = i;
    for (let j = i + 1; j < a.length; j++) {
      if (checkStop()) return;
      await checkPause();
      if (a[j] < a[min]) {
        min = j;
      }
    }
    if (min !== i) {
      [a[i], a[min]] = [a[min], a[i]];
      update([...a]);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  return a;
};

const insertionSort = async (
  arr: number[],
  update: (arr: number[]) => void,
  checkStop: () => boolean,
  checkPause: () => Promise<void>,
  delay: number,
) => {
  const a = [...arr];
  for (let i = 1; i < a.length; i++) {
    const key = a[i];
    let j = i - 1;
    while (j >= 0 && a[j] > key) {
      if (checkStop()) return;
      await checkPause();
      a[j + 1] = a[j];
      j = j - 1;
      update([...a]);
      await new Promise((r) => setTimeout(r, delay));
    }
    a[j + 1] = key;
    update([...a]);
  }
  return a;
};

const quickSort = async (
  arr: number[],
  update: (arr: number[]) => void,
  checkStop: () => boolean,
  checkPause: () => Promise<void>,
  delay: number,
) => {
  const a = [...arr];

  const partition = async (low: number, high: number) => {
    if (checkStop()) return -1;
    await checkPause();
    const pivot = a[high];
    let i = low - 1;
    for (let j = low; j < high; j++) {
      if (checkStop()) return -1;
      await checkPause();
      if (a[j] < pivot) {
        i++;
        [a[i], a[j]] = [a[j], a[i]];
        update([...a]);
        await new Promise((r) => setTimeout(r, delay));
      }
    }
    [a[i + 1], a[high]] = [a[high], a[i + 1]];
    update([...a]);
    await new Promise((r) => setTimeout(r, delay));
    return i + 1;
  };

  const sort = async (low: number, high: number) => {
    if (checkStop()) return;
    await checkPause();
    if (low < high) {
      const pi = await partition(low, high);
      if (pi === -1) return;
      await sort(low, pi - 1);
      await sort(pi + 1, high);
    }
  };

  await sort(0, a.length - 1);
  return a;
};

const mergeSort = async (
  arr: number[],
  update: (arr: number[]) => void,
  checkStop: () => boolean,
  checkPause: () => Promise<void>,
  delay: number,
) => {
  const a = [...arr];

  const merge = async (left: number, mid: number, right: number) => {
    if (checkStop()) return;
    await checkPause();
    const n1 = mid - left + 1;
    const n2 = right - mid;
    const leftChunk = new Array(n1);
    const rightChunk = new Array(n2);

    for (let i = 0; i < n1; i++) leftChunk[i] = a[left + i];
    for (let j = 0; j < n2; j++) rightChunk[j] = a[mid + 1 + j];

    let i = 0;
    let j = 0;
    let k = left;

    while (i < n1 && j < n2) {
      if (checkStop()) return;
      await checkPause();
      if (leftChunk[i] <= rightChunk[j]) {
        a[k] = leftChunk[i];
        i++;
      } else {
        a[k] = rightChunk[j];
        j++;
      }
      k++;
      update([...a]);
      await new Promise((r) => setTimeout(r, delay));
    }

    while (i < n1) {
      if (checkStop()) return;
      await checkPause();
      a[k] = leftChunk[i];
      i++;
      k++;
      update([...a]);
      await new Promise((r) => setTimeout(r, delay));
    }

    while (j < n2) {
      if (checkStop()) return;
      await checkPause();
      a[k] = rightChunk[j];
      j++;
      k++;
      update([...a]);
      await new Promise((r) => setTimeout(r, delay));
    }
  };

  const sort = async (left: number, right: number) => {
    if (checkStop()) return;
    await checkPause();
    if (left >= right) return;
    const mid = left + Math.floor((right - left) / 2);
    await sort(left, mid);
    await sort(mid + 1, right);
    await merge(left, mid, right);
  };

  await sort(0, a.length - 1);
  return a;
};

const heapSort = async (
  arr: number[],
  update: (arr: number[]) => void,
  checkStop: () => boolean,
  checkPause: () => Promise<void>,
  delay: number,
) => {
  const a = [...arr];
  const n = a.length;

  const heapify = async (heapSize: number, rootIndex: number) => {
    if (checkStop()) return;
    await checkPause();
    let largest = rootIndex;
    const left = 2 * rootIndex + 1;
    const right = 2 * rootIndex + 2;

    if (left < heapSize && a[left] > a[largest]) largest = left;
    if (right < heapSize && a[right] > a[largest]) largest = right;

    if (largest !== rootIndex) {
      [a[rootIndex], a[largest]] = [a[largest], a[rootIndex]];
      update([...a]);
      await new Promise((r) => setTimeout(r, delay));
      await heapify(heapSize, largest);
    }
  };

  for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
    await heapify(n, i);
  }

  for (let i = n - 1; i > 0; i--) {
    if (checkStop()) return;
    await checkPause();
    [a[0], a[i]] = [a[i], a[0]];
    update([...a]);
    await new Promise((r) => setTimeout(r, delay));
    await heapify(i, 0);
  }

  return a;
};

export default function AlgoRacePage() {
  const [arraySize, setArraySize] = useState(60);
  const delay = arraySize <= 20 ? 150 : arraySize > 60 ? 5 : 20;

  const [bubbleArr, setBubbleArr] = useState<number[]>([]);
  const [selectArr, setSelectArr] = useState<number[]>([]);
  const [insertArr, setInsertArr] = useState<number[]>([]);
  const [quickArr, setQuickArr] = useState<number[]>([]);
  const [mergeArr, setMergeArr] = useState<number[]>([]);
  const [heapArr, setHeapArr] = useState<number[]>([]);

  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [winners, setWinners] = useState<SortName[]>([]);
  const [raceStats, setRaceStats] = useState<RaceStat[]>([]);
  const stopRef = useRef(false);
  const pausedRef = useRef(false);
  const raceIdRef = useRef(0);
  const finishedSortsRef = useRef(new Set<SortName>());
  const hasSeededInitialDataRef = useRef(false);

  const seedArrays = useCallback((size: number) => {
    const newArr = generateRandomData(size);
    setBubbleArr([...newArr]);
    setSelectArr([...newArr]);
    setInsertArr([...newArr]);
    setQuickArr([...newArr]);
    setMergeArr([...newArr]);
    setHeapArr([...newArr]);
  }, []);

  useEffect(() => {
    if (hasSeededInitialDataRef.current) return;
    hasSeededInitialDataRef.current = true;
    seedArrays(arraySize);
  }, [arraySize, seedArrays]);

  const reset = useCallback(
    (size = arraySize) => {
      raceIdRef.current += 1;
      stopRef.current = true;
      pausedRef.current = false;
      setIsRunning(false);
      setIsPaused(false);
      setWinners([]);
      setRaceStats([]);
      finishedSortsRef.current.clear();

      setTimeout(() => {
        stopRef.current = false;
        seedArrays(size);
      }, 100);
    },
    [arraySize, seedArrays],
  );

  const changeArraySize = (size: number) => {
    if (size === arraySize) return;
    setArraySize(size);
    reset(size);
  };

  const registerFinish = useCallback(
    (raceId: number, name: SortName, startedAt: number) => {
      if (stopRef.current || raceId !== raceIdRef.current) return;

      const durationMs = performance.now() - startedAt;
      const finishedSorts = finishedSortsRef.current;

      if (finishedSorts.has(name)) return;

      finishedSorts.add(name);
      setWinners([...finishedSorts]);

      setRaceStats((prev) => {
        if (prev.some((entry) => entry.name === name)) return prev;
        return [
          ...prev,
          {
            name,
            durationMs,
            operationsPerItem: durationMs / arraySize,
          },
        ];
      });

      if (finishedSorts.size === SORT_NAMES.length) {
        pausedRef.current = false;
        setIsRunning(false);
        setIsPaused(false);
      }
    },
    [arraySize],
  );

  const toggleRace = () => {
    if (isRunning) {
      pausedRef.current = !pausedRef.current;
      setIsPaused(pausedRef.current);
      return;
    }

    const raceId = raceIdRef.current + 1;
    raceIdRef.current = raceId;
    setIsRunning(true);
    setIsPaused(false);
    setWinners([]);
    setRaceStats([]);
    finishedSortsRef.current.clear();
    stopRef.current = false;
    pausedRef.current = false;

    const checkStop = () => stopRef.current || raceId !== raceIdRef.current;
    const checkPause = async () => {
      while (pausedRef.current) {
        if (checkStop()) return;
        await new Promise((r) => setTimeout(r, 100));
      }
    };

    const startTimes: Record<SortName, number> = {
      "Bubble Sort": performance.now(),
      "Selection Sort": performance.now(),
      "Insertion Sort": performance.now(),
      "Quick Sort": performance.now(),
      "Merge Sort": performance.now(),
      "Heap Sort": performance.now(),
    };

    bubbleSort(bubbleArr, setBubbleArr, checkStop, checkPause, delay).then(() =>
      registerFinish(raceId, "Bubble Sort", startTimes["Bubble Sort"]),
    );
    selectionSort(selectArr, setSelectArr, checkStop, checkPause, delay).then(
      () =>
        registerFinish(raceId, "Selection Sort", startTimes["Selection Sort"]),
    );
    insertionSort(insertArr, setInsertArr, checkStop, checkPause, delay).then(
      () =>
        registerFinish(raceId, "Insertion Sort", startTimes["Insertion Sort"]),
    );
    quickSort(quickArr, setQuickArr, checkStop, checkPause, delay).then(() =>
      registerFinish(raceId, "Quick Sort", startTimes["Quick Sort"]),
    );
    mergeSort(mergeArr, setMergeArr, checkStop, checkPause, delay).then(() =>
      registerFinish(raceId, "Merge Sort", startTimes["Merge Sort"]),
    );
    heapSort(heapArr, setHeapArr, checkStop, checkPause, delay).then(() =>
      registerFinish(raceId, "Heap Sort", startTimes["Heap Sort"]),
    );
  };

  const getRank = (name: SortName) => {
    const idx = winners.indexOf(name);
    if (idx === -1) return null;
    return idx + 1;
  };

  const orderedStats = [...raceStats].sort(
    (a, b) => a.durationMs - b.durationMs,
  );
  const averageTime =
    orderedStats.reduce((sum, entry) => sum + entry.durationMs, 0) /
    (orderedStats.length || 1);
  const winnerTime = orderedStats[0]?.durationMs ?? 0;
  const slowestTime = orderedStats.at(-1)?.durationMs ?? 0;
  const spread = slowestTime - winnerTime;
  const raceComplete = orderedStats.length === SORT_NAMES.length;

  return (
    <div className="min-h-screen bg-[#f0f2f5] px-2 py-2 text-[#333] sm:px-3 sm:py-3 md:h-screen md:overflow-hidden md:px-8 xl:px-16">
      <div className="mx-auto flex h-full max-w-360 flex-col gap-3 md:gap-4">
        <header className="flex flex-col gap-2 border-b-2 border-slate-300 pb-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="text-center sm:text-left">
            <h1 className="text-2xl font-black tracking-tight text-slate-800 sm:text-3xl">
              ALGO RACE
            </h1>
            <p className="text-[11px] text-slate-500 sm:text-xs">
              Visualizing efficiency • N={arraySize} • Delay={delay}ms
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-end">
            <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 shadow-sm">
              <span className="text-[10px] font-bold text-slate-400">SIZE</span>
              {[10, 60, 120].map((size) => (
                <button
                  key={size}
                  onClick={() => changeArraySize(size)}
                  disabled={isRunning}
                  className={`rounded px-1.5 py-0.5 text-xs font-bold ${
                    arraySize === size
                      ? "bg-slate-800 text-white"
                      : "text-slate-500 hover:bg-slate-100"
                  } disabled:opacity-50`}
                >
                  {size === 10 ? "S" : size === 60 ? "M" : "L"}
                </button>
              ))}
            </div>

            <button
              onClick={toggleRace}
              className="flex min-w-24 items-center justify-center gap-1.5 rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-bold text-white shadow-md transition-all hover:bg-slate-700"
            >
              {isRunning && !isPaused ? (
                <>
                  <Pause className="h-3.5 w-3.5" /> PAUSE
                </>
              ) : isRunning && isPaused ? (
                <>
                  <Play className="h-3.5 w-3.5" /> RESUME
                </>
              ) : (
                <>
                  <Play className="h-3.5 w-3.5" /> START
                </>
              )}
            </button>
            <button
              onClick={() => reset()}
              className="flex items-center gap-1.5 rounded-lg border-2 border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-800 shadow-sm transition-all hover:bg-slate-100"
            >
              <RotateCcw className="h-3.5 w-3.5" /> RESET
            </button>
          </div>
        </header>

        <div className="grid flex-1 min-h-0 grid-cols-2 items-center gap-1.5 md:grid-cols-2 md:gap-3 xl:grid-cols-3">
          <SortVisualizer
            name="Bubble Sort"
            data={bubbleArr}
            rank={getRank("Bubble Sort")}
            color="bg-blue-500"
            complexity="O(n^2)"
            isRaceComplete={raceComplete}
          />
          <SortVisualizer
            name="Selection Sort"
            data={selectArr}
            rank={getRank("Selection Sort")}
            color="bg-emerald-500"
            complexity="O(n^2)"
            isRaceComplete={raceComplete}
          />
          <SortVisualizer
            name="Insertion Sort"
            data={insertArr}
            rank={getRank("Insertion Sort")}
            color="bg-rose-500"
            complexity="O(n^2)"
            isRaceComplete={raceComplete}
          />
          <SortVisualizer
            name="Quick Sort"
            data={quickArr}
            rank={getRank("Quick Sort")}
            color="bg-violet-500"
            complexity="O(n log n)"
            isRaceComplete={raceComplete}
          />
          <SortVisualizer
            name="Merge Sort"
            data={mergeArr}
            rank={getRank("Merge Sort")}
            color="bg-cyan-500"
            complexity="O(n log n)"
            isRaceComplete={raceComplete}
          />
          <SortVisualizer
            name="Heap Sort"
            data={heapArr}
            rank={getRank("Heap Sort")}
            color="bg-amber-500"
            complexity="O(n log n)"
            isRaceComplete={raceComplete}
          />
        </div>

        {raceComplete && (
          <section className="rounded-xl border border-slate-200 bg-white p-2.5 shadow-lg md:p-3">
            <div className="grid gap-2 md:grid-cols-[minmax(15rem,0.85fr)_1fr] md:items-stretch">
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                <div className="mb-1 flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">
                  <Trophy className="h-3.5 w-3.5 text-amber-500" />
                  Post-Race Results
                </div>
                <div className="text-sm font-black text-slate-800 md:text-base">
                  {orderedStats[0]?.name} wins
                </div>
                <div className="mt-1 text-[11px] text-slate-500">
                  Avg {averageTime.toFixed(1)}ms &bull; Spread{" "}
                  {spread.toFixed(1)}ms &bull; Best{" "}
                  {orderedStats[0]?.operationsPerItem.toFixed(2)}ms/item
                </div>
              </div>

              <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-6">
                {orderedStats.map((entry, index) => {
                  const delta = entry.durationMs - winnerTime;
                  return (
                    <div
                      key={entry.name}
                      className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-800 text-[10px] font-black text-white">
                          {index + 1}
                        </span>
                        <div className="min-w-0 text-right">
                          <div className="truncate text-[11px] font-bold text-slate-700">
                            {entry.name.replace(" Sort", "")}
                          </div>
                          <div className="text-xs font-black text-slate-900">
                            {entry.durationMs.toFixed(1)}ms
                          </div>
                          <div className="text-[10px] text-slate-500">
                            +{delta.toFixed(1)}ms
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function SortVisualizer({
  name,
  data,
  rank,
  color,
  complexity,
  isRaceComplete,
}: {
  name: SortName;
  data: number[];
  rank: number | null;
  color: string;
  complexity: string;
  isRaceComplete: boolean;
}) {
  return (
    <div
      className={`relative mx-auto flex aspect-square w-full min-w-0 max-w-none flex-col rounded-xl border border-slate-100 bg-white p-2.5 shadow-lg md:p-3 ${
        isRaceComplete
          ? "md:max-w-[calc((100vh-238px)/3)] xl:max-w-[calc((100vh-218px)/2)]"
          : "md:max-w-[calc((100vh-138px)/3)] xl:max-w-[calc((100vh-128px)/2)]"
      }`}
    >
      <div className="mb-1.5 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 className="text-[11px] font-bold leading-tight text-slate-800 sm:text-sm md:text-base">
            {name}
          </h2>
          <div className="mt-0.5 text-[8px] font-bold uppercase tracking-[0.16em] text-slate-300 sm:text-[9px]">
            {complexity}
          </div>
        </div>
        {rank && (
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-yellow-400 text-[10px] font-black text-black shadow-md animate-in zoom-in">
            #{rank}
          </div>
        )}
      </div>

      <div className="relative flex min-h-0 flex-1 items-end gap-px border-b border-l border-slate-200 p-0.5">
        {data.map((val, i) => (
          <div
            key={i}
            style={{ height: `${val}%` }}
            className={`flex-1 rounded-t-[1px] ${color} opacity-80 transition-all duration-75 hover:opacity-100`}
          />
        ))}
      </div>
    </div>
  );
}
