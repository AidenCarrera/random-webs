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
      <div className="w-full max-w-3xl border border-[#414868] bg-[#16161e] p-6 rounded shadow-xl flex flex-col justify-between h-[60vh]">
        <div className="overflow-y-auto leading-normal text-sm flex-1 scrollbar-none font-bold">
          {bootLogs.map((line, index) => (
            <div key={index} className="whitespace-pre-wrap break-all mb-1">
              {line}
            </div>
          ))}
          <div className="w-1.5 h-4 bg-[#a9b1d6] animate-ping inline-block ml-1" />
        </div>
        <div className="text-center text-xs opacity-50 mt-4 font-bold border-t border-[#414868]/45 pt-2">
          [ Press any key or click to skip boot sequence ]
        </div>
      </div>
    </div>
  );
}
