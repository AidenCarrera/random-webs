"use client";

import type { BackgroundTheme } from "../types";
import { TEXTURE_MAP } from "../constants";

export function SolarSystemBackdrop({ theme }: { theme: BackgroundTheme }) {
  return (
    <>
      <div
        className="absolute inset-0 bg-cover bg-center -z-20 transition-all duration-1000"
        style={{ backgroundImage: `url(${TEXTURE_MAP[theme]})` }}
      />
      <div className="absolute inset-0 bg-black/40 -z-10" />
    </>
  );
}

export function SolarSystemHeader() {
  return (
    <div className="relative z-40 w-full max-w-sm self-start px-1 pb-3 pointer-events-none md:absolute md:top-6 md:left-6 md:w-auto md:max-w-none md:px-0 md:pb-0">
      <h1 className="text-3xl font-extralight tracking-[0.2em] uppercase text-white/95 leading-none">
        Solar System Creator
      </h1>
      <p className="text-[10px] font-mono tracking-widest text-white/40 uppercase mt-1">
        Interactive Solar System Builder
      </p>
    </div>
  );
}

export function TextureAttribution() {
  return (
    <div className="order-6 mt-4 text-center font-mono text-[9px] text-white/25 transition-colors pointer-events-auto md:absolute md:bottom-4 md:right-4 md:mt-0 md:text-left hover:text-white/50">
      Planet texture maps by{" "}
      <a
        href="https://www.solarsystemscope.com/textures/"
        target="_blank"
        rel="noopener noreferrer"
        className="underline hover:text-white/40 transition-colors"
      >
        Solar System Scope
      </a>
      , licensed under{" "}
      <a
        href="https://creativecommons.org/licenses/by/4.0/"
        target="_blank"
        rel="noopener noreferrer"
        className="underline hover:text-white/40 transition-colors"
      >
        CC BY 4.0
      </a>
    </div>
  );
}
