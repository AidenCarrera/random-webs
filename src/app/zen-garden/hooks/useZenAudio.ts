import { useEffect, useRef, useState } from "react";
import { ZenAudio } from "../audio";

export function useZenAudio() {
  const [soundEnabled, setSoundEnabled] = useState(false);
  const audioRef = useRef<ZenAudio | null>(null);

  useEffect(() => {
    audioRef.current = new ZenAudio();
    return () => audioRef.current?.destroy();
  }, []);

  useEffect(() => {
    if (soundEnabled) {
      audioRef.current?.init();
      audioRef.current?.resume();
    } else {
      audioRef.current?.suspend();
    }
  }, [soundEnabled]);

  useEffect(() => {
    if (!soundEnabled) return;
    let timerId: ReturnType<typeof setTimeout>;
    const repetitionTimers = new Set<ReturnType<typeof setTimeout>>();

    const scheduleChime = () => {
      const delay = 4000 + Math.random() * 8000;
      timerId = setTimeout(() => {
        if (!audioRef.current || !soundEnabled) return;

        const repetitions = Math.floor(Math.random() * 2) + 1;
        for (let index = 0; index < repetitions; index += 1) {
          const repetitionTimer = setTimeout(() => {
            audioRef.current?.playChime();
            repetitionTimers.delete(repetitionTimer);
          }, index * 350);
          repetitionTimers.add(repetitionTimer);
        }
        scheduleChime();
      }, delay);
    };

    scheduleChime();
    return () => {
      clearTimeout(timerId);
      repetitionTimers.forEach(clearTimeout);
    };
  }, [soundEnabled]);

  return { audioRef, soundEnabled, setSoundEnabled };
}
