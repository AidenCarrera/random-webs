import {
  ACCESSORY_OPTIONS,
  ACCESSORY_UNLOCK_LEVELS,
  BACKGROUND_OPTIONS,
  CARE_PACES,
  HAT_OPTIONS,
  HAT_UNLOCK_LEVELS,
  PET_STATUSES,
  SKIN_OPTIONS,
  SKIN_UNLOCK_LEVELS,
} from "../data/options";
import type { PetStatus, SavedProgress } from "../types";

const includesOption = <T extends string>(
  options: readonly T[],
  value: unknown,
): value is T => typeof value === "string" && options.includes(value as T);

const readNumber = (
  value: unknown,
  fallback: number,
  minimum: number,
  maximum: number,
) =>
  typeof value === "number" && Number.isFinite(value)
    ? Math.min(maximum, Math.max(minimum, value))
    : fallback;

const persistentStatus = (status: PetStatus): PetStatus =>
  status === "EATING" || status === "PLAYING" || status === "CLEANING"
    ? "IDLE"
    : status;

export const normalizeSavedProgress = (
  saved: Partial<SavedProgress>,
): SavedProgress | null => {
  if (saved.version !== 1) return null;

  const level = readNumber(saved.level, 1, 1, 999);
  const status = includesOption(PET_STATUSES, saved.status)
    ? persistentStatus(saved.status)
    : "IDLE";
  const skin =
    includesOption(SKIN_OPTIONS, saved.skin) &&
    SKIN_UNLOCK_LEVELS[saved.skin] <= level
      ? saved.skin
      : "cyber-cyan";
  const hat =
    includesOption(HAT_OPTIONS, saved.hat) &&
    HAT_UNLOCK_LEVELS[saved.hat] <= level
      ? saved.hat
      : "NONE";
  const accessory =
    includesOption(ACCESSORY_OPTIONS, saved.accessory) &&
    ACCESSORY_UNLOCK_LEVELS[saved.accessory] <= level
      ? saved.accessory
      : "NONE";

  return {
    version: 1,
    hunger: readNumber(saved.hunger, 70, 0, 100),
    happiness: readNumber(saved.happiness, 80, 0, 100),
    energy: readNumber(saved.energy, 90, 0, 100),
    cleanliness: readNumber(saved.cleanliness, 85, 0, 100),
    level,
    exp: readNumber(saved.exp, 0, 0, 999999),
    status,
    skin,
    hat,
    accessory,
    isMuted: saved.isMuted === true,
    petName:
      typeof saved.petName === "string"
        ? saved.petName.toUpperCase().slice(0, 10) || "BABY"
        : "CYBER-KITY",
    carePace: includesOption(CARE_PACES, saved.carePace)
      ? saved.carePace
      : "NORMAL",
    backgroundColor: includesOption(BACKGROUND_OPTIONS, saved.backgroundColor)
      ? saved.backgroundColor
      : "BLUE",
  };
};

export const createSavedProgress = (
  progress: Omit<SavedProgress, "version">,
): SavedProgress => ({
  ...progress,
  version: 1,
  status: persistentStatus(progress.status),
});
