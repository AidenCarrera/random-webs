import { ChangeEvent, DragEvent, FormEvent, useId, useState } from "react";
import { FileUp, Link2, LoaderCircle, Search, Settings, X } from "lucide-react";
import { Dataset } from "../types";

type RepoLoaderProps = {
  isOpen: boolean;
  onClose: () => void;
  repositoryInput: string;
  setRepositoryInput: (val: string) => void;
  githubToken: string;
  setGithubToken: (val: string) => void;
  commitLimit: number;
  setCommitLimit: (val: number) => void;
  isLoadingRepository: boolean;
  repositoryError: string;
  handleRepositoryLoad: (e: FormEvent<HTMLFormElement>) => void;
  handleLocalLogUpload: (text: string, filename: string, onLoadSuccess: () => void) => void;
  handleUseDemo: () => void;
  dataset: Dataset;
  onLoadSuccess: () => void;
};

export function RepoLoader({
  isOpen,
  onClose,
  repositoryInput,
  setRepositoryInput,
  githubToken,
  setGithubToken,
  commitLimit,
  setCommitLimit,
  isLoadingRepository,
  repositoryError,
  handleRepositoryLoad,
  handleLocalLogUpload,
  handleUseDemo,
  dataset,
  onLoadSuccess,
}: RepoLoaderProps) {
  const [activeTab, setActiveTab] = useState<"remote" | "local">("remote");
  const [showSettings, setShowSettings] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputId = useId();

  if (!isOpen) return null;

  const loadLocalFile = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      handleLocalLogUpload(
        event.target?.result as string,
        file.name,
        () => {
          onLoadSuccess();
          onClose();
        },
      );
    };
    reader.readAsText(file);
  };

  const handleDrag = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragActive(event.type === "dragenter" || event.type === "dragover");
  };

  const handleDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setIsDragActive(false);
    loadLocalFile(event.dataTransfer.files?.[0]);
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    loadLocalFile(event.target.files?.[0]);
    event.target.value = "";
  };

  return (
    <section className="absolute inset-x-4 top-[4.9rem] z-50 rounded-2xl border border-white/10 bg-slate-950/95 p-3 shadow-2xl shadow-black/50 backdrop-blur-2xl">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-semibold text-slate-100">Switch repository</p>
        <button
          type="button"
          onClick={onClose}
          className="grid size-7 place-items-center rounded-lg text-slate-500 transition hover:bg-white/8 hover:text-white"
          aria-label="Close repository switcher"
        >
          <X className="size-4" />
        </button>
      </div>

      <div className="mb-3 grid grid-cols-2 rounded-xl border border-white/5 bg-black/25 p-1">
        <button
          type="button"
          onClick={() => setActiveTab("remote")}
          className={`flex items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-[10px] font-medium transition ${
            activeTab === "remote"
              ? "bg-blue-500/15 text-blue-200 shadow-sm"
              : "text-slate-500 hover:text-slate-300"
          }`}
        >
          <Link2 className="size-3.5" /> Remote repo
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("local")}
          className={`flex items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-[10px] font-medium transition ${
            activeTab === "local"
              ? "bg-blue-500/15 text-blue-200 shadow-sm"
              : "text-slate-500 hover:text-slate-300"
          }`}
        >
          <FileUp className="size-3.5" /> Local log
        </button>
      </div>

      {activeTab === "remote" ? (
        <form onSubmit={handleRepositoryLoad} className="space-y-2.5">
          <label className="relative block">
            <Link2 className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
            <input
              value={repositoryInput}
              onChange={(event) => setRepositoryInput(event.target.value)}
              placeholder="owner/repository or GitHub URL"
              className="h-10 w-full rounded-xl border border-white/10 bg-black/35 pl-9 pr-11 text-sm text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-blue-400/45 focus:ring-2 focus:ring-blue-400/10"
              spellCheck={false}
              autoCapitalize="none"
              autoCorrect="off"
            />
            <button
              type="submit"
              disabled={isLoadingRepository}
              className="absolute right-1.5 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-lg bg-blue-500/20 text-blue-200 transition hover:bg-blue-500/30 disabled:opacity-50"
              aria-label="Load repository"
            >
              {isLoadingRepository ? <LoaderCircle className="size-4 animate-spin" /> : <Search className="size-4" />}
            </button>
          </label>

          <button
            type="button"
            onClick={() => setShowSettings((visible) => !visible)}
            className="flex items-center gap-1.5 text-[10px] text-slate-500 transition hover:text-slate-300"
          >
            <Settings className="size-3.5" /> Advanced options
          </button>

          {showSettings ? (
            <div className="space-y-3 rounded-xl border border-white/5 bg-white/3 p-3">
              <input
                type="password"
                value={githubToken}
                onChange={(event) => setGithubToken(event.target.value)}
                placeholder="GitHub token (optional)"
                className="h-8 w-full rounded-lg border border-white/5 bg-black/40 px-2.5 text-xs text-slate-200 outline-none focus:border-blue-400/40"
              />
              <label className="block text-[10px] text-slate-500">
                <span className="mb-1 flex justify-between"><span>Commit limit</span><strong className="font-mono text-slate-300">{commitLimit}</strong></span>
                <input
                  type="range"
                  min={5}
                  max={150}
                  step={5}
                  value={commitLimit}
                  onChange={(event) => setCommitLimit(Number(event.target.value))}
                  className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-blue-400"
                />
              </label>
            </div>
          ) : null}
        </form>
      ) : (
        <label
          htmlFor={fileInputId}
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed px-4 py-6 text-center transition ${
            isDragActive
              ? "border-blue-400 bg-blue-500/10"
              : "border-white/15 bg-black/20 hover:border-blue-400/40 hover:bg-white/4"
          }`}
        >
          <input id={fileInputId} type="file" accept=".txt,.log" className="hidden" onChange={handleFileChange} />
          <FileUp className="mb-2 size-5 text-slate-400" />
          <span className="text-xs font-medium text-slate-200">Upload git log file</span>
          <span className="mt-1 text-[10px] text-slate-500">Drop a .txt or .log file here</span>
        </label>
      )}

      {repositoryError ? <p className="mt-2 text-[10px] text-rose-300">{repositoryError}</p> : null}
      {dataset.source === "github" ? (
        <button type="button" onClick={() => { handleUseDemo(); onClose(); }} className="mt-2 text-[10px] text-blue-400 transition hover:text-blue-300">
          Use demo data
        </button>
      ) : null}
    </section>
  );
}
