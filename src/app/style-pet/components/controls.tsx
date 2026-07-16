import type { PetController } from "../hooks/use-pet";

type ControlsProps = { pet: PetController };

function ControlHints({ pet }: ControlsProps) {
  return (
    <div className="flex min-w-25 flex-col items-center gap-1 text-center text-[9px] font-bold uppercase tracking-wider text-[#505556]">
      {pet.currentMenu === "STYLE" ? (
        <>
          <span className="animate-pulse text-[#7b2946]">▲▼ - SELECT</span>
          <span className="text-[#7b2946]">A / ◀▶ - CHANGE</span>
          <span className="text-[#686d6d]">B - CLOSE</span>
        </>
      ) : pet.currentMenu === "SETTINGS" ? (
        <>
          <span className="text-[#7b2946]">▲▼ - SELECT</span>
          <span className="text-[#7b2946]">A - CHANGE / RUN</span>
          <span className="text-[#686d6d]">B - BACK</span>
        </>
      ) : pet.status === "DEAD" ? (
        <>
          <span className="text-[#7b2946]">A - REVIVE</span>
          <span>START - SETTINGS</span>
        </>
      ) : (
        <>
          <span>▲ - CLEAN</span>
          <span>◀ - HATS</span>
          <span>▶ - ACCESSORIES</span>
          <span>▼ - {pet.status === "SLEEPING" ? "WAKE" : "SLEEP"}</span>
        </>
      )}
    </div>
  );
}

function DPad({ pet }: ControlsProps) {
  const upLabel =
    pet.currentMenu === "STYLE"
      ? "Previous style category"
      : pet.currentMenu === "SETTINGS"
        ? "Previous setting"
        : "Clean pet";
  const downLabel =
    pet.currentMenu === "STYLE"
      ? "Next style category"
      : pet.currentMenu === "SETTINGS"
        ? "Next setting"
        : pet.status === "SLEEPING"
          ? "Wake pet"
          : "Put pet to sleep";

  return (
    <div className="relative flex h-28 w-28 shrink-0 items-center justify-center">
      <div className="absolute h-8 w-8 rounded bg-[#303638]" />
      <button
        onClick={() => pet.pressDirection("UP")}
        aria-label={upLabel}
        className="absolute top-0 flex h-11 w-8 items-center justify-center rounded-t bg-[#303638] shadow-[inset_0_2px_0_rgba(255,255,255,0.13)] transition-colors hover:bg-[#282e30] active:translate-y-px active:shadow-none"
      >
        <div className="h-0 w-0 border-r-5 border-b-7 border-l-5 border-r-transparent border-b-zinc-400 border-l-transparent" />
      </button>
      <button
        onClick={() => pet.pressDirection("DOWN")}
        aria-label={downLabel}
        className="absolute bottom-0 flex h-11 w-8 items-center justify-center rounded-b bg-[#303638] shadow-[inset_0_-2px_0_rgba(0,0,0,0.32)] transition-colors hover:bg-[#282e30] active:translate-y-px active:shadow-none"
      >
        <div className="h-0 w-0 border-t-7 border-r-5 border-l-5 border-t-zinc-400 border-r-transparent border-l-transparent" />
      </button>
      <button
        onClick={() => pet.pressDirection("LEFT")}
        aria-label={
          pet.currentMenu === "STYLE"
            ? "Previous style option"
            : pet.currentMenu === "SETTINGS"
              ? "Previous setting value"
              : "Previous hat"
        }
        className="absolute left-0 flex h-8 w-11 items-center justify-center rounded-l bg-[#303638] shadow-[inset_2px_0_0_rgba(255,255,255,0.13)] transition-colors hover:bg-[#282e30] active:translate-x-px active:shadow-none"
      >
        <div className="h-0 w-0 border-t-5 border-r-7 border-b-5 border-t-transparent border-r-zinc-400 border-b-transparent" />
      </button>
      <button
        onClick={() => pet.pressDirection("RIGHT")}
        aria-label={
          pet.currentMenu === "STYLE"
            ? "Next style option"
            : pet.currentMenu === "SETTINGS"
              ? "Next setting value"
              : "Next accessory"
        }
        className="absolute right-0 flex h-8 w-11 items-center justify-center rounded-r bg-[#303638] shadow-[inset_-2px_0_0_rgba(0,0,0,0.32)] transition-colors hover:bg-[#282e30] active:translate-x-px active:shadow-none"
      >
        <div className="h-0 w-0 border-t-5 border-b-5 border-l-7 border-t-transparent border-b-transparent border-l-zinc-400" />
      </button>
    </div>
  );
}

function ActionButtons({ pet }: ControlsProps) {
  return (
    <div className="mr-2 flex shrink-0 -translate-y-2 rotate-[-25deg] gap-4">
      <div className="flex flex-col items-center gap-1">
        <button
          onClick={pet.handleCancelButton}
          disabled={
            pet.currentMenu === "NONE" &&
            (pet.status === "DEAD" || pet.status === "SLEEPING")
          }
          aria-label={
            pet.currentMenu === "NONE" ? "Pet companion" : "Close menu"
          }
          className="flex h-12 w-12 items-center justify-center rounded-full bg-[#93425f] text-sm font-bold text-[#f5e8ed] shadow-[0_4px_0_#65263e,inset_0_2px_4px_rgba(255,255,255,0.24)] transition-all hover:bg-[#a44c6a] active:translate-y-1 active:shadow-none disabled:translate-y-0 disabled:opacity-40"
        >
          B
        </button>
        <span className="text-[9px] font-bold tracking-wider text-[#505556]">
          {pet.currentMenu === "NONE" ? "PET" : "BACK"}
        </span>
      </div>
      <div className="flex flex-col items-center gap-1">
        <button
          onClick={pet.handleActionButton}
          disabled={pet.currentMenu === "NONE" && pet.status === "SLEEPING"}
          aria-label={
            pet.currentMenu === "SETTINGS"
              ? "Use selected setting"
              : pet.currentMenu === "STYLE"
                ? "Change selected style"
                : pet.status === "DEAD"
                  ? "Revive pet"
                  : "Feed pet"
          }
          className="flex h-12 w-12 items-center justify-center rounded-full bg-[#93425f] text-sm font-bold text-[#f5e8ed] shadow-[0_4px_0_#65263e,inset_0_2px_4px_rgba(255,255,255,0.24)] transition-all hover:bg-[#a44c6a] active:translate-y-1 active:shadow-none disabled:translate-y-0 disabled:opacity-40"
        >
          A
        </button>
        <span className="text-[9px] font-bold tracking-wider text-[#505556]">
          {pet.currentMenu === "NONE"
            ? pet.status === "DEAD"
              ? "REVIVE"
              : "FEED"
            : "ACTION"}
        </span>
      </div>
    </div>
  );
}

function LowerControls({ pet }: ControlsProps) {
  return (
    <div className="relative mt-10 flex min-h-14 w-full items-center px-4">
      <div className="absolute top-0 left-1/2 flex -translate-x-1/2 -rotate-12 gap-3">
        <div className="flex flex-col items-center gap-1.5">
          <button
            onClick={() => pet.toggleMenu("STYLE")}
            aria-label="Select style menu"
            className="h-4 w-12 rounded-full border border-[#454b4d] bg-[#565c5f] shadow-[0_2px_0_#3d4345,inset_0_1px_0_rgba(255,255,255,0.16)] transition-all hover:bg-[#4d5356] active:translate-y-0.5 active:shadow-none"
          />
          <span className="text-[8px] font-bold tracking-wider text-[#505556]">
            SELECT
          </span>
        </div>
        <div className="flex flex-col items-center gap-1.5">
          <button
            onClick={() => pet.toggleMenu("SETTINGS")}
            aria-label="Start settings menu"
            className="h-4 w-12 rounded-full border border-[#454b4d] bg-[#565c5f] shadow-[0_2px_0_#3d4345,inset_0_1px_0_rgba(255,255,255,0.16)] transition-all hover:bg-[#4d5356] active:translate-y-0.5 active:shadow-none"
          />
          <span className="text-[8px] font-bold tracking-wider text-[#505556]">
            START
          </span>
        </div>
      </div>

      <div
        aria-hidden="true"
        className="ml-auto flex translate-x-2 translate-y-4 rotate-[-28deg] gap-2.5"
      >
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="h-16 w-2 rounded-full bg-[#777d7a]/70" />
        ))}
      </div>
    </div>
  );
}

export function Controls({ pet }: ControlsProps) {
  return (
    <>
      <div className="mt-16 flex w-full items-center justify-between px-2 max-[420px]:scale-[0.82]">
        <DPad pet={pet} />
        <ControlHints pet={pet} />
        <ActionButtons pet={pet} />
      </div>
      <LowerControls pet={pet} />
    </>
  );
}
