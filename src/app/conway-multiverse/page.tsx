"use client";

import { useRef, useState, useSyncExternalStore } from "react";

import { hashStore, navigate, ruleFromHash } from "./lib/location";
import type { Rule } from "./lib/rules";
import { MultiverseMap, type MapSession } from "./MultiverseMap";
import { UniverseView } from "./UniverseView";
import styles from "./styles.module.css";

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

const reducedMotion = {
  subscribe(listener: () => void) {
    const query = window.matchMedia(REDUCED_MOTION);
    query.addEventListener("change", listener);
    return () => query.removeEventListener("change", listener);
  },
  get: () => window.matchMedia(REDUCED_MOTION).matches,
  getServer: () => false,
};

export default function ConwayMultiverse() {
  const hash = useSyncExternalStore(
    hashStore.subscribe,
    hashStore.get,
    hashStore.getServer,
  );
  const rule = ruleFromHash(hash);

  // Everything starts moving unless motion is turned down, until the
  // visitor presses play or pause themselves.
  const calm = useSyncExternalStore(
    reducedMotion.subscribe,
    reducedMotion.get,
    reducedMotion.getServer,
  );
  const [playing, setPlaying] = useState<boolean | null>(null);
  const [speed, setSpeed] = useState(1);
  const [visited, setVisited] = useState<Rule | null>(null);
  const sessionRef = useRef<MapSession>({ multiverse: null, camera: null });
  // Whether the map sits one history entry back, so "back" can return to it.
  const pushedRef = useRef(false);

  const transport = {
    running: playing ?? !calm,
    speed,
    onRunningChange: setPlaying,
    onSpeedChange: setSpeed,
  };

  return (
    <main className={styles.page}>
      {rule === null ? (
        <MultiverseMap
          {...transport}
          sessionRef={sessionRef}
          focus={visited}
          onEnter={(next) => {
            setVisited(next);
            pushedRef.current = true;
            navigate(next, "push");
          }}
        />
      ) : (
        <UniverseView
          {...transport}
          rule={rule}
          onRuleChange={(next) => {
            setVisited(next);
            navigate(next, "replace");
          }}
          onExit={() => {
            setVisited(rule);
            if (pushedRef.current) {
              pushedRef.current = false;
              window.history.back();
            } else {
              navigate(null, "replace");
            }
          }}
        />
      )}
    </main>
  );
}
