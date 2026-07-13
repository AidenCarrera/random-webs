"use client";

import { useEffect, useRef } from "react";

import { AMBIENT_AUDIO_URL, DEFAULT_AMBIENT_VOLUME } from "../constants";

export function useAmbientAudio(volume: number) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio(AMBIENT_AUDIO_URL);
    audio.loop = true;
    audio.preload = "auto";
    audio.volume = DEFAULT_AMBIENT_VOLUME;
    audioRef.current = audio;

    const tryStartAmbientAudio = () => {
      audio.play().then(
        () => {
          window.removeEventListener("pointerdown", tryStartAmbientAudio);
          window.removeEventListener("keydown", tryStartAmbientAudio);
        },
        () => {},
      );
    };

    window.addEventListener("pointerdown", tryStartAmbientAudio);
    window.addEventListener("keydown", tryStartAmbientAudio);
    tryStartAmbientAudio();

    return () => {
      window.removeEventListener("pointerdown", tryStartAmbientAudio);
      window.removeEventListener("keydown", tryStartAmbientAudio);
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
      audioRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);
}
