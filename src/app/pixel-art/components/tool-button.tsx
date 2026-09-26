import type { ReactNode } from "react";

type ToolButtonProps = {
  active: boolean;
  disabled?: boolean;
  icon: ReactNode;
  label: string;
  onClick: () => void;
};

export function ToolButton({
  active,
  disabled,
  icon,
  label,
  onClick,
}: ToolButtonProps) {
  return (
    <button
      aria-pressed={active}
      className={`pixel-tool flex min-h-12 flex-col items-center justify-center gap-1 border-[3px] px-1.5 py-2 text-center font-mono text-[11px] font-bold uppercase tracking-wide transition-transform sm:min-h-16 sm:gap-2 sm:px-2 sm:py-3 sm:text-[15px] lg:min-h-0 lg:gap-1 lg:py-2 lg:text-[13px] ${
        active
          ? "border-[#fff1e8] bg-[#29adff] text-[#fff7dd] shadow-[inset_0_0_0_2px_#1d2b53]"
          : "border-[#1d2b53] bg-[#c2c3c7] text-[#1d2b53]"
      } ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
