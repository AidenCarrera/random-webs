import { ExternalLink, GitBranch, Repeat2 } from "lucide-react";

type HeaderProps = {
  datasetName: string;
  datasetUrl?: string;
  onSwitchRepository: () => void;
};

export function Header({
  datasetName,
  datasetUrl,
  onSwitchRepository,
}: HeaderProps) {
  const showDatasetName = !datasetName.toLowerCase().startsWith("random-web");

  return (
    <div className="flex flex-col gap-2 pb-4 border-b border-white/10">
      <div className="flex items-center gap-2">
        <div className="grid size-8 place-items-center rounded-lg border border-blue-400/30 bg-blue-500/15 text-blue-300">
          <GitBranch className="size-4" />
        </div>
        <h1 className="text-sm font-bold tracking-tight text-slate-100 sm:text-base">
          GitHub History Visualizer
        </h1>
      </div>
      <div className="flex min-w-0 items-center gap-2 text-[11px] text-slate-400">
        {showDatasetName ? (
          <span className="truncate font-mono text-slate-300 bg-white/5 border border-white/5 rounded-md px-2 py-0.5">
            {datasetName}
          </span>
        ) : null}
        <button
          type="button"
          onClick={onSwitchRepository}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-white/10 bg-white/4 px-3 py-1.5 text-[11px] font-semibold text-slate-200 transition hover:border-blue-400/30 hover:bg-blue-500/10 hover:text-blue-100"
        >
          <Repeat2 className="size-3.5" /> Switch Repository
        </button>
        {datasetUrl ? (
          <a
            href={datasetUrl}
            target="_blank"
            rel="noreferrer"
            className="text-slate-500 transition-all hover:scale-105 hover:text-blue-400 active:scale-95"
            aria-label="Open repository on GitHub"
          >
            <ExternalLink className="size-3.5" />
          </a>
        ) : null}
      </div>
    </div>
  );
}
