import { X } from "lucide-react";

import { PANIC_LOGS } from "../constants";

export function PanicScreen() {
  return (
    <div className="min-h-screen bg-black text-[#ff0033] flex items-center justify-center p-6 font-mono animate-panic select-none">
      <div className="w-full max-w-4xl border-2 border-[#ff0033]/60 bg-black/90 p-8 rounded-lg shadow-[0_0_30px_rgba(255,0,51,0.4)]">
        <div className="mb-4 border-b border-[#ff0033]/40 pb-2 flex gap-2 items-center font-bold">
          <X className="h-5 w-5 animate-pulse" />
          <span>!!! SYSTEM KERNEL PANIC !!!</span>
        </div>
        <div className="overflow-y-auto leading-relaxed h-[60vh] text-sm font-bold">
          {PANIC_LOGS.map((line, index) => (
            <div
              key={index}
              className="whitespace-pre-wrap break-all mb-1 font-bold"
            >
              {line}
            </div>
          ))}
        </div>
      </div>

      <style jsx global>{`
        @keyframes panic-flicker {
          0% {
            opacity: 0.96;
          }
          50% {
            opacity: 1;
          }
          100% {
            opacity: 0.96;
          }
        }
        .animate-panic {
          animation: panic-flicker 0.15s infinite;
        }
      `}</style>
    </div>
  );
}
