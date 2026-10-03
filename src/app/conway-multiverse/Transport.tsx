import { Pause, Play, StepForward } from "lucide-react";

import styles from "./styles.module.css";

export const SPEEDS = [
  { label: "½×", interval: 250 },
  { label: "1×", interval: 125 },
  { label: "2×", interval: 60 },
  { label: "4×", interval: 30 },
];

/** Play state and speed, shared by the map and every universe. */
export type TransportProps = {
  running: boolean;
  speed: number;
  onRunningChange: (running: boolean) => void;
  onSpeedChange: (speed: number) => void;
};

export function Transport({
  running,
  speed,
  onRunningChange,
  onSpeedChange,
  onStep,
}: TransportProps & { onStep: () => void }) {
  return (
    <>
      <button
        type="button"
        className={styles.play}
        onClick={() => onRunningChange(!running)}
        aria-label={running ? "Pause" : "Play"}
        title={running ? "Pause (Space)" : "Play (Space)"}
      >
        {running ? <Pause aria-hidden="true" /> : <Play aria-hidden="true" />}
      </button>
      <button
        type="button"
        className={styles.iconButton}
        onClick={() => {
          onRunningChange(false);
          onStep();
        }}
        aria-label="Step"
        title="Step (N)"
      >
        <StepForward aria-hidden="true" />
      </button>
      <button
        type="button"
        className={styles.speed}
        onClick={() => onSpeedChange((speed + 1) % SPEEDS.length)}
        aria-label={`Speed ${SPEEDS[speed].label}`}
        title="Change speed"
      >
        {SPEEDS[speed].label}
      </button>
    </>
  );
}
