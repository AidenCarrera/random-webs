import { motion } from "framer-motion";
import { RefreshCw } from "lucide-react";

interface DrawAgainButtonProps {
  readonly onClick: () => void;
}

export function DrawAgainButton({ onClick }: DrawAgainButtonProps) {
  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onClick}
      className="mt-16 flex items-center gap-2 text-[#ffd700]/70 hover:text-[#ffd700] uppercase tracking-widest text-sm font-bold transition-colors"
    >
      <RefreshCw className="w-4 h-4" />
      Draw Again
    </motion.button>
  );
}
