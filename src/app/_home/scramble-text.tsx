"use client";

import { useEffect, useRef, useState } from "react";

const GLYPHS = "?#%&*+=<>/|!$ABCDEFGHJKLMNPRSTUVWXYZ0123456789";

type ScrambleTextProps = {
  text: string;
  /** Start the effect once the text scrolls into view instead of on mount. */
  trigger?: "mount" | "visible";
  delay?: number;
  duration?: number;
  /** Unresolved characters show this glyph instead of random noise. */
  placeholder?: string;
  className?: string;
};

function randomGlyph() {
  return GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
}

/**
 * Resolves text character by character from noise. The real text stays in
 * the DOM for layout and assistive technology while an aria-hidden overlay
 * shows the animation, so nothing reflows and screen readers hear the words.
 */
export function ScrambleText({
  text,
  trigger = "mount",
  delay = 0,
  duration = 700,
  placeholder,
  className,
}: ScrambleTextProps) {
  const rootRef = useRef<HTMLSpanElement>(null);
  const overlayRef = useRef<HTMLSpanElement>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const root = rootRef.current;
    const overlay = overlayRef.current;

    if (
      !root ||
      !overlay ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    let frame = 0;
    let timer = 0;
    let observer: IntersectionObserver | undefined;

    const characters = [...text];
    const resolveAt = characters.map(
      (_, index) =>
        (index / Math.max(1, characters.length)) * duration * 0.65 +
        Math.random() * duration * 0.35,
    );

    const run = () => {
      const startedAt = performance.now();
      // Paint the first noisy frame before the real text fades out.
      overlay.textContent = characters
        .map((character) =>
          character === " " ? character : (placeholder ?? randomGlyph()),
        )
        .join("");
      setIsAnimating(true);

      const tick = (now: number) => {
        const elapsed = now - startedAt;
        let output = "";
        let done = true;

        for (let index = 0; index < characters.length; index++) {
          const character = characters[index];
          if (character === " " || elapsed >= resolveAt[index]) {
            output += character;
          } else {
            done = false;
            output += placeholder ?? randomGlyph();
          }
        }

        overlay.textContent = output;

        if (done) {
          setIsAnimating(false);
          return;
        }
        frame = requestAnimationFrame(tick);
      };

      frame = requestAnimationFrame(tick);
    };

    const start = () => {
      timer = window.setTimeout(run, delay);
    };

    if (trigger === "visible" && "IntersectionObserver" in window) {
      observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting)) {
            observer?.disconnect();
            start();
          }
        },
        { rootMargin: "0px 0px -8% 0px" },
      );
      observer.observe(root);
    } else {
      start();
    }

    return () => {
      observer?.disconnect();
      window.clearTimeout(timer);
      cancelAnimationFrame(frame);
    };
  }, [text, trigger, delay, duration, placeholder]);

  return (
    <span ref={rootRef} className={`relative inline-block ${className ?? ""}`}>
      <span style={isAnimating ? { opacity: 0 } : undefined}>{text}</span>
      <span
        ref={overlayRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={isAnimating ? undefined : { display: "none" }}
      />
    </span>
  );
}
