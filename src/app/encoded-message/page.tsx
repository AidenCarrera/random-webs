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
  cipherClassName = "",
  speed,
  preserveSpacesInitially = true,
  onStart,
  onComplete,
}: {
  text: string;
  className?: string;
  /** Applied to characters that have not been decrypted yet. */
  cipherClassName?: string;
  speed?: number;
  preserveSpacesInitially?: boolean;
  onStart?: () => void;
  onComplete?: () => void;
}) => {
  const [resolvedCount, setResolvedCount] = useState(0);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const isRevealedRef = useRef(false);
  const [display, setDisplay] = useState(() =>
    getInitialDisplay(text, preserveSpacesInitially, false),
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
      setResolvedCount(0);
    } else {
      setResolvedCount(text.length);
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

    setIsDecrypting(true);
    intervalRef.current = setInterval(() => {
      const resolved = Math.min(text.length, Math.floor(iterationRef.current));
      setResolvedCount(resolved);
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
        setIsDecrypting(false);
        setResolvedCount(text.length);
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
    setIsDecrypting(false);
  };

  const resolvedText = isRevealed ? display : display.slice(0, resolvedCount);
  const cipherText = isRevealed ? "" : display.slice(resolvedCount);

  return (
    <div
      onPointerEnter={(event) => {
        if (event.pointerType === "mouse") startScramble();
      }}
      onPointerLeave={(event) => {
        if (event.pointerType === "mouse") stopScramble();
      }}
      onClick={startScramble}
      data-decrypting={isDecrypting || undefined}
      data-revealed={isRevealed || undefined}
      className={`cursor-default font-mono ${className} wrap-break-word transition-[text-shadow] duration-500 data-[decrypting]:[text-shadow:0_0_10px_color-mix(in_srgb,currentColor_40%,transparent)]`}
    >
      {resolvedText}
      {cipherText ? (
        <span className={cipherClassName}>{cipherText}</span>
      ) : null}
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
    <main className="relative flex min-h-screen flex-col items-center justify-start gap-10 overflow-x-hidden overflow-y-auto bg-[#0e0f11] p-5 pb-36 pt-14 text-white sm:gap-12 sm:p-8 sm:pb-36 sm:pt-16">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 bg-[repeating-linear-gradient(0deg,transparent_0_3px,rgba(0,0,0,0.22)_3px_4px)] opacity-60"
      />

      <div className="relative flex shrink-0 flex-col gap-0 text-center">
        <p className="mb-8 font-mono text-sm text-gray-500">
          HOVER TO DECRYPT
        </p>
        <ScrambleText
          text="ACCESS_GRANTED"
          className="text-4xl font-bold tracking-tighter text-white sm:text-6xl md:text-8xl"
        />
        <ScrambleText
          text="SYSTEM_SECURE"
          className="text-4xl font-bold tracking-tighter text-gray-400 sm:text-6xl md:text-8xl"
        />
        <ScrambleText
          text="DATA_ENCRYPTED"
          className="text-4xl font-bold tracking-tighter text-gray-600 sm:text-6xl md:text-8xl"
        />
      </div>

      <div className="relative w-full max-w-4xl space-y-8">
        <div className="relative rounded-sm border border-gray-800 bg-[#121316]/85 px-5 pb-8 pt-6 shadow-[0_30px_80px_-40px_rgba(0,0,0,0.9)] backdrop-blur-sm sm:px-10 sm:pb-10 sm:pt-8">
          {[
            "left-0 top-0 border-l-2 border-t-2",
            "right-0 top-0 border-r-2 border-t-2",
            "bottom-0 left-0 border-b-2 border-l-2",
            "bottom-0 right-0 border-b-2 border-r-2",
          ].map((corner) => (
            <span
              key={corner}
              aria-hidden="true"
              className={`absolute h-4 w-4 border-gray-500 ${corner}`}
            />
          ))}
          <h3 className="mb-6 flex items-center justify-center gap-3 text-center font-mono text-xs uppercase tracking-widest text-gray-500">
            <span aria-hidden="true" className="h-px flex-1 bg-gray-800" />
            Intercepted Transmission // Source: Unknown
            <span aria-hidden="true" className="h-px flex-1 bg-gray-800" />
          </h3>
          <ScrambleText
            text={LITERATURE_TEXT}
            preserveSpacesInitially={false}
            onStart={() => setMainTextTouched(true)}
            onComplete={() => setMainTextComplete(true)}
            cipherClassName="text-gray-600"
            className="text-left text-lg leading-relaxed text-gray-200 data-[revealed]:text-justify md:text-xl"
          />
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-10 border-t border-gray-800/80 bg-[#0e0f11]/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-x-12 gap-y-1 px-5 py-4 opacity-90 sm:justify-between">
          <ScrambleText
            text="PROJECT: THE WAR OF THE WORLDS"
            className="text-sm text-red-500 sm:text-xl"
          />
          <ScrambleText
            text={statusText}
            className="text-sm text-blue-500 sm:text-xl"
          />
        </div>
      </div>
    </main>
  );
}
