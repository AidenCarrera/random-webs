import type { CommitEvent, FileChange } from "../types";
import { normalizePath } from "./common";

const MIN_COMMIT_DURATION = 180;
const MAX_COMMIT_DURATION = 7_000;

export type ScheduledFileChange = {
  path: string;
  status: FileChange["status"];
  at: number;
};

export function getCommitPlaybackDuration(event: CommitEvent): number {
  const filesChanged = Math.max(1, event.changes.length);
  const lineChanges = Math.max(
    event.additions + event.deletions,
    event.changes.reduce(
      (total, change) =>
        total + (change.additions ?? 0) + (change.deletions ?? 0),
      0,
    ),
  );
  const fileTime = Math.min(5_500, filesChanged * 110);
  const lineTime = Math.min(900, Math.log1p(lineChanges) * 65);

  return Math.round(
    Math.min(
      MAX_COMMIT_DURATION,
      Math.max(MIN_COMMIT_DURATION, 120 + fileTime + lineTime),
    ),
  );
}

export function scheduleFileChanges(
  changes: FileChange[],
): ScheduledFileChange[] {
  const weights = changes.map((change) => {
    const lineChanges = (change.additions ?? 0) + (change.deletions ?? 0);
    return 1 + Math.log1p(lineChanges) * 0.32;
  });
  const totalWeight = Math.max(
    1,
    weights.reduce((total, weight) => total + weight, 0),
  );
  let elapsedWeight = 0;

  return changes.map((change, index) => {
    const weight = weights[index];
    const midpoint = (elapsedWeight + weight / 2) / totalWeight;
    elapsedWeight += weight;

    return {
      path: normalizePath(change.path),
      status: change.status,
      at: 0.08 + midpoint * 0.84,
    };
  });
}
