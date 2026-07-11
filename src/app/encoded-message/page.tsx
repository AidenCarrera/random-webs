"use client";

import { useEffect, useRef, useState } from "react";

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

const getDeterministicLetter = (text: string, index: number) => {
  const seed = text.charCodeAt(index % text.length) + text.length + index * 17;
  return LETTERS[seed % LETTERS.length];
};

const getInitialDisplay = (
  text: string,
  preserveSpacesInitially: boolean,
  isRevealed: boolean,
) => {
  if (isRevealed) return text;

  return text
    .split("")
    .map((char, index) => {
      if (char === " ") {
        return preserveSpacesInitially
          ? " "
          : getDeterministicLetter(text, index);
      }
      return getDeterministicLetter(text, index);
    })
    .join("");
};

const ScrambleText = ({
  text,
  className,
  speed,
  preserveSpacesInitially = true,
  onStart,
  onComplete,
}: {
  text: string;
  className?: string;
  speed?: number;
  preserveSpacesInitially?: boolean;
  onStart?: () => void;
  onComplete?: () => void;
}) => {
  const isRevealedRef = useRef(false);
  const [display, setDisplay] = useState(() =>
    getInitialDisplay(text, preserveSpacesInitially, isRevealedRef.current),
  );
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const iterationRef = useRef(0);
  const [isRevealed, setIsRevealed] = useState(false);
  const hasStartedRef = useRef(false);

  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    const initialDisplay = getInitialDisplay(
      text,
      preserveSpacesInitially,
      isRevealedRef.current,
    );

    setDisplay(initialDisplay);

    if (!isRevealedRef.current) {
      iterationRef.current = 0;
      hasStartedRef.current = false;
      setIsRevealed(false);
    }
  }, [text, preserveSpacesInitially]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const startScramble = () => {
    if (isRevealed) return;
    if (intervalRef.current) return;

    if (!hasStartedRef.current) {
      hasStartedRef.current = true;
      onStart?.();
    }

    intervalRef.current = setInterval(() => {
      setDisplay(
        text
          .split("")
          .map((_, index) => {
            if (index < iterationRef.current) {
              return text[index];
            }
            return LETTERS[Math.floor(Math.random() * 26)];
          })
          .join(""),
      );

      if (iterationRef.current >= text.length) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = null;
        isRevealedRef.current = true;
        setIsRevealed(true);
        setDisplay(text);
        onComplete?.();
      }

      // Automatically scale decryption speed based on text length if no speed is explicitly provided
      const increment =
        speed !== undefined ? speed : Math.max(0.45, text.length / 2000);
      iterationRef.current += increment;
    }, 30);
  };

  const stopScramble = () => {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches)
      return;
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
  };

  return (
    <div
      onPointerEnter={(event) => {
        if (event.pointerType === "mouse") startScramble();
      }}
      onPointerLeave={(event) => {
        if (event.pointerType === "mouse") stopScramble();
      }}
      onClick={startScramble}
      className={`cursor-default font-mono ${className} wrap-break-word`}
    >
      {display}
    </div>
  );
};

const LITERATURE_TEXT = `No one would have believed in the last years of the nineteenth century that this world was being watched keenly and closely by intelligences greater than man's and yet as mortal as his own; that as men busied themselves about their various concerns they were scrutinised and studied, perhaps almost as narrowly as a man with a microscope might scrutinise the transient creatures that swarm and multiply in a drop of water. With infinite complacency men went to and fro over this globe about their little affairs, serene in their assurance of their empire over matter. It is possible that the infusoria under the microscope do the same. No one gave a thought to the older worlds of space as sources of human danger, or thought of them only to dismiss the idea of life upon them as impossible or improbable. It is curious to recall some of the mental habits of those departed days. At most terrestrial men fancied there might be other men upon Mars, perhaps inferior to themselves and ready to welcome a missionary enterprise. Yet across the gulf of space, minds that are to our minds as ours are to those of the beasts that perish, intellects vast and cool and unsympathetic, regarded this earth with envious eyes, and slowly and surely drew their plans against us.`;

export default function EncodedMessage() {
  const [mainTextTouched, setMainTextTouched] = useState(false);
  const [mainTextComplete, setMainTextComplete] = useState(false);
  const statusText = mainTextComplete
    ? "STATUS: COMPLETE"
    : mainTextTouched
      ? "STATUS: IN PROGRESS"
      : "STATUS: ?????";

  return (
    <div className="min-h-screen bg-[#111] text-white flex flex-col items-center justify-start gap-8 p-8 overflow-y-auto pt-16">
      <div className="flex flex-col gap-0 text-center shrink-0">
        <p className="text-gray-500 font-mono text-sm mb-8">HOVER TO DECRYPT</p>
        <ScrambleText
          text="ACCESS_GRANTED"
          className="text-5xl md:text-8xl font-bold tracking-tighter text-white"
        />
        <ScrambleText
          text="SYSTEM_SECURE"
          className="text-5xl md:text-8xl font-bold tracking-tighter text-gray-400"
        />
        <ScrambleText
          text="DATA_ENCRYPTED"
          className="text-5xl md:text-8xl font-bold tracking-tighter text-gray-600"
        />
      </div>

      <div className="max-w-4xl w-full space-y-8 pb-20">
        <div className="border-t border-gray-800 pt-8">
          <h3 className="text-gray-500 font-mono text-xs mb-4 uppercase tracking-widest text-center">
            Intercepted Transmission // Source: Unknown
          </h3>
          <ScrambleText
            text={LITERATURE_TEXT}
            preserveSpacesInitially={false}
            onStart={() => setMainTextTouched(true)}
            onComplete={() => setMainTextComplete(true)}
            className="text-lg md:text-xl text-gray-300 leading-relaxed text-justify"
          />
        </div>
      </div>

      <div className="fixed bottom-10 flex gap-12 opacity-75">
        <ScrambleText
          text="PROJECT: THE WAR OF THE WORLDS"
          className="text-xl text-red-500"
        />
        <ScrambleText text={statusText} className="text-xl text-blue-500" />
      </div>
    </div>
  );
}
