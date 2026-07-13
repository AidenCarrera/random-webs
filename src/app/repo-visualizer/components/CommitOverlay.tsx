import Image from "next/image";
import { CommitEvent } from "../types";
import { initials } from "../utils/common";
import { STATUS_COLORS } from "../constants";

type CommitOverlayProps = {
  currentEvent: CommitEvent | null;
};

export function CommitOverlay({ currentEvent }: CommitOverlayProps) {
  if (!currentEvent) {
    return (
      <div className="flex flex-col gap-2 pt-4 border-t border-white/10 text-slate-500">
        <p className="px-1 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
          Active Commit
        </p>
        <div className="rounded-xl border border-white/5 bg-slate-950/20 p-3 text-center text-xs text-slate-600">
          Press Play to begin simulation
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 pt-4 border-t border-white/10">
      <p className="px-1 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
        Active Commit
      </p>
      <div className="rounded-xl border border-white/5 bg-slate-950/30 p-3 space-y-2">
        <div className="flex items-start gap-2.5">
          {currentEvent.author.avatarUrl ? (
            <Image
              src={currentEvent.author.avatarUrl}
              alt={currentEvent.author.name}
              width={30}
              height={30}
              unoptimized
              className="size-7.5 shrink-0 rounded-full border border-white/10 object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="flex size-7.5 shrink-0 items-center justify-center rounded-full border border-blue-400/20 bg-blue-500/10 text-[9px] font-bold text-blue-300">
              {initials(currentEvent.author.name)}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p
              className="text-xs font-semibold text-slate-200 truncate"
              title={currentEvent.message}
            >
              {currentEvent.message}
            </p>
            <p className="text-[10px] text-slate-500 mt-0.5">
              {currentEvent.author.login
                ? `@${currentEvent.author.login}`
                : currentEvent.author.name}
              <span className="mx-1 text-slate-700">•</span>
              <code className="text-[9px] text-slate-500">
                {currentEvent.hash}
              </code>
            </p>
          </div>
        </div>

        {/* Changes list */}
        <div className="flex max-h-21 flex-col gap-1 overflow-y-auto pr-1">
          {currentEvent.changes.map((change) => (
            <div
              key={`${currentEvent.id}:${change.status}:${change.path}`}
              className="flex items-center justify-between font-mono text-[9px]"
              style={{ color: STATUS_COLORS[change.status] }}
            >
              <span className="truncate max-w-47.5 text-slate-400">
                {change.path}
              </span>
              <span className="font-semibold text-right shrink-0">
                {change.status === "added"
                  ? "[+]"
                  : change.status === "removed"
                    ? "[-]"
                    : "[~]"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
