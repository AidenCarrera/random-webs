import { BOOT_SEQUENCE } from "../constants";
import styles from "./terminal-window.module.css";

interface BootScreenProps {
  bootLogs: string[];
  onSkip: () => void;
}

export function BootScreen({ bootLogs, onSkip }: BootScreenProps) {
  return (
    <div
      className="min-h-screen bg-[#1a1b26] text-[#a9b1d6] flex items-center justify-center p-4 font-mono select-none"
      onClick={onSkip}
    >
      <div
        className={`${styles.window} relative w-full max-w-3xl border border-[#414868] bg-[#16161e] p-6 rounded-xl shadow-[0_30px_80px_-30px_rgba(0,0,0,0.8),0_0_40px_rgba(169,177,214,0.06)] flex flex-col justify-between h-[60vh]`}
        style={{ "--term-text": "#a9b1d6" } as React.CSSProperties}
      >
        <div className="overflow-y-auto leading-normal text-sm flex-1 scrollbar-none font-bold">
          {bootLogs.map((line, index) => (
            <div key={index} className="whitespace-pre-wrap break-all mb-1">
              {line}
            </div>
          ))}
          <span aria-hidden="true" className={styles.bootCursor} />
        </div>
        <div aria-hidden="true" className={`${styles.bootBar} mt-4`}>
          <span
            style={{
              transform: `scaleX(${Math.min(1, bootLogs.length / BOOT_SEQUENCE.length)})`,
            }}
          />
        </div>
        <div className="text-center text-xs opacity-50 mt-3 font-bold pt-1 motion-safe:animate-pulse">
          [ Press any key or click to skip boot sequence ]
        </div>
      </div>
    </div>
  );
}
