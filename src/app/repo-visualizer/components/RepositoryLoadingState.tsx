import { GitBranch } from "lucide-react";

type RepositoryLoadingStateProps = {
  isLoading: boolean;
  onChooseRepository: () => void;
};

export function RepositoryLoadingState({
  isLoading,
  onChooseRepository,
}: RepositoryLoadingStateProps) {
  return (
    <div className="absolute inset-0 z-10 grid place-items-center bg-[#04060b]/92 px-6 backdrop-blur-sm">
      <div
        className="w-full max-w-sm rounded-2xl border border-white/10 bg-slate-950/80 p-5 shadow-2xl shadow-black/40"
        role="status"
        aria-live="polite"
      >
        <div className="flex items-start gap-3">
          <div className="grid size-10 shrink-0 place-items-center rounded-xl border border-blue-400/20 bg-blue-500/10 text-blue-300">
            <GitBranch className="size-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-100">
              {isLoading
                ? "Loading repository history"
                : "Repository history unavailable"}
            </p>
            <p className="mt-1 text-xs leading-5 text-slate-400">
              {isLoading
                ? "Preparing commits, contributors, and file changes."
                : "Load a GitHub repository or upload a local git log to begin."}
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="mt-5 space-y-2.5" aria-hidden="true">
            <div className="h-2.5 w-full animate-pulse rounded-full bg-white/10 motion-reduce:animate-none" />
            <div className="h-2.5 w-4/5 animate-pulse rounded-full bg-white/8 motion-reduce:animate-none" />
            <div className="h-2.5 w-3/5 animate-pulse rounded-full bg-white/6 motion-reduce:animate-none" />
          </div>
        ) : (
          <button
            type="button"
            onClick={onChooseRepository}
            className="mt-5 rounded-xl border border-blue-400/25 bg-blue-500/15 px-3 py-2 text-xs font-semibold text-blue-200 transition hover:bg-blue-500/25"
          >
            Choose repository
          </button>
        )}
      </div>
    </div>
  );
}
