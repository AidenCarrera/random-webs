// src/hooks/useTelegraph.ts
import { useState, useRef } from "react";
import * as Tone from "tone";
import { MORSE_CODE, REVERSE_MORSE_CODE } from "../lib/morse";

export function useTelegraph() {
  const [input, setInput] = useState("");
  const [isTransmitting, setIsTransmitting] = useState(false);
  const [lightOn, setLightOn] = useState(false);

  const encoded = input
    .toUpperCase()
    .split("")
    .map((char) => MORSE_CODE[char] || "?")
    .join(" ");

  const oscRef = useRef<Tone.Synth | null>(null);
  const stopSignalRef = useRef<(() => void) | null>(null);
  const tapStartTime = useRef<number>(0);
  const currentSignal = useRef<string>("");
  const decodeTimeout = useRef<NodeJS.Timeout | null>(null);
  const isTappingRef = useRef(false);

  const initAudio = async () => {
    await Tone.start();
    if (!oscRef.current) {
      const synth = new Tone.Synth({
        oscillator: { type: "sine" },
        envelope: { attack: 0.005, decay: 0.1, sustain: 1, release: 0.005 },
      }).toDestination();
      synth.volume.value = -10;
      oscRef.current = synth;
    }
  };

  const transmit = async () => {
    if (isTransmitting || !encoded) return;
    await initAudio();
    setIsTransmitting(true);

    const dotDuration = 100;
    const sequence = encoded.split("");

    const playSignal = async (index: number) => {
      if (index >= sequence.length || stopSignalRef.current === null) {
        if (index >= sequence.length) {
          setIsTransmitting(false);
          setLightOn(false);
          stopSignalRef.current = null;
        }
        return;
      }

      const char = sequence[index];
      let duration = 0;
      let pause = dotDuration;

      if (char === ".") {
        oscRef.current?.triggerAttack(600);
        setLightOn(true);
        duration = dotDuration;
      } else if (char === "-") {
        oscRef.current?.triggerAttack(600);
        setLightOn(true);
        duration = dotDuration * 3;
      } else if (char === " " || char === "/") {
        duration = 0;
        pause = dotDuration * 3;
        if (char === "/") pause = dotDuration * 7;
      }

      stopSignalRef.current = () => {
        oscRef.current?.triggerRelease();
        setLightOn(false);
        setIsTransmitting(false);
        stopSignalRef.current = null;
      };

      setTimeout(() => {
        if (duration > 0) {
          oscRef.current?.triggerRelease();
          setLightOn(false);
        }
        if (!stopSignalRef.current) return;
        setTimeout(() => {
          if (!stopSignalRef.current) return;
          playSignal(index + 1);
        }, pause);
      }, duration);
    };

    stopSignalRef.current = () => {};
    playSignal(0);
  };

  const manualTapStart = async () => {
    if (decodeTimeout.current) {
      clearTimeout(decodeTimeout.current);
      decodeTimeout.current = null;
    }
    isTappingRef.current = true;
    tapStartTime.current = Date.now();
    await initAudio();
    oscRef.current?.triggerAttack(600);
    setLightOn(true);
  };

  const manualTapEnd = () => {
    if (!isTappingRef.current) return;
    isTappingRef.current = false;
    oscRef.current?.triggerRelease();
    setLightOn(false);

    const duration = Date.now() - tapStartTime.current;
    currentSignal.current += duration > 200 ? "-" : ".";

    decodeTimeout.current = setTimeout(() => {
      const char = REVERSE_MORSE_CODE[currentSignal.current];
      if (char) setInput((prev) => prev + char);
      currentSignal.current = "";
    }, 600);
  };

  const stopTransmission = () => {
    if (stopSignalRef.current) stopSignalRef.current();
  };

  return {
    input,
    setInput,
    encoded,
    isTransmitting,
    lightOn,
    transmit,
    stopTransmission,
    manualTapStart,
    manualTapEnd,
  };
}
