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
      transition={{ delay: 0.4, duration: 0.5 }}
      onClick={onClick}
      className="group mt-16 flex items-center gap-3 rounded-full border border-[#ffd700]/30 px-6 py-3 text-sm font-bold uppercase tracking-widest text-[#ffd700]/75 transition-colors duration-300 hover:border-[#ffd700]/70 hover:bg-[#ffd700]/10 hover:text-[#ffd700] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#ffd700]"
    >
      <RefreshCw className="h-4 w-4 transition-transform duration-700 group-hover:rotate-180" />
      Draw Again
    </motion.button>
  );
}
