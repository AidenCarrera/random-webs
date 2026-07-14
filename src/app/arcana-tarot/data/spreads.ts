import type { TarotSpreadDefinition } from "../types";

export const THREE_CARD_SPREAD = {
  id: "past-present-future",
  positions: [
    { id: "past", label: "Past" },
    { id: "present", label: "Present" },
    { id: "future", label: "Future" },
  ],
} as const satisfies TarotSpreadDefinition;

export const SHUFFLE_DURATION_MS = 1_500;
