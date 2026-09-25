import styles from "../styles.module.css";
import { AstrolabeRing } from "./ornaments";

export function ArcanaHeader() {
  return (
    <header className="relative isolate mb-8 text-center md:mb-12">
      <div className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-44 w-44 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(88,28,135,0.6)_0%,rgba(88,28,135,0.22)_42%,rgba(88,28,135,0)_74%)] md:h-64 md:w-64" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 -z-20 h-[26rem] w-[26rem] -translate-x-1/2 -translate-y-1/2 opacity-70 md:h-[34rem] md:w-[34rem]">
        <AstrolabeRing className={`h-full w-full ${styles.ring}`} />
      </div>
      <h1
        className={`mb-4 text-6xl font-bold leading-none text-[#ffd700] md:text-8xl ${styles.title}`}
      >
        Arcana
      </h1>
      <p className="flex items-center justify-center gap-3 font-serif text-lg italic tracking-widest text-purple-200/70">
        <span
          aria-hidden="true"
          className="text-xs not-italic text-[#ffd700]/60"
        >
          ✦
        </span>
        Reveal your fate
        <span
          aria-hidden="true"
          className="text-xs not-italic text-[#ffd700]/60"
        >
          ✦
        </span>
      </p>
    </header>
  );
}
