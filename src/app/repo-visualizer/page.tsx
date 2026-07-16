"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Menu,
  X,
  Files,
  FileText,
  FolderTree,
  Keyboard,
  Users,
} from "lucide-react";

import { useGithubLoader } from "./hooks/useGithubLoader";
import { useGraphEngine } from "./hooks/useGraphEngine";
import { GraphCanvas } from "./components/GraphCanvas";
import { Toolbar } from "./components/Toolbar";
import { Legend } from "./components/Legend";
import { Header } from "./components/Header";
import { RepoLoader } from "./components/RepoLoader";
import { CommitOverlay } from "./components/CommitOverlay";
import { RepositoryLoadingState } from "./components/RepositoryLoadingState";

function StatValueSkeleton({ width = "w-12" }: { width?: string }) {
  return (
    <span
      className={`block h-4 ${width} animate-pulse rounded bg-white/10 motion-reduce:animate-none`}
      aria-hidden="true"
    />
  );
}

export default function GithubHistoryVisualizerPage() {
  const {
    dataset,
    repositoryInput,
    setRepositoryInput,
    githubToken,
    setGithubToken,
    commitLimit,
    setCommitLimit,
    isInitializingDataset,
    isLoadingRepository,
    repositoryError,
    handleRepositoryLoad,
    handleLocalLogUpload,
    handleUseDemo,
  } = useGithubLoader();

  const {
    cursor,
    setCursor,
    isPlaying,
    setIsPlaying,
    speed,
    setSpeed,
    graphStats,
    currentEvent,
    timelineStats,
    graphRef,
    authorsRef,
    particlesRef,
    activeNodeIdsRef,
    cameraRef,
    avatarCacheRef,
    fitGraph,
    changeZoom,
    advancePlayback,
  } = useGraphEngine(dataset);

  const containerRef = useRef<HTMLDivElement>(null);
  const visualizationRef = useRef<HTMLDivElement>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isRepositorySwitcherOpen, setIsRepositorySwitcherOpen] =
    useState(false);
  const [isSidebarScrolling, setIsSidebarScrolling] = useState(false);
  const [readyDatasetId, setReadyDatasetId] = useState<string | null>(null);
  const sidebarScrollTimeoutRef = useRef<number | null>(null);
  const isDatasetLoading = isInitializingDataset || isLoadingRepository;
  const isDatasetReady = !isDatasetLoading && dataset.events.length > 0;
  const isVisualizationReady = isDatasetReady && readyDatasetId === dataset.id;

  useEffect(() => {
    if (isDatasetLoading) setIsPlaying(false);
  }, [isDatasetLoading, setIsPlaying]);

  const toggleFullscreen = async () => {
    const element = containerRef.current;
    if (!element) return;

    if (document.fullscreenElement) {
      await document.exitFullscreen();
    } else {
      await element.requestFullscreen();
    }
  };

  const handleFitGraph = useCallback(() => {
    if (visualizationRef.current) {
      fitGraph(
        visualizationRef.current.clientWidth,
        visualizationRef.current.clientHeight,
      );
    }
  }, [fitGraph]);

  useEffect(() => {
    if (!isDatasetReady) return;

    const frame = window.requestAnimationFrame(() => {
      handleFitGraph();
      setReadyDatasetId(dataset.id);
    });

    return () => window.cancelAnimationFrame(frame);
  }, [dataset.id, handleFitGraph, isDatasetReady]);

  useEffect(() => {
    const timeout = window.setTimeout(handleFitGraph, 300);
    return () => window.clearTimeout(timeout);
  }, [handleFitGraph, isSidebarCollapsed]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isTextInput =
        target instanceof HTMLInputElement &&
        !["button", "checkbox", "radio", "range"].includes(target.type);
      if (
        isTextInput ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        target?.isContentEditable
      ) {
        return;
      }

      if (event.code === "Space" && isDatasetReady) {
        event.preventDefault();
        if (event.repeat) return;
        setIsPlaying((playing) => !playing);
      } else if (event.key === "ArrowRight" && isDatasetReady) {
        event.preventDefault();
        setIsPlaying(false);
        setCursor((value) => Math.min(dataset.events.length, value + 1));
      } else if (event.key === "ArrowLeft" && isDatasetReady) {
        event.preventDefault();
        setIsPlaying(false);
        setCursor((value) => Math.max(0, value - 1));
      } else if (event.key.toLowerCase() === "r" && isDatasetReady) {
        event.preventDefault();
        setIsPlaying(false);
        setCursor(0);
      } else if (event.key === "+" || event.key === "=") {
        event.preventDefault();
        changeZoom(1.18);
      } else if (event.key === "-" || event.key === "_") {
        event.preventDefault();
        changeZoom(0.84);
      } else if (event.key.toLowerCase() === "f") {
        event.preventDefault();
        void toggleFullscreen();
      }
    };

    window.addEventListener("keydown", handleKeyDown, { capture: true });
    return () =>
      window.removeEventListener("keydown", handleKeyDown, { capture: true });
  }, [
    changeZoom,
    dataset.events.length,
    isDatasetReady,
    setCursor,
    setIsPlaying,
  ]);

  const handleSidebarScroll = () => {
    setIsSidebarScrolling(true);
    if (sidebarScrollTimeoutRef.current !== null) {
      window.clearTimeout(sidebarScrollTimeoutRef.current);
    }
    sidebarScrollTimeoutRef.current = window.setTimeout(() => {
      setIsSidebarScrolling(false);
    }, 700);
  };

  return (
    <main
      ref={containerRef}
      className="relative flex h-svh min-h-0 w-full overflow-hidden bg-[#04060b] text-slate-100 lg:min-h-155"
    >
      {/* Mobile Sidebar Toggle Button */}
      <button
        type="button"
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="pointer-events-auto fixed left-3 top-3 z-40 grid size-10 place-items-center rounded-xl border border-white/10 bg-slate-950/70 text-slate-300 shadow-lg backdrop-blur-xl transition hover:bg-white/8 hover:text-white lg:hidden"
        aria-label="Toggle controls sidebar"
      >
        {isSidebarOpen ? <X className="size-5" /> : <Menu className="size-5" />}
      </button>

      {/* Sidebar (Sleek Dashboard Panel) */}
      <div
        className={`fixed inset-y-0 left-0 z-30 flex w-88 shrink-0 flex-col gap-4 border-r border-white/10 bg-slate-950/76 p-5 shadow-2xl backdrop-blur-3xl transition-transform duration-300 ease-in-out lg:static lg:bg-slate-950/30 lg:transition-[width,padding,opacity] ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } ${isSidebarCollapsed ? "lg:w-0 lg:overflow-hidden lg:border-r-0 lg:p-0 lg:opacity-0 lg:pointer-events-none" : "lg:translate-x-0"}`}
      >
        <Header
          datasetName={dataset.name}
          datasetUrl={dataset.url}
          onSwitchRepository={() => setIsRepositorySwitcherOpen(true)}
        />

        <RepoLoader
          isOpen={isRepositorySwitcherOpen}
          onClose={() => setIsRepositorySwitcherOpen(false)}
          repositoryInput={repositoryInput}
          setRepositoryInput={setRepositoryInput}
          githubToken={githubToken}
          setGithubToken={setGithubToken}
          commitLimit={commitLimit}
          setCommitLimit={setCommitLimit}
          isLoadingRepository={isLoadingRepository}
          repositoryError={repositoryError}
          handleRepositoryLoad={(e) => handleRepositoryLoad(e, handleFitGraph)}
          handleLocalLogUpload={handleLocalLogUpload}
          handleUseDemo={() => handleUseDemo(handleFitGraph)}
          dataset={dataset}
          onLoadSuccess={handleFitGraph}
        />

        <div
          onScroll={handleSidebarScroll}
          className={`flex-1 space-y-4 overflow-y-auto pr-1 scrollbar-thin [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:border-2 [&::-webkit-scrollbar-thumb]:border-slate-950/70 ${
            isSidebarScrolling
              ? "[scrollbar-color:rgba(100,116,139,0.65)_rgba(15,23,42,0.5)] [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-slate-900/50 [&::-webkit-scrollbar-thumb]:bg-slate-600/65"
              : "[scrollbar-color:transparent_transparent] [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-transparent"
          }`}
        >
          {/* Repo statistics dashboard */}
          <div className="flex flex-col gap-2.5">
            <p className="px-1 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
              Repository stats
            </p>
            <div
              className="grid grid-cols-2 gap-2"
              aria-busy={isDatasetLoading}
              aria-label={
                isDatasetLoading
                  ? "Repository statistics loading"
                  : "Repository statistics"
              }
            >
              <div className="rounded-xl border border-white/5 bg-white/4 p-2.5">
                <span className="flex items-center gap-1.5 text-[10px] text-slate-500 mb-1">
                  <Files className="size-3.5" /> Files
                </span>
                {isDatasetLoading ? (
                  <StatValueSkeleton />
                ) : (
                  <span className="font-mono text-sm font-bold text-slate-200">
                    {graphStats.files}
                  </span>
                )}
              </div>
              <div className="rounded-xl border border-white/5 bg-white/4 p-2.5">
                <span className="flex items-center gap-1.5 text-[10px] text-slate-500 mb-1">
                  <FolderTree className="size-3.5" /> Folders
                </span>
                {isDatasetLoading ? (
                  <StatValueSkeleton />
                ) : (
                  <span className="font-mono text-sm font-bold text-slate-200">
                    {graphStats.directories}
                  </span>
                )}
              </div>
              <div className="rounded-xl border border-white/5 bg-white/4 p-2.5">
                <span className="flex items-center gap-1.5 text-[10px] text-slate-500 mb-1">
                  <Users className="size-3.5" /> Authors
                </span>
                {isDatasetLoading ? (
                  <StatValueSkeleton />
                ) : (
                  <span className="font-mono text-sm font-bold text-slate-200">
                    {timelineStats.authors}
                  </span>
                )}
              </div>
              <div className="rounded-xl border border-white/5 bg-white/4 p-2.5">
                <span className="flex items-center gap-1.5 text-[10px] text-slate-500 mb-1">
                  Changes
                </span>
                {isDatasetLoading ? (
                  <StatValueSkeleton width="w-20" />
                ) : (
                  <div className="flex items-center gap-1 font-mono text-xs font-bold">
                    <span className="text-emerald-400">
                      +{timelineStats.additions.toLocaleString()}
                    </span>
                    <span className="text-rose-400">
                      -{timelineStats.deletions.toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
              <div
                className="col-span-2 rounded-xl border border-white/5 bg-white/4 p-2.5"
                title="Net lines represented by the loaded commit history"
              >
                <span className="flex items-center gap-1.5 text-[10px] text-slate-500 mb-1">
                  <FileText className="size-3.5" /> Total lines
                </span>
                {isDatasetLoading ? (
                  <StatValueSkeleton width="w-16" />
                ) : (
                  <span className="font-mono text-sm font-bold text-slate-200">
                    {Math.max(
                      0,
                      timelineStats.additions - timelineStats.deletions,
                    ).toLocaleString()}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="hidden items-center gap-2 rounded-xl border border-white/5 bg-white/3 px-3 py-2 text-[10px] text-slate-500">
            <Keyboard className="size-3.5 shrink-0" />
            <span>
              Space play · ←/→ step · R reset · +/- zoom · F fullscreen
            </span>
          </div>

          <Legend graphRef={graphRef} />
          {isDatasetReady && <CommitOverlay currentEvent={currentEvent} />}
        </div>
      </div>

      {/* Main visualization container */}
      <div
        ref={visualizationRef}
        className="relative h-full flex-1 overflow-hidden"
      >
        <GraphCanvas
          dataset={dataset}
          graphRef={graphRef}
          authorsRef={authorsRef}
          particlesRef={particlesRef}
          activeNodeIdsRef={activeNodeIdsRef}
          cameraRef={cameraRef}
          avatarCacheRef={avatarCacheRef}
          fitGraph={fitGraph}
          containerRef={visualizationRef}
          isPlaying={isPlaying}
          speed={speed}
          advancePlayback={advancePlayback}
        />

        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgba(3,6,14,0.28),transparent_24%,transparent_72%,rgba(3,6,14,0.48))]" />

        {!isVisualizationReady && (
          <RepositoryLoadingState
            isLoading={isDatasetLoading}
            onChooseRepository={() => setIsRepositorySwitcherOpen(true)}
          />
        )}

        {/* Zoom & Fullscreen Controls */}
        <div className="pointer-events-none absolute right-3 top-3 z-10 hidden flex-col gap-2 sm:right-5 sm:top-5 lg:flex">
          <button
            type="button"
            onClick={() => changeZoom(1.18)}
            className="pointer-events-auto grid size-9 place-items-center rounded-xl border border-white/10 bg-slate-950/70 text-slate-400 shadow-lg backdrop-blur-xl transition hover:bg-white/8 hover:text-white"
            aria-label="Zoom in"
          >
            <ZoomIn className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => changeZoom(0.84)}
            className="pointer-events-auto grid size-9 place-items-center rounded-xl border border-white/10 bg-slate-950/70 text-slate-400 shadow-lg backdrop-blur-xl transition hover:bg-white/8 hover:text-white"
            aria-label="Zoom out"
          >
            <ZoomOut className="size-4" />
          </button>

          <button
            type="button"
            onClick={toggleFullscreen}
            className="pointer-events-auto grid size-9 place-items-center rounded-xl border border-white/10 bg-slate-950/70 text-slate-400 shadow-lg backdrop-blur-xl transition hover:bg-white/8 hover:text-white"
            aria-label="Toggle fullscreen"
          >
            <Maximize2 className="size-4" />
          </button>
        </div>

        {/* Playback controls container */}
        <Toolbar
          dataset={dataset}
          cursor={cursor}
          setCursor={setCursor}
          isPlaying={isPlaying}
          setIsPlaying={setIsPlaying}
          speed={speed}
          setSpeed={setSpeed}
          isReady={isVisualizationReady}
        />
      </div>

      <button
        type="button"
        onClick={() => setIsSidebarCollapsed((collapsed) => !collapsed)}
        className={`pointer-events-auto absolute top-1/2 z-40 hidden size-9 -translate-y-1/2 place-items-center rounded-full border border-white/10 bg-slate-950/80 text-slate-400 shadow-lg backdrop-blur-xl transition-all duration-300 hover:bg-white/10 hover:text-white lg:grid ${
          isSidebarCollapsed ? "left-3" : "left-83.5"
        }`}
        aria-label={
          isSidebarCollapsed ? "Show controls sidebar" : "Hide controls sidebar"
        }
        title={isSidebarCollapsed ? "Show controls" : "Hide controls"}
      >
        {isSidebarCollapsed ? (
          <ChevronRight className="size-4" />
        ) : (
          <ChevronLeft className="size-4" />
        )}
      </button>
    </main>
  );
}
