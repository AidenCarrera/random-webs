import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Award } from "lucide-react";
import { LEVEL_REWARDS, SKIN_LABELS } from "../data/options";
import type { PetController } from "../hooks/use-pet";
import { Pet } from "./pet";

type ScreenProps = { pet: PetController };

function MenuRow({
  active,
  label,
  value,
  style = "style",
}: {
  active: boolean;
  label: string;
  value: string;
  style?: "style" | "setting";
}) {
  if (style === "setting") {
    return (
      <div
        className={`flex items-center justify-between rounded px-2 py-0.5 ${active ? "bg-zinc-700/70 font-bold text-[#b8c8a9]" : "text-zinc-400"}`}
      >
        <span>{label}</span>
        <span>{value}</span>
      </div>
    );
  }

  return (
    <div
      className={`flex items-center justify-between rounded px-1.5 py-0.5 transition-all ${active ? "bg-zinc-800/40 font-bold text-cyan-400" : "opacity-80"}`}
    >
      <span className="flex items-center gap-1">
        <span
          className={`h-1.5 w-1.5 rounded-full ${active ? "animate-pulse bg-cyan-400" : "bg-transparent"}`}
        />
        <span>{label}</span>
      </span>
      <span>{value}</span>
    </div>
  );
}

function Needs({ pet }: ScreenProps) {
  const items = [
    { label: "FOOD", value: pet.hunger },
    { label: "JOY", value: pet.happiness },
    { label: "ENERGY", value: pet.energy },
    { label: "CLEAN", value: pet.cleanliness },
  ];

  return (
    <div
      className="absolute inset-x-2 bottom-2 z-20 grid grid-cols-4 gap-2"
      aria-label="Pet needs"
      role="group"
    >
      {items.map((item) => {
        const roundedValue = Math.round(item.value);
        return (
          <div
            key={item.label}
            className="min-w-0 text-zinc-900"
            aria-label={item.label}
            aria-valuemax={100}
            aria-valuemin={0}
            aria-valuenow={roundedValue}
            role="meter"
          >
            <div className="flex items-baseline justify-between gap-0.5">
              <span className="truncate text-[7px] font-black">
                {item.label}
              </span>
              <span className="text-[8px] font-black tabular-nums">
                {roundedValue}
              </span>
            </div>
            <div className="mt-0.5 grid grid-cols-5 gap-px">
              {Array.from({ length: 5 }).map((_, index) => (
                <span
                  key={index}
                  className={`h-1 ${roundedValue >= (index + 1) * 20 ? "bg-zinc-900" : "bg-zinc-900/20"}`}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function Screen({ pet }: ScreenProps) {
  const reduceMotion = useReducedMotion();

  return (
    <div
      className="relative flex aspect-11/10 w-full flex-col overflow-hidden rounded-2xl border-solid border-[#676b69] bg-[#87977a] p-4 text-zinc-900 shadow-[inset_0_4px_12px_rgba(0,0,0,0.32),0_2px_4px_rgba(255,255,255,0.3)]"
      style={{ borderWidth: "18px 26px" }}
    >
      <div
        className="pointer-events-none absolute inset-0 z-30 opacity-[0.08]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 2px, #000 2px, #000 4px)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 z-30"
        style={{
          background:
            "linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0) 50%, rgba(0,0,0,0.04) 100%)",
        }}
      />

      <div className="z-10 flex items-center justify-between border-b border-zinc-800/20 pb-1.5 text-[10px] font-bold">
        <div className="flex items-center gap-1">
          <Award size={10} />
          <span>LEVEL {pet.level}</span>
        </div>
        <div className="relative">
          {pet.isEditingName ? (
            <input
              type="text"
              value={pet.tempName}
              onChange={(event) => pet.updateTempName(event.target.value)}
              onBlur={pet.commitPetName}
              onKeyDown={(event) => {
                if (event.key === "Enter") pet.commitPetName();
              }}
              className="w-24 border-b border-zinc-800 bg-zinc-800/10 text-center text-[10px] font-bold focus:outline-none"
              autoFocus
            />
          ) : (
            <span
              onClick={pet.beginEditingName}
              className="cursor-pointer border-b border-dotted border-zinc-800/40 tracking-wider hover:border-zinc-800"
            >
              {pet.petName}
            </span>
          )}
        </div>
        <div className="text-[9px] font-medium tracking-tight tabular-nums">
          XP {Math.floor(pet.exp)}/{pet.level * 100}
        </div>
      </div>

      {pet.status === "SLEEPING" && !reduceMotion && (
        <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden">
          <AnimatePresence>
            {pet.sleepBubbles.map((bubble) => (
              <motion.div
                key={bubble.id}
                initial={{
                  opacity: 0,
                  scale: 0.6,
                  y: 150,
                  x: 120 + bubble.x,
                }}
                animate={{
                  opacity: 1,
                  scale: 1.1,
                  y: 50,
                  x: 130 + bubble.x * 1.5,
                }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 3.5, ease: "easeOut" }}
                className="absolute text-base font-bold text-zinc-900/70"
              >
                Z
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <div
        className="pointer-events-none absolute inset-0 z-0 opacity-[0.06]"
        style={{
          backgroundImage: `
            linear-gradient(to right, #000 1px, transparent 1px),
            linear-gradient(to bottom, #000 1px, transparent 1px)
          `,
          backgroundSize: "2px 2px",
        }}
      />

      <Pet
        accessory={pet.accessory}
        hat={pet.hat}
        reduceMotion={reduceMotion}
        skin={pet.skin}
        status={pet.status}
      />

      {pet.currentMenu === "STYLE" && (
        <div className="absolute inset-x-2 bottom-9.5 z-30 flex flex-col gap-1 rounded-lg border border-zinc-800 bg-zinc-900/95 p-2.5 text-[9px] text-zinc-300">
          <div className="mb-1.5 border-b border-zinc-800/60 px-1 pb-0.5 text-center font-bold uppercase tracking-wider text-zinc-400">
            <span>STYLE CUSTOMIZER</span>
          </div>
          <MenuRow
            active={pet.selectedStyleIndex === 0}
            label="PET COLOR"
            value={SKIN_LABELS[pet.skin]}
          />
          <MenuRow
            active={pet.selectedStyleIndex === 1}
            label="HAT STYLE"
            value={pet.hat}
          />
          <MenuRow
            active={pet.selectedStyleIndex === 2}
            label="ACCESSORY"
            value={pet.accessory}
          />
          <div className="mt-1 border-t border-zinc-800/60 px-1 pt-1 text-center text-[8px] text-zinc-500">
            {LEVEL_REWARDS[pet.level + 1]
              ? `NEXT L${pet.level + 1}: ${LEVEL_REWARDS[pet.level + 1]}`
              : "ALL GEAR UNLOCKED"}
          </div>
        </div>
      )}

      {pet.currentMenu === "SETTINGS" && (
        <div className="absolute inset-x-2 bottom-9.5 z-30 flex flex-col gap-0.5 rounded-lg border border-zinc-800 bg-zinc-900/95 p-2 text-[9px] text-zinc-300">
          <div className="mb-0.5 border-b border-zinc-800/60 px-1 pb-1 font-bold uppercase tracking-wider text-zinc-400">
            <span>SETTINGS</span>
          </div>
          <MenuRow
            active={pet.selectedSettingIndex === 0}
            label="SOUND"
            value={pet.isMuted ? "OFF" : "ON"}
            style="setting"
          />
          <MenuRow
            active={pet.selectedSettingIndex === 1}
            label="CARE PACE"
            value={pet.carePace}
            style="setting"
          />
          <MenuRow
            active={pet.selectedSettingIndex === 2}
            label="BACKGROUND"
            value={pet.backgroundColor}
            style="setting"
          />
          <MenuRow
            active={pet.selectedSettingIndex === 3}
            label="EXPORT SAVE"
            value="RUN"
            style="setting"
          />
          <MenuRow
            active={pet.selectedSettingIndex === 4}
            label="LOAD SAVE"
            value="RUN"
            style="setting"
          />
        </div>
      )}

      <AnimatePresence mode="wait">
        {pet.screenMessage && pet.currentMenu === "NONE" && (
          <motion.div
            key={pet.screenMessage.id}
            initial={reduceMotion ? false : { opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: -4 }}
            className="pointer-events-none absolute inset-x-4 bottom-10 z-20 text-center text-[8px] font-black tracking-wide text-zinc-900 drop-shadow-[0_1px_0_rgba(255,255,255,0.2)]"
          >
            {pet.screenMessage.text}
          </motion.div>
        )}
      </AnimatePresence>

      <Needs pet={pet} />
    </div>
  );
}
